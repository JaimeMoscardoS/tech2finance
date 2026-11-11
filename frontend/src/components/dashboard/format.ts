import type { Lang } from "./copy.ts";

const locale = (l: Lang) => (l === "es" ? "es-ES" : "en-GB");

export const eur = (n: number, l: Lang, digits = 0) =>
  new Intl.NumberFormat(locale(l), { style: "currency", currency: "EUR", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);

/** Importe con signo explícito (+ / −) para resultados. */
export const signedEur = (n: number, l: Lang, digits = 0) =>
  new Intl.NumberFormat(locale(l), { style: "currency", currency: "EUR", minimumFractionDigits: digits, maximumFractionDigits: digits, signDisplay: "exceptZero" }).format(n);

/** Porcentaje con signo explícito: «+1,32 %». */
export const signedPct = (n: number, l: Lang, digits = 2) =>
  `${new Intl.NumberFormat(locale(l), { minimumFractionDigits: digits, maximumFractionDigits: digits, signDisplay: "exceptZero" }).format(n)} %`;

export const pct = (n: number, l: Lang, digits = 1) =>
  `${new Intl.NumberFormat(locale(l), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n)} %`;

export const num = (n: number, l: Lang, digits = 2) =>
  new Intl.NumberFormat(locale(l), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);

export const compactEur = (n: number, l: Lang) =>
  `${new Intl.NumberFormat(locale(l), { notation: "compact", maximumFractionDigits: 1 }).format(n)} €`;

export type Direction = "rise" | "fall" | "flat";
export const directionOf = (n: number | null | undefined): Direction => (n == null || Math.abs(n) < 1e-9 ? "flat" : n > 0 ? "rise" : "fall");
