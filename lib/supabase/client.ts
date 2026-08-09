import { createBrowserClient } from "@supabase/ssr";

// Cliente de Supabase para usar en Client Components (ej. el formulario de
// login del admin). Usa la anon key pública — nunca la service_role key acá.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
