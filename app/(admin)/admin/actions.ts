"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { getPlanTitle, type PlanTitleTranslator } from "@/lib/planTitle";
import type { PlanId } from "@/lib/plans";
import esMessages from "@/messages/es.json";
import deMessages from "@/messages/de.json";
import enMessages from "@/messages/en.json";
import frMessages from "@/messages/fr.json";
import euMessages from "@/messages/eu.json";

// Server Functions son alcanzables por POST directo, no solo desde la UI de
// esta página — cada una revalida acá adentro que quien llama es Gesa
// específicamente, sin confiar únicamente en que proxy.ts haya filtrado la
// request antes de llegar. Desde la Fase 3 los alumnos también tienen
// sesiones válidas de Supabase Auth, así que "hay un user" ya no alcanza.
//
// Ubicación: este archivo vivía en admin/alumno/[id]/actions.ts, pero ahora
// también lo usa el calendario (admin/calendario + components/admin/*), así
// que se movió a admin/actions.ts — un lugar neutral que no pertenece a
// ninguna de las dos vistas en particular.
async function requireAuthenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    throw new Error("No autorizado.");
  }

  return supabase;
}

// Tanto la página de detalle del alumno como el calendario muestran clases,
// así que cualquier mutación revalida las dos.
function revalidateSessionViews(enrollmentId: string) {
  revalidatePath(`/admin/alumno/${enrollmentId}`);
  revalidatePath("/admin/calendario");
}

// --- Emails al alumno cuando Gesa confirma algo desde el panel (pago por
// transferencia, lugar en Coffee Break) — mismo remitente y diseño tipo
// "postal" que los demás emails al alumno (app/api/stripe/webhook/route.ts),
// pero sin la tarjeta de plan/precio: acá el cuerpo ya viene armado como
// texto corrido (greeting + body + signoff), interpolado a mano porque este
// archivo no usa useTranslations/getTranslations, solo indexa el JSON de
// mensajes directamente.
type SimpleEmailMessages = {
  subject: string;
  greeting: string;
  body: string;
  signoff: string;
};

const POSTAL_IMAGE_URL =
  "https://www.deutschflow.eu/images/DflowPostal-fixed3.png";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildSimplePostalEmailHtml({
  greeting,
  body,
  signoff,
}: {
  greeting: string;
  body: string;
  signoff: string;
}): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background:#faf7f0; font-family: Georgia, 'Times New Roman', serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f0;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#faf7f0;">
        <tr>
          <td style="padding:0; line-height:0; font-size:0;">
            <img src="${POSTAL_IMAGE_URL}" alt="Deutsch Flow" width="600" style="width:100%; max-width:600px; display:block; border:0;">
          </td>
        </tr>
        <tr>
          <td style="padding: 0 28px;">
            <div style="border-top: 2px dashed #1a3a5c; opacity: 0.35;"></div>
          </td>
        </tr>
        <tr>
          <td style="padding: 26px 32px 34px 32px;">
            <p style="margin:0 0 18px 0; font-size:16px; color:#1a3a5c; line-height:1.5;">
              ${escapeHtml(greeting)}
            </p>
            <p style="margin:0 0 22px 0; font-size:15px; color:#1a3a5c; line-height:1.6; opacity:0.85;">
              ${escapeHtml(body)}
            </p>
            <p style="margin:0; font-size:15px; color:#1a3a5c; line-height:1.6; font-style: italic;">
              ${escapeHtml(signoff)}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// Importados estáticamente (no con import() dinámico + path relativo): así
// tsc verifica que los 5 archivos existen de verdad, en vez de confiar en
// contar niveles de "../" a mano — un import() dinámico con un locale
// interpolado no lo valida el compilador (tipa como Promise<any>), y este
// archivo es el único lugar que intentaba ese patrón desde dentro de un
// "use server" (en las rutas API sí está probado, acá no lo estaba).
const MESSAGES_BY_LOCALE: Record<string, typeof esMessages> = {
  es: esMessages,
  de: deMessages,
  en: enMessages,
  fr: frMessages,
  eu: euMessages,
};

// Respaldo "es" si el locale guardado falta o no es uno de los soportados
// (ej. filas viejas de antes de que existiera la columna).
function resolveStoredLocale(locale: string | null): string {
  return locale && hasLocale(routing.locales, locale) ? locale : "es";
}

// Adaptador de getPlanTitle (lib/planTitle.ts) sobre el JSON ya cargado en
// MESSAGES_BY_LOCALE — getTranslations de next-intl no es seguro acá adentro
// (ver comentario de MESSAGES_BY_LOCALE más arriba sobre import() dinámico
// dentro de un "use server"), así que esto solo indexa el objeto "clases" a
// mano en vez de usar un translator real.
function clasesTranslator(locale: string): PlanTitleTranslator {
  const clases = MESSAGES_BY_LOCALE[locale].clases as unknown as Record<
    string,
    Record<string, { title?: string }>
  >;
  const read = (key: string): string | undefined => {
    const [group, planId] = key.split(".");
    return clases[group]?.[planId]?.title;
  };
  const translator = ((key: string) => read(key) ?? "") as PlanTitleTranslator;
  translator.has = (key: string) => read(key) !== undefined;
  return translator;
}

export async function completeSession(formData: FormData) {
  const supabase = await requireAuthenticatedClient();

  const sessionId = formData.get("sessionId");
  const enrollmentId = formData.get("enrollmentId");
  const hoursCountedRaw = formData.get("hoursCounted");

  if (
    typeof sessionId !== "string" ||
    typeof enrollmentId !== "string" ||
    typeof hoursCountedRaw !== "string"
  ) {
    throw new Error("Datos inválidos.");
  }

  const hoursCounted = Math.round(Number(hoursCountedRaw) * 100) / 100;

  if (!Number.isFinite(hoursCounted) || hoursCounted < 0) {
    throw new Error("Las horas deben ser un número válido mayor o igual a 0.");
  }

  const { error } = await supabase
    .from("class_sessions")
    .update({ status: "completed", hours_counted: hoursCounted })
    .eq("id", sessionId);

  if (error) {
    console.error("[admin] Error marcando la clase como completada:", error);
    throw new Error("No se pudo marcar la clase como completada.");
  }

  revalidateSessionViews(enrollmentId);
}

export async function cancelSession(formData: FormData) {
  const supabase = await requireAuthenticatedClient();

  const sessionId = formData.get("sessionId");
  const enrollmentId = formData.get("enrollmentId");

  if (typeof sessionId !== "string" || typeof enrollmentId !== "string") {
    throw new Error("Datos inválidos.");
  }

  // No se descuentan horas al cancelar.
  const { error } = await supabase
    .from("class_sessions")
    .update({ status: "cancelled", hours_counted: null })
    .eq("id", sessionId);

  if (error) {
    console.error("[admin] Error cancelando la clase:", error);
    throw new Error("No se pudo cancelar la clase.");
  }

  revalidateSessionViews(enrollmentId);
}

export async function deleteSession(formData: FormData) {
  const supabase = await requireAuthenticatedClient();

  const sessionId = formData.get("sessionId");
  const enrollmentId = formData.get("enrollmentId");

  if (typeof sessionId !== "string" || typeof enrollmentId !== "string") {
    throw new Error("Datos inválidos.");
  }

  // DELETE real, no un cambio de status: a diferencia de cancelar, esto
  // borra el registro por completo (ej. para sacar clases cargadas por
  // error).
  const { error } = await supabase
    .from("class_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    console.error("[admin] Error eliminando la clase:", error);
    throw new Error("No se pudo eliminar la clase.");
  }

  revalidateSessionViews(enrollmentId);
}

export async function confirmCoffeeBreakSignup(formData: FormData) {
  const supabase = await requireAuthenticatedClient();

  const signupId = formData.get("signupId");

  if (typeof signupId !== "string") {
    throw new Error("Datos inválidos.");
  }

  const { data, error } = await supabase
    .from("coffee_break_signups")
    .update({ status: "confirmed" })
    .eq("id", signupId)
    .select("name, email, locale")
    .single();

  if (error || !data) {
    console.error(
      "[confirmCoffeeBreakSignup] El update no devolvió la fila esperada:",
      error ?? "sin datos (0 filas) — revisá la policy de SELECT de admin en coffee_break_signups",
    );
    throw new Error("No se pudo confirmar el registro.");
  }

  revalidatePath("/admin/coffee-break");

  const signup = data as {
    name: string;
    email: string;
    locale: string | null;
  };

  // El email es secundario: si falla, el registro ya quedó confirmado y no
  // se revierte — solo se deja constancia en el log. El try/catch cubre
  // fallos inesperados (ej. una clave de mensaje faltante); el resultado de
  // Resend en sí se chequea explícitamente más abajo, no solo con throw.
  try {
    const locale = resolveStoredLocale(signup.locale);
    const t: SimpleEmailMessages =
      MESSAGES_BY_LOCALE[locale].coffeeBreakConfirmedEmail;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Deutsch Flow <hallo@deutschflow.eu>",
      to: signup.email,
      replyTo: process.env.CONTACT_EMAIL_TO!,
      subject: t.subject,
      html: buildSimplePostalEmailHtml({
        greeting: t.greeting.replace("{name}", signup.name),
        body: t.body.replace("{name}", signup.name),
        signoff: t.signoff,
      }),
    });

    if (emailError) {
      console.error("[confirmCoffeeBreakSignup] Resend error:", emailError);
    } else {
      console.log(
        "[confirmCoffeeBreakSignup] Email enviado a",
        signup.email,
        "id:",
        emailData?.id,
      );
    }
  } catch (emailError) {
    console.error(
      "[confirmCoffeeBreakSignup] Error inesperado enviando el email:",
      emailError,
    );
  }
}

export async function markTransferAsPaid(formData: FormData) {
  const supabase = await requireAuthenticatedClient();

  const enrollmentId = formData.get("enrollmentId");

  if (typeof enrollmentId !== "string") {
    throw new Error("Datos inválidos.");
  }

  const { data, error } = await supabase
    .from("enrollments")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", enrollmentId)
    .select("student_name, student_email, plan_id, plan_title, locale")
    .single();

  if (error || !data) {
    console.error(
      "[markTransferAsPaid] El update no devolvió la fila esperada:",
      error ?? "sin datos (0 filas) — revisá la policy de SELECT de admin en enrollments",
    );
    throw new Error("No se pudo marcar la inscripción como pagada.");
  }

  revalidatePath("/admin");

  const enrollment = data as {
    student_name: string;
    student_email: string;
    plan_id: PlanId;
    plan_title: string;
    locale: string | null;
  };

  // El email es secundario: si falla, el estado ya quedó actualizado y no
  // se revierte — solo se deja constancia en el log. El try/catch cubre
  // fallos inesperados (ej. una clave de mensaje faltante); el resultado de
  // Resend en sí se chequea explícitamente más abajo, no solo con throw.
  try {
    const locale = resolveStoredLocale(enrollment.locale);
    const t: SimpleEmailMessages = MESSAGES_BY_LOCALE[locale].transferPaidEmail;
    const planTitle = getPlanTitle(
      enrollment.plan_id,
      enrollment.plan_title,
      clasesTranslator(locale),
    );

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Deutsch Flow <hallo@deutschflow.eu>",
      to: enrollment.student_email,
      replyTo: process.env.CONTACT_EMAIL_TO!,
      subject: t.subject,
      html: buildSimplePostalEmailHtml({
        greeting: t.greeting.replace("{name}", enrollment.student_name),
        body: t.body
          .replace("{name}", enrollment.student_name)
          .replace("{plan}", planTitle),
        signoff: t.signoff,
      }),
    });

    if (emailError) {
      console.error("[markTransferAsPaid] Resend error:", emailError);
    } else {
      console.log(
        "[markTransferAsPaid] Email enviado a",
        enrollment.student_email,
        "id:",
        emailData?.id,
      );
    }
  } catch (emailError) {
    console.error(
      "[markTransferAsPaid] Error inesperado enviando el email:",
      emailError,
    );
  }
}

export async function addSession(formData: FormData) {
  const supabase = await requireAuthenticatedClient();

  const enrollmentId = formData.get("enrollmentId");
  const scheduledAt = formData.get("scheduledAt");
  const durationMinutesRaw = formData.get("durationMinutes");
  const notes = formData.get("notes");

  if (
    typeof enrollmentId !== "string" ||
    typeof scheduledAt !== "string" ||
    typeof durationMinutesRaw !== "string" ||
    !scheduledAt
  ) {
    throw new Error("Datos inválidos.");
  }

  const durationMinutes = Number(durationMinutesRaw);

  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    throw new Error("La duración debe ser un número de minutos mayor a 0.");
  }

  // NOTA: el input datetime-local no trae información de zona horaria — acá
  // se interpreta con la zona horaria del servidor donde corre Next.js, que
  // puede no coincidir con la de Gesa si el hosting corre en UTC. Si las
  // horas guardadas aparecen corridas, este es el lugar para ajustar
  // (agregar/restar el offset, o cambiar a una librería de zonas horarias).
  const { error } = await supabase.from("class_sessions").insert({
    enrollment_id: enrollmentId,
    scheduled_at: new Date(scheduledAt).toISOString(),
    duration_minutes: durationMinutes,
    status: "scheduled",
    notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
  });

  if (error) {
    console.error("[admin] Error agregando la clase:", error);
    throw new Error("No se pudo agregar la clase.");
  }

  revalidateSessionViews(enrollmentId);
}

const TESTIMONIAL_BUCKET = "testimonial-photos";

function testimonialPhotoPrefix() {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${TESTIMONIAL_BUCKET}/`;
}

function revalidateTestimonialViews() {
  revalidatePath("/[locale]", "page");
  revalidatePath("/admin/resenas");
}

// Best-effort: un fallo al borrar el archivo no debe impedir el cambio en la
// base (la reseña ya quedó actualizada/borrada cuando esto corre).
async function removeTestimonialPhoto(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedClient>>,
  photoUrl: string | null,
) {
  if (!photoUrl || !photoUrl.startsWith(testimonialPhotoPrefix())) return;

  const path = photoUrl.slice(testimonialPhotoPrefix().length);
  const { error } = await supabase.storage
    .from(TESTIMONIAL_BUCKET)
    .remove([path]);

  if (error) {
    console.error("[admin] Error borrando la foto de la reseña:", error);
  }
}

function parseTestimonialForm(formData: FormData) {
  const studentName = formData.get("studentName");
  const ratingRaw = formData.get("rating");
  const comment = formData.get("comment");
  const detail = formData.get("detail");
  const photoUrl = formData.get("photoUrl");

  if (typeof studentName !== "string" || !studentName.trim()) {
    throw new Error("El nombre del alumno es obligatorio.");
  }

  const rating = Number(ratingRaw);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("La calificación debe ser un número entero entre 1 y 5.");
  }

  if (typeof comment !== "string" || !comment.trim()) {
    throw new Error("El comentario es obligatorio.");
  }

  if (typeof photoUrl === "string" && photoUrl && !photoUrl.startsWith(testimonialPhotoPrefix())) {
    throw new Error("La foto debe venir del bucket de reseñas.");
  }

  return {
    student_name: studentName.trim(),
    rating,
    comment: comment.trim(),
    detail: typeof detail === "string" && detail.trim() ? detail.trim() : null,
    photo_url: typeof photoUrl === "string" && photoUrl ? photoUrl : null,
  };
}

export async function addTestimonial(formData: FormData) {
  const supabase = await requireAuthenticatedClient();
  const values = parseTestimonialForm(formData);

  const { error } = await supabase.from("testimonials").insert(values);

  if (error) {
    console.error("[admin] Error agregando la reseña:", error);
    throw new Error("No se pudo agregar la reseña.");
  }

  revalidateTestimonialViews();
}

export async function updateTestimonial(formData: FormData) {
  const supabase = await requireAuthenticatedClient();

  const id = formData.get("id");
  if (typeof id !== "string") {
    throw new Error("Datos inválidos.");
  }

  const values = parseTestimonialForm(formData);

  // La foto anterior se lee de la base, no del formulario, para no confiar en
  // una URL mandada por el cliente al decidir qué archivo borrar.
  const { data: previous } = await supabase
    .from("testimonials")
    .select("photo_url")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("testimonials")
    .update(values)
    .eq("id", id);

  if (error) {
    console.error("[admin] Error actualizando la reseña:", error);
    throw new Error("No se pudo actualizar la reseña.");
  }

  const previousPhoto = (previous as { photo_url: string | null } | null)
    ?.photo_url;
  if (previousPhoto && previousPhoto !== values.photo_url) {
    await removeTestimonialPhoto(supabase, previousPhoto);
  }

  revalidateTestimonialViews();
}

export async function deleteTestimonial(formData: FormData) {
  const supabase = await requireAuthenticatedClient();

  const id = formData.get("id");
  if (typeof id !== "string") {
    throw new Error("Datos inválidos.");
  }

  const { data: existing } = await supabase
    .from("testimonials")
    .select("photo_url")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("testimonials").delete().eq("id", id);

  if (error) {
    console.error("[admin] Error eliminando la reseña:", error);
    throw new Error("No se pudo eliminar la reseña.");
  }

  const photo = (existing as { photo_url: string | null } | null)?.photo_url;
  await removeTestimonialPhoto(supabase, photo ?? null);

  revalidateTestimonialViews();
}
