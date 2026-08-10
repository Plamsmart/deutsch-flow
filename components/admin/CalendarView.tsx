"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  dateFnsLocalizer,
  type EventPropGetter,
  type View,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { Fraunces, Work_Sans } from "next/font/google";
import "react-big-calendar/lib/css/react-big-calendar.css";
import styles from "./CalendarView.module.css";

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

const locales = { es };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CALENDAR_VIEWS: View[] = ["month", "week", "day"];

const MESSAGES = {
  date: "Fecha",
  time: "Hora",
  event: "Clase",
  allDay: "Todo el día",
  week: "Semana",
  work_week: "Semana laboral",
  day: "Día",
  month: "Mes",
  previous: "Anterior",
  next: "Siguiente",
  yesterday: "Ayer",
  tomorrow: "Mañana",
  today: "Hoy",
  agenda: "Agenda",
  noEventsInRange: "No hay clases en este rango.",
  showMore: (count: number) => `+ ${count} más`,
};

export type CalendarSessionInput = {
  id: string;
  enrollment_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: "scheduled" | "completed" | "cancelled";
  student_name: string;
  plan_title: string;
};

type CalendarEvent = {
  id: string;
  enrollmentId: string;
  title: string;
  start: Date;
  end: Date;
  status: "scheduled" | "completed" | "cancelled";
};

const STATUS_COLORS: Record<
  CalendarEvent["status"],
  { background: string; color: string }
> = {
  scheduled: { background: "#00b7b5", color: "#04282d" },
  completed: { background: "#4d7c74", color: "#f4f4f4" },
  cancelled: { background: "#9ca3af", color: "#f4f4f4" },
};

const eventPropGetter: EventPropGetter<CalendarEvent> = (event) => {
  const colors = STATUS_COLORS[event.status];
  return {
    style: {
      backgroundColor: colors.background,
      color: colors.color,
      border: "none",
      opacity: event.status === "cancelled" ? 0.7 : 1,
      textDecoration: event.status === "cancelled" ? "line-through" : "none",
    },
  };
};

export default function CalendarView({
  sessions,
  variant = "admin",
}: {
  sessions: CalendarSessionInput[];
  // "admin" ve las clases de todos los alumnos y navega al detalle de cada
  // uno al hacer click; "student" es la versión reducida de /mi-cuenta, que
  // ya sólo recibe las clases del alumno logueado (filtradas por RLS) y no
  // tiene a dónde navegar al hacer click.
  variant?: "admin" | "student";
}) {
  const router = useRouter();

  const events = useMemo<CalendarEvent[]>(
    () =>
      sessions.map((session) => {
        const start = new Date(session.scheduled_at);
        const end = new Date(
          start.getTime() + session.duration_minutes * 60000,
        );
        return {
          id: session.id,
          enrollmentId: session.enrollment_id,
          title: `${session.student_name} — ${session.plan_title}`,
          start,
          end,
          status: session.status,
        };
      }),
    [sessions],
  );

  return (
    <div
      className={`${fraunces.variable} ${workSans.variable} ${styles.calendarWrapper}`}
    >
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        defaultView="week"
        views={CALENDAR_VIEWS}
        culture="es"
        messages={MESSAGES}
        eventPropGetter={eventPropGetter}
        onSelectEvent={
          variant === "admin"
            ? (event) => router.push(`/admin/alumno/${event.enrollmentId}`)
            : undefined
        }
        style={{ height: "100%" }}
      />
    </div>
  );
}
