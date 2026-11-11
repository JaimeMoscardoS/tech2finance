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
    /** Duración total del plan ficticio (10 años). Empieza con la serie de la cartera: los meses transcurridos se calculan con su longitud (72 con los datos CNMV 2019-12 a 2025-12). */
    monthsTotal: 120,
  },
} as const;
