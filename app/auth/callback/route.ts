import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Un "next" sin validar sería un open redirect: cualquiera podría armar un
// link de confirmación con ?next=https://sitio-malicioso.com y el canje de
// sesión terminaría redirigiendo ahí. Solo se acepta un path interno
// ("/algo"), nunca algo que empiece con "//" (protocol-relative, salta a
// otro host) ni que contenga "://" (una URL absoluta en cualquier parte del
// valor).
function isSafeNextPath(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("://");
}

// Destino de emailRedirectTo (ver app/(student)/mi-cuenta/registro/page.tsx):
// Supabase redirige acá con ?code=... tras confirmar el email. Un Server
// Component no puede setear cookies, así que el canje por sesión tiene que
// pasar por un Route Handler — recién después se redirige a "next" (la
// página pública donde se muestra el modal de bienvenida).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  const next =
    rawNext && isSafeNextPath(rawNext) ? rawNext : "/mi-cuenta";

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("[auth/callback] Error canjeando el code por sesión:", error);
  }

  // Sin code, o el canje falló: mandamos al login en vez de a una página
  // que asuma que ya hay sesión.
  return NextResponse.redirect(`${origin}/mi-cuenta/login`);
}
