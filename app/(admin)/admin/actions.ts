"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

  const { error } = await supabase
    .from("coffee_break_signups")
    .update({ status: "confirmed" })
    .eq("id", signupId);

  if (error) {
    console.error(
      "[admin] Error confirmando el registro de Coffee Break:",
      error,
    );
    throw new Error("No se pudo confirmar el registro.");
  }

  revalidatePath("/admin/coffee-break");
}

export async function markTransferAsPaid(formData: FormData) {
  const supabase = await requireAuthenticatedClient();

  const enrollmentId = formData.get("enrollmentId");

  if (typeof enrollmentId !== "string") {
    throw new Error("Datos inválidos.");
  }

  const { error } = await supabase
    .from("enrollments")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", enrollmentId);

  if (error) {
    console.error(
      "[admin] Error marcando la transferencia como pagada:",
      error,
    );
    throw new Error("No se pudo marcar la inscripción como pagada.");
  }

  revalidatePath("/admin");
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
