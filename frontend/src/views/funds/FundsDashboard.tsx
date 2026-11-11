import { Activity, BarChart3, Gauge, Layers, Percent, ShieldAlert, TrendingDown, Wallet } from "lucide-react";
import { useId, useMemo, useState, type ReactNode } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { demoFunds } from "../../../../shared/mock/demo-portfolio.ts";
import { demoTrades } from "../../../../shared/mock/demo-trades.ts";
import {
  DemoBadge, DeltaChip, EvolutionChart, FundTable, KpiCard, KpiRow, MetricBar, PeriodSelector, Section, DonutCard, type EvolutionPoint, type DonutSlice,
} from "../../components/dashboard/index.ts";
import { assetClassNames, currencyNames, regionNames } from "../../components/dashboard/copy.ts";
import { eur, monthLabel, num, pct, signedEur, signedPct } from "../../components/dashboard/format.ts";
import { usePrefersReducedMotion } from "../../components/dashboard/useReducedMotion.ts";
import { changePct, cumulativeFromReturns, returnsFromSeries } from "../../dashboard-metrics.ts";
import { buildDemoPortfolio, type DemoPortfolio } from "../../dashboard-portfolio.ts";
import { bestWorstMonth, excessReturnPct, filterPositions, monthlyReturnMatrix, periodWindow, positiveMonthsPct, rebase, summarizeTrades } from "../../funds-metrics.ts";
import type { Level, Theme } from "../../types/level.ts";
import { fc, fr, type Lang } from "./copy.ts";
import { Heatmap } from "./Heatmap.tsx";
import "./funds.css";

export type FundsDashboardProps = {
  language: Lang;
  level: Level;
  theme?: Theme;
  onExplore?: () => void;
  onSimulate?: () => void;
  onSell?: () => void;
  /** Cartera ya construida por App (NAV reales CNMV vía `buildRealPortfolio`, la misma que usa Inicio). Sin ella, la cartera DEMO. */
  portfolio?: DemoPortfolio;
};

type PeriodId = "3" | "6" | "12" | "24" | "all";
const PERIOD_MONTHS: Record<Exclude<PeriodId, "all">, number> = { "3": 3, "6": 6, "12": 12, "24": 24 };

function usePeriod(portfolio: DemoPortfolio, options: readonly PeriodId[], initial: PeriodId) {
  const t = (l: Lang) => fc[l];
  const [period, setPeriod] = useState<PeriodId>(initial);
  const max = Math.max(1, portfolio.valueSeries.length - 1);
  const months = period === "all" ? max : Math.min(PERIOD_MONTHS[period], max);
  const labelOf = (l: Lang, id: PeriodId) => ({ "3": t(l).p3, "6": t(l).p6, "12": t(l).p12, "24": t(l).p24, all: t(l).pAll })[id];
  return { period, setPeriod, months, options, labelOf };
}

function periodControl(language: Lang, p: ReturnType<typeof usePeriod>) {
  return <PeriodSelector<PeriodId> label={fc[language].period} value={p.period} onChange={p.setPeriod} options={p.options.map((id) => ({ id, label: p.labelOf(language, id) }))} />;
}

function Actions({ language, onExplore, onSimulate, onSell }: Pick<FundsDashboardProps, "language" | "onExplore" | "onSimulate" | "onSell">) {
  const t = fc[language];
  if (!onExplore && !onSimulate && !onSell) return null;
  return (
    <div className="fd__actions">
      {onExplore && <button type="button" className="fd-btn fd-btn--primary" onClick={onExplore}>{t.explore}</button>}
      {onSimulate && <button type="button" className="fd-btn" onClick={onSimulate}>{t.simulate}</button>}
      {onSell && <button type="button" className="fd-btn" onClick={onSell}>{t.sell}</button>}
    </div>
  );
}

function Kpis({ p, language, dense }: { p: DemoPortfolio; language: Lang; dense?: boolean }) {
  const t = fc[language];
  const risk = p.averageRisk;
  return (
    <KpiRow label={t.kpis}>
      <KpiCard label={t.value} icon={Wallet} value={eur(p.totalValue, language)} language={language} />
      <KpiCard label={t.result} icon={BarChart3} value={signedEur(p.pnlAmount, language)} delta={p.pnlPercent} caption={dense ? undefined : t.resultCaption} language={language} />
      <KpiCard label={t.risk} icon={ShieldAlert} value={risk == null ? t.na : `${num(risk, language, 1)} / 7`} caption={dense ? undefined : t.riskCaption} language={language}>
        {risk != null && <MetricBar label={t.risk} value={risk} language={language} valueText={`${num(risk, language, 1)} / 7`} />}
      </KpiCard>
    </KpiRow>
  );
}

function chartData(p: DemoPortfolio, months: number, withIndex: boolean): { data: EvolutionPoint[]; change: number | null } {
  const values = periodWindow(p.valueSeries, months);
  const labels = periodWindow(p.labels, months);
  const bench = periodWindow(p.benchmarkSeries, months);
  return {
    data: values.map((value, i) => ({ label: labels[i], value, ...(withIndex && bench[i] != null ? { compare: bench[i] } : {}) })),
    change: changePct(p.valueSeries, Math.min(months, p.valueSeries.length - 1)),
  };
}

function slices<K extends string>(groups: { key: K; weight: number }[], names: Record<K, string>): DonutSlice[] {
  return groups.map((g) => ({ id: g.key, label: names[g.key], weight: g.weight }));
}

/* ---------------- Básico ---------------- */
function Basic(props: FundsDashboardProps & { p: DemoPortfolio }) {
  const { p, language } = props;
  const t = fc[language];
  const per = usePeriod(p, ["3", "12", "all"], "12");
  const { data, change } = chartData(p, per.months, false);
  return (
    <>
      <Kpis p={p} language={language} />
      <EvolutionChart title={t.evolution} description={p.real ? fr[language].evolutionDesc : t.evolutionDesc} data={data} seriesName={t.portfolio} changePct={change} periodControl={periodControl(language, per)} language={language} />
      <Section title={t.yourFunds} description={t.yourFundsDesc} language={language} level={3}>
        <ul className="fd-cards">
          {p.positions.map((r) => (
            <li key={r.fund.id}>
              <article className="dash-card fd-fund" aria-label={r.fund.name}>
                <h4>{r.fund.name}</h4>
                <small>{assetClassNames[language][r.fund.assetClass]}</small>
                <p>{t.classHelp[r.fund.assetClass].split(". ")[0].replace(/\.?$/, ".")}</p>
                <MetricBar label={`${t.riskOfProduct}: ${r.fund.name}`} value={r.fund.riskLevel} language={language} />
                <dl>
                  <dt>{t.value}</dt><dd>{eur(r.value, language)}</dd>
                  <dt>{t.weight}</dt><dd>{pct(r.weight * 100, language)}</dd>
                  <dt>{t.resultLabel}</dt><dd><DeltaChip value={r.pnlPercent} language={language} /></dd>
                </dl>
              </article>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

/* ---------------- Intermedio ---------------- */
function Intermediate(props: FundsDashboardProps & { p: DemoPortfolio }) {
  const { p, language } = props;
  const t = fc[language];
  const per = usePeriod(p, ["3", "6", "12", "24", "all"], "12");
  const { data, change } = chartData(p, per.months, true);
  const benchChange = changePct(p.benchmarkSeries, Math.min(per.months, p.benchmarkSeries.length - 1));
  const diff = excessReturnPct(p.valueSeries, p.benchmarkSeries, Math.min(per.months, p.valueSeries.length - 1));
  return (
    <>
      <Kpis p={p} language={language} />
      <EvolutionChart title={t.evolution} description={p.real ? fr[language].compareDesc : t.compareDesc} data={data} seriesName={t.portfolio} compareName={p.real ? p.real.benchmarkName[language] : t.index} changePct={change} periodControl={periodControl(language, per)} language={language} />
      <article className="dash-card" aria-label={t.compare}>
        <header className="dash-card__head"><h3>{p.real ? fr[language].indexLabel : t.compare}</h3></header>
        <div className="fd-compare">
          <div><span>{t.portfolioChange}</span><strong>{change == null ? t.na : signedPct(change, language)}</strong></div>
          <div><span>{p.real ? fr[language].indexLabel : t.indexChange}</span><strong>{benchChange == null ? t.na : signedPct(benchChange, language)}</strong></div>
          <div><span>{t.difference}</span><strong>{diff == null ? t.na : `${num(diff, language, 2)} ${t.pp}`}</strong></div>
        </div>
        <p className="fd-note">{t.forPeriod}. {p.real ? fr[language].compareNote : t.compareNote}</p>
      </article>
      <Section title={t.mix} description={t.mixDesc} language={language} level={3}>
        <div className="fd-grid">
          <DonutCard title={t.byClass} slices={slices(p.byAssetClass, assetClassNames[language])} centerValue={eur(p.totalValue, language)} centerLabel={t.center} language={language} />
          <DonutCard title={t.byCurrency} slices={slices(p.byCurrency, currencyNames[language])} language={language} />
          <DonutCard title={t.byProduct} slices={p.positions.map((r) => ({ id: r.fund.id, label: r.fund.name, weight: r.weight }))} language={language} />
        </div>
      </Section>
      <FundTable rows={p.positions} caption={t.table} language={language} />
    </>
  );
}

/* ---------------- Avanzado ---------------- */
// Cartera: --chart-line, trazo continuo y grueso. Índice: --chart-2 con guiones «6 4». Los fondos no usan --cat-1, --cat-2 ni --cat-3 (en algún tema iguales a esos dos)
// y todos llevan un patrón de guiones propio, de modo que ninguno se confunde con la cartera ni depende solo del color.
const FUND_COLORS = ["var(--cat-4)", "var(--cat-5)", "var(--cat-6)", "var(--muted)", "var(--ink)"];
const FUND_DASH = ["2 3", "10 3 2 3", "1 4", "14 5", "4 2 1 2"];

function MultiSeriesChart({ p, language, months, periodCtl }: { p: DemoPortfolio; language: Lang; months: number; periodCtl: ReactNode }) {
  const t = fc[language];
  const uid = useId().replace(/:/g, "");
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState<Set<string>>(() => new Set(["portfolio", "index"]));
  const length = p.valueSeries.length;
  const series = useMemo(() => {
    const entries: { key: string; name: string; color: string; dash: string; values: number[] }[] = [
      { key: "portfolio", name: t.portfolio, color: "var(--chart-line)", dash: "", values: rebase(periodWindow(p.valueSeries, months)) },
      { key: "index", name: p.real ? p.real.benchmarkName[language] : t.index, color: "var(--chart-2)", dash: "6 4", values: rebase(periodWindow(p.benchmarkSeries, months)) },
    ];
    p.positions.forEach((r, i) => {
      const prices = cumulativeFromReturns(r.fund.startPrice, r.fund.monthlyReturnsPct).slice(0, length);
      entries.push({ key: r.fund.id, name: r.fund.name, color: FUND_COLORS[i % FUND_COLORS.length], dash: FUND_DASH[i % FUND_DASH.length], values: rebase(periodWindow(prices, months)) });
    });
    return entries;
  }, [p, months, length, t.portfolio, t.index, language]);
  const labels = periodWindow(p.labels, months);
  const data = labels.map((label, i) => ({ label, ...Object.fromEntries(series.map((s) => [s.key, s.values[i]])) })) as Record<string, number | string>[];
  const shown = series.filter((s) => visible.has(s.key));
  const toggle = (key: string) => setVisible((v) => { const n = new Set(v); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  return (
    <article className="dash-card" aria-labelledby={`${uid}-t`}>
      <header className="dash-card__head">
        <div>
          <h3 id={`${uid}-t`}>{t.seriesTitle}</h3>
          <p className="dash-card__desc">{p.real ? fr[language].seriesDesc : t.seriesDesc}</p>
        </div>
        {periodCtl}
      </header>
      <fieldset className="fd-series">
        <legend>{t.seriesPicker}</legend>
        {series.map((s) => (
          <label key={s.key}>
            <input type="checkbox" checked={visible.has(s.key)} onChange={() => toggle(s.key)} />
            <svg width="26" height="8" aria-hidden="true" focusable="false"><line x1="0" y1="4" x2="26" y2="4" stroke={s.color} strokeWidth="2.5" strokeDasharray={s.dash || undefined} /></svg>
            {s.name}
          </label>
        ))}
      </fieldset>
      <div className="fd-plot" role="img" aria-label={`${t.seriesTitle}: ${shown.map((s) => s.name).join(", ")}`}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={data} accessibilityLayer={false} margin={{ top: 8, right: 14, left: 0, bottom: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="2 4" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} minTickGap={28} interval="preserveStartEnd" tickFormatter={(l: string) => monthLabel(l, language)} />
            <YAxis width={44} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} domain={["auto", "auto"]} tickFormatter={(n: number) => num(n, language, 0)} />
            <Tooltip cursor={{ stroke: "var(--muted)", strokeDasharray: "3 3" }} content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as Record<string, number | string>;
              return (
                <div className="fd-tip" data-l="1">
                  <strong>{monthLabel(String(label), language)}</strong>
                  {shown.map((s) => <div key={s.key}>{s.name}: <b>{num(row[s.key] as number, language, 1)}</b></div>)}
                </div>
              );
            }} />
            {shown.map((s) => <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={s.key === "portfolio" ? 2.6 : 1.8} strokeDasharray={s.dash || undefined} dot={false} isAnimationActive={!reduced} />)}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <details className="dash-evo__data">
        <summary>{t.showData}</summary>
        <div className="dash-funds__scroll" role="region" aria-label={t.seriesTitle} tabIndex={0}>
          <table>
            <caption className="dash-sr">{t.seriesTitle}. {t.base100}</caption>
            <thead><tr><th scope="col">{language === "es" ? "Punto" : "Point"}</th>{shown.map((s) => <th scope="col" key={s.key} className="is-num">{s.name}</th>)}</tr></thead>
            <tbody>{data.map((d) => <tr key={d.label as string}><th scope="row">{d.label}</th>{shown.map((s) => <td key={s.key} className="is-num">{num(d[s.key] as number, language, 1)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </details>
    </article>
  );
}

function ExposureBars({ title, description, items, language, demo = true }: { title: string; description?: string; items: { key: string; label: string; weight: number }[]; language: Lang; demo?: boolean }) {
  return (
    <article className="dash-card" aria-label={title}>
      <header className="dash-card__head"><div><h3>{title} {demo && <DemoBadge language={language} />}</h3>{description && <p className="dash-card__desc">{description}</p>}</div></header>
      <ul className="fd-bars">
        {items.map((i) => (
          <li key={i.key}>
            <span>{i.label}</span>
            <span className="fd-bars__track" aria-hidden="true"><i style={{ width: `${Math.round(i.weight * 100)}%` }} /></span>
            <b>{pct(i.weight * 100, language)}</b>
          </li>
        ))}
      </ul>
    </article>
  );
}

function RecentTrades({ language }: { language: Lang }) {
  const t = fc[language];
  const summary = useMemo(() => summarizeTrades(demoTrades, demoFunds), []);
  const names = new Map(demoFunds.map((f) => [f.id, f.name]));
  return (
    <article className="dash-card fd-trades" aria-label={t.trades}>
      <header className="dash-card__head"><div><h3>{t.trades} <DemoBadge language={language} /></h3><p className="dash-card__desc">{t.tradesDesc}</p></div></header>
      {!summary.rows.length ? <p className="dash-state">{t.noTrades}</p> : (
        <>
          <p className="fd-sum"><span>{t.bought}: <b>{eur(summary.bought, language)}</b></span><span>{t.sold}: <b>{eur(summary.sold, language)}</b></span><span>{t.net}: <b>{signedEur(summary.net, language)}</b></span></p>
          <div className="fd-trades__scroll" role="region" aria-label={t.trades} tabIndex={0}>
            <table>
              <caption className="dash-sr">{t.trades}. {t.tradesDesc}</caption>
              <thead><tr><th scope="col">{t.month}</th><th scope="col">{language === "es" ? "Fondo" : "Fund"}</th><th scope="col">{t.side}</th><th scope="col" className="is-num">{t.units}</th><th scope="col" className="is-num">{t.price}</th><th scope="col" className="is-num">{t.amount}</th></tr></thead>
              <tbody>
                {summary.rows.map((r) => (
                  <tr key={r.id}>
                    <th scope="row">M{r.month}</th>
                    <td>{names.get(r.fundId)}</td>
                    <td>{r.side === "buy" ? t.buy : t.sell_} <DemoBadge language={language} label={language === "es" ? "SIMULADA" : "SIMULATED"} /></td>
                    <td className="is-num">{num(r.units, language, 0)}</td>
                    <td className="is-num">{eur(r.price, language, 2)}</td>
                    <td className="is-num">{eur(r.amount, language)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </article>
  );
}

/** Con la cartera CNMV la única «operación» es la compra DEMO supuesta de cada fondo al inicio de la serie. */
function InitialTrades({ p, language }: { p: DemoPortfolio; language: Lang }) {
  const t = fc[language];
  const es = language === "es";
  const total = p.positions.reduce((s, r) => s + r.cost, 0);
  return (
    <article className="dash-card fd-trades" aria-label={t.trades}>
      <header className="dash-card__head"><div><h3>{t.trades}</h3><p className="dash-card__desc">{es ? "Compra única SIMULADA de cada fondo al inicio de la serie (supuesto de la cartera DEMO); sin comisiones ni impuestos." : "Single SIMULATED purchase of each fund at the start of the series (DEMO portfolio assumption); no fees or taxes."}</p></div></header>
      <p className="fd-sum"><span>{t.bought}: <b>{eur(total, language)}</b></span><span>{t.sold}: <b>{eur(0, language)}</b></span></p>
      <div className="fd-trades__scroll" role="region" aria-label={t.trades} tabIndex={0}>
        <table>
          <caption className="dash-sr">{t.trades}</caption>
          <thead><tr><th scope="col">{t.month}</th><th scope="col">{es ? "Fondo" : "Fund"}</th><th scope="col">{t.side}</th><th scope="col" className="is-num">{t.units}</th><th scope="col" className="is-num">{t.price}</th><th scope="col" className="is-num">{t.amount}</th></tr></thead>
          <tbody>{p.positions.map((r) => (
            <tr key={r.fund.id}>
              <th scope="row">{monthLabel(p.labels[0] ?? "", language)}</th><td>{r.fund.name}</td><td>{t.buy}</td>
              <td className="is-num">{num(r.units, language, 2)}</td><td className="is-num">{eur(r.fund.startPrice, language, 2)}</td><td className="is-num">{eur(r.cost, language)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </article>
  );
}

function Advanced(props: FundsDashboardProps & { p: DemoPortfolio }) {
  const { p, language, onExplore, onSimulate, onSell } = props;
  const t = fc[language];
  const per = usePeriod(p, ["3", "6", "12", "24", "all"], "all");
  const [assetClass, setAssetClass] = useState("all");
  const [query, setQuery] = useState("");
  const monthly = useMemo(() => returnsFromSeries(p.valueSeries), [p]);
  const matrix = useMemo(() => monthlyReturnMatrix(monthly), [monthly]);
  const bw = bestWorstMonth(monthly);
  const positive = positiveMonthsPct(monthly);
  const change12 = changePct(p.valueSeries, 12);
  const excess12 = excessReturnPct(p.valueSeries, p.benchmarkSeries, 12);
  const rf = pct(p.riskFreeAnnualPct, language, 1);
  const rows = filterPositions(p.positions, { assetClass, query });
  const classes = [...new Set(p.positions.map((r) => r.fund.assetClass))];
  const id = useId();
  return (
    <>
      <KpiRow label={t.kpis}>
        <KpiCard label={t.value} icon={Wallet} value={eur(p.totalValue, language)} language={language} />
        <KpiCard label={t.result} icon={BarChart3} value={signedEur(p.pnlAmount, language)} delta={p.pnlPercent} language={language} />
        <KpiCard label={t.change12} icon={Activity} value={change12 == null ? t.na : signedPct(change12, language)} language={language} />
        <KpiCard label={t.excess} icon={Layers} value={excess12 == null ? t.na : `${num(excess12, language, 2)} ${t.pp}`} language={language} />
        <KpiCard label={t.volatility} icon={Gauge} value={p.volatilityPct == null ? t.na : pct(p.volatilityPct, language)} language={language} />
        <KpiCard label={t.maxDd} icon={TrendingDown} value={p.maxDrawdownPct == null ? t.na : signedPct(p.maxDrawdownPct, language)} language={language} />
        <KpiCard label={t.sharpe} icon={Percent} value={p.sharpe == null ? t.na : num(p.sharpe, language, 2)} caption={t.sharpeCaption(rf)} language={language} />
        <KpiCard label={t.equity} icon={Layers} value={p.equityExposure == null ? t.na : pct(p.equityExposure * 100, language)} caption={t.equityCaption} language={language} />
        <KpiCard label={t.risk} icon={ShieldAlert} value={p.averageRisk == null ? t.na : `${num(p.averageRisk, language, 1)} / 7`} language={language} />
        <KpiCard label={t.positiveMonths} value={positive == null ? t.na : pct(positive, language, 0)} language={language}
          caption={bw ? `${t.best}: ${signedPct(bw.best.value, language)} (${monthLabel(p.labels[bw.best.index + 1] ?? "", language)}) · ${t.worst}: ${signedPct(bw.worst.value, language)} (${monthLabel(p.labels[bw.worst.index + 1] ?? "", language)})` : undefined} />
      </KpiRow>
      <MultiSeriesChart p={p} language={language} months={per.months} periodCtl={periodControl(language, per)} />
      <Heatmap rows={matrix} language={language} title={t.heatmap} description={p.real ? (p.real.heatmapFirstYear != null ? fr[language].heatmapDesc : fr[language].heatmapDescRel) : t.heatmapDesc} demo={false} firstYear={p.real?.heatmapFirstYear} />
      <div className="fd-grid fd-grid--2">
        <ExposureBars title={t.geo} description={t.geoDesc} items={p.byRegion.map((g) => ({ key: g.key, label: regionNames[language][g.key], weight: g.weight }))} language={language} demo={false} />
        <ExposureBars title={t.currency} items={p.byCurrency.map((g) => ({ key: g.key, label: currencyNames[language][g.key], weight: g.weight }))} language={language} demo={false} />
      </div>
      <Section title={t.positions} language={language} level={3} actions={<Actions language={language} onExplore={onExplore} onSimulate={onSimulate} onSell={onSell} />}>
        <div className="fd-filters">
          <label className="fd-field" htmlFor={`${id}-c`}>{t.filterClass}
            <select id={`${id}-c`} value={assetClass} onChange={(e) => setAssetClass(e.target.value)}>
              <option value="all">{t.filterAll}</option>
              {classes.map((c) => <option key={c} value={c}>{assetClassNames[language][c]}</option>)}
            </select>
          </label>
          <label className="fd-field" htmlFor={`${id}-q`}>{t.search}
            <input id={`${id}-q`} type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <p className="fd-count" role="status">{t.filtered(rows.length, p.positions.length)}</p>
        </div>
        <FundTable rows={rows} caption={t.table} language={language} />
      </Section>
      {p.real ? <InitialTrades p={p} language={language} /> : <RecentTrades language={language} />}
    </>
  );
}

/** Sección Fondos/Inversiones adaptada al nivel. Datos DEMO ficticios; sin operaciones reales. */
export default function FundsDashboard(props: FundsDashboardProps) {
  const { language, level, onExplore, onSimulate, onSell } = props;
  const t = fc[language];
  const p = useMemo(() => props.portfolio ?? buildDemoPortfolio(), [props.portfolio]);
  const real = p.real;
  const r = fr[language];
  const subtitle = real
    ? (level === "beginner" ? r.subtitleBeginner : level === "intermediate" ? r.subtitleIntermediate : r.subtitleAdvanced)
    : (level === "beginner" ? t.subtitleBeginner : level === "intermediate" ? t.subtitleIntermediate : t.subtitleAdvanced);
  return (
    <div className="fd">
      <h1 className="dash-sr">{language === "es" ? "Mi cartera" : "My portfolio"}</h1>
      <Section title={t.title} description={subtitle} demo language={language} actions={level !== "advanced" ? <Actions language={language} onExplore={onExplore} onSimulate={onSimulate} onSell={onSell} /> : undefined}>
        <details className="dash-origin fd__source">
          <summary>{r.sourceTitle}</summary>
          <p>{real ? r.notice : t.notice}</p>
          {real && <>
            <p><span className="fd-real">{r.sourceReal}</span> {r.sourceLine(real.sourceName, monthLabel(real.from, language), monthLabel(real.to, language), real.months)}</p>
            <p><a href={real.sourceUrl} target="_blank" rel="noopener noreferrer">{r.sourceLink}</a></p>
            <p>{r.demoLine}</p>
          </>}
          {level === "advanced" && <p>{r.sharpeAssumption}</p>}
          <p>{r.pastNote}</p>
        </details>
      </Section>
      {level === "beginner" && <Basic {...props} p={p} />}
      {level === "intermediate" && <Intermediate {...props} p={p} />}
      {level === "advanced" && <Advanced {...props} p={p} />}
    </div>
  );
}
