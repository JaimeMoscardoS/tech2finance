/** Único tipo de nivel de la interfaz. El id interno no cambia aunque cambie el texto visible. */
export type Level = "beginner" | "intermediate" | "advanced";
export type Theme = "light" | "dark";

export const LEVELS: readonly Level[] = ["beginner", "intermediate", "advanced"];
export const THEMES: readonly Theme[] = ["light", "dark"];

/** Texto visible del nivel («Principiante» pasa a «Básico»; el id sigue siendo `beginner`). */
export const LEVEL_LABELS = {
  es: { beginner: "Básico", intermediate: "Intermedio", advanced: "Avanzado" },
  en: { beginner: "Basic", intermediate: "Intermediate", advanced: "Advanced" },
} as const satisfies Record<"es" | "en", Record<Level, string>>;
