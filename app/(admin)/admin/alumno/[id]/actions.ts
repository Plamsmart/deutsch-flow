"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Server Functions son alcanzables por POST directo, no solo desde la UI de
// esta página — cada una revalida la sesión de Gesa acá adentro, sin confiar
// únicamente en que proxy.ts haya filtrado la request antes de llegar.
async function requireAuthenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autorizado.");
  }

  return supabase;
}

export async function completeSession(formData: FormData) {
  const supabase = await requireAuthenticatedClient();

  const sessionId = formData.get("sessionId");
  const enrollmentId = formData.get("enrollmentId");
  const hoursCountedRaw = formData.get("hoursCounted");

  if (
    typeof sessionId !== "string" ||
    typeof enrollmentId !== "string" ||
    typeof hoursCountedRaw !== "string"
  ) {
    throw new Error("Datos inválidos.");
  }

  const hoursCounted = Math.round(Number(hoursCountedRaw) * 100) / 100;

  if (!Number.isFinite(hoursCounted) || hoursCounted < 0) {
    throw new Error("Las horas deben ser un número válido mayor o igual a 0.");
  }

  const { error } = await supabase
    .from("class_sessions")
    .update({ status: "completed", hours_counted: hoursCounted })
    .eq("id", sessionId);

  if (error) {
    console.error("[admin] Error marcando la clase como completada:", error);
    throw new Error("No se pudo marcar la clase como completada.");
  }

  revalidatePath(`/admin/alumno/${enrollmentId}`);
}

export async function cancelSession(formData: FormData) {
  const supabase = await requireAuthenticatedClient();

  const sessionId = formData.get("sessionId");
  const enrollmentId = formData.get("enrollmentId");

  if (typeof sessionId !== "string" || typeof enrollmentId !== "string") {
    throw new Error("Datos inválidos.");
  }

  // No se descuentan horas al cancelar.
  const { error } = await supabase
    .from("class_sessions")
    .update({ status: "cancelled", hours_counted: null })
    .eq("id", sessionId);

  if (error) {
    console.error("[admin] Error cancelando la clase:", error);
    throw new Error("No se pudo cancelar la clase.");
  }

  revalidatePath(`/admin/alumno/${enrollmentId}`);
}

export async function addSession(formData: FormData) {
  const supabase = await requireAuthenticatedClient();

  const enrollmentId = formData.get("enrollmentId");
  const scheduledAt = formData.get("scheduledAt");
  const durationMinutesRaw = formData.get("durationMinutes");
  const notes = formData.get("notes");

  if (
    typeof enrollmentId !== "string" ||
    typeof scheduledAt !== "string" ||
    typeof durationMinutesRaw !== "string" ||
    !scheduledAt
  ) {
    throw new Error("Datos inválidos.");
  }

  const durationMinutes = Number(durationMinutesRaw);

  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    throw new Error("La duración debe ser un número de minutos mayor a 0.");
  }

  // NOTA: el input datetime-local no trae información de zona horaria — acá
  // se interpreta con la zona horaria del servidor donde corre Next.js, que
  // puede no coincidir con la de Gesa si el hosting corre en UTC. Si las
  // horas guardadas aparecen corridas, este es el lugar para ajustar
  // (agregar/restar el offset, o cambiar a una librería de zonas horarias).
  const { error } = await supabase.from("class_sessions").insert({
    enrollment_id: enrollmentId,
    scheduled_at: new Date(scheduledAt).toISOString(),
    duration_minutes: durationMinutes,
    status: "scheduled",
    notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
  });

  if (error) {
    console.error("[admin] Error agregando la clase:", error);
    throw new Error("No se pudo agregar la clase.");
  }

  revalidatePath(`/admin/alumno/${enrollmentId}`);
}
