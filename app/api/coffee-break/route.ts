import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

type CoffeeBreakPayload = {
  name?: string;
  email?: string;
  notes?: string;
};

type CoffeeBreakEmailMessages = {
  subject: string;
  greeting: string;
  body: string;
  thanks: string;
  contactNote: string;
};

export async function POST(request: Request) {
  let body: CoffeeBreakPayload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim();
  const notes = body.notes?.trim() || null;

  if (!name || !email) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios." },
      { status: 400 },
    );
  }

  // El locale se saca del "referer", mismo criterio que
  // app/api/checkout/route.ts, para saber en qué idioma mandarle el email de
  // confirmación a quien se apuntó — el email de aviso a Gesa siempre va en
  // español, sin importar esto.
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

  // Guardar en Supabase con la service_role key (mismo patrón que
  // app/api/contact/route.ts) — la columna "status" queda en su default
  // 'waiting'. Es lo único crítico acá: si esto falla, la persona no quedó
  // registrada.
  let savedToSupabase = false;
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error } = await supabase
      .from("coffee_break_signups")
      .insert({ name, email, notes });

    if (error) throw error;
    savedToSupabase = true;
  } catch (error) {
    console.error(
      "[coffee-break] Error guardando el registro en Supabase:",
      error,
    );
  }

  if (!savedToSupabase) {
    return NextResponse.json(
      { error: "No se pudo guardar el registro." },
      { status: 500 },
    );
  }

  // Los dos emails son secundarios: cada uno en su propio try/catch para que
  // uno fallando no afecte al otro ni tire abajo la respuesta — el registro
  // en Supabase (lo crítico) ya quedó guardado en este punto.

  // EMAIL 1: a Gesa, siempre en español, con reply_to a quien se apuntó.
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: "Deutsch Flow <hallo@deutschflow.eu>",
      to: process.env.CONTACT_EMAIL_TO!,
      replyTo: email,
      subject: `Nueva persona interesada en German Coffee Break: ${name}`,
      text: [
        `Nombre: ${name}`,
        `Email: ${email}`,
        notes ? `Notas: ${notes}` : null,
      ]
        .filter((line) => line !== null)
        .join("\n"),
    });

    if (error) throw error;
  } catch (error) {
    console.error(
      "[coffee-break] Error enviando el email de aviso a Gesa:",
      error,
    );
  }

  // EMAIL 2: a quien se apuntó, en su idioma (mismo criterio de carga del
  // JSON de mensajes que app/api/stripe/webhook/route.ts para el email de la
  // postal) — acá es texto plano simple, no hace falta el diseño de postal.
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const messages = (await import(`../../../messages/${locale}.json`))
      .default;
    const t: CoffeeBreakEmailMessages = messages.coffeeBreakEmail;

    const { error } = await resend.emails.send({
      from: "Deutsch Flow <hallo@deutschflow.eu>",
      to: email,
      subject: t.subject,
      text: `${t.greeting} ${name},\n\n${t.body}\n\n${t.thanks}\n${t.contactNote}`,
    });

    if (error) throw error;
  } catch (error) {
    console.error(
      "[coffee-break] Error enviando el email de confirmación a quien se apuntó:",
      error,
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
