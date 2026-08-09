import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  // Las rutas /admin viven fuera de app/(public)/[locale] (el panel es solo
  // para Gesa, sin traducir), así que quedan completamente al margen del
  // middleware de next-intl. Si no las excluyéramos acá, next-intl trataría
  // "admin" como si fuera un locale inválido y redirigiría /admin a
  // /es/admin, rompiendo el panel.
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return updateSessionAndProtectAdmin(request);
  }

  return intlMiddleware(request);
}

async function updateSessionAndProtectAdmin(request: NextRequest) {
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

  // IMPORTANTE: getUser() (no getSession()) es lo que efectivamente valida
  // el token contra Supabase Auth en cada request — es lo que hace que esto
  // sirva como gate real, no solo un chequeo de "hay una cookie presente".
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  if (!user && !isLoginPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
