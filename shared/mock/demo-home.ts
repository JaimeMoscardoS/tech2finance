/**
 * DATOS DEMO FICTICIOS para el Inicio: efectivo y objetivo de la cartera de ejemplo.
 * Inventados, sin relación con ninguna cuenta real. El valor invertido NO se guarda aquí: se calcula
 * a partir de `demo-portfolio.ts`. Los avances y estados se calculan en `frontend/src/home-logic.ts`.
 */
export const demoHome = {
  /** Efectivo disponible ficticio en euros (no invertido). */
  availableCashEur: 3200,
  goal: {
    name: { es: "Entrada para una vivienda", en: "Home deposit" },
    /** Importe objetivo ficticio en euros. */
    targetEur: 40000,
    /** Meses transcurridos desde el inicio del plan ficticio y duración total prevista. */
    monthsElapsed: 18,
    monthsTotal: 60,
  },
} as const;
