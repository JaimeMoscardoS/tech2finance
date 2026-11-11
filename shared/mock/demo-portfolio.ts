/**
 * DATOS DEMO FICTICIOS para el rediseño del dashboard (docs/diseno-dashboard.md).
 *
 * - Todo lo de este archivo es inventado: gestoras, fondos, precios, unidades y rentabilidades
 *   mensuales. No hay nombres comerciales, ISIN ni precios reales, ni se basan en datos reales.
 * - No se mezcla con los datos publicados (`annual_history` en demo-data.json) ni se compara con ellos.
 * - Los rendimientos mensuales se generaron una vez con un generador pseudoaleatorio con semilla
 *   (20261111) y se fijaron aquí como literales; no representan ningún mercado ni predicen nada.
 * - Solo se guardan entradas (rentabilidades mensuales, unidades, coste de compra). Valores,
 *   variaciones, pesos, volatilidad, drawdown y Sharpe se CALCULAN en código probado
 *   (`frontend/src/dashboard-metrics.ts` y `frontend/src/dashboard-portfolio.ts`).
 * - Las rentabilidades mensuales DEMO se entienden NETAS de gastos (TER ya descontado) y SIN efecto del
 *   tipo de cambio: los fondos con divisa USD no modelan conversión a euros (ver `DEMO_RETURNS_NOTE`).
 * - El coste de compra de cada posición es unidades × precio en el mes 0 (misma base que la serie).
 * - La serie empieza en el mes 0; las etiquetas son relativas (M0, M1...) para no inferir fechas.
 */

export type AssetClass = "money_market" | "fixed_income" | "mixed" | "equity";
export type Region = "europe" | "global" | "emerging";
export type Currency = "EUR" | "USD";

export type DemoFund = {
  id: string;
  name: string;
  manager: string;
  assetClass: AssetClass;
  region: Region;
  /** Divisa de exposición principal del fondo (ficticia). */
  currency: Currency;
  /** Nivel de riesgo del producto de 1 (menor) a 7 (mayor); ficticio y fijo, no depende del nivel de la interfaz. */
  riskLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /** Gastos corrientes anuales supuestos, en %. */
  ter: number;
  /**
   * Exposición a renta variable del fondo, de 0 a 1 (supuesto ficticio): renta variable pura = 1,
   * mixto prudente = 0,4, renta fija y monetario = 0. Se usa en el escenario de sensibilidad.
   */
  equityWeight: number;
  /** Precio por participación en el mes 0 (ficticio). */
  startPrice: number;
  /** Rentabilidades mensuales en % (36 meses). */
  monthlyReturnsPct: readonly number[];
};

export type DemoPosition = {
  fundId: string;
  units: number;
  /** Importe total invertido (coste de compra) en euros, ficticio. */
  costBasisEur: number;
};

export const DEMO_LABEL = "DEMO";
export const DEMO_NOTE = "Datos ficticios de ejemplo; no son datos reales ni una predicción.";
export const DEMO_RETURNS_NOTE = { es: "Rentabilidades DEMO netas de gastos, sin tipo de cambio.", en: "DEMO returns net of fees, without exchange rate." } as const;
export const DEMO_RISK_FREE_ANNUAL_PCT = 2;

export const demoFunds: readonly DemoFund[] = [
  { id: "demo-liquidez", name: "Liquidez Ejemplo", manager: "Gestora Ejemplo A", assetClass: "money_market", region: "europe", currency: "EUR", riskLevel: 1, ter: 0.2, equityWeight: 0, startPrice: 100,
    monthlyReturnsPct: [0.09,0.1,0,0.03,0.03,0.16,0.13,0.16,0.13,0.06,0.12,0.11,0.08,0.2,0.06,0.04,0.11,0.11,0.11,0,0.07,0.11,0.08,0.09,0.18,0.07,0.09,0.12,0.04,0.13,0.06,0.16,0.13,0.25,0.13,0.1] },
  { id: "demo-bonos", name: "Bonos Corto Plazo Ejemplo", manager: "Gestora Ejemplo A", assetClass: "fixed_income", region: "europe", currency: "EUR", riskLevel: 2, ter: 0.45, equityWeight: 0, startPrice: 50,
    monthlyReturnsPct: [-0.01,0.38,0.38,1.02,0.31,-0.43,0.61,0.09,0.01,0.47,-0.25,-0.24,0,0.03,0.52,0.96,0.5,0.09,0.57,0.35,0.55,0.48,0.96,1.02,1.13,0.64,-0.26,0.12,0.59,-0.04,1.19,0.48,-0.64,-0.44,-0.21,-0.25] },
  { id: "demo-mixto", name: "Mixto Prudente Ejemplo", manager: "Gestora Ejemplo B", assetClass: "mixed", region: "global", currency: "EUR", riskLevel: 3, ter: 1.1, equityWeight: 0.4, startPrice: 12.5,
    monthlyReturnsPct: [-1.33,0.04,-0.53,-0.57,1.09,-1.37,-1.43,-0.34,0.85,-0.43,2.7,0.94,-1.06,2.18,0.78,0.63,-0.25,-1.39,3.53,-1.92,-0.5,-0.61,2.26,1.64,0.33,-1.84,0.87,3.63,0.81,1.06,0.55,1.39,-1.44,0.34,-1.71,1.52] },
  { id: "demo-global", name: "Acciones Globales Ejemplo", manager: "Gestora Ejemplo B", assetClass: "equity", region: "global", currency: "USD", riskLevel: 5, ter: 0.9, equityWeight: 1, startPrice: 20,
    monthlyReturnsPct: [-1.91,9.55,5.79,0.49,-1.46,-2.65,4.07,3.95,-0.22,4.12,-2.07,-3.1,4.92,3.25,-0.9,1.35,2.62,4.93,-0.49,2.42,-0.2,1.83,-3.37,1.19,-1.05,-3.21,-0.89,2.04,-3.57,-4.42,-2.57,5.71,1.76,0.3,1.31,-2.07] },
  { id: "demo-emergentes", name: "Mercados Emergentes Ejemplo", manager: "Gestora Ejemplo C", assetClass: "equity", region: "emerging", currency: "USD", riskLevel: 6, ter: 1.35, equityWeight: 1, startPrice: 8,
    monthlyReturnsPct: [8.54,-9.49,1.52,5.97,0.55,-3.83,-3.02,1.18,-10.83,8.04,-7.92,-9.7,6.02,-7.77,-5.77,-2.93,10.95,0.66,0.23,2.69,-2.4,-2.33,-3.01,-3.22,11.42,6.48,3.76,8.87,-1,-8.33,-0.04,-1.83,-2.44,-6.14,-3.74,2.14] },
];

/** Cartera de ejemplo: unidades inventadas; coste de compra = unidades × precio del mes 0 (cuadra con la serie). */
export const demoPositions: readonly DemoPosition[] = [
  { fundId: "demo-liquidez", units: 40, costBasisEur: 4000 },
  { fundId: "demo-bonos", units: 140, costBasisEur: 7000 },
  { fundId: "demo-mixto", units: 520, costBasisEur: 6500 },
  { fundId: "demo-global", units: 280, costBasisEur: 5600 },
  { fundId: "demo-emergentes", units: 350, costBasisEur: 2800 },
];

/** Índice de referencia ficticio (base 100 en el mes 0) para comparar con la cartera DEMO. */
export const demoBenchmark = {
  id: "demo-indice",
  name: "Índice de referencia Ejemplo",
  base: 100,
  monthlyReturnsPct: [-0.62,2.08,-0.19,0.59,-0.7,-3.27,3.47,1.91,-2.27,0.7,-0.01,2.98,2.32,-3.52,5.11,0.5,-0.07,-2.76,1.76,0.72,2.68,2.31,0.29,-3.09,4.16,2.91,-0.49,0.12,-1.79,3.68,-2.06,1.89,1.22,-1.9,-0.85,-0.46],
} as const;
