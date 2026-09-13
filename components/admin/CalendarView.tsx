"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  type EventProps,
  type EventPropGetter,
  type SlotInfo,
  type View,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { Fraunces, Work_Sans } from "next/font/google";
import "react-big-calendar/lib/css/react-big-calendar.css";
import EventDetailModal from "./EventDetailModal";
import AddSessionModal from "./AddSessionModal";
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

export type CalendarEvent = {
  kind: "own";
  id: string;
  enrollmentId: string;
  title: string;
  start: Date;
  end: Date;
  status: "scheduled" | "completed" | "cancelled";
};

// Representa un hueco ocupado por OTRO alumno, ya anonimizado por
// get_busy_slots() en Supabase (solo trae scheduled_at/duration_minutes, sin
// id de sesión ni de inscripción) — por eso no tiene enrollmentId ni status,
// y por eso onSelectEvent lo ignora más abajo: no hay a dónde navegar ni
// nada que gestionar.
export type BusySlotEvent = {
  kind: "busy";
  id: string;
  title: string;
  start: Date;
  end: Date;
};

type AnyCalendarEvent = CalendarEvent | BusySlotEvent;

export type EnrollmentOption = {
  id: string;
  student_name: string;
  plan_title: string;
};

export type BusySlotInput = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
};

const STATUS_COLORS: Record<
  CalendarEvent["status"],
  { background: string; color: string }
> = {
  scheduled: { background: "#00b7b5", color: "#04282d" },
  completed: { background: "#4d7c74", color: "#f4f4f4" },
  cancelled: { background: "#9ca3af", color: "#f4f4f4" },
};

const BUSY_SLOT_COLORS = { background: "#d1d5db", color: "#4b5563" };

const eventPropGetter: EventPropGetter<AnyCalendarEvent> = (event) => {
  if (event.kind === "busy") {
    return {
      className: "busySlotEvent",
      style: {
        backgroundColor: BUSY_SLOT_COLORS.background,
        color: BUSY_SLOT_COLORS.color,
        border: "none",
        cursor: "default",
      },
    };
  }

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

// Bloques "busy" no muestran texto (ni "Ocupado" ni la hora) — solo el color
// gris de eventPropGetter marca el hueco como ocupado. Las clases propias
// siguen mostrando su título normal.
function EventContent({ event, title }: EventProps<AnyCalendarEvent>) {
  if (event.kind === "busy") {
    return null;
  }

  return <>{title}</>;
}

export default function CalendarView({
  sessions,
  busySlots = [],
  enrollments = [],
  variant = "admin",
}: {
  sessions: CalendarSessionInput[];
  // Huecos ocupados por OTROS alumnos, ya anonimizados (solo usado en
  // variant="student" hoy, ver EventDetailModal/onSelectEvent más abajo para
  // la garantía de que nunca son clickeables).
  busySlots?: BusySlotInput[];
  // Solo hace falta en variant="admin", para llenar el <select> de alumno
  // del modal de "agregar clase" al hacer click en un hueco vacío.
  enrollments?: EnrollmentOption[];
  // "admin" ve las clases de todos los alumnos y puede gestionarlas (abrir
  // detalle/completar/cancelar/eliminar, y agregar nuevas haciendo click en
  // un hueco vacío); "student" es la versión reducida de /mi-cuenta, que ya
  // sólo recibe las clases del alumno logueado (filtradas por RLS) y no
  // tiene ninguna acción disponible al hacer click.
  variant?: "admin" | "student";
}) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedSlotStart, setSelectedSlotStart] = useState<Date | null>(
    null,
  );
  // react-big-calendar no controla la fecha internamente de forma confiable
  // en Next.js — sin esto, los botones "Anterior"/"Siguiente"/"Hoy" del
  // toolbar no navegan.
  const [currentDate, setCurrentDate] = useState(new Date());

  const events = useMemo<CalendarEvent[]>(
    () =>
      sessions.map((session) => {
        const start = new Date(session.scheduled_at);
        const end = new Date(
          start.getTime() + session.duration_minutes * 60000,
        );
        return {
          kind: "own",
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

  const busyEvents = useMemo<BusySlotEvent[]>(
    () =>
      busySlots.map((slot) => {
        const start = new Date(slot.scheduled_at);
        const end = new Date(start.getTime() + slot.duration_minutes * 60000);
        return { kind: "busy", id: slot.id, title: "Ocupado", start, end };
      }),
    [busySlots],
  );

  // react-big-calendar solo acepta un array de eventos: las propias clases y
  // los huecos anonimizados de otros alumnos se combinan acá solo para
  // renderizarse juntos, pero llegan como props separadas (sessions vs.
  // busySlots) para que estilo/comportamiento se puedan tratar distinto sin
  // mezclar ambas fuentes de datos más arriba.
  const calendarEvents = useMemo<AnyCalendarEvent[]>(
    () => [...events, ...busyEvents],
    [events, busyEvents],
  );

  // Se busca por id en vez de guardar el evento clickeado entero: así, si una
  // mutación (completar/cancelar/eliminar) revalida la página y `sessions`
  // llega actualizado, el modal abierto refleja el estado nuevo solo, y si el
  // evento fue eliminado deja de encontrarse y el modal se cierra solo. Se
  // busca en `events` (no en calendarEvents): un hueco "busy" nunca puede
  // ser el seleccionado, ver el guard en onSelectEvent.
  const selectedEvent =
    events.find((event) => event.id === selectedEventId) ?? null;

  return (
    <div
      className={`${fraunces.variable} ${workSans.variable} ${styles.calendarWrapper}`}
    >
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        defaultView="week"
        views={CALENDAR_VIEWS}
        date={currentDate}
        onNavigate={setCurrentDate}
        culture="es"
        messages={MESSAGES}
        components={{ event: EventContent }}
        eventPropGetter={eventPropGetter}
        selectable={variant === "admin"}
        onSelectEvent={
          variant === "admin"
            ? (event) => {
                // Los huecos "busy" (de otros alumnos, anonimizados) nunca
                // son clickeables, ni siquiera acá — no hay detalle que
                // mostrar ni acción que tomar sobre ellos.
                if (event.kind === "busy") return;
                setSelectedEventId(event.id);
              }
            : undefined
        }
        onSelectSlot={
          variant === "admin"
            ? (slotInfo: SlotInfo) => setSelectedSlotStart(slotInfo.start)
            : undefined
        }
        style={{ height: "100%" }}
      />

      {variant === "admin" && (
        <>
          <EventDetailModal
            event={selectedEvent}
            onClose={() => setSelectedEventId(null)}
          />
          <AddSessionModal
            slotStart={selectedSlotStart}
            enrollments={enrollments}
            onClose={() => setSelectedSlotStart(null)}
          />
        </>
      )}
    </div>
  );
}
