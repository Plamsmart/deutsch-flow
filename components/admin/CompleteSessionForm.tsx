"use client";

import { useState } from "react";
import { completeSession } from "@/app/(admin)/admin/actions";

export default function CompleteSessionForm({
  sessionId,
  enrollmentId,
  suggestedHours,
}: {
  sessionId: string;
  enrollmentId: string;
  suggestedHours: number;
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="rounded-[8px] bg-[#00b7b5] px-3 py-1.5 text-[0.78rem] font-semibold text-[#005461] transition-colors duration-200 hover:bg-[#33cfcd]"
      >
        Marcar como completada
      </button>
    );
  }

  return (
    <form action={completeSession} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <label className="flex items-center gap-1 text-[0.72rem] text-[#005461] opacity-80">
        Horas
        <input
          type="number"
          name="hoursCounted"
          defaultValue={suggestedHours}
          step="0.01"
          min="0"
          required
          className="w-[70px] rounded-[6px] border border-[rgba(0,84,97,0.18)] px-2 py-1 text-[0.8rem] text-[#142023] outline-none focus:border-[#00b7b5]"
        />
      </label>
      <button
        type="submit"
        className="rounded-[8px] bg-[#00b7b5] px-3 py-1.5 text-[0.78rem] font-semibold text-[#005461] transition-colors duration-200 hover:bg-[#33cfcd]"
      >
        Confirmar
      </button>
      <button
        type="button"
        onClick={() => setIsEditing(false)}
        className="rounded-[8px] border border-[rgba(0,84,97,0.18)] px-3 py-1.5 text-[0.78rem] text-[#005461] transition-colors duration-200 hover:bg-[rgba(0,84,97,0.06)]"
      >
        Cancelar
      </button>
    </form>
  );
}
