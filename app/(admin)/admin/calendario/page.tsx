import { redirect } from "next/navigation";
import Link from "next/link";
import { Fraunces, Work_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import CalendarView, {
  type CalendarSessionInput,
} from "@/components/admin/CalendarView";

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

type RawSessionRow = {
  id: string;
  enrollment_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: "scheduled" | "completed" | "cancelled";
  enrollments: { student_name: string; plan_title: string } | null;
};

export default async function CalendarioPage() {
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

  // Misma nota de seguridad que en app/(admin)/admin/page.tsx: cliente de
  // servidor (anon key + sesión de Gesa), sujeto a RLS en "class_sessions" y
  // "enrollments" por igual.
  const { data, error } = await supabase
    .from("class_sessions")
    .select(
      "id, enrollment_id, scheduled_at, duration_minutes, status, enrollments(student_name, plan_title)",
    )
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error(
      "[admin] Error trayendo class_sessions para el calendario:",
      error,
    );
  }

  const rows = (data ?? []) as unknown as RawSessionRow[];

  const sessions: CalendarSessionInput[] = rows
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

  // Para el <select> de alumno del modal de "agregar clase" al hacer click
  // en un hueco vacío del calendario.
  const { data: enrollmentsData, error: enrollmentsError } = await supabase
    .from("enrollments")
    .select("id, student_name, plan_title")
    .eq("status", "paid")
    .order("student_name", { ascending: true });

  if (enrollmentsError) {
    console.error(
      "[admin] Error trayendo enrollments para el calendario:",
      enrollmentsError,
    );
  }

  const enrollments = (enrollmentsData ?? []) as {
    id: string;
    student_name: string;
    plan_title: string;
  }[];

  return (
    <main
      className={`${fraunces.variable} ${workSans.variable} min-h-screen bg-[#f4f4f4] px-6 py-10 font-[family-name:var(--font-work-sans)] md:px-10`}
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8">
          <Link
            href="/admin"
            className="mb-2 inline-block text-[0.85rem] text-[#005461] opacity-70 hover:opacity-100"
          >
            ← Volver al listado
          </Link>
          <h1 className="font-[family-name:var(--font-fraunces)] text-[1.8rem] font-medium text-[#005461]">
            Calendario de clases
          </h1>
        </div>

        <CalendarView sessions={sessions} enrollments={enrollments} />
      </div>
    </main>
  );
}
