import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// ---------------------------------------------------------------------------
// NOTA TÉCNICA — leer antes de publicar en producción:
//
// 1) Resend: se está enviando desde "onboarding@resend.dev", el dominio de
//    pruebas que da Resend por defecto. Ese dominio SOLO entrega emails a la
//    dirección con la que te registraste en Resend — cualquier otro
//    destinatario no va a recibir nada aunque la API responda éxito. Antes de
//    publicar el sitio hay que verificar un dominio propio en Resend y
//    cambiar el "from" de más abajo por una dirección de ese dominio.
//
// 2) Supabase: la tabla "contact_messages" no se crea desde este código, hay
//    que crearla manualmente en el proyecto de Supabase con esta estructura:
//
//    create table contact_messages (
//      id uuid primary key default gen_random_uuid(),
//      name text not null,
//      email text not null,
//      message text not null,
//      created_at timestamptz not null default now()
//    );
// ---------------------------------------------------------------------------

type ContactPayload = {
  name?: string;
  email?: string;
  message?: string;
};

export async function POST(request: Request) {
  let body: ContactPayload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim();
  const message = body.message?.trim();

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios." },
      { status: 400 },
    );
  }

  // a) Guardar en Supabase. Si esto falla, sí perdemos el mensaje del
  // cliente, así que es lo único que determina el status final de la request.
  let savedToSupabase = false;
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error } = await supabase
      .from("contact_messages")
      .insert({ name, email, message });

    if (error) throw error;
    savedToSupabase = true;
  } catch (error) {
    console.error("[contact] Error guardando el mensaje en Supabase:", error);
  }

  // b) Notificar por email con Resend. Es secundario: si falla, no debe tirar
  // abajo la respuesta siempre que el guardado en Supabase haya funcionado.
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: process.env.CONTACT_EMAIL_TO!,
      replyTo: email,
      subject: `Nuevo mensaje desde Deutsch Flow de ${name}`,
      text: `Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${message}`,
    });

    if (error) throw error;
  } catch (error) {
    console.error("[contact] Error enviando el email con Resend:", error);
  }

  if (!savedToSupabase) {
    return NextResponse.json(
      { error: "No se pudo guardar el mensaje." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
