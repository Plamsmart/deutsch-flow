import { redirect } from "next/navigation";
import { Fraunces, Work_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { PLAN_HOURS, type PlanId } from "@/lib/plans";
import CalendarView, {
  type CalendarSessionInput,
} from "@/components/admin/CalendarView";
import SignOutButton from "./SignOutButton";

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
  plan_id: PlanId;
  plan_title: string;
  level: string;
  paid_at: string | null;
};

type RawSessionRow = {
  id: string;
  enrollment_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: "scheduled" | "completed" | "cancelled";
  hours_counted: number | null;
  enrollments: { student_name: string; plan_title: string } | null;
};

function formatDate(isoDate: string | null) {
  if (!isoDate) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoDate));
}

export default async function MiCuentaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Mismo respaldo que en /admin: proxy.ts ya protege /mi-cuenta/* sin
  // sesión, este chequeo es la segunda capa por si la página se renderizara
  // sin pasar por el middleware.
  if (!user) {
    redirect("/mi-cuenta/login");
  }

  // NOTA DE SEGURIDAD: cliente de servidor (anon key + sesión del alumno),
  // sujeto a RLS. Las políticas nuevas de "enrollments" y "class_sessions"
  // filtran por student_email = auth.jwt()->>'email', así que estas dos
  // queries "traen todo" a propósito — es RLS, no el código acá, lo que
  // garantiza que cada alumno solo vea sus propias filas.
  const { data: enrollmentsData, error: enrollmentsError } = await supabase
    .from("enrollments")
    .select("id, student_name, plan_id, plan_title, level, paid_at")
    .eq("status", "paid")
    .order("paid_at", { ascending: false });

  if (enrollmentsError) {
    console.error(
      "[mi-cuenta] Error trayendo enrollments del alumno:",
      enrollmentsError,
    );
  }

  const enrollments = (enrollmentsData ?? []) as EnrollmentRow[];

  const { data: sessionsData, error: sessionsError } = await supabase
    .from("class_sessions")
    .select(
      "id, enrollment_id, scheduled_at, duration_minutes, status, hours_counted, enrollments(student_name, plan_title)",
    )
    .order("scheduled_at", { ascending: true });

  if (sessionsError) {
    console.error(
      "[mi-cuenta] Error trayendo class_sessions del alumno:",
      sessionsError,
    );
  }

  const sessionRows = (sessionsData ?? []) as unknown as RawSessionRow[];

  const calendarSessions: CalendarSessionInput[] = sessionRows
    .filter((row) => row.enrollments !== null)
    .map((row) => ({
      id: row.id,
      enrollment_id: row.enrollment_id,
      scheduled_at: row.scheduled_at,
      duration_minutes: row.duration_minutes,
      status: row.status,
      student_name: row.enrollments!.student_name,
      plan_title: row.enrollments!.plan_title,
    }));

  return (
    <main
      className={`${fraunces.variable} ${workSans.variable} min-h-screen bg-[#f4f4f4] px-6 py-10 font-[family-name:var(--font-work-sans)] md:px-10`}
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-fraunces)] text-[1.8rem] font-medium text-[#005461]">
            Mi cuenta
          </h1>
          <SignOutButton />
        </div>

        {enrollments.length === 0 ? (
          <div className="rounded-[16px] border border-[rgba(0,84,97,0.1)] bg-white p-6 text-center text-[0.9rem] text-[#005461] opacity-80 shadow-[0_6px_20px_rgba(0,84,97,0.06)]">
            No encontramos inscripciones asociadas a este email. Si compraste
            un paquete con un email distinto al de esta cuenta, escribile a
            Gesa para que lo revise.
          </div>
        ) : (
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {enrollments.map((enrollment) => {
              const totalHours = PLAN_HOURS[enrollment.plan_id];
              const usedHours =
                Math.round(
                  sessionRows
                    .filter(
                      (row) =>
                        row.enrollment_id === enrollment.id &&
                        row.status === "completed",
                    )
                    .reduce((sum, row) => sum + (row.hours_counted ?? 0), 0) *
                    100,
                ) / 100;
              const remainingHours =
                Math.round((totalHours - usedHours) * 100) / 100;

              return (
                <div
                  key={enrollment.id}
                  className="rounded-[16px] border border-[rgba(0,84,97,0.1)] bg-white p-6 shadow-[0_6px_20px_rgba(0,84,97,0.06)]"
                >
                  <h2 className="mb-1 font-[family-name:var(--font-fraunces)] text-[1.15rem] font-medium text-[#005461]">
                    {enrollment.plan_title}
                  </h2>
                  <p className="mb-4 text-[0.82rem] text-[#005461] opacity-70">
                    Nivel {enrollment.level} · Comprado el{" "}
                    {formatDate(enrollment.paid_at)}
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-center text-[0.8rem]">
                    <div className="rounded-[12px] border border-[rgba(0,183,181,0.3)] bg-[rgba(0,183,181,0.08)] p-3">
                      <div className="text-[0.68rem] tracking-[0.05em] text-[#018790] uppercase">
                        Totales
                      </div>
                      <div className="mt-1 font-[family-name:var(--font-fraunces)] text-[1.3rem] font-medium text-[#005461]">
                        {totalHours}h
                      </div>
                    </div>
                    <div className="rounded-[12px] border border-[rgba(0,84,97,0.1)] p-3">
                      <div className="text-[0.68rem] tracking-[0.05em] text-[#018790] uppercase">
                        Usadas
                      </div>
                      <div className="mt-1 font-[family-name:var(--font-fraunces)] text-[1.3rem] font-medium text-[#005461]">
                        {usedHours}h
                      </div>
                    </div>
                    <div
                      className={`rounded-[12px] border p-3 ${
                        remainingHours <= 0
                          ? "border-[rgba(220,38,38,0.3)] bg-[rgba(220,38,38,0.06)]"
                          : "border-[rgba(0,84,97,0.1)]"
                      }`}
                    >
                      <div className="text-[0.68rem] tracking-[0.05em] text-[#018790] uppercase">
                        Restantes
                      </div>
                      <div
                        className={`mt-1 font-[family-name:var(--font-fraunces)] text-[1.3rem] font-medium ${
                          remainingHours <= 0
                            ? "text-red-600"
                            : "text-[#005461]"
                        }`}
                      >
                        {remainingHours}h
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {calendarSessions.length > 0 && (
          <>
            <h2 className="mb-4 font-[family-name:var(--font-fraunces)] text-[1.3rem] font-medium text-[#005461]">
              Mis clases
            </h2>
            <CalendarView sessions={calendarSessions} variant="student" />
          </>
        )}
      </div>
    </main>
  );
}
