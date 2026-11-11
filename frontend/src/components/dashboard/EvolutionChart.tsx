import { useId, type ReactNode } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DemoBadge, DeltaChip } from "./basics.tsx";
import { dash, type Lang } from "./copy.ts";
import { compactEur, eur } from "./format.ts";
import { usePrefersReducedMotion } from "./useReducedMotion.ts";
import "./dashboard.css";

export type EvolutionPoint = { label: string; value: number; compare?: number };

/** Gráfica de evolución: área degradada (serie principal), línea discontinua opcional (comparación), tooltip y último valor visible. */
export function EvolutionChart({ title, data, seriesName, compareName, changePct, periodControl, demo, language = "es", description, loading, error }: {
  title: string; data: readonly EvolutionPoint[]; seriesName: string; compareName?: string; changePct?: number | null;
  periodControl?: ReactNode; demo?: boolean; language?: Lang; description?: string; loading?: boolean; error?: string;
}) {
  const t = dash[language];
  const uid = useId().replace(/:/g, "");
  const reduced = usePrefersReducedMotion();
  const hasCompare = !!compareName && data.some((d) => d.compare != null);
  const last = data[data.length - 1];
  const ticks = data.length <= 6 ? data.map((d) => d.label) : Array.from({ length: 6 }, (_, i) => data[Math.round((i * (data.length - 1)) / 5)].label);
  return (
    <article className="dash-card dash-evo" aria-labelledby={`${uid}-t`}>
      <header className="dash-card__head">
        <div>
          <h3 id={`${uid}-t`}>{title}{demo && <> <DemoBadge language={language} /></>}</h3>
          {description && <p className="dash-card__desc">{description}</p>}
        </div>
        {periodControl}
      </header>
      {error ? <p className="dash-state dash-state--error" role="alert">{error}</p>
        : loading ? <p className="dash-state" role="status">{t.loading}</p>
        : !data.length ? <p className="dash-state">{t.empty}</p>
        : (
          <>
            <div className="dash-evo__last">
              <span>{t.last}</span><strong>{eur(last.value, language)}</strong>
              {changePct !== undefined && <DeltaChip value={changePct} language={language} />}
            </div>
            <ul className="dash-evo__legend" aria-label={language === "es" ? "Leyenda" : "Legend"}>
              <li><i className="dash-evo__key dash-evo__key--main" aria-hidden="true" />{seriesName}</li>
              {hasCompare && <li><i className="dash-evo__key dash-evo__key--cmp" aria-hidden="true" />{compareName}</li>}
            </ul>
            <div className="dash-evo__plot">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <ComposedChart data={data as EvolutionPoint[]} accessibilityLayer margin={{ top: 12, right: 14, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-line)" stopOpacity={0.38} />
                      <stop offset="100%" stopColor="var(--chart-line)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="2 4" />
                  <XAxis dataKey="label" ticks={ticks} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} minTickGap={12} />
                  <YAxis width={60} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} tickFormatter={(n: number) => compactEur(n, language)} domain={["auto", "auto"]} />
                  <Tooltip cursor={{ stroke: "var(--muted)", strokeDasharray: "3 3" }} content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0].payload as EvolutionPoint;
                    return (
                      <div className="dash-tip">
                        <strong>{label}</strong>
                        <div><i className="dash-evo__key dash-evo__key--main" aria-hidden="true" />{seriesName}: <b>{eur(row.value, language)}</b></div>
                        {hasCompare && row.compare != null && <div><i className="dash-evo__key dash-evo__key--cmp" aria-hidden="true" />{compareName}: <b>{eur(row.compare, language)}</b></div>}
                      </div>
                    );
                  }} />
                  <Area type="monotone" dataKey="value" name={seriesName} stroke="var(--chart-line)" strokeWidth={2.4} fill={`url(#${uid}-g)`} isAnimationActive={!reduced} activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2, fill: "var(--chart-line)" }} />
                  {hasCompare && <Line type="monotone" dataKey="compare" name={compareName} stroke="var(--chart-2)" strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={!reduced} />}
                  <ReferenceDot x={last.label} y={last.value} r={4.5} fill="var(--chart-line)" stroke="var(--surface)" strokeWidth={2} ifOverflow="visible" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <details className="dash-evo__data">
              <summary>{t.showData}</summary>
              <div className="dash-funds__scroll" role="region" aria-label={t.chartData} tabIndex={0}>
                <table>
                  <caption className="dash-sr">{t.chartData}</caption>
                  <thead><tr><th scope="col">{t.point}</th><th scope="col" className="is-num">{seriesName}</th>{hasCompare && <th scope="col" className="is-num">{compareName}</th>}</tr></thead>
                  <tbody>{data.map((d) => <tr key={d.label}><th scope="row">{d.label}</th><td className="is-num">{eur(d.value, language)}</td>{hasCompare && <td className="is-num">{d.compare != null ? eur(d.compare, language) : t.na}</td>}</tr>)}</tbody>
                </table>
              </div>
            </details>
          </>
        )}
    </article>
  );
}
