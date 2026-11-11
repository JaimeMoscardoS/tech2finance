/**
 * PERFILES DEMO FICTICIOS de los fondos de «Mi cartera» (docs/diseno-dashboard.md, decisión 4).
 *
 * El histórico real (CNMV) solo publica los valores liquidativos: la clase de activo, el nivel de riesgo 1-7,
 * los gastos corrientes (TER), la exposición a renta variable y la región de estos fondos NO constan en los
 * datos de la demo. Para que la cartera no muestre paneles vacíos se usan estos valores supuestos, coherentes
 * con el tipo de fondo (nombre genérico), que la interfaz marca siempre como DEMO. No son los datos reales del
 * fondo ni deben citarse como tales: el folleto y el documento de datos fundamentales son la fuente válida.
 *
 * Clave: identificador interno del catálogo (`instrumentId`), el mismo de `shared/fund-aliases.json`.
 */
import type { AssetClass, Region } from "./demo-portfolio.ts";

export type DemoFundProfile = {
  assetClass: Exclude<AssetClass, "unknown">;
  region: Exclude<Region, "unknown">;
  riskLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /** Gastos corrientes anuales supuestos, en %. */
  ter: number;
  /** Exposición supuesta a renta variable, de 0 a 1. */
  equityWeight: number;
};

export const demoFundProfiles: Readonly<Record<string, DemoFundProfile>> = {
  "caixabank-monetario-estandar": { assetClass: "money_market", region: "europe", riskLevel: 1, ter: 0.3, equityWeight: 0 },
  "santander-rf-ahorro": { assetClass: "fixed_income", region: "europe", riskLevel: 1, ter: 0.55, equityWeight: 0 },
  "santander-renta-fija-a": { assetClass: "fixed_income", region: "europe", riskLevel: 2, ter: 0.85, equityWeight: 0 },
  "bbva-estrategia-0-50": { assetClass: "mixed", region: "global", riskLevel: 3, ter: 1.2, equityWeight: 0.3 },
  "bbva-mi-inversion-bolsa-acumulacion": { assetClass: "equity", region: "europe", riskLevel: 5, ter: 1.45, equityWeight: 1 },
  "bbva-mi-inversion-bolsa": { assetClass: "equity", region: "europe", riskLevel: 5, ter: 1.45, equityWeight: 1 },
};
