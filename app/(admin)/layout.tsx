import type { Metadata } from "next";
import "./globals.css";

// Root layout independiente para /admin/*, separado del root layout público
// (app/(public)/[locale]/layout.tsx) usando un route group. El panel de
// admin es solo para Gesa, sin next-intl ni traducciones, así que no tiene
// sentido que comparta el árbol de layouts del sitio público — y técnicamente
// no podría: Next.js exige un único root layout por rama de rutas, y
// app/(public)/[locale]/layout.tsx ya es el root layout de esa rama. Los
// route groups (carpetas entre paréntesis) no aparecen en la URL, así que
// esto no cambia ninguna ruta pública ni de admin.
export const metadata: Metadata = {
  title: "Admin — Deutsch Flow",
  description: "Panel de administración de Deutsch Flow",
};

export default function AdminRootLayout({
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
