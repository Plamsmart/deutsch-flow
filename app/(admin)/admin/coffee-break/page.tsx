import { redirect } from "next/navigation";
import Link from "next/link";
import { Fraunces, Work_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { confirmCoffeeBreakSignup } from "../actions";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-fraunces",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-work-sans",
});

type SignupStatus = "waiting" | "confirmed";

type SignupRow = {
  id: string;
  name: string;
  email: string;
  notes: string | null;
  status: SignupStatus;
  created_at: string;
};

const STATUS_LABELS: Record<SignupStatus, string> = {
  waiting: "En espera",
  confirmed: "Confirmado",
};

const STATUS_BADGE_CLASSES: Record<SignupStatus, string> = {
  waiting: "bg-[rgba(0,84,97,0.1)] text-[#005461]",
  confirmed: "bg-[rgba(0,183,181,0.12)] text-[#018790]",
};

function formatDateTime(isoDate: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoDate));
}

export default async function CoffeeBreakAdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Mismo respaldo que en el resto de /admin: proxy.ts ya protege esta ruta
  // exigiendo que el email autenticado sea exactamente ADMIN_EMAIL, este
  // chequeo es la segunda capa por si la página se renderizara sin pasar
  // por el middleware.
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/admin/login");
  }

  // NOTA DE SEGURIDAD: cliente de servidor (anon key + sesión de Gesa),
  // sujeto a RLS — coffee_break_signups permite insertar a cualquiera, pero
  // solo el admin puede leer/actualizar, así que esta query depende de que
  // esa policy de admin exista para no devolver 0 filas.
  const { data, error } = await supabase
    .from("coffee_break_signups")
    .select("id, name, email, notes, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin] Error trayendo coffee_break_signups:", error);
  }

  const signups = (data ?? []) as SignupRow[];

  return (
    <main
      className={`${fraunces.variable} ${workSans.variable} min-h-screen bg-[#f4f4f4] px-6 py-10 font-[family-name:var(--font-work-sans)] md:px-10`}
    >
      <div className="mx-auto max-w-[1000px]">
        <div className="mb-8">
          <Link
            href="/admin"
            className="mb-2 inline-block text-[0.85rem] text-[#005461] opacity-70 hover:opacity-100"
          >
            ← Volver al listado
          </Link>
          <h1 className="font-[family-name:var(--font-fraunces)] text-[1.8rem] font-medium text-[#005461]">
            German Coffee Break — Interesados
          </h1>
        </div>

        <div className="overflow-x-auto rounded-[16px] border border-[rgba(0,84,97,0.1)] bg-white shadow-[0_6px_20px_rgba(0,84,97,0.06)]">
          <table className="w-full min-w-[720px] border-collapse text-left text-[0.9rem]">
            <thead>
              <tr className="border-b border-[rgba(0,84,97,0.1)] text-[0.72rem] tracking-[0.05em] text-[#018790] uppercase">
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Notas</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {signups.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-[#005461] opacity-60"
                  >
                    Todavía no hay interesados registrados.
                  </td>
                </tr>
              )}
              {signups.map((signup) => (
                <tr
                  key={signup.id}
                  className="border-b border-[rgba(0,84,97,0.06)] text-[#142023] last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-[#005461]">
                    {signup.name}
                  </td>
                  <td className="px-4 py-3">{signup.email}</td>
                  <td className="px-4 py-3 text-[#142023] opacity-80">
                    {signup.notes || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {formatDateTime(signup.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[0.72rem] font-medium ${STATUS_BADGE_CLASSES[signup.status]}`}
                    >
                      {STATUS_LABELS[signup.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {signup.status === "waiting" && (
                      <form action={confirmCoffeeBreakSignup}>
                        <input type="hidden" name="signupId" value={signup.id} />
                        <button
                          type="submit"
                          className="rounded-[8px] bg-[#00b7b5] px-3 py-1.5 text-[0.78rem] font-semibold text-[#005461] transition-colors duration-200 hover:bg-[#33cfcd]"
                        >
                          Marcar como confirmado
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
