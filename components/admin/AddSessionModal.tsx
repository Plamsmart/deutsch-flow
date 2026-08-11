"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Fraunces, Work_Sans } from "next/font/google";
import { addSession } from "@/app/(admin)/admin/actions";
import type { EnrollmentOption } from "./CalendarView";
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

// <input type="datetime-local"> espera "YYYY-MM-DDTHH:mm" en hora local, sin
// info de zona horaria — mismo criterio que ya usa addSession() del lado del
// servidor (ver su comentario sobre zona horaria).
function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AddSessionModal({
  slotStart,
  enrollments,
  onClose,
}: {
  slotStart: Date | null;
  enrollments: EnrollmentOption[];
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slotStart) return;

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
  }, [slotStart, onClose]);

  if (!slotStart || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className={styles.overlay}>
      <div
        ref={panelRef}
        className={`${fraunces.variable} ${workSans.variable} ${styles.panel} w-full max-w-[420px] rounded-[20px] bg-white p-[1.8rem] font-[family-name:var(--font-work-sans)]`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h3 className="font-[family-name:var(--font-fraunces)] text-[1.2rem] font-medium text-[#005461]">
            Agregar clase
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

        <form action={addSession}>
          <div className="mb-3">
            <label
              htmlFor="slot-enrollmentId"
              className="mb-1 block text-[0.78rem] text-[#005461] opacity-80"
            >
              Alumno
            </label>
            <select
              id="slot-enrollmentId"
              name="enrollmentId"
              required
              defaultValue=""
              className="w-full rounded-[10px] border border-[rgba(0,84,97,0.18)] px-3 py-2 text-[0.9rem] text-[#142023] outline-none transition-colors duration-200 focus:border-[#00b7b5]"
            >
              <option value="" disabled>
                Elegí un alumno
              </option>
              {enrollments.map((enrollment) => (
                <option key={enrollment.id} value={enrollment.id}>
                  {enrollment.student_name} — {enrollment.plan_title}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label
              htmlFor="slot-scheduledAt"
              className="mb-1 block text-[0.78rem] text-[#005461] opacity-80"
            >
              Fecha y hora
            </label>
            <input
              type="datetime-local"
              id="slot-scheduledAt"
              name="scheduledAt"
              defaultValue={toDatetimeLocalValue(slotStart)}
              required
              className="w-full rounded-[10px] border border-[rgba(0,84,97,0.18)] px-3 py-2 text-[0.9rem] text-[#142023] outline-none transition-colors duration-200 focus:border-[#00b7b5]"
            />
          </div>

          <div className="mb-3">
            <label
              htmlFor="slot-durationMinutes"
              className="mb-1 block text-[0.78rem] text-[#005461] opacity-80"
            >
              Duración (min)
            </label>
            <input
              type="number"
              id="slot-durationMinutes"
              name="durationMinutes"
              defaultValue={55}
              min="1"
              required
              className="w-full rounded-[10px] border border-[rgba(0,84,97,0.18)] px-3 py-2 text-[0.9rem] text-[#142023] outline-none transition-colors duration-200 focus:border-[#00b7b5]"
            />
          </div>

          <div className="mb-5">
            <label
              htmlFor="slot-notes"
              className="mb-1 block text-[0.78rem] text-[#005461] opacity-80"
            >
              Notas (opcional)
            </label>
            <input
              type="text"
              id="slot-notes"
              name="notes"
              className="w-full rounded-[10px] border border-[rgba(0,84,97,0.18)] px-3 py-2 text-[0.9rem] text-[#142023] outline-none transition-colors duration-200 focus:border-[#00b7b5]"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-[10px] bg-[#00b7b5] py-3 text-[0.95rem] font-semibold text-[#005461] transition-colors duration-200 hover:bg-[#33cfcd]"
          >
            Agregar clase
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
