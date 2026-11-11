import { Calculator, GraduationCap, HelpCircle, MessageCircle, Search, Wallet, type LucideIcon } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { demoFacts } from "../../../../shared/mock/demo-facts.ts";
import { demoHome } from "../../../../shared/mock/demo-home.ts";
import { DEMO_NOTE } from "../../../../shared/mock/demo-portfolio.ts";
import { DemoBadge, EvolutionChart, KpiRow, Section, StatusChip } from "../../components/dashboard/index.ts";
import { KpiCard } from "../../components/dashboard/index.ts";
import { eur, num, pct, signedEur, signedPct } from "../../components/dashboard/format.ts";
import { buildDemoPortfolio, type DemoPortfolio } from "../../dashboard-portfolio.ts";
import type { HistoricalEvent } from "../../../../tutor-ia/src/types.ts";
import { HOME_PERIODS, goalProgress, lastMonthChangePct, planStatus, selectFacts, sliceByPeriod, type HomePeriod, type PlanStatus } from "../../home-logic.ts";
import type { Level } from "../../types/level.ts";
import "./home.css";

type Page = "explore" | "simulator" | "portfolio" | "learn";
type Lang = "es" | "en";

/** Fecha ficticia de consulta de los hechos DEMO (los hechos posteriores no se muestran). */
const DEMO_AS_OF = "2026-11-11";
const FACT_COUNT: Record<Level, number> = { beginner: 3, intermediate: 4, advanced: 5 };

const periodLabel: Record<Lang, Record<HomePeriod, string>> = {
  es: { "1w": "1S", "1m": "1M", "3m": "3M", "6m": "6M", "1y": "1A", max: "Máx" },
  en: { "1w": "1W", "1m": "1M", "3m": "3M", "6m": "6M", "1y": "1Y", max: "Max" },
};

const services: { page: Page; icon: LucideIcon; es: [string, string]; en: [string, string] }[] = [
  { page: "explore", icon: Search, es: ["Explorar", "Conoce los fondos y sus características."], en: ["Explore", "Learn about funds and their features."] },
  { page: "simulator", icon: Calculator, es: ["Simulador", "Prueba un producto o escenarios ilustrativos DEMO con supuestos claros; no es una previsión."], en: ["Simulator", "Try a product or illustrative DEMO scenarios with clear assumptions; not a forecast."] },
  { page: "portfolio", icon: Wallet, es: ["Mi cartera", "Revisa tus posiciones de ejemplo."], en: ["My portfolio", "Review your sample positions."] },
  { page: "learn", icon: GraduationCap, es: ["Educación", "Aprende conceptos paso a paso."], en: ["Education", "Learn concepts step by step."] },
];

const copy = {
  es: {
    title: "Inicio", summary: "Resumen de tu cartera de ejemplo", value: "Valor de la cartera", lastMonth: "Último mes",
    lastMonthCap: "La serie DEMO es mensual: no hay variación diaria.", na: "n. d.", available: "Disponible", invested: "Aportado", result: "Resultado", goal: "Progreso al objetivo",
    goalOf: (t: string) => `de ${t}`, vol: "Volatilidad anual", dd: "Caída máxima", kpis: "Indicadores de la cartera de ejemplo",
    chart: "Evolución de la cartera", period: "Periodo del gráfico", series: "Cartera DEMO", bench: "Índice de referencia DEMO",
    weekNote: "1S no disponible: los datos DEMO son mensuales y no se inventan datos diarios. 1M muestra el último mes.",
    learnTitle: "Invertir empieza por entender", learnDesc: "Elige por dónde empezar. Todo lo que ves aquí es una demostración educativa, sin operaciones reales.",
    assistant: "Asistente", what: "¿Qué estoy viendo?", how: "¿Cómo van las cosas?", close: "Cerrar", ask: "Preguntar al tutor",
    limits: "Contenido educativo y general: no son órdenes ni asesoramiento personalizado. Las observaciones no prueban causas y nada garantiza rendimientos futuros.",
    howTitle: "Situación frente a tu plan", factsTitle: "Hechos recientes que podrían afectar a tus fondos", source: "Fuente",
    status: { ahead: "por delante del plan", on_track: "en línea con el plan", behind: "por detrás del plan" } as Record<PlanStatus, string>,
    noFacts: "No hay hechos DEMO recientes para tus fondos.", loading: "Cargando…",
  },
  en: {
    title: "Home", summary: "Summary of your sample portfolio", value: "Portfolio value", lastMonth: "Last month",
    lastMonthCap: "The DEMO series is monthly: there is no daily change.", na: "n/a", available: "Available", invested: "Contributed", result: "Result", goal: "Progress to goal",
    goalOf: (t: string) => `of ${t}`, vol: "Annual volatility", dd: "Maximum drawdown", kpis: "Sample portfolio indicators",
    chart: "Portfolio evolution", period: "Chart period", series: "DEMO portfolio", bench: "DEMO reference index",
    weekNote: "1W unavailable: DEMO data is monthly and no daily data is invented. 1M shows the last month.",
    learnTitle: "Investing starts with understanding", learnDesc: "Pick where to start. Everything here is an educational demo with no real transactions.",
    assistant: "Assistant", what: "What am I looking at?", how: "How are things going?", close: "Close", ask: "Ask the tutor",
    limits: "Educational, general content: not orders or personalised advice. Observations do not prove causes and nothing guarantees future returns.",
    howTitle: "Where you stand against your plan", factsTitle: "Recent facts that could affect your funds", source: "Source",
    status: { ahead: "ahead of plan", on_track: "in line with plan", behind: "behind plan" } as Record<PlanStatus, string>,
    noFacts: "No recent DEMO facts for your funds.", loading: "Loading…",
  },
} as const;

function whatText(level: Level, lang: Lang, real?: DemoPortfolio["real"]): string[] {
  const es = lang === "es";
  if (real) {
    const base = es
      ? [`Estás en el Inicio: arriba ves el valor de tu cartera de ejemplo, calculado con los valores liquidativos mensuales publicados por la CNMV (${real.from} – ${real.to}); las participaciones son ficticias (DEMO). Debajo, accesos a las secciones de la aplicación.`]
      : [`You are on Home: at the top you see the value of your sample portfolio, computed with the monthly net asset values published by the CNMV (${real.from} – ${real.to}); the holdings are fictional (DEMO). Below, shortcuts to the app sections.`];
    if (level === "beginner") return [...base, es ? "El gráfico muestra cómo ha subido y bajado el valor. Lo pasado no predice lo futuro; lo importante es tu plazo y tu objetivo." : "The chart shows how the value has risen and fallen. The past does not predict the future; what matters is your horizon and goal."];
    if (level === "intermediate") return [...base, es ? "Además ves lo invertido, el efectivo DEMO, el resultado y el avance hacia un objetivo DEMO. Puedes cambiar el periodo y comparar con la media simple de los fondos (calculada; no es un índice de mercado)." : "You also see the amount invested, the DEMO cash, the result and progress toward a DEMO goal. You can change the period and compare with the simple average of the funds (calculated; not a market index)."];
    return [...base, es ? "La volatilidad anualizada y la caída máxima se calculan por código sobre esa serie mensual real. Son los mismos cálculos que en «Mi cartera»." : "Annualised volatility and maximum drawdown are computed by code on that real monthly series. They are the same calculations as in “My portfolio”."];
  }
  const base = es
    ? ["Estás en el Inicio: arriba ves el valor de una cartera de ejemplo (DEMO) y cómo ha evolucionado; debajo, accesos a las secciones de la aplicación."]
    : ["You are on Home: at the top you see the value of a sample (DEMO) portfolio and how it has evolved; below, shortcuts to the app sections."];
  if (level === "beginner") return [...base, es ? "El gráfico muestra cómo sube y baja el valor con el tiempo. Subir y bajar es normal; lo importante es tu plazo y tu objetivo." : "The chart shows how the value rises and falls over time. Ups and downs are normal; what matters is your horizon and goal."];
  if (level === "intermediate") return [...base, es ? "Además del valor ves cuánto está invertido y cuánto disponible, el resultado sobre lo aportado y el avance hacia tu objetivo. Puedes cambiar el periodo del gráfico y comparar con un índice DEMO." : "Besides the value you see how much is invested and available, the result over what was contributed, and progress toward your goal. You can change the chart period and compare with a DEMO index."];
  return [...base, es ? "También aparecen la volatilidad anualizada y la caída máxima calculadas sobre la serie mensual DEMO (menos de unos pocos años de datos limita su fiabilidad). El gráfico compara la cartera con un índice ficticio reescalado al mismo valor inicial." : "Annualised volatility and maximum drawdown, computed on the monthly DEMO series (a short history limits their reliability), also appear. The chart compares the portfolio with a fictional index rescaled to the same starting value."];
}

export default function HomeDashboard({ language, level, onNavigate, onAskAssistant, portfolio, events }: {
  language: Lang; level: Level; onNavigate?: (page: Page) => void; onAskAssistant?: () => void;
  /** Misma cartera que «Mi cartera» (construida en App); sin ella, la cartera DEMO. */
  portfolio?: DemoPortfolio;
  /** Hechos públicos verificados del dataset CNMV (`navHistory.events`); se usan solo con la cartera real. */
  events?: readonly HistoricalEvent[];
}) {
  const c = copy[language];
  const es = language === "es";
  const panelId = useId();
  const [period, setPeriod] = useState<HomePeriod>("max");
  const [panel, setPanel] = useState<"what" | "how" | null>(null);
  const p = useMemo(() => portfolio ?? buildDemoPortfolio(), [portfolio]);
  const real = p.real;
  const goal = demoHome.goal;

  const values = sliceByPeriod(p.valueSeries, period) ?? p.valueSeries;
  const bench = sliceByPeriod(p.benchmarkSeries, period) ?? p.benchmarkSeries;
  const labels = sliceByPeriod(p.labels, period) ?? p.labels;
  const advanced = level === "advanced";
  const data = values.map((value, i) => ({ label: labels[i], value, compare: advanced || level === "intermediate" ? bench[i] : undefined }));
  const periodChange = values.length > 1 && values[0] !== 0 ? (values[values.length - 1] / values[0] - 1) * 100 : null;
  const monthChange = lastMonthChangePct(p.valueSeries);
  const progress = goalProgress(p.totalValue, goal.targetEur);
  const plan = progress ? planStatus(progress.pct, goal.monthsElapsed, goal.monthsTotal) : null;
  // Con datos reales no se mezclan los hechos DEMO ficticios (hablan de fondos inventados): se muestran hechos públicos
  // verificados dentro del periodo de la serie, como contexto (no prueban causas).
  const facts = useMemo(() => real
    ? [...(events ?? [])].filter((e) => e.date >= real.from && e.date <= real.to).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, FACT_COUNT[level])
        .map((e) => ({ id: e.id, date: e.date, text: { es: `${e.title.es}. ${e.summary.es}`, en: `${e.title.en}. ${e.summary.en}` }, source: { es: e.publisher, en: e.publisher }, url: e.sourceUrl as string | undefined, verified: true }))
    : selectFacts(demoFacts, p.positions.map((r) => r.fund.id), DEMO_AS_OF, FACT_COUNT[level]).map((f) => ({ ...f, url: undefined as string | undefined, verified: false })), [p, real, events, level]);
  const realNote = real ? (es ? `Valores liquidativos mensuales reales (CNMV, ${real.from} – ${real.to}); participaciones, efectivo y objetivo son DEMO.` : `Real monthly net asset values (CNMV, ${real.from} – ${real.to}); holdings, cash and goal are DEMO.`) : null;

  // Foco: al abrir un panel pasa a su encabezado; al cerrarlo vuelve al botón que lo abrió (no hay aria-live: el cambio de foco lo anuncia).
  const triggers = useRef<Record<"what" | "how", HTMLButtonElement | null>>({ what: null, how: null });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const lastTrigger = useRef<"what" | "how" | null>(null);
  const interacted = useRef(false);
  useEffect(() => {
    if (!interacted.current) return;
    if (panel) headingRef.current?.focus();
    else if (lastTrigger.current) triggers.current[lastTrigger.current]?.focus();
  }, [panel]);
  const toggle = (which: "what" | "how") => { interacted.current = true; lastTrigger.current = which; setPanel((cur) => (cur === which ? null : which)); };
  const close = () => { interacted.current = true; setPanel(null); };

  return (
    <div className="home">
      <h1 className="dash-sr">{es ? "Inicio" : "Home"}</h1>
      <Section title={c.summary} demo language={language} description={realNote ?? DEMO_NOTE[language]}>
        <div className="home__hero">
          <KpiRow label={c.kpis}>
            <KpiCard label={c.value} value={eur(p.totalValue, language)} demo language={language} />
            <KpiCard label={c.lastMonth} value={monthChange == null ? c.na : signedPct(monthChange, language)} delta={monthChange} caption={real ? (es ? "Serie mensual (NAV CNMV): no hay variación diaria." : "Monthly series (CNMV NAVs): no daily change.") : c.lastMonthCap} demo language={language} />
            {level !== "beginner" && <KpiCard label={c.invested} value={eur(p.totalCost, language)} language={language} />}
            {level !== "beginner" && <KpiCard label={c.available} value={eur(demoHome.availableCashEur, language)} language={language} />}
            {advanced && <KpiCard label={c.result} value={signedEur(p.pnlAmount, language)} delta={p.pnlPercent} language={language} />}
            {advanced && <KpiCard label={c.vol} value={p.volatilityPct == null ? c.na : pct(p.volatilityPct, language)} language={language} />}
            {advanced && <KpiCard label={c.dd} value={p.maxDrawdownPct == null ? c.na : pct(p.maxDrawdownPct, language)} language={language} />}
            <KpiCard label={c.goal} value={progress ? pct(progress.pct, language) : c.na} caption={`${goal.name[language]} ${c.goalOf(eur(goal.targetEur, language))}`} demo language={language}>
              {progress && <div className="home__goal-bar" role="progressbar" aria-label={c.goal} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.pct)}><span style={{ width: `${progress.pct}%` }} /></div>}
            </KpiCard>
          </KpiRow>
          <EvolutionChart
            title={c.chart} data={data} seriesName={real ? (es ? "Cartera (NAV CNMV)" : "Portfolio (CNMV NAVs)") : c.series} compareName={real ? real.benchmarkName[language] : c.bench} changePct={periodChange} demo language={language}
            periodControl={
              <div className="home__period-wrap">
                <div className="dash-period" role="group" aria-label={c.period}>
                  {HOME_PERIODS.map((o) => (
                    <button key={o.id} type="button" aria-pressed={o.id === period} disabled={!o.available} onClick={() => setPeriod(o.id)}>{periodLabel[language][o.id]}</button>
                  ))}
                </div>
              </div>
            }
          />
          <p className="home__period-note">{real ? (es ? "1S no disponible: los NAV publicados son mensuales y no se inventan datos diarios. 1M muestra el último mes." : "1W unavailable: published NAVs are monthly and no daily data is invented. 1M shows the last month.") : c.weekNote}</p>
        </div>
      </Section>

      <Section title={c.learnTitle} description={c.learnDesc} language={language}>
        <ul className="home__services">
          {services.map((s) => {
            const [name, desc] = s[language];
            const Icon = s.icon;
            return (
              <li key={s.page}>
                <button type="button" className="home__service" onClick={() => onNavigate?.(s.page)}>
                  <Icon size={22} aria-hidden="true" />
                  <strong>{name}</strong>
                  {level !== "advanced" && <span>{desc}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title={c.assistant} language={language}>
        <div className="home__assist">
          <button type="button" ref={(el) => { triggers.current.what = el; }} aria-expanded={panel === "what"} aria-controls={panelId} onClick={() => toggle("what")}><HelpCircle size={16} aria-hidden="true" />{c.what}</button>
          <button type="button" ref={(el) => { triggers.current.how = el; }} aria-expanded={panel === "how"} aria-controls={panelId} onClick={() => toggle("how")}><MessageCircle size={16} aria-hidden="true" />{c.how}</button>
        </div>
        <div id={panelId}>
          {panel === "what" && (
            <div className="home__panel">
              <h3 ref={headingRef} tabIndex={-1}>{c.what} <DemoBadge language={language} /></h3>
              {whatText(level, language, real).map((t) => <p key={t}>{t}</p>)}
              <p className="home__note">{c.limits}</p>
              <div className="home__panel-actions">
                {onAskAssistant && <button type="button" onClick={onAskAssistant}>{c.ask}</button>}
                <button type="button" onClick={close}>{c.close}</button>
              </div>
            </div>
          )}
          {panel === "how" && (
            <div className="home__panel">
              <h3 ref={headingRef} tabIndex={-1}>{c.how} <DemoBadge language={language} /></h3>
              {progress && plan && (
                <p>
                  <StatusChip tone={plan.status === "behind" ? "warning" : plan.status === "ahead" ? "positive" : "info"}>{c.status[plan.status]}</StatusChip>{" "}
                  {es
                    ? `Objetivo «${goal.name.es}»: llevas ${num(progress.pct, language, 1)} % (${eur(p.totalValue, language)} de ${eur(goal.targetEur, language)}); con ${goal.monthsElapsed} de ${goal.monthsTotal} meses del plan, el avance lineal sería ${num(plan.expectedPct, language, 1)} %. Es una comparación orientativa con datos DEMO.`
                    : `Goal "${goal.name.en}": you are at ${num(progress.pct, language, 1)}% (${eur(p.totalValue, language)} of ${eur(goal.targetEur, language)}); with ${goal.monthsElapsed} of ${goal.monthsTotal} plan months elapsed, linear progress would be ${num(plan.expectedPct, language, 1)}%. This is an indicative comparison on DEMO data.`}
                </p>
              )}
              <h4>{real ? (es ? "Hechos públicos verificados del periodo de la serie" : "Verified public events in the series period") : c.factsTitle}</h4>
              {facts.length ? (
                <ul>
                  {facts.map((f) => (
                    <li key={f.id} className="home__fact">
                      <span>{f.text[language]}</span>
                      <small><time dateTime={f.date}>{f.date}</time> · {c.source}: {f.url ? <a href={f.url} target="_blank" rel="noreferrer">{f.source[language]}</a> : f.source[language]} {!f.verified && <DemoBadge language={language} />}</small>
                    </li>
                  ))}
                </ul>
              ) : <p>{real ? (es ? "No hay hechos públicos verificados en el periodo." : "No verified public events in the period.") : c.noFacts}</p>}
              <p className="home__note">{c.limits}</p>
              <div className="home__panel-actions">
                {onAskAssistant && <button type="button" onClick={onAskAssistant}>{c.ask}</button>}
                <button type="button" onClick={close}>{c.close}</button>
              </div>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
