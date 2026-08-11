"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Fraunces, Work_Sans } from "next/font/google";
import { deleteSession } from "@/app/(admin)/admin/actions";
import CompleteSessionForm from "./CompleteSessionForm";
import CancelSessionForm from "./CancelSessionForm";
import type { CalendarEvent } from "./CalendarView";
import styles from "./AdminModal.module.css";

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

const STATUS_LABELS: Record<CalendarEvent["status"], string> = {
  scheduled: "Programada",
  completed: "Completada",
  cancelled: "Cancelada",
};

const STATUS_BADGE_CLASSES: Record<CalendarEvent["status"], string> = {
  scheduled: "bg-[rgba(0,183,181,0.12)] text-[#018790]",
  completed: "bg-[rgba(0,84,97,0.1)] text-[#005461]",
  cancelled: "bg-[rgba(220,38,38,0.1)] text-red-600",
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function EventDetailModal({
  event,
  onClose,
}: {
  event: CalendarEvent | null;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!event) return;

    function handlePointerDown(pointerEvent: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(pointerEvent.target as Node)
      ) {
        onClose();
      }
    }

    function handleKeyDown(keyboardEvent: KeyboardEvent) {
      if (keyboardEvent.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [event, onClose]);

  if (!event || typeof document === "undefined") {
    return null;
  }

  const durationMinutes = Math.round(
    (event.end.getTime() - event.start.getTime()) / 60000,
  );
  const suggestedHours = Math.round((durationMinutes / 60) * 100) / 100;

  return createPortal(
    <div className={styles.overlay}>
      <div
        ref={panelRef}
        className={`${fraunces.variable} ${workSans.variable} ${styles.panel} w-full max-w-[420px] rounded-[20px] bg-white p-[1.8rem] font-[family-name:var(--font-work-sans)]`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="font-[family-name:var(--font-fraunces)] text-[1.2rem] font-medium text-[#005461]">
            {event.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#005461] transition-colors duration-200 hover:bg-[rgba(0,84,97,0.08)]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-4 w-4"
            >
              <path d="M18 6 6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-5 space-y-2 text-[0.88rem] text-[#142023]">
          <div className="flex justify-between">
            <span className="opacity-60">Fecha y hora</span>
            <span>{formatDateTime(event.start)}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-60">Duración</span>
            <span>{durationMinutes} min</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="opacity-60">Estado</span>
            <span
              className={`rounded-full px-2.5 py-1 text-[0.72rem] font-medium ${STATUS_BADGE_CLASSES[event.status]}`}
            >
              {STATUS_LABELS[event.status]}
            </span>
          </div>
        </div>

        {event.status === "scheduled" && (
          <div className="mb-4 flex flex-wrap items-center gap-2 border-t border-[rgba(0,84,97,0.1)] pt-4">
            <CompleteSessionForm
              sessionId={event.id}
              enrollmentId={event.enrollmentId}
              suggestedHours={suggestedHours}
            />
            <CancelSessionForm
              sessionId={event.id}
              enrollmentId={event.enrollmentId}
            />
          </div>
        )}

        <div className="mb-4 flex items-center justify-between border-t border-[rgba(0,84,97,0.1)] pt-4">
          <Link
            href={`/admin/alumno/${event.enrollmentId}`}
            className="text-[0.82rem] font-medium text-[#00b7b5] hover:underline"
          >
            Ver detalle completo del alumno →
          </Link>

          <form
            action={deleteSession}
            onSubmit={(submitEvent) => {
              if (
                !window.confirm(
                  "¿Seguro que querés eliminar esta clase? Esta acción no se puede deshacer.",
                )
              ) {
                submitEvent.preventDefault();
              }
            }}
          >
            <input type="hidden" name="sessionId" value={event.id} />
            <input
              type="hidden"
              name="enrollmentId"
              value={event.enrollmentId}
            />
            <button
              type="submit"
              className="rounded-[8px] border border-[rgba(220,38,38,0.3)] px-3 py-1.5 text-[0.78rem] font-medium text-red-600 transition-colors duration-200 hover:bg-[rgba(220,38,38,0.08)]"
            >
              Eliminar
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}
