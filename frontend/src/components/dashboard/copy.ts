import type { AssetClass, Currency, Region } from "../../../../shared/mock/demo-portfolio.ts";

export type Lang = "es" | "en";

export const dash = {
  es: {
    demo: "DEMO", demoLong: "Datos ficticios de ejemplo", rise: "Sube", fall: "Baja", flat: "Sin cambio",
    fund: "Fondo", assetClass: "Clase", risk: "Riesgo", value: "Valor", weight: "Peso", result: "Resultado", change12m: "12 meses",
    sortBy: "Ordenar por", noRows: "No hay posiciones que mostrar.", tableRegion: "Tabla de fondos, desplazable horizontalmente",
    last: "Último valor", showData: "Ver datos del gráfico", period: "Periodo", point: "Punto", main: "Cartera", loading: "Cargando…", empty: "Sin datos para mostrar.",
    riskOf: (n: number, max: number) => `${n} de ${max}`, total: "Total", chartData: "Datos del gráfico",
    na: "sin dato",
  },
  en: {
    demo: "DEMO", demoLong: "Fictional sample data", rise: "Rises", fall: "Falls", flat: "No change",
    fund: "Fund", assetClass: "Class", risk: "Risk", value: "Value", weight: "Weight", result: "Result", change12m: "12 months",
    sortBy: "Sort by", noRows: "No positions to show.", tableRegion: "Funds table, horizontally scrollable",
    last: "Latest value", showData: "View chart data", period: "Period", point: "Point", main: "Portfolio", loading: "Loading…", empty: "No data to show.",
    riskOf: (n: number, max: number) => `${n} of ${max}`, total: "Total", chartData: "Chart data",
    na: "no data",
  },
} as const;

export const assetClassNames: Record<Lang, Record<AssetClass, string>> = {
  es: { money_market: "Monetario", fixed_income: "Renta fija", mixed: "Mixto", equity: "Renta variable", unknown: "Sin dato" },
  en: { money_market: "Money market", fixed_income: "Fixed income", mixed: "Mixed", equity: "Equities", unknown: "No data" },
};
export const regionNames: Record<Lang, Record<Region, string>> = {
  es: { europe: "Europa", global: "Global", emerging: "Emergentes", unknown: "Sin dato" },
  en: { europe: "Europe", global: "Global", emerging: "Emerging", unknown: "No data" },
};
export const currencyNames: Record<Lang, Record<Currency, string>> = {
  es: { EUR: "Euro", USD: "Dólar" },
  en: { EUR: "Euro", USD: "US dollar" },
};
