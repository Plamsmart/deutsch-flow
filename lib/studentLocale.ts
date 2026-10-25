import { cookies } from "next/headers";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";

// Idioma efectivo para /mi-cuenta, que vive fuera de app/(public)/[locale] y
// por lo tanto no pasa por el middleware de next-intl (no hay request-locale
// ambiente ni cookie seteada desde acá mismo). Prioridad:
//   1) la cookie NEXT_LOCALE, que next-intl ya setea sola en cualquier visita
//      previa a una página bajo /{locale} en este mismo navegador;
//   2) user_metadata.locale de la sesión (si hay una) — guardado en el
//      registro, es la fuente durable entre dispositivos una vez logueado;
//   3) el locale por defecto del sitio.
// No hay columna profiles.locale: el locale del alumno ya logueado vive en
// user_metadata, no en la tabla.
export async function resolveStudentLocale(): Promise<string> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

  if (cookieLocale && hasLocale(routing.locales, cookieLocale)) {
    return cookieLocale;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const metadataLocale = user?.user_metadata?.locale;
  if (typeof metadataLocale === "string" && hasLocale(routing.locales, metadataLocale)) {
    return metadataLocale;
  }

  return routing.defaultLocale;
}
