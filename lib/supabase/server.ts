import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente de Supabase para Server Components y Route Handlers. Crea una
// instancia nueva por request (nunca se reutiliza/cachea entre requests) y
// usa la anon key pública + la cookie de sesión del usuario — no la
// service_role key. Esto es intencional: ver la nota de seguridad en
// app/(admin)/admin/page.tsx sobre por qué leer con este cliente (en vez del
// cliente con service_role que ya usan las API routes de Stripe/contacto)
// es lo que hace que Row Level Security siga protegiendo la tabla.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll() fue llamado desde un Server Component, donde no se
            // pueden escribir cookies. Es inofensivo porque proxy.ts ya
            // refresca la sesión en cada request a /admin antes de que el
            // Server Component se ejecute.
          }
        },
      },
    },
  );
}
