import { addSession } from "./actions";

// Tampoco necesita "use client": formulario no controlado, con
// progressive enhancement, ligado directo al Server Function.
export default function AddSessionForm({
  enrollmentId,
}: {
  enrollmentId: string;
}) {
  return (
    <form
      action={addSession}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-[1fr_140px_1fr_auto] md:items-end"
    >
      <input type="hidden" name="enrollmentId" value={enrollmentId} />

      <div>
        <label
          htmlFor="scheduledAt"
          className="mb-1 block text-[0.78rem] text-[#005461] opacity-80"
        >
          Fecha y hora
        </label>
        <input
          type="datetime-local"
          id="scheduledAt"
          name="scheduledAt"
          required
          className="w-full rounded-[10px] border border-[rgba(0,84,97,0.18)] px-3 py-2 text-[0.9rem] text-[#142023] outline-none transition-colors duration-200 focus:border-[#00b7b5]"
        />
      </div>

      <div>
        <label
          htmlFor="durationMinutes"
          className="mb-1 block text-[0.78rem] text-[#005461] opacity-80"
        >
          Duración (min)
        </label>
        <input
          type="number"
          id="durationMinutes"
          name="durationMinutes"
          defaultValue={55}
          min="1"
          required
          className="w-full rounded-[10px] border border-[rgba(0,84,97,0.18)] px-3 py-2 text-[0.9rem] text-[#142023] outline-none transition-colors duration-200 focus:border-[#00b7b5]"
        />
      </div>

      <div>
        <label
          htmlFor="notes"
          className="mb-1 block text-[0.78rem] text-[#005461] opacity-80"
        >
          Notas (opcional)
        </label>
        <input
          type="text"
          id="notes"
          name="notes"
          className="w-full rounded-[10px] border border-[rgba(0,84,97,0.18)] px-3 py-2 text-[0.9rem] text-[#142023] outline-none transition-colors duration-200 focus:border-[#00b7b5]"
        />
      </div>

      <button
        type="submit"
        className="rounded-[10px] bg-[#00b7b5] px-4 py-2 text-[0.9rem] font-semibold text-[#005461] transition-colors duration-200 hover:bg-[#33cfcd]"
      >
        Agregar clase
      </button>
    </form>
  );
}
