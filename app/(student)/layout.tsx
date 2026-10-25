import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { resolveStudentLocale } from "@/lib/studentLocale";
import "./globals.css";

// Root layout independiente para /mi-cuenta/*, mismo patrón que
// app/(admin)/layout.tsx: route group propio, sin el prefijo de locale en la
// URL. A diferencia de /admin (que sigue fijo en español), este panel ya
// traduce sus textos al idioma efectivo del alumno (ver lib/studentLocale.ts)
// — por eso necesita su propio <NextIntlClientProvider>: al vivir fuera de
// app/(public)/[locale], no hay segmento de ruta que next-intl pueda usar
// para inferir locale/messages solo, hay que pasárselos a mano.
export const metadata: Metadata = {
  title: "Mi cuenta — Deutsch Flow",
  description: "Panel de alumno de Deutsch Flow",
};

export default async function StudentRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await resolveStudentLocale();

  // Mismo patrón de import dinámico que i18n/request.ts, pero acá solo se le
  // pasa al provider el namespace "student" — no hace falta el resto de los
  // mensajes del sitio público para este panel.
  const allMessages = (await import(`../../messages/${locale}.json`)).default;
  const messages = { student: allMessages.student };

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
