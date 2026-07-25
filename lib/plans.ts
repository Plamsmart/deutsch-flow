export type PlanId =
  | "suelta"
  | "p4"
  | "p8"
  | "p12"
  | "pareja"
  | "reducido"
  | "conversacion";

// En centavos de euro. Debe coincidir exactamente con los montos mostrados
// en components/Clases.tsx.
export const PLAN_PRICES: Record<PlanId, number> = {
  suelta: 2500,
  p4: 9600,
  p8: 19000,
  p12: 28200,
  pareja: 12800,
  reducido: 10400,
  conversacion: 1000,
};

// Títulos internos en español, usados para registros en Supabase y en el
// nombre del producto de Stripe Checkout. No se traducen.
export const PLAN_TITLES: Record<PlanId, string> = {
  suelta: "Clase Suelta",
  p4: "Paquete 4 horas",
  p8: "Paquete 8 horas",
  p12: "Paquete 12 horas",
  pareja: "Paquete Pareja",
  reducido: "Grupo Reducido",
  conversacion: "Grupo de Conversación",
};
