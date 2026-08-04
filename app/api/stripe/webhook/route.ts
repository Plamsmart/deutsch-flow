import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { Resend } from "resend";

// ---------------------------------------------------------------------------
// PARTE 2 del sistema de compra. Este webhook es la ÚNICA vía por la que una
// inscripción pasa de status "pending" (creada en app/api/checkout/route.ts)
// a "paid". Flujo completo:
//
//   1. La persona termina el pago en Stripe Checkout.
//   2. Stripe manda un POST acá con el body crudo + la firma en el header
//      "stripe-signature".
//   3. Verificamos esa firma con STRIPE_WEBHOOK_SECRET
//      (stripe.webhooks.constructEventAsync) ANTES de cualquier otra lógica.
//      Si falla, devolvemos 400 y no tocamos Supabase ni mandamos nada — sin
//      esto, cualquiera podría llamar a este endpoint a mano y marcar una
//      inscripción como pagada sin haber pagado.
//   4. Si el evento es "checkout.session.completed", leemos la metadata que
//      pusimos en app/api/checkout/route.ts (enrollment_id, plan_id,
//      student_email, locale) y marcamos ese enrollment como "paid" en
//      Supabase. Cualquier otro tipo de evento se responde con 200 vacío
//      para que Stripe no reintente algo que no nos interesa procesar.
//   5. Mandamos 2 emails de notificación (alumno + Gesa) con Resend, cada uno
//      en su propio try/catch independiente — un email fallido nunca debe
//      hacer que el webhook responda con error, porque Stripe reintentaría
//      la entrega completa y volveríamos a ejecutar el update de Supabase
//      (inofensivo, pero innecesario) sobre un pago que ya quedó bien
//      registrado.
//
// NOTA: en producción, STRIPE_WEBHOOK_SECRET sale del endpoint que configures
// en el dashboard de Stripe (Developers → Webhooks), no del que imprime
// `stripe listen` en la terminal — ese secreto es solo para probar en local.
// ---------------------------------------------------------------------------

type EnrollmentRecord = {
  student_name: string;
  student_email: string;
  plan_title: string;
  price_cents: number;
  locale: string;
  level: string;
  notes: string | null;
};

type EnrollmentEmailMessages = {
  subject: string;
  greeting: string;
  bodyIntro: string;
  planLabel: string;
  priceLabel: string;
  thanks: string;
  contactNote: string;
};

function formatPrice(priceCents: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(priceCents / 100);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// La postal (imagen fija, siempre en alemán) se sirve directamente desde la
// URL de producción de Vercel — esta es la solución definitiva, no un parche
// temporal. Si en el futuro se conecta un dominio propio (ej. deutschflow.com)
// en vez del subdominio *.vercel.app, hay que actualizar esta URL también.
const POSTAL_IMAGE_URL =
  "https://deutsch-flow-delta.vercel.app/images/DflowPostal-fixed3.png";

function buildPostalEmailHtml({
  studentName,
  planTitle,
  priceFormatted,
  t,
}: {
  studentName: string;
  planTitle: string;
  priceFormatted: string;
  t: EnrollmentEmailMessages;
}): string {
  const name = escapeHtml(studentName);
  const plan = escapeHtml(planTitle);

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

      <!-- Contenedor principal del email -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#faf7f0;">

        <!-- La postal (imagen fija, siempre en alemán) -->
        <tr>
          <td style="padding:0; line-height:0; font-size:0;">
            <img src="${POSTAL_IMAGE_URL}" alt="Deutsch Flow — Herzlich willkommen" width="600" style="width:100%; max-width:600px; display:block; border:0;">
          </td>
        </tr>

        <!-- Linea de "perforado" -->
        <tr>
          <td style="padding: 0 28px;">
            <div style="border-top: 2px dashed #1a3a5c; opacity: 0.35;"></div>
          </td>
        </tr>

        <!-- Detalles de la compra -->
        <tr>
          <td style="padding: 26px 32px 8px 32px;">
            <p style="margin:0 0 18px 0; font-size:16px; color:#1a3a5c; line-height:1.5;">
              ${escapeHtml(t.greeting)} <strong>${name}</strong>,
            </p>
            <p style="margin:0 0 22px 0; font-size:15px; color:#1a3a5c; line-height:1.6; opacity:0.85;">
              ${escapeHtml(t.bodyIntro)}
            </p>
          </td>
        </tr>

        <!-- Tarjeta tipo "boleto" con los detalles -->
        <tr>
          <td style="padding: 0 32px 22px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1.5px solid #1a3a5c; border-radius: 4px;">
              <tr>
                <td style="padding: 16px 20px; border-bottom: 1px dashed rgba(26,58,92,0.3);">
                  <span style="font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#1a3a5c; opacity:0.6;">${escapeHtml(t.planLabel)}</span><br>
                  <span style="font-size:17px; color:#1a3a5c; font-weight:bold;">${plan}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 16px 20px;">
                  <span style="font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#1a3a5c; opacity:0.6;">${escapeHtml(t.priceLabel)}</span><br>
                  <span style="font-size:17px; color:#1a3a5c; font-weight:bold;">${priceFormatted}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Cierre calido -->
        <tr>
          <td style="padding: 4px 32px 34px 32px;">
            <p style="margin:0 0 14px 0; font-size:15px; color:#1a3a5c; line-height:1.6; font-style: italic;">
              ${escapeHtml(t.thanks)}
            </p>
            <p style="margin:0; font-size:13px; color:#1a3a5c; opacity:0.6;">
              ${escapeHtml(t.contactNote)}
            </p>
          </td>
        </tr>

      </table>
      <!-- fin contenedor principal -->

    </td>
  </tr>
</table>
</body>
</html>`;
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Falta la firma del webhook." },
      { status: 400 },
    );
  }

  // Body crudo (sin parsear) — imprescindible para que constructEventAsync
  // pueda verificar la firma contra los bytes exactos que mandó Stripe.
  const rawBody = await request.text();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    console.error("[stripe-webhook] Firma inválida:", error);
    return NextResponse.json({ error: "Firma inválida." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata ?? {};
  const enrollmentId = metadata.enrollment_id;

  if (!enrollmentId) {
    console.error(
      "[stripe-webhook] El evento checkout.session.completed no trae enrollment_id en metadata.",
    );
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error: updateError } = await supabase
    .from("enrollments")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", enrollmentId)
    .select("student_name, student_email, plan_title, price_cents, locale, level, notes")
    .single();

  if (updateError || !data) {
    console.error(
      "[stripe-webhook] Error marcando la inscripción como pagada en Supabase:",
      updateError,
    );
    return NextResponse.json(
      { error: "No se pudo actualizar la inscripción." },
      { status: 500 },
    );
  }

  const enrollment = data as EnrollmentRecord;
  const locale = enrollment.locale || metadata.locale || "es";

  // EMAIL 1: al alumno, en su idioma.
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const messages = (await import(`../../../../messages/${locale}.json`))
      .default;
    const t: EnrollmentEmailMessages = messages.enrollmentEmail;

    await resend.emails.send({
      from: "Deutsch Flow <hallo@deutschflow.eu>",
      to: enrollment.student_email,
      subject: t.subject,
      html: buildPostalEmailHtml({
        studentName: enrollment.student_name,
        planTitle: enrollment.plan_title,
        priceFormatted: formatPrice(enrollment.price_cents, locale),
        t,
      }),
    });
  } catch (error) {
    console.error(
      "[stripe-webhook] Error enviando el email de confirmación al alumno:",
      error,
    );
  }

  // EMAIL 2: a Gesa, siempre en español (uso interno, sin importar el idioma
  // del alumno).
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Deutsch Flow <hallo@deutschflow.eu>",
      to: process.env.CONTACT_EMAIL_TO!,
      subject: `Nueva inscripción pagada: ${enrollment.plan_title} - ${enrollment.student_name}`,
      text: [
        `Nombre: ${enrollment.student_name}`,
        `Email: ${enrollment.student_email}`,
        `Nivel: ${enrollment.level}`,
        enrollment.notes ? `Notas: ${enrollment.notes}` : null,
        `Plan: ${enrollment.plan_title}`,
        `Precio: ${formatPrice(enrollment.price_cents, "es")}`,
        `Idioma del alumno: ${locale}`,
      ]
        .filter((line) => line !== null)
        .join("\n"),
    });
  } catch (error) {
    console.error(
      "[stripe-webhook] Error enviando el email de aviso a Gesa:",
      error,
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
