import type { Metadata } from "next";
import "./globals.css";

// Root layout independiente para /mi-cuenta/*, mismo patrón que
// app/(admin)/layout.tsx: route group propio, sin next-intl, panel en
// español fijo. Los route groups no aparecen en la URL, así que esto no
// afecta ninguna ruta pública ni la de /admin.
export const metadata: Metadata = {
  title: "Mi cuenta — Deutsch Flow",
  description: "Panel de alumno de Deutsch Flow",
};

export default function StudentRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
