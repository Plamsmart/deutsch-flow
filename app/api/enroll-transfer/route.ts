import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { PLAN_PRICES, PLAN_TITLES, type PlanId } from "@/lib/plans";

// ---------------------------------------------------------------------------
// Alternativa a app/api/checkout/route.ts para quien prefiere pagar por
// transferencia bancaria en vez de con tarjeta. La inscripción queda
// "pending" (igual que el flujo de Stripe antes de pagar), pero acá nunca se
// crea una sesión de Stripe ni se completa sola: Gesa revisa su cuenta y la
// marca como pagada a mano desde /admin (ver markTransferAsPaid en
// app/(admin)/admin/actions.ts).
// ---------------------------------------------------------------------------

type TransferPayload = {
  planId?: string;
  name?: string;
  email?: string;
  level?: string;
  notes?: string;
};

type TransferEmailMessages = {
  subject: string;
  greeting: string;
  body: string;
  ibanLabel: string;
  holderLabel: string;
  amountLabel: string;
  referenceLabel: string;
  thanks: string;
  contactNote: string;
};

function isPlanId(value: string): value is PlanId {
  return value in PLAN_PRICES;
}

function formatPrice(priceCents: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(priceCents / 100);
}

export async function POST(request: Request) {
  let body: TransferPayload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const planId = body.planId;
  const name = body.name?.trim();
  const email = body.email?.trim();
  const level = body.level?.trim();
  const notes = body.notes?.trim() || null;

  if (!planId || !isPlanId(planId)) {
    return NextResponse.json({ error: "Plan inválido." }, { status: 400 });
  }

  if (!name || !email || !level) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios." },
      { status: 400 },
    );
  }

  const planTitle = PLAN_TITLES[planId];
  const priceCents = PLAN_PRICES[planId];

  // Mismo criterio que app/api/checkout/route.ts para sacar el locale del
  // referer: el email al alumno (con los datos bancarios) se manda en su
  // idioma; el aviso a Gesa siempre va en español.
  const refererHeader = request.headers.get("referer");
  let locale: string = routing.defaultLocale;

  if (refererHeader) {
    try {
      const refererUrl = new URL(refererHeader);
      const firstSegment = refererUrl.pathname.split("/").filter(Boolean)[0];
      if (firstSegment && hasLocale(routing.locales, firstSegment)) {
        locale = firstSegment;
      }
    } catch {
      // referer malformado: seguimos con el locale por defecto.
    }
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error: insertError } = await supabase.from("enrollments").insert({
    plan_id: planId,
    plan_title: planTitle,
    price_cents: priceCents,
    student_name: name,
    student_email: email,
    level,
    notes,
    locale,
    status: "pending",
    payment_method: "transfer",
  });

  if (insertError) {
    console.error(
      "[enroll-transfer] Error guardando la inscripción en Supabase:",
      insertError,
    );
    return NextResponse.json(
      { error: "No se pudo registrar la inscripción." },
      { status: 500 },
    );
  }

  // Los dos emails son secundarios: cada uno en su propio try/catch, la
  // inscripción ya quedó guardada en este punto.

  // EMAIL 1: a Gesa, siempre en español, con reply_to a quien se inscribió
  // (mismo criterio que app/api/contact/route.ts y app/api/coffee-break/route.ts).
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: "Deutsch Flow <hallo@deutschflow.eu>",
      to: process.env.CONTACT_EMAIL_TO!,
      replyTo: email,
      subject: `Nueva inscripción por transferencia pendiente de confirmar: ${planTitle} - ${name}`,
      text: [
        `Nombre: ${name}`,
        `Email: ${email}`,
        `Nivel: ${level}`,
        notes ? `Notas: ${notes}` : null,
        `Plan: ${planTitle}`,
        `Precio: ${formatPrice(priceCents, "es")}`,
        `Idioma del alumno: ${locale}`,
        "",
        "Revisá tu cuenta de N26 y, cuando confirmes que la transferencia llegó, marcá esta inscripción como pagada en el panel de admin.",
      ]
        .filter((line) => line !== null)
        .join("\n"),
    });

    if (error) throw error;
  } catch (error) {
    console.error(
      "[enroll-transfer] Error enviando el email de aviso a Gesa:",
      error,
    );
  }

  // EMAIL 2: al alumno, en su idioma, con los datos bancarios (mismo criterio
  // de carga dinámica del JSON de mensajes que app/api/stripe/webhook/route.ts
  // para el email de la postal). No se setea reply_to acá: el destinatario
  // ES el alumno, así que un reply_to a su propio email no tendría sentido —
  // queda el comportamiento default de Resend (responde a "from").
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const messages = (await import(`../../../messages/${locale}.json`))
      .default;
    const t: TransferEmailMessages = messages.transferEmail;

    const { error } = await resend.emails.send({
      from: "Deutsch Flow <hallo@deutschflow.eu>",
      to: email,
      subject: t.subject,
      text: [
        `${t.greeting} ${name},`,
        "",
        t.body,
        "",
        `${t.ibanLabel}: ${process.env.BANK_TRANSFER_IBAN}`,
        `${t.holderLabel}: ${process.env.BANK_TRANSFER_HOLDER}`,
        `${t.amountLabel}: ${formatPrice(priceCents, locale)}`,
        "",
        t.referenceLabel,
        "",
        t.thanks,
        t.contactNote,
      ].join("\n"),
    });

    if (error) throw error;
  } catch (error) {
    console.error(
      "[enroll-transfer] Error enviando el email de datos bancarios al alumno:",
      error,
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
