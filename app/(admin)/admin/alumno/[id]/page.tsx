import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Fraunces, Work_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { PLAN_HOURS, type PlanId } from "@/lib/plans";
import CompleteSessionForm from "./CompleteSessionForm";
import CancelSessionForm from "./CancelSessionForm";
import AddSessionForm from "./AddSessionForm";

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

type EnrollmentDetail = {
  id: string;
  student_name: string;
  student_email: string;
  plan_id: PlanId;
  plan_title: string;
  level: string;
  notes: string | null;
  paid_at: string | null;
};

type SessionStatus = "scheduled" | "completed" | "cancelled";

type ClassSession = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: SessionStatus;
  hours_counted: number | null;
  notes: string | null;
};

const STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: "Programada",
  completed: "Completada",
  cancelled: "Cancelada",
};

const STATUS_BADGE_CLASSES: Record<SessionStatus, string> = {
  scheduled: "bg-[rgba(0,183,181,0.12)] text-[#018790]",
  completed: "bg-[rgba(0,84,97,0.1)] text-[#005461]",
  cancelled: "bg-[rgba(220,38,38,0.1)] text-red-600",
};

function formatDateTime(isoDate: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoDate));
}

export default async function AlumnoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Mismo respaldo que en /admin: proxy.ts ya protege /admin/* exigiendo que
  // el email autenticado sea exactamente ADMIN_EMAIL, este chequeo es la
  // segunda capa por si la página se renderizara sin pasar por el
  // middleware.
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/admin/login");
  }

  // Misma nota de seguridad que en app/(admin)/admin/page.tsx: se usa el
  // cliente de servidor (anon key + sesión de Gesa), sujeto a RLS. Ver el
  // resumen final sobre las policies que necesitan "enrollments" y
  // "class_sessions" para que esto funcione.
  const { data: enrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .select(
      "id, student_name, student_email, plan_id, plan_title, level, notes, paid_at",
    )
    .eq("id", id)
    .single();

  if (enrollmentError || !enrollment) {
    notFound();
  }

  const enrollmentTyped = enrollment as EnrollmentDetail;

  const { data: sessionsData, error: sessionsError } = await supabase
    .from("class_sessions")
    .select("id, scheduled_at, duration_minutes, status, hours_counted, notes")
    .eq("enrollment_id", id)
    .order("scheduled_at", { ascending: true });

  if (sessionsError) {
    console.error("[admin] Error trayendo class_sessions:", sessionsError);
  }

  const sessions = (sessionsData ?? []) as ClassSession[];

  const totalHours = PLAN_HOURS[enrollmentTyped.plan_id];
  const usedHours = Math.round(
    sessions
      .filter((session) => session.status === "completed")
      .reduce((sum, session) => sum + (session.hours_counted ?? 0), 0) * 100,
  ) / 100;
  const remainingHours = Math.round((totalHours - usedHours) * 100) / 100;

  return (
    <main
      className={`${fraunces.variable} ${workSans.variable} min-h-screen bg-[#f4f4f4] px-6 py-10 font-[family-name:var(--font-work-sans)] md:px-10`}
    >
      <div className="mx-auto max-w-[1000px]">
        <Link
          href="/admin"
          className="mb-6 inline-block text-[0.85rem] text-[#005461] opacity-70 hover:opacity-100"
        >
          ← Volver al listado
        </Link>

        <div className="mb-6 rounded-[16px] border border-[rgba(0,84,97,0.1)] bg-white p-6 shadow-[0_6px_20px_rgba(0,84,97,0.06)]">
          <h1 className="mb-1 font-[family-name:var(--font-fraunces)] text-[1.6rem] font-medium text-[#005461]">
            {enrollmentTyped.student_name}
          </h1>
          <p className="mb-4 text-[0.9rem] text-[#005461] opacity-70">
            {enrollmentTyped.student_email}
          </p>
          <div className="grid grid-cols-2 gap-4 text-[0.85rem] sm:grid-cols-4">
            <div>
              <div className="text-[0.7rem] tracking-[0.05em] text-[#018790] uppercase opacity-75">
                Plan
              </div>
              <div className="text-[#142023]">{enrollmentTyped.plan_title}</div>
            </div>
            <div>
              <div className="text-[0.7rem] tracking-[0.05em] text-[#018790] uppercase opacity-75">
                Nivel
              </div>
              <div className="text-[#142023]">{enrollmentTyped.level}</div>
            </div>
            <div>
              <div className="text-[0.7rem] tracking-[0.05em] text-[#018790] uppercase opacity-75">
                Fecha de pago
              </div>
              <div className="text-[#142023]">
                {enrollmentTyped.paid_at
                  ? formatDateTime(enrollmentTyped.paid_at)
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-[0.7rem] tracking-[0.05em] text-[#018790] uppercase opacity-75">
                Notas de la compra
              </div>
              <div className="text-[#142023]">
                {enrollmentTyped.notes || "—"}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-[16px] border border-[rgba(0,183,181,0.3)] bg-[rgba(0,183,181,0.08)] p-5 text-center">
            <div className="text-[0.72rem] tracking-[0.05em] text-[#018790] uppercase">
              Horas totales
            </div>
            <div className="mt-1 font-[family-name:var(--font-fraunces)] text-[1.8rem] font-medium text-[#005461]">
              {totalHours}h
            </div>
          </div>
          <div className="rounded-[16px] border border-[rgba(0,84,97,0.1)] bg-white p-5 text-center">
            <div className="text-[0.72rem] tracking-[0.05em] text-[#018790] uppercase">
              Horas usadas
            </div>
            <div className="mt-1 font-[family-name:var(--font-fraunces)] text-[1.8rem] font-medium text-[#005461]">
              {usedHours}h
            </div>
          </div>
          <div
            className={`rounded-[16px] border p-5 text-center ${
              remainingHours <= 0
                ? "border-[rgba(220,38,38,0.3)] bg-[rgba(220,38,38,0.06)]"
                : "border-[rgba(0,84,97,0.1)] bg-white"
            }`}
          >
            <div className="text-[0.72rem] tracking-[0.05em] text-[#018790] uppercase">
              Horas restantes
            </div>
            <div
              className={`mt-1 font-[family-name:var(--font-fraunces)] text-[1.8rem] font-medium ${
                remainingHours <= 0 ? "text-red-600" : "text-[#005461]"
              }`}
            >
              {remainingHours}h
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-[16px] border border-[rgba(0,84,97,0.1)] bg-white p-6 shadow-[0_6px_20px_rgba(0,84,97,0.06)]">
          <h2 className="mb-4 font-[family-name:var(--font-fraunces)] text-[1.1rem] font-medium text-[#005461]">
            Agregar nueva clase
          </h2>
          <AddSessionForm enrollmentId={enrollmentTyped.id} />
        </div>

        <div className="overflow-x-auto rounded-[16px] border border-[rgba(0,84,97,0.1)] bg-white shadow-[0_6px_20px_rgba(0,84,97,0.06)]">
          <table className="w-full min-w-[720px] border-collapse text-left text-[0.9rem]">
            <thead>
              <tr className="border-b border-[rgba(0,84,97,0.1)] text-[0.72rem] tracking-[0.05em] text-[#018790] uppercase">
                <th className="px-4 py-3 font-semibold">Fecha y hora</th>
                <th className="px-4 py-3 font-semibold">Duración</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Notas</th>
                <th className="px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-[#005461] opacity-60"
                  >
                    Todavía no hay clases programadas.
                  </td>
                </tr>
              )}
              {sessions.map((session) => (
                <tr
                  key={session.id}
                  className="border-b border-[rgba(0,84,97,0.06)] text-[#142023] last:border-0"
                >
                  <td className="px-4 py-3">
                    {formatDateTime(session.scheduled_at)}
                  </td>
                  <td className="px-4 py-3">{session.duration_minutes} min</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[0.72rem] font-medium ${STATUS_BADGE_CLASSES[session.status]}`}
                    >
                      {STATUS_LABELS[session.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#142023] opacity-80">
                    {session.notes || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {session.status === "scheduled" && (
                      <div className="flex flex-wrap items-center gap-2">
                        <CompleteSessionForm
                          sessionId={session.id}
                          enrollmentId={enrollmentTyped.id}
                          suggestedHours={
                            Math.round(
                              (session.duration_minutes / 60) * 100,
                            ) / 100
                          }
                        />
                        <CancelSessionForm
                          sessionId={session.id}
                          enrollmentId={enrollmentTyped.id}
                        />
                      </div>
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
