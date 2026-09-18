import { redirect } from "next/navigation";
import Link from "next/link";
import { Fraunces, Work_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { PLAN_HOURS, type PlanId } from "@/lib/plans";
import SignOutButton from "./SignOutButton";
import { markTransferAsPaid } from "./actions";

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

type EnrollmentRow = {
  id: string;
  student_name: string;
  student_email: string;
  plan_id: PlanId;
  plan_title: string;
  price_cents: number;
  level: string;
  paid_at: string | null;
  status: "pending" | "paid";
  payment_method: "stripe" | "transfer";
};

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(priceCents / 100);
}

function formatDate(isoDate: string | null) {
  if (!isoDate) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoDate));
}

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // proxy.ts ya protege /admin redirigiendo a /admin/login si no hay sesión
  // o si el email autenticado no es exactamente ADMIN_EMAIL (desde la Fase
  // 3, los alumnos también tienen cuentas de Supabase Auth). Este chequeo
  // queda como respaldo por si esta página llegara a renderizarse sin pasar
  // por el middleware (ej. un cambio futuro al matcher de proxy.ts).
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/admin/login");
  }

  // NOTA DE SEGURIDAD: acá se usa el cliente de SERVIDOR de
  // lib/supabase/server.ts (anon key + la cookie de sesión de Gesa), NO el
  // cliente del navegador ni la service_role key que usan las API routes de
  // Stripe/contacto. Eso significa que esta consulta queda sujeta a Row
  // Level Security igual que cualquier request autenticado normal: si la
  // tabla "enrollments" no tiene RLS habilitado con una policy de SELECT
  // para el rol "authenticated" (o específicamente para el usuario de
  // Gesa), esta query devuelve 0 filas aunque la sesión sea válida — falla
  // "cerrado" en vez de exponer datos por accidente. Verificar en el
  // dashboard de Supabase (Authentication > Policies) que "enrollments"
  // tenga esa policy antes de dar por terminada esta fase.
  // Además de las inscripciones ya pagadas, traemos las "pending" que
  // eligieron pagar por transferencia (payment_method='transfer'): a
  // diferencia de una compra con tarjeta que quedó a medias (pending +
  // stripe, sin intención real de pago confirmada), una transferencia
  // "pending" SÍ es una inscripción real esperando que Gesa confirme que el
  // dinero entró — por eso necesita aparecer con su propio indicador.
  const { data, error } = await supabase
    .from("enrollments")
    .select(
      "id, student_name, student_email, plan_id, plan_title, price_cents, level, paid_at, status, payment_method",
    )
    .or("status.eq.paid,and(status.eq.pending,payment_method.eq.transfer)")
    .order("paid_at", { ascending: false });

  if (error) {
    console.error("[admin] Error trayendo enrollments:", error);
  }

  const enrollments = (data ?? []) as EnrollmentRow[];

  return (
    <main
      className={`${fraunces.variable} ${workSans.variable} min-h-screen bg-[#f4f4f4] px-6 py-10 font-[family-name:var(--font-work-sans)] md:px-10`}
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-fraunces)] text-[1.8rem] font-medium text-[#005461]">
            Alumnos inscritos
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/calendario"
              className="text-[0.9rem] font-medium text-[#00b7b5] hover:underline"
            >
              Calendario
            </Link>
            <Link
              href="/admin/coffee-break"
              className="text-[0.9rem] font-medium text-[#00b7b5] hover:underline"
            >
              Coffee Break
            </Link>
            <SignOutButton />
          </div>
        </div>

        <div className="overflow-x-auto rounded-[16px] border border-[rgba(0,84,97,0.1)] bg-white shadow-[0_6px_20px_rgba(0,84,97,0.06)]">
          <table className="w-full min-w-[960px] border-collapse text-left text-[0.9rem]">
            <thead>
              <tr className="border-b border-[rgba(0,84,97,0.1)] text-[0.72rem] tracking-[0.05em] text-[#018790] uppercase">
                <th className="px-4 py-3 font-semibold">Alumno</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Precio</th>
                <th className="px-4 py-3 font-semibold">Nivel</th>
                <th className="px-4 py-3 font-semibold">Horas</th>
                <th className="px-4 py-3 font-semibold">Fecha de pago</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-6 text-center text-[#005461] opacity-60"
                  >
                    Todavía no hay inscripciones pagadas.
                  </td>
                </tr>
              )}
              {enrollments.map((enrollment) => (
                <tr
                  key={enrollment.id}
                  className="border-b border-[rgba(0,84,97,0.06)] text-[#142023] last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-[#005461]">
                    {enrollment.student_name}
                  </td>
                  <td className="px-4 py-3">{enrollment.student_email}</td>
                  <td className="px-4 py-3">{enrollment.plan_title}</td>
                  <td className="px-4 py-3">
                    {formatPrice(enrollment.price_cents)}
                  </td>
                  <td className="px-4 py-3">{enrollment.level}</td>
                  <td className="px-4 py-3">
                    {PLAN_HOURS[enrollment.plan_id]}h
                  </td>
                  <td className="px-4 py-3">
                    {formatDate(enrollment.paid_at)}
                  </td>
                  <td className="px-4 py-3">
                    {enrollment.status === "pending" &&
                    enrollment.payment_method === "transfer" ? (
                      <div className="flex flex-col items-start gap-1.5">
                        <span className="rounded-full bg-[rgba(0,84,97,0.1)] px-2.5 py-1 text-[0.72rem] font-medium whitespace-nowrap text-[#005461]">
                          Pendiente transferencia
                        </span>
                        <form action={markTransferAsPaid}>
                          <input
                            type="hidden"
                            name="enrollmentId"
                            value={enrollment.id}
                          />
                          <button
                            type="submit"
                            className="rounded-[8px] bg-[#00b7b5] px-3 py-1.5 text-[0.72rem] font-semibold whitespace-nowrap text-[#005461] transition-colors duration-200 hover:bg-[#33cfcd]"
                          >
                            Marcar como pagado
                          </button>
                        </form>
                      </div>
                    ) : (
                      <span className="text-[0.8rem] text-[#005461] opacity-40">
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/alumno/${enrollment.id}`}
                      className="font-medium text-[#00b7b5] hover:underline"
                    >
                      Ver detalle
                    </Link>
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
