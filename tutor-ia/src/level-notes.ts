import type { KnowledgeLevel, Language, Page } from './types.ts';

// Textos fijos por nivel: el nivel cambia la cantidad y el tono de la explicación, no el perfil de riesgo ni el producto.
type Pair = readonly [string, string];
type LevelNotes = Partial<Record<KnowledgeLevel, Pair>>;

const conceptNotes: Record<string, LevelNotes> = {
  fund: {
    beginner: ['En corto: es como poner dinero en un bote común que gestiona un equipo.', 'In short: like putting money in a shared pot run by a team.'],
    intermediate: ['Cada fondo tiene una política de inversión, una categoría y gastos corrientes (TER) que restan rentabilidad; compara productos de la misma categoría.', 'Each fund has an investment policy, a category and ongoing charges (TER) that reduce returns; compare products within the same category.'],
    advanced: ['Conviene revisar el folleto: índice de referencia, política de cobertura de divisa, comisiones de gestión y de éxito, y el indicador de riesgo de 1 a 7. Los datos de esta demo son simplificados.', 'Check the prospectus: benchmark, currency-hedging policy, management and performance fees, and the 1 to 7 risk indicator. Data in this demo is simplified.'],
  },
  etf: {
    beginner: ['En corto: es un fondo que se compra y vende en bolsa como una acción.', 'In short: a fund you buy and sell on an exchange like a share.'],
    intermediate: ['Suelen replicar un índice y tienen costes bajos, pero el precio de mercado puede diferir ligeramente del valor de sus activos.', 'Many track an index and have low costs, but the market price can differ slightly from the value of their assets.'],
    advanced: ['Aspectos técnicos: error de seguimiento (tracking error), diferencial oferta-demanda, réplica física o sintética y liquidez del mercado.', 'Technical aspects: tracking error, bid-ask spread, physical or synthetic replication and market liquidity.'],
  },
  stock: {
    beginner: ['En corto: si la empresa va mal, su precio puede bajar mucho.', 'In short: if the company does badly, its price can fall a lot.'],
    intermediate: ['Una sola acción concentra el riesgo en una empresa; por eso suele compararse con una cartera diversificada.', 'A single share concentrates risk in one company, which is why it is often compared with a diversified portfolio.'],
    advanced: ['El riesgo se descompone en sistemático (mercado) y específico (empresa); la diversificación solo reduce el específico.', 'Risk splits into systematic (market) and specific (company) parts; diversification only reduces the specific part.'],
  },
  diversification: {
    intermediate: ['Se mide con el peso de cada posición y la exposición por clase de activo, región y divisa.', 'It is measured through each position’s weight and exposure by asset class, region and currency.'],
    advanced: ['Su eficacia depende de las correlaciones, que pueden subir en caídas de mercado; no se asume que sean estables.', 'Its effectiveness depends on correlations, which can rise during market falls; they are not assumed to be stable.'],
  },
  risk: {
    beginner: ['En corto: cuanto más sube y baja el valor, más riesgo; y siempre puedes perder parte del dinero.', 'In short: the more the value moves up and down, the more risk; you can always lose part of your money.'],
    intermediate: ['Se suele resumir en un indicador de 1 a 7 y en la volatilidad; ninguno de los dos predice lo que ocurrirá.', 'It is often summarised as a 1 to 7 indicator and by volatility; neither predicts what will happen.'],
    advanced: ['Medidas habituales: volatilidad anualizada, caída máxima desde un máximo (drawdown) y ratio de Sharpe, que depende del tipo libre de riesgo supuesto y del periodo. Todas se calculan sobre datos pasados.', 'Common measures: annualised volatility, maximum drawdown and the Sharpe ratio, which depends on the assumed risk-free rate and period. All are computed on past data.'],
  },
  costs: {
    beginner: ['En corto: cada comisión es dinero que se descuenta de tu resultado.', 'In short: every fee is money taken off your result.'],
    intermediate: ['Un coste pequeño y constante se acumula con los años; compara gastos corrientes y comisiones de operación.', 'A small, constant cost accumulates over the years; compare ongoing charges and dealing fees.'],
    advanced: ['Se distinguen gastos corrientes, comisiones de suscripción y reembolso, de éxito y costes de transacción; en la demo solo constan las condiciones del perfil del banco simulado.', 'Ongoing charges, subscription and redemption fees, performance fees and transaction costs are distinct; the demo only has the conditions in the simulated bank profile.'],
  },
};

export function conceptLevelNote(intent: string, level: KnowledgeLevel | undefined, en: boolean): string {
  const pair = level ? conceptNotes[intent]?.[level] : undefined;
  return pair ? ' ' + pair[en ? 1 : 0] : '';
}

const decisionNotes: LevelNotes = {
  beginner: ['Puedes decidir ahora o más tarde; piensa cuándo necesitarás el dinero.', 'You can decide now or later; think about when you will need the money.'],
  intermediate: ['Una caída vista en datos pasados no implica que se repita ni que se recupere; sirve como contexto, no como prueba.', 'A fall seen in past data does not mean it will repeat or recover; it is context, not proof.'],
  advanced: ['Límites: el análisis usa solo los puntos disponibles, no incluye impuestos, costes de venta ni tu situación completa, y las noticias son contexto sin causalidad demostrada.', 'Limits: the analysis uses only the available points and excludes taxes, selling costs and your full situation; news is context without proven causality.'],
};
export const decisionLevelNote = (level: KnowledgeLevel | undefined, en: boolean): string => {
  const pair = level ? decisionNotes[level] : undefined;
  return pair ? ' ' + pair[en ? 1 : 0] : '';
};

const declineNotes: LevelNotes = {
  beginner: ['En corto: es cuánto ha bajado desde lo más alto que se ha visto.', 'In short: how far it has dropped from the highest point seen.'],
  intermediate: ['Se calcula como la variación desde el máximo anterior; el tiempo hasta recuperarlo, si ocurre, es otra medida.', 'It is computed as the change from the previous peak; the time to recover it, if it happens, is another measure.'],
  advanced: ['Supuestos: caída medida sobre los puntos disponibles (no intradía), sin dividendos ni costes si no constan en la serie; con pocas observaciones la cifra es poco robusta.', 'Assumptions: measured on the available points (not intraday), excluding dividends and costs unless in the series; with few observations the figure is not robust.'],
};
export const declineLevelNote = (level: KnowledgeLevel | undefined, en: boolean): string => {
  const pair = level ? declineNotes[level] : undefined;
  return pair ? ' ' + pair[en ? 1 : 0] : '';
};

// Orientación por pantalla cuando la pregunta no encaja con una regla.
const pageHints: Record<Page, Record<KnowledgeLevel, Pair>> = {
  home: {
    beginner: ['Estás en el inicio: un resumen sencillo de tu cartera de ejemplo.', 'You are on the home page: a simple summary of your sample portfolio.'],
    intermediate: ['Estás en el inicio: resumen de la cartera de ejemplo con valor, resultado y reparto.', 'You are on the home page: sample portfolio summary with value, result and allocation.'],
    advanced: ['Estás en el inicio: indicadores de la cartera DEMO calculados por código (valor, resultado, riesgo, exposición).', 'You are on the home page: DEMO portfolio indicators computed by code (value, result, risk, exposure).'],
  },
  explore: {
    beginner: ['Estás en el catálogo: cada tarjeta es un producto de ejemplo con su nivel de riesgo.', 'You are in the catalogue: each card is a sample product with its risk level.'],
    intermediate: ['Estás en el catálogo: compara categoría, riesgo, costes y evolución de los productos de ejemplo.', 'You are in the catalogue: compare category, risk, costs and performance of the sample products.'],
    advanced: ['Estás en el catálogo: compara condiciones, costes y series; revisa siempre la fuente y el tipo de dato.', 'You are in the catalogue: compare terms, costs and series; always check the source and data type.'],
  },
  simulator: {
    beginner: ['Estás en el simulador: practicas con escenarios ilustrativos de rentabilidades ficticias DEMO (no son una previsión ni datos de mercado) y con un producto del catálogo, que usa su serie ficticia o histórica publicada con fuente. No hay dinero real.', 'You are in the simulator: you practise with illustrative scenarios of fictional DEMO returns (not a forecast or market data) and with a catalogue product, which uses its fictional or published sourced series. There is no real money.'],
    intermediate: ['Estás en el simulador: cambia aportación y plazo y compara el valor final con lo aportado. Los escenarios usan rentabilidades ficticias DEMO (ni previsión ni datos de mercado); el producto del catálogo usa su serie ficticia o histórica publicada con fuente.', 'You are in the simulator: change the contribution and term and compare final value with the amount contributed. Scenarios use fictional DEMO returns (neither a forecast nor market data); the catalogue product uses its fictional or published sourced series.'],
    advanced: ['Estás en el simulador: el resultado es sensible a los supuestos, al momento de las aportaciones y a los costes. Los escenarios son rentabilidades ficticias DEMO (no son previsión ni datos de mercado); el producto usa su serie ficticia o histórica anual publicada con fuente.', 'You are in the simulator: the result is sensitive to assumptions, contribution timing and costs. Scenarios are fictional DEMO returns (not a forecast or market data); the product uses its fictional or published sourced annual series.'],
  },
  portfolio: {
    beginner: ['Estás en la cartera de ejemplo: lo que tiene, cuánto vale y qué peso tiene cada parte.', 'You are on the sample portfolio: what it holds, what it is worth and each part’s weight.'],
    intermediate: ['Estás en la cartera de ejemplo: posiciones, pesos, resultado y riesgo de cada producto.', 'You are on the sample portfolio: positions, weights, result and each product’s risk.'],
    advanced: ['Estás en la cartera de ejemplo: coste, valor, peso y métricas (volatilidad, caída máxima, Sharpe con tipo libre de riesgo supuesto).', 'You are on the sample portfolio: cost, value, weight and metrics (volatility, maximum drawdown, Sharpe with an assumed risk-free rate).'],
  },
  learn: {
    beginner: ['Estás en Educación: lecciones cortas para entender lo básico.', 'You are in Learning: short lessons to understand the basics.'],
    intermediate: ['Estás en Educación: lecciones y práctica, incluida la práctica del test de conveniencia e idoneidad (educativa, no es una evaluación real).', 'You are in Learning: lessons and practice, including the appropriateness and suitability test practice (educational, not a real assessment).'],
    advanced: ['Estás en Educación: material técnico y práctica del test MiFID, que es educativa y no sustituye al test real del banco.', 'You are in Learning: technical material and MiFID test practice, which is educational and does not replace the bank’s real test.'],
  },
};
export const pageHint = (page: Page | undefined, level: KnowledgeLevel | undefined, en: boolean): string => {
  const pair = page && level ? pageHints[page]?.[level] : undefined;
  return pair ? pair[en ? 1 : 0] : '';
};

// Preguntas sugeridas por pantalla y nivel; las responde el tutor local por reglas.
const q = {
  fund: ['¿Qué es un fondo?', 'What is a fund?'], etf: ['¿Qué es un ETF?', 'What is an ETF?'],
  risk: ['¿Qué quiere decir riesgo?', 'What does risk mean?'], diversify: ['¿Qué es diversificar?', 'What is diversification?'],
  costs: ['¿Qué son los costes de un fondo?', 'What are fund costs?'], seeing: ['¿Qué estoy viendo?', 'What am I seeing?'],
  sim: ['¿Cómo funciona la simulación?', 'How does the simulation work?'], result: ['Explica el resultado', 'Explain the result'],
  ret: ['¿Qué es la rentabilidad?', 'What is return?'], source: ['¿De dónde vienen los datos? (fuente)', 'Where does the data come from? (source)'],
  metrics: ['¿Qué miden la volatilidad y la caída máxima? (riesgo)', 'What do volatility and maximum drawdown measure? (risk)'],
  limits: ['¿Qué límites tiene la diversificación?', 'What are the limits of diversification?'],
  fundEtf: ['¿Qué diferencia hay entre fondo y ETF?', 'How do a fund and an ETF differ? (fund)'],
  scale: ['¿Qué significa el riesgo de 1 a 7?', 'What does the 1 to 7 risk indicator mean?'],
  fall: ['¿Qué es una caída desde el máximo? (caída)', 'What is a fall from the peak? (drawdown)'],
  dd: ['¿Qué es la caída máxima (drawdown)?', 'What is maximum drawdown?'],
} as const satisfies Record<string, Pair>;
const questions: Record<Page, Record<KnowledgeLevel, readonly Pair[]>> = {
  home: { beginner: [q.fund, q.risk, q.seeing], intermediate: [q.diversify, q.costs, q.seeing], advanced: [q.metrics, q.limits, q.costs] },
  explore: { beginner: [q.fund, q.etf, q.risk], intermediate: [q.fundEtf, q.costs, q.diversify], advanced: [q.scale, q.costs, q.source] },
  simulator: { beginner: [q.sim, q.result, q.ret], intermediate: [q.result, q.fall, q.source], advanced: [q.result, q.dd, q.source] },
  portfolio: { beginner: [q.fund, q.diversify, q.seeing], intermediate: [q.diversify, q.risk, q.costs], advanced: [q.metrics, q.limits, q.source] },
  learn: { beginner: [q.fund, q.etf, q.risk], intermediate: [q.diversify, q.costs, q.risk], advanced: [q.metrics, q.limits, q.costs] },
};
export function suggestedQuestions(page: Page, level: KnowledgeLevel, language: Language, hasDecline = false): string[] {
  const en = language === 'en';
  const base = (questions[page]?.[level] ?? questions.home.beginner).map(p => p[en ? 1 : 0]);
  return hasDecline ? [en ? 'What does this decline mean?' : '¿Qué significa esta caída?', en ? 'Why did it fall?' : '¿Por qué ha caído?', ...base.slice(0, 1)] : [...base];
}
