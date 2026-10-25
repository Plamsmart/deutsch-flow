// Compartido entre el registro de alumnos, el editor de perfil en /mi-cuenta
// y la tabla de /admin — los tres son español fijo (sin next-intl), a
// diferencia de BuyButton.tsx (público, traducido a 5 idiomas), que define
// sus propias 6 opciones por separado en modal.levels.* de messages/*.json.
// Las 6 claves base ("beginner".."c1") son las mismas que usa BuyButton, para
// que enrollments.level y profiles.german_level compartan el mismo
// vocabulario — acá se agregan "from_scratch" y "unsure", que no existen en
// el flujo de compra.
export type GermanLevelKey =
  | "from_scratch"
  | "beginner"
  | "a1"
  | "a2"
  | "b1"
  | "b2"
  | "c1"
  | "unsure";

export const GERMAN_LEVEL_KEYS: GermanLevelKey[] = [
  "from_scratch",
  "beginner",
  "a1",
  "a2",
  "b1",
  "b2",
  "c1",
  "unsure",
];

export const GERMAN_LEVEL_LABELS: Record<GermanLevelKey, string> = {
  from_scratch: "Empiezo desde cero",
  beginner: "Principiante (sin experiencia)",
  a1: "A1",
  a2: "A2",
  b1: "B1",
  b2: "B2",
  c1: "C1",
  unsure: "No lo sé",
};
