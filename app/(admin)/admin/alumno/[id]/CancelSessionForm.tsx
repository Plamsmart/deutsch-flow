import { cancelSession } from "./actions";

// Sin "use client": es un formulario simple ligado directamente a un Server
// Function, funciona con progressive enhancement sin necesitar JS del lado
// del cliente ni estado propio.
export default function CancelSessionForm({
  sessionId,
  enrollmentId,
}: {
  sessionId: string;
  enrollmentId: string;
}) {
  return (
    <form action={cancelSession}>
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <button
        type="submit"
        className="rounded-[8px] border border-[rgba(0,84,97,0.18)] px-3 py-1.5 text-[0.78rem] text-[#005461] transition-colors duration-200 hover:bg-[rgba(0,84,97,0.06)]"
      >
        Cancelar
      </button>
    </form>
  );
}
