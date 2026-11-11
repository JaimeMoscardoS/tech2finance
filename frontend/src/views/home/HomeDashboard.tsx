import { BookOpen, Compass, FlaskConical, HelpCircle, LifeBuoy, MessageCircle, Sparkles, Wallet } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { insightFacts, useInsight, type InsightProvider } from "../../insights.ts";
import { demoFacts } from "../../../../shared/mock/demo-facts.ts";
import { demoHome } from "../../../../shared/mock/demo-home.ts";
import { DemoBadge, KpiRow, Section, StatusChip } from "../../components/dashboard/index.ts";
import { KpiCard } from "../../components/dashboard/index.ts";
import { eur, monthLabel, num, pct, signedEur, signedPct } from "../../components/dashboard/format.ts";
import { buildDemoPortfolio, type DemoPortfolio } from "../../dashboard-portfolio.ts";
import type { HistoricalEvent } from "../../../../tutor-ia/src/types.ts";
import { goalProgress, lastMonthChangePct, planStatus, selectFacts, type PlanStatus } from "../../home-logic.ts";
import type { Level } from "../../types/level.ts";
import "./home.css";

type Page = "explore" | "simulator" | "portfolio" | "learn";
type Lang = "es" | "en";

/** Fecha ficticia de consulta de los hechos DEMO (los hechos posteriores no se muestran). */
const DEMO_AS_OF = "2026-11-11";
const FACT_COUNT: Record<Level, number> = { beginner: 3, intermediate: 4, advanced: 5 };

const copy = {
  es: {
    title: "Inicio", summary: "Resumen de tu cartera de ejemplo", value: "Valor de la cartera", lastMonth: "Último mes",
    lastMonthCap: "La serie DEMO es mensual: no hay variación diaria.", na: "n. d.", available: "Disponible", invested: "Aportado", result: "Resultado", goal: "Progreso al objetivo",
    goalOf: (t: string) => `de ${t}`, vol: "Volatilidad anual", dd: "Caída máxima", kpis: "Indicadores de la cartera de ejemplo",
    chart: "Evolución de la cartera", period: "Periodo del gráfico", series: "Cartera DEMO", bench: "Índice de referencia DEMO",
    weekNote: "1S no disponible: los datos DEMO son mensuales y no se inventan datos diarios. 1M muestra el último mes.",
    cardsAria: "Qué puedes hacer", seePortfolio: "Ver mi cartera", worryTitle: "¿Te preocupa una caída?", worryText: "Respira: antes de decidir, te mostramos con datos qué ha pasado. Nada te obliga a vender ni a mantener.", worryBtn: "Entender una caída",
    cards: [["explore", "Explorar fondos", "Descubre qué son y cómo se comportan.", "Ver el catálogo"], ["simulator", "Simular", "Prueba qué habría pasado, sin dinero real.", "Probar el simulador"], ["portfolio", "Mi cartera", "Mira tus fondos y tu objetivo.", "Ver mis fondos"], ["learn", "Aprender", "Conceptos clave y práctica del Test MiFID.", "Empezar a aprender"]],
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
    cardsAria: "What you can do", seePortfolio: "See my portfolio", worryTitle: "Worried about a decline?", worryText: "Take a breath: before deciding, we show you what happened with data. Nothing forces you to sell or hold.", worryBtn: "Understand a decline",
    cards: [["explore", "Explore funds", "Discover what they are and how they behave.", "See the catalogue"], ["simulator", "Simulate", "Try what would have happened, with no real money.", "Try the simulator"], ["portfolio", "My portfolio", "See your funds and your goal.", "See my funds"], ["learn", "Learn", "Key concepts and MiFID test practice.", "Start learning"]],
    learnTitle: "Investing starts with understanding", learnDesc: "Pick where to start. Everything here is an educational demo with no real transactions.",
    assistant: "Assistant", what: "What am I looking at?", how: "How are things going?", close: "Close", ask: "Ask the tutor",
    limits: "Educational, general content: not orders or personalised advice. Observations do not prove causes and nothing guarantees future returns.",
    howTitle: "Where you stand against your plan", factsTitle: "Recent facts that could affect your funds", source: "Source",
    status: { ahead: "ahead of plan", on_track: "in line with plan", behind: "behind plan" } as Record<PlanStatus, string>,
    noFacts: "No recent DEMO facts for your funds.", loading: "Loading…",
  },
} as const;


/** Explicación local (respaldo sin modelo de IA). Básico: una frase. */
function whatText(level: Level, lang: Lang, real?: DemoPortfolio["real"]): string[] {
  const es = lang === "es";
  if (level === "beginner") return [es
    ? "Arriba ves cuánto vale tu cartera de ejemplo y, en el gráfico, cómo ha subido y bajado con el tiempo."
    : "At the top you see what your sample portfolio is worth and, in the chart, how it has gone up and down over time."];
  const base = real
    ? (es ? `El resumen muestra el valor de tu cartera de ejemplo, calculado con los valores liquidativos mensuales publicados por la CNMV (${monthLabel(real.from, lang)} – ${monthLabel(real.to, lang)}); las participaciones son ficticias (DEMO).`
      : `The summary shows the value of your sample portfolio, computed with the monthly net asset values published by the CNMV (${monthLabel(real.from, lang)} – ${monthLabel(real.to, lang)}); the holdings are fictional (DEMO).`)
    : (es ? "El resumen muestra el valor de una cartera de ejemplo (DEMO) y cómo ha evolucionado." : "The summary shows the value of a sample (DEMO) portfolio and how it has evolved.");
  if (level === "intermediate") return [base, es ? "Además ves lo aportado, el efectivo DEMO y el avance hacia un objetivo DEMO; puedes cambiar el periodo y comparar con la referencia." : "You also see the contributions, DEMO cash and progress toward a DEMO goal; you can change the period and compare with the reference."];
  return [base, es ? "La volatilidad anualizada y la caída máxima se calculan por código sobre esa serie mensual, igual que en «Mi cartera»." : "Annualised volatility and maximum drawdown are computed by code on that monthly series, as in “My portfolio”."];
}

export default function HomeDashboard({ language, level, onNavigate, onUnderstandFall, onAskAssistant, portfolio, events, insights, actions, status }: {
  language: Lang; level: Level; onNavigate?: (page: Page) => void; onUnderstandFall?: () => void; onAskAssistant?: () => void;
  /** Misma cartera que «Mi cartera», Educación y el asistente (construida en App); sin ella, la cartera DEMO. */
  portfolio?: DemoPortfolio;
  /** Hechos públicos verificados del dataset CNMV (`navHistory.events`); se usan solo con la cartera real. */
  events?: readonly HistoricalEvent[];
  /** Modelo del backend para redactar las respuestas; sin él, plantilla local. */
  insights?: InsightProvider;
  /** Accesos de acción bajo el asistente (p. ej. «Probar una caída»). */
  actions?: ReactNode;
  status?: ReactNode;
}) {
  const c = copy[language];
  const es = language === "es";
  const panelId = useId();
  const [panel, setPanel] = useState<"what" | "how" | null>(null);
  const p = useMemo(() => portfolio ?? buildDemoPortfolio(), [portfolio]);
  const real = p.real;
  const goal = demoHome.goal;
  const beginner = level === "beginner";

  const advanced = level === "advanced";
  const monthChange = lastMonthChangePct(p.valueSeries);
  const progress = goalProgress(p.totalValue, goal.targetEur);
  // El plan DEMO empieza con la serie: meses transcurridos = meses de la serie mostrada (72 con los datos CNMV).
  const monthsElapsed = Math.min(goal.monthsTotal, Math.max(0, p.valueSeries.length - 1));
  const plan = progress ? planStatus(progress.pct, monthsElapsed, goal.monthsTotal) : null;
  const facts = useMemo(() => real
    ? [...(events ?? [])].filter((e) => e.date >= real.from && e.date <= real.to).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, FACT_COUNT[level])
        .map((e) => ({ id: e.id, date: e.date, text: { es: `${e.title.es}. ${e.summary.es}`, en: `${e.title.en}. ${e.summary.en}` }, source: { es: e.publisher, en: e.publisher }, url: e.sourceUrl as string | undefined, verified: true }))
    : selectFacts(demoFacts, p.positions.map((r) => r.fund.id), DEMO_AS_OF, FACT_COUNT[level]).map((f) => ({ ...f, url: undefined as string | undefined, verified: false })), [p, real, events, level]);

  const request = useMemo(() => panel ? { kind: panel, page: "home" as const, level, language, facts: insightFacts(p, { lastMonthPct: monthChange, goalProgressPct: progress?.pct, planExpectedPct: plan?.expectedPct }) } : null,
    [panel, level, language, p, monthChange, progress?.pct, plan?.expectedPct]);
  const insight = useInsight(insights, request);

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

  const aiBlock = insight.status === "loading" ? <p className="home__note" role="status">{es ? "El asistente está redactando…" : "The assistant is writing…"}</p>
    : insight.status === "ai" && insight.insight ? (
      <div className="home__ai">
        <p className="home__ai-tag"><Sparkles size={14} aria-hidden="true" /> {es ? "Redactado por IA con las cifras calculadas por código" : "Written by AI from figures computed by code"}</p>
        <p>{insight.insight.summary}</p>
        {!beginner && <ul className="home__ai-points">{insight.insight.points.map((t) => <li key={t}>{t}</li>)}</ul>}
      </div>
    ) : null;
  const fallbackNote = insight.status === "template" && insights ? <p className="home__note">{es ? "Sin conexión con el modelo de IA: explicación local." : "No connection to the AI model: local explanation."}</p> : null;
  const panelActions = (
    <div className="home__panel-actions">
      {onAskAssistant && <button type="button" onClick={onAskAssistant}>{c.ask}</button>}
      <button type="button" onClick={close}>{c.close}</button>
    </div>
  );

  return (
    <div className="home">
      <h1 className="dash-sr">{es ? "Inicio" : "Home"}</h1>
      <section className="home__intro" data-tour="intro" aria-labelledby={`${panelId}-intro`}>
        <h2 id={`${panelId}-intro`}>{c.learnTitle}</h2>
        <p>{c.learnDesc}</p>
        <div className="home__cards" role="group" aria-label={c.cardsAria}>
          {c.cards.map(([id, title, line, btn], i) => {
            const Icon = [Compass, FlaskConical, Wallet, BookOpen][i];
            return (
              <article key={id} className="home__card">
                <Icon size={26} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{line}</p>
                <button type="button" onClick={() => onNavigate?.(id as Page)}>{btn}</button>
              </article>
            );
          })}
        </div>
      </section>

      {onUnderstandFall && (
        <section className="home__worry" data-tour="worry" aria-labelledby={`${panelId}-worry`}>
          <LifeBuoy size={30} aria-hidden="true" />
          <div>
            <h2 id={`${panelId}-worry`}>{c.worryTitle}</h2>
            <p>{c.worryText}</p>
          </div>
          <button type="button" onClick={onUnderstandFall}>{c.worryBtn}</button>
        </section>
      )}

      <div className="home__top">
        <section className="dash-card home__assistant" data-tour="assistant" aria-labelledby={`${panelId}-h`}>
          <h2 id={`${panelId}-h`}><Sparkles size={18} aria-hidden="true" /> {c.assistant}</h2>
          <div className="home__assist">
            <button type="button" ref={(el) => { triggers.current.what = el; }} aria-expanded={panel === "what"} aria-controls={panelId} onClick={() => toggle("what")}><HelpCircle size={20} aria-hidden="true" />{c.what}</button>
            <button type="button" ref={(el) => { triggers.current.how = el; }} aria-expanded={panel === "how"} aria-controls={panelId} onClick={() => toggle("how")}><MessageCircle size={20} aria-hidden="true" />{c.how}</button>
          </div>
          <div id={panelId}>
            {panel === "what" && (
              <div className="home__panel">
                <h3 ref={headingRef} tabIndex={-1}>{c.what}</h3>
                {aiBlock}
                {insight.status === "template" && whatText(level, language, real).map((t) => <p key={t}>{t}</p>)}
                {fallbackNote}
                {panelActions}
              </div>
            )}
            {panel === "how" && (
              <div className="home__panel">
                <h3 ref={headingRef} tabIndex={-1}>{c.how}</h3>
                {aiBlock}
                {progress && plan && (
                  <p>
                    <StatusChip tone={plan.status === "behind" ? "warning" : plan.status === "ahead" ? "positive" : "info"}>{c.status[plan.status]}</StatusChip>{" "}
                    {beginner
                      ? (es ? `Llevas ${num(progress.pct, language, 0)} % de tu objetivo «${goal.name.es}».` : `You are at ${num(progress.pct, language, 0)}% of your goal "${goal.name.en}".`)
                      : es
                        ? `Objetivo «${goal.name.es}»: llevas ${num(progress.pct, language, 1)} % (${eur(p.totalValue, language)} de ${eur(goal.targetEur, language)}); con ${monthsElapsed} de ${goal.monthsTotal} meses del plan, el avance lineal sería ${num(plan.expectedPct, language, 1)} %. Comparación orientativa con datos DEMO.`
                        : `Goal "${goal.name.en}": you are at ${num(progress.pct, language, 1)}% (${eur(p.totalValue, language)} of ${eur(goal.targetEur, language)}); with ${monthsElapsed} of ${goal.monthsTotal} plan months elapsed, linear progress would be ${num(plan.expectedPct, language, 1)}%. Indicative comparison on DEMO data.`}
                  </p>
                )}
                {!beginner && <>
                  <h4>{real ? (es ? "Hechos públicos verificados del periodo" : "Verified public events in the period") : c.factsTitle}</h4>
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
                </>}
                {fallbackNote}
                {panelActions}
              </div>
            )}
          </div>
          {actions && <div className="home__actions">{actions}</div>}
          {status}
          <p className="home__note">{beginner ? (es ? "Contenido educativo: no son órdenes ni consejos personalizados." : "Educational content: not orders or personalised advice.") : c.limits}</p>
        </section>

        <div data-tour="summary">
          <Section title={c.summary} demo language={language}>
            <div className="home__hero">
              <KpiRow label={c.kpis}>
                <KpiCard label={c.value} value={eur(p.totalValue, language)} language={language} />
                <KpiCard label={c.lastMonth} value={monthChange == null ? c.na : signedPct(monthChange, language)} language={language} />
                {advanced && <KpiCard label={c.vol} value={p.volatilityPct == null ? c.na : pct(p.volatilityPct, language)} language={language} />}
                {advanced && <KpiCard label={c.dd} value={p.maxDrawdownPct == null ? c.na : pct(p.maxDrawdownPct, language)} language={language} />}
                <KpiCard label={c.goal} value={progress ? pct(progress.pct, language) : c.na} caption={`${goal.name[language]} ${c.goalOf(eur(goal.targetEur, language))}`} language={language}>
                  {progress && <div className="home__goal-bar" role="progressbar" aria-label={c.goal} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.pct)}><span style={{ width: `${progress.pct}%` }} /></div>}
                </KpiCard>
              </KpiRow>
              <button type="button" className="home__link" onClick={() => onNavigate?.("portfolio")}>{c.seePortfolio}</button>
              <details className="dash-origin">
                <summary>{es ? "Origen de los datos" : "Data origin"}</summary>
                <p>{real
                  ? (es ? `Valores liquidativos mensuales reales (CNMV, ${monthLabel(real.from, language)} – ${monthLabel(real.to, language)}). Participaciones, efectivo y objetivo son DEMO (ficticios).` : `Real monthly net asset values (CNMV, ${monthLabel(real.from, language)} – ${monthLabel(real.to, language)}). Holdings, cash and goal are DEMO (fictional).`)
                  : (es ? "Datos ficticios de ejemplo; no son datos reales ni una predicción." : "Fictional sample data; not real data or a prediction.")}</p>
                <p>{es ? "La serie es mensual: «Último mes» es la última variación mensual y no hay datos diarios." : "The series is monthly: “Last month” is the latest monthly change and there is no daily data."}</p>
                <p>{c.limits}</p>
              </details>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
