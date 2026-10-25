import type { PlanId } from "./plans";

// Mismo agrupamiento que components/Clases.tsx (individualPlans/grupalPlans):
// clases.individual.* para suelta/p4/p8/p12, clases.grupal.* para
// pareja/reducido/conversacion. No existía antes como export propio, así que
// se repite acá en vez de derivarlo de Clases.tsx (que no exporta nada).
const PLAN_GROUPS: Record<PlanId, "individual" | "grupal"> = {
  suelta: "individual",
  p4: "individual",
  p8: "individual",
  p12: "individual",
  pareja: "grupal",
  reducido: "grupal",
  conversacion: "grupal",
};

// Interfaz mínima común entre el translator de next-intl
// (getTranslations/useTranslations, que expone .has) y el adaptador de solo
// lectura que arma admin/actions.ts sobre su propio MESSAGES_BY_LOCALE
// estático (ese archivo no puede llamar a getTranslations: es un import
// dinámico por debajo, y falla silenciosamente dentro de un "use server").
export type PlanTitleTranslator = {
  has(key: string): boolean;
  (key: string): string;
};

export function getPlanTitle(
  planId: PlanId,
  storedTitle: string,
  t: PlanTitleTranslator,
): string {
  const key = `${PLAN_GROUPS[planId]}.${planId}.title`;
  try {
    return t.has(key) ? t(key) : storedTitle;
  } catch {
    return storedTitle;
  }
}
