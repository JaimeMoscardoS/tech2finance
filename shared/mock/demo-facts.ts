/**
 * HECHOS DEMO FICTICIOS para «¿Cómo van las cosas?».
 * Todo es inventado y está etiquetado DEMO: no son noticias reales ni explican causas. Son observaciones
 * de contexto (no prueban causalidad) sobre los fondos ficticios de `demo-portfolio.ts`.
 * Fechas ISO (AAAA-MM-DD), también ficticias.
 */
export type DemoFact = {
  id: string;
  /** Fecha ficticia (ISO). */
  date: string;
  /** Fondos DEMO a los que podría afectar; vacío = contexto general de mercado. */
  fundIds: readonly string[];
  text: { es: string; en: string };
  /** Fuente ficticia. */
  source: { es: string; en: string };
};

export const DEMO_FACTS_LABEL = "DEMO";

export const demoFacts: readonly DemoFact[] = [
  { id: "f1", date: "2026-11-05", fundIds: ["demo-bonos", "demo-mixto"],
    text: { es: "El banco central ficticio mantuvo los tipos de interés sin cambios en su última reunión.", en: "The fictional central bank left interest rates unchanged at its latest meeting." },
    source: { es: "Comunicado DEMO del banco central ficticio", en: "DEMO fictional central bank statement" } },
  { id: "f2", date: "2026-10-28", fundIds: ["demo-global", "demo-emergentes"],
    text: { es: "Varias empresas tecnológicas ficticias presentaron resultados trimestrales por encima de lo esperado por los analistas ficticios.", en: "Several fictional tech companies reported quarterly results above the expectations of fictional analysts." },
    source: { es: "Resumen DEMO de resultados", en: "DEMO results summary" } },
  { id: "f3", date: "2026-10-21", fundIds: ["demo-emergentes"],
    text: { es: "Las monedas de los países emergentes ficticios se movieron con más oscilaciones que de costumbre frente al dólar.", en: "Fictional emerging-market currencies swung more than usual against the dollar." },
    source: { es: "Informe DEMO de divisas", en: "DEMO currency report" } },
  { id: "f4", date: "2026-10-14", fundIds: ["demo-liquidez", "demo-bonos"],
    text: { es: "La inflación ficticia de la zona euro se situó una décima por debajo del mes anterior.", en: "Fictional euro-area inflation came in a tenth below the previous month." },
    source: { es: "Estadística DEMO de precios", en: "DEMO price statistics" } },
  { id: "f5", date: "2026-10-02", fundIds: [],
    text: { es: "La volatilidad general de los mercados ficticios bajó respecto al trimestre anterior.", en: "Overall volatility in fictional markets fell compared with the previous quarter." },
    source: { es: "Indicador DEMO de volatilidad", en: "DEMO volatility indicator" } },
  { id: "f6", date: "2026-11-20", fundIds: ["demo-global"],
    text: { es: "Hecho ficticio con fecha posterior a la consulta: no debe mostrarse todavía.", en: "Fictional fact dated after the query date: not to be shown yet." },
    source: { es: "Prueba DEMO", en: "DEMO test" } },
];
