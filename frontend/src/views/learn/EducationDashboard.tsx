import { ArrowRight, BookOpen, Compass, Lightbulb, Shuffle } from "lucide-react";
import { useMemo, useState } from "react";
import { demoFunds, DEMO_NOTE } from "../../../../shared/mock/demo-portfolio.ts";
import { DemoBadge, DonutCard, KpiCard, KpiRow, MetricBar, Section } from "../../components/dashboard/index.ts";
import { assetClassNames, type Lang } from "../../components/dashboard/copy.ts";
import { eur, num, pct } from "../../components/dashboard/format.ts";
import { buildDemoPortfolio } from "../../dashboard-portfolio.ts";
import { runScenario } from "../../game-scenarios.ts";
import type { Level, Theme } from "../../types/level.ts";
import MifidPractice from "./MifidPractice.tsx";
import "./learn.css";

type Bi = { es: string; en: string };
const concepts: readonly { id: string; term: Bi; text: Bi }[] = [
  { id: "diversification", term: { es: "Diversificación", en: "Diversification" }, text: { es: "Repartir el dinero entre distintos activos para que un mal resultado de uno no hunda el conjunto. Reduce el riesgo específico, pero no lo elimina.", en: "Spreading money across different assets so one poor result does not sink the whole. It reduces specific risk but does not remove it." } },
  { id: "risk-return", term: { es: "Riesgo y rentabilidad", en: "Risk and return" }, text: { es: "Una rentabilidad esperada mayor suele venir con más posibilidad de pérdidas. Ningún producto con riesgo garantiza ganancias.", en: "A higher expected return usually comes with a greater chance of losses. No product with risk guarantees gains." } },
  { id: "horizon", term: { es: "Horizonte temporal", en: "Time horizon" }, text: { es: "El tiempo que piensas mantener el dinero invertido. Con plazos cortos, las caídas temporales tienen menos margen para recuperarse.", en: "How long you plan to keep the money invested. With short terms, temporary falls have less room to recover." } },
  { id: "costs", term: { es: "Costes (TER)", en: "Costs (TER)" }, text: { es: "Los gastos corrientes anuales de un fondo se descuentan poco a poco de su valor. Un punto porcentual al año puede restar mucho en décadas.", en: "A fund's ongoing annual charges are deducted gradually from its value. One percentage point a year can subtract a lot over decades." } },
  { id: "liquidity", term: { es: "Liquidez", en: "Liquidity" }, text: { es: "Lo rápido y barato que es convertir una inversión en dinero. Conviene no invertir dinero que puedas necesitar pronto.", en: "How quickly and cheaply an investment can be turned into cash. Avoid investing money you may need soon." } },
];

const glossary: readonly { term: Bi; text: Bi }[] = [
  { term: { es: "Fondo de inversión", en: "Investment fund" }, text: { es: "Producto que reúne dinero de muchas personas y lo invierte en una cesta de activos.", en: "A product that pools money from many people and invests it in a basket of assets." } },
  { term: { es: "TER", en: "TER" }, text: { es: "Gastos corrientes anuales, en % del valor del fondo.", en: "Ongoing annual charges, as a % of the fund's value." } },
  { term: { es: "Volatilidad", en: "Volatility" }, text: { es: "Cuánto oscila el precio; más volatilidad significa cambios más bruscos arriba y abajo.", en: "How much the price swings; more volatility means sharper moves up and down." } },
  { term: { es: "Renta fija", en: "Fixed income" }, text: { es: "Activos que pagan intereses en condiciones conocidas, como los bonos. También tienen riesgo.", en: "Assets paying interest on known terms, such as bonds. They also carry risk." } },
  { term: { es: "Renta variable", en: "Equities" }, text: { es: "Participaciones en empresas (acciones); su valor sube y baja con más intensidad.", en: "Shares in companies (stocks); their value rises and falls more sharply." } },
  { term: { es: "Rentabilidad pasada", en: "Past performance" }, text: { es: "Lo que ocurrió antes. No es una previsión ni una garantía de lo que ocurrirá.", en: "What happened before. It is not a forecast or a guarantee of what will happen." } },
];

const paths: readonly { id: string; title: Bi; steps: readonly Bi[]; cta?: boolean }[] = [
  { id: "start", title: { es: "Primeros pasos", en: "First steps" }, steps: [
    { es: "Define para qué es el dinero y cuándo lo necesitarás.", en: "Define what the money is for and when you will need it." },
    { es: "Separa tu fondo de emergencia del dinero a invertir.", en: "Keep your emergency fund apart from money to invest." },
    { es: "Practica con la simulación ilustrativa antes de decidir nada.", en: "Practise with the illustrative simulation before deciding anything." },
  ], cta: true },
  { id: "risk", title: { es: "Entender el riesgo", en: "Understanding risk" }, steps: [
    { es: "Mira el indicador de riesgo del producto (de 1 a 7).", en: "Check the product's risk indicator (1 to 7)." },
    { es: "Comprueba cuánto cayó en sus peores momentos, sin asumir que se repetirá.", en: "See how far it fell at its worst, without assuming it will repeat." },
    { es: "Pregúntate si podrías esperar la recuperación sin necesitar el dinero.", en: "Ask yourself whether you could wait for a recovery without needing the money." },
  ] },
  { id: "costs", title: { es: "Controlar los costes", en: "Keeping costs in check" }, steps: [
    { es: "Localiza el TER y las comisiones de compra o venta.", en: "Find the TER and any buy or sell fees." },
    { es: "Calcula el coste anual sobre tu importe.", en: "Work out the annual cost on your amount." },
    { es: "Compara productos de riesgo similar antes de elegir.", en: "Compare products of similar risk before choosing." },
  ] },
];

const tx = {
  es: {
    title: "Educación", subtitle: "Aprende a tu ritmo con contenido educativo; no es asesoramiento ni una recomendación.",
    daily: "Concepto del día", another: "Otro concepto", glossary: "Glosario básico", paths: "Rutas cortas", pathsDesc: "Tres recorridos de unos minutos.",
    goSim: "Probar en la simulación", riskCosts: "Riesgo y costes", riskCostsDesc: "Riesgo del producto (1 a 7) y coste anual de cada fondo DEMO sobre 10.000 €.",
    fund: "Fondo", cls: "Clase", risk: "Riesgo", ter: "TER", cost10k: "Coste anual / 10.000 €", cost10y: "Coste en 10 años",
    allocation: "Asignación de activos", allocationDesc: "Reparto por clase de activo de la cartera DEMO de ejemplo.",
    riskMetrics: "Métricas de riesgo", vol: "Volatilidad anual", dd: "Caída máxima", sharpe: "Ratio de Sharpe", metricsNote: "Calculadas sobre rentabilidades mensuales DEMO; no son datos reales ni predicen nada.",
    costsCompare: "Costes (TER) y comparación de fondos", costsNote: "Coste en 10 años: 10.000 € sin aportaciones con una rentabilidad bruta supuesta del 4 % anual (supuesto ilustrativo, no previsión), restando solo el TER.",
    equity: "Exposición a renta variable", avgRisk: "Riesgo medio ponderado", na: "n. d.",
  },
  en: {
    title: "Education", subtitle: "Learn at your own pace with educational content; it is not advice or a recommendation.",
    daily: "Concept of the day", another: "Another concept", glossary: "Basic glossary", paths: "Short paths", pathsDesc: "Three routes of a few minutes each.",
    goSim: "Try it in the simulation", riskCosts: "Risk and costs", riskCostsDesc: "Product risk (1 to 7) and annual cost of each DEMO fund on 10,000 €.",
    fund: "Fund", cls: "Class", risk: "Risk", ter: "TER", cost10k: "Annual cost / 10,000 €", cost10y: "Cost over 10 years",
    allocation: "Asset allocation", allocationDesc: "Split by asset class of the sample DEMO portfolio.",
    riskMetrics: "Risk metrics", vol: "Annual volatility", dd: "Maximum drawdown", sharpe: "Sharpe ratio", metricsNote: "Computed from DEMO monthly returns; not real data and predicting nothing.",
    costsCompare: "Costs (TER) and fund comparison", costsNote: "Cost over 10 years: 10,000 € with no contributions at an assumed 4% gross annual return (illustrative assumption, not a forecast), deducting only the TER.",
    equity: "Equity exposure", avgRisk: "Weighted average risk", na: "n/a",
  },
} as const;

function dayIndex() { const d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86400000); }

export default function EducationDashboard({ language, level, theme: _theme, onGoSimulation }: { language: Lang; level: Level; theme?: Theme; onGoSimulation?: () => void }) {
  const t = tx[language];
  const [offset, setOffset] = useState(0);
  const concept = concepts[(dayIndex() + offset) % concepts.length];
  const portfolio = useMemo(() => buildDemoPortfolio(), []);
  // Solo fondos DEMO ficticios con TER supuesto (un TER desconocido no se trata como 0).
  const costRows = useMemo(() => demoFunds.flatMap((f) => f.ter == null ? [] : [{
    fund: f, ter: f.ter, annual: (f.ter / 100) * 10000,
    ten: runScenario({ initial: 10000, monthly: 0, years: 10 }, { id: f.id, kind: "constant", grossAnnualPct: 4, costAnnualPct: f.ter }).costEur,
  }]), []);

  const conceptCard = (
    <article className="dash-card edu-concept">
      <header className="dash-card__head"><h2><Lightbulb size={18} aria-hidden="true" /> {t.daily}</h2>
        <button type="button" className="edu-btn edu-btn--ghost" onClick={() => setOffset(offset + 1)}><Shuffle size={15} aria-hidden="true" /> {t.another}</button></header>
      <p className="edu-concept__term">{concept.term[language]}</p>
      <p aria-live="polite">{concept.text[language]}</p>
    </article>
  );

  const fundsTable = (full: boolean) => (
    <div className="dash-card">
      <div className="dash-funds__scroll" role="region" aria-label={full ? t.costsCompare : t.riskCosts} tabIndex={0}>
        <table className="edu-table">
          <caption className="dash-sr">{full ? t.costsCompare : t.riskCosts}</caption>
          <thead><tr>
            <th scope="col">{t.fund}</th>{full && <th scope="col">{t.cls}</th>}<th scope="col">{t.risk}</th><th scope="col" className="is-num">{t.ter}</th>
            <th scope="col" className="is-num">{t.cost10k}</th>{full && <th scope="col" className="is-num">{t.cost10y}</th>}
          </tr></thead>
          <tbody>{costRows.map(({ fund, ter, annual, ten }) => (
            <tr key={fund.id}>
              <th scope="row">{fund.name}</th>
              {full && <td>{assetClassNames[language][fund.assetClass]}</td>}
              <td><MetricBar label={`${t.risk}: ${fund.name}`} value={fund.riskLevel} language={language} /></td>
              <td className="is-num">{pct(ter, language, 2)}</td>
              <td className="is-num">{eur(annual, language)}</td>
              {full && <td className="is-num">{eur(ten, language)}</td>}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className={`edu edu--${level}`}>
      <header className="edu__head">
        <h1><BookOpen size={22} aria-hidden="true" /> {t.title}</h1>
        <p>{t.subtitle} <DemoBadge language={language} title={DEMO_NOTE[language]} /></p>
      </header>

      {level === "beginner" && (
        <>
          {conceptCard}
          <Section title={t.glossary} language={language}>
            <dl className="dash-card edu-glossary">
              {glossary.map((g) => <div key={g.term.es}><dt>{g.term[language]}</dt><dd>{g.text[language]}</dd></div>)}
            </dl>
          </Section>
        </>
      )}

      {level === "intermediate" && (
        <>
          <Section title={t.paths} description={t.pathsDesc} language={language}>
            <div className="edu-paths">
              {paths.map((p) => (
                <article key={p.id} className="dash-card edu-path">
                  <h3><Compass size={17} aria-hidden="true" /> {p.title[language]}</h3>
                  <ol>{p.steps.map((s) => <li key={s.es}>{s[language]}</li>)}</ol>
                  {p.cta && onGoSimulation && <button type="button" className="edu-btn edu-btn--ghost" onClick={onGoSimulation}>{t.goSim} <ArrowRight size={15} aria-hidden="true" /></button>}
                </article>
              ))}
            </div>
          </Section>
          <Section title={t.riskCosts} description={t.riskCostsDesc} demo language={language}>{fundsTable(false)}</Section>
        </>
      )}

      {level === "advanced" && (
        <>
          <div className="edu-grid-2">
            <DonutCard headingLevel={2} title={t.allocation} description={t.allocationDesc} demo language={language}
              slices={portfolio.byAssetClass.map((g) => ({ id: g.key, label: assetClassNames[language][g.key], weight: g.weight }))} />
            <div className="edu-stack">
              <Section title={t.riskMetrics} demo language={language}>
                <KpiRow label={t.riskMetrics}>
                  <KpiCard label={t.vol} value={portfolio.volatilityPct == null ? t.na : pct(portfolio.volatilityPct, language, 1)} language={language} />
                  <KpiCard label={t.dd} value={portfolio.maxDrawdownPct == null ? t.na : pct(portfolio.maxDrawdownPct, language, 1)} language={language} />
                  <KpiCard label={t.sharpe} value={portfolio.sharpe == null ? t.na : num(portfolio.sharpe, language, 2)} language={language} />
                  <KpiCard label={t.equity} value={portfolio.equityExposure == null ? t.na : pct(portfolio.equityExposure * 100, language, 0)} language={language} />
                </KpiRow>
                <p className="edu-note">{t.metricsNote}</p>
              </Section>
            </div>
          </div>
          <Section title={t.costsCompare} description={t.costsNote} demo language={language}>{fundsTable(true)}</Section>
        </>
      )}

      {level === "advanced" && conceptCard}
      <MifidPractice key={level} language={language} level={level} />
    </div>
  );
}
