import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  // Las rutas /admin y /mi-cuenta viven fuera de app/(public)/[locale]
  // (paneles sin traducir), así que quedan completamente al margen del
  // middleware de next-intl. Si no las excluyéramos acá, next-intl trataría
  // "admin"/"mi-cuenta" como si fueran locales inválidos y redirigiría a
  // /es/admin o /es/mi-cuenta, rompiendo ambos paneles.
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return protectAdmin(request);
  }

  if (request.nextUrl.pathname.startsWith("/mi-cuenta")) {
    return protectStudent(request);
  }

  return intlMiddleware(request);
}

function createSupabaseMiddlewareClient(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  return { supabase, getResponse: () => supabaseResponse };
}

async function protectAdmin(request: NextRequest) {
  const { supabase, getResponse } = createSupabaseMiddlewareClient(request);

  // IMPORTANTE: getUser() (no getSession()) es lo que efectivamente valida
  // el token contra Supabase Auth en cada request — es lo que hace que esto
  // sirva como gate real, no solo un chequeo de "hay una cookie presente".
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  // Desde la Fase 3, los alumnos también tienen cuentas de Supabase Auth —
  // tener una sesión válida ya no alcanza para entrar a /admin. El email
  // autenticado tiene que coincidir EXACTAMENTE con ADMIN_EMAIL; cualquier
  // otra sesión válida (ej. un alumno logueado) se trata igual que "sin
  // sesión" acá.
  const isAdmin = user?.email === process.env.ADMIN_EMAIL;

  if (!isAdmin && !isLoginPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    return NextResponse.redirect(loginUrl);
  }

  return getResponse();
}

async function protectStudent(request: NextRequest) {
  const { supabase, getResponse } = createSupabaseMiddlewareClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage =
    request.nextUrl.pathname === "/mi-cuenta/login" ||
    request.nextUrl.pathname === "/mi-cuenta/registro";

  if (!user && !isAuthPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/mi-cuenta/login";
    return NextResponse.redirect(loginUrl);
  }

  return getResponse();
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
