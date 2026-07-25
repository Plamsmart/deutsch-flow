import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { PLAN_PRICES, PLAN_TITLES, type PlanId } from "@/lib/plans";

// ---------------------------------------------------------------------------
// Esto es la PARTE 1 (modal + creación de la sesión de pago). Toda
// inscripción se guarda acá con status: "pending" y nunca se actualiza sola a
// "paid" — eso lo hace exclusivamente el webhook de Stripe en
// app/api/stripe/webhook/route.ts (PARTE 2), una vez que Stripe confirma que
// el pago se completó.
// ---------------------------------------------------------------------------

type CheckoutPayload = {
  planId?: string;
  name?: string;
  email?: string;
  level?: string;
  notes?: string;
};

function isPlanId(value: string): value is PlanId {
  return value in PLAN_PRICES;
}

export async function POST(request: Request) {
  let body: CheckoutPayload;

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

  // El sitio es de una sola página (todas las secciones, incluida "Clases",
  // viven en /{locale}, no hay una ruta /clases separada), así que las URLs
  // de retorno de Stripe apuntan de vuelta al home en el locale actual con el
  // hash de la sección. El locale se saca del "referer" (contiene el path
  // completo); el origin preferimos tomarlo del header "origin" y si no está
  // presente, del propio "referer". Este mismo locale se guarda en Supabase y
  // en la metadata de Stripe para que el webhook (Parte 2) sepa en qué idioma
  // enviarle el email de confirmación al alumno.
  const originHeader = request.headers.get("origin");
  const refererHeader = request.headers.get("referer");

  let origin = originHeader;
  let locale: string = routing.defaultLocale;

  if (refererHeader) {
    try {
      const refererUrl = new URL(refererHeader);
      if (!origin) origin = refererUrl.origin;

      const firstSegment = refererUrl.pathname.split("/").filter(Boolean)[0];
      if (firstSegment && hasLocale(routing.locales, firstSegment)) {
        locale = firstSegment;
      }
    } catch {
      // referer malformado: seguimos con los valores por defecto.
    }
  }

  if (!origin) {
    origin = new URL(request.url).origin;
  }

  const successUrl = `${origin}/${locale}?checkout=success#clases`;
  const cancelUrl = `${origin}/${locale}?checkout=cancel#clases`;

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: enrollment, error: insertError } = await supabase
    .from("enrollments")
    .insert({
      plan_id: planId,
      plan_title: planTitle,
      price_cents: priceCents,
      student_name: name,
      student_email: email,
      level,
      notes,
      locale,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !enrollment) {
    console.error(
      "[checkout] Error guardando la inscripción en Supabase:",
      insertError,
    );
    return NextResponse.json(
      { error: "No se pudo registrar la inscripción." },
      { status: 500 },
    );
  }

  let session: Stripe.Checkout.Session;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: priceCents,
            product_data: {
              name: planTitle,
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        enrollment_id: enrollment.id,
        plan_id: planId,
        student_email: email,
        locale,
      },
    });
  } catch (error) {
    console.error("[checkout] Error creando la sesión de Stripe:", error);
    return NextResponse.json(
      { error: "No se pudo iniciar el pago." },
      { status: 500 },
    );
  }

  if (!session.url) {
    console.error("[checkout] Stripe no devolvió una URL de sesión.");
    return NextResponse.json(
      { error: "No se pudo iniciar el pago." },
      { status: 500 },
    );
  }

  const { error: updateError } = await supabase
    .from("enrollments")
    .update({ stripe_session_id: session.id })
    .eq("id", enrollment.id);

  if (updateError) {
    console.error(
      "[checkout] Error guardando el stripe_session_id en Supabase:",
      updateError,
    );
  }

  return NextResponse.json({ url: session.url });
}
