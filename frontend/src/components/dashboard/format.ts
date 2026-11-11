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

const MONTHS: Record<Lang, readonly string[]> = {
  es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};
/** Nombre corto del mes (1-12): «Ene»…«Dic» en mayúscula inicial. */
export const monthShort = (m: number, l: Lang) => { const s = MONTHS[l][m - 1] ?? String(m); return s.charAt(0).toUpperCase() + s.slice(1); };
/** «2020-03» o «2020-03-31» → «mar 2020»; las etiquetas relativas (M3) → «mes 3». Otras etiquetas se devuelven sin cambios. */
export function monthLabel(label: string, l: Lang): string {
  const m = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(label);
  if (m) return `${MONTHS[l][Number(m[2]) - 1]} ${m[1]}`;
  const r = /^M(\d+)$/.exec(label);
  if (r) return l === "es" ? `mes ${r[1]}` : `month ${r[1]}`;
  return label;
}
/** Eje de importes en una línea: «26,5 mil €» / «€26.5k». */
export const axisEur = (n: number, l: Lang) => l === "es"
  ? (Math.abs(n) >= 1000 ? `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(n / 1000)} mil €` : `${Math.round(n)} €`)
  : (Math.abs(n) >= 1000 ? `€${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(n / 1000)}k` : `€${Math.round(n)}`);
