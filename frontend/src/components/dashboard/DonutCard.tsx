import { useId } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { DemoBadge } from "./basics.tsx";
import { type Lang } from "./copy.ts";
import { pct } from "./format.ts";
import { usePrefersReducedMotion } from "./useReducedMotion.ts";
import "./dashboard.css";

export type DonutSlice = { id: string; label: string; weight: number; detail?: string };

/** Rellenos con trama para no depender solo del color (--cat-1..6). */
function Patterns({ id }: { id: string }) {
  const cover = { stroke: "var(--surface)", strokeWidth: 1.6, opacity: 0.7 } as const;
  const base = (n: number) => <rect width="8" height="8" fill={`var(--cat-${n})`} />;
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" className="dash-patterns">
      <defs>
        <pattern id={`${id}-1`} width="8" height="8" patternUnits="userSpaceOnUse">{base(1)}</pattern>
        <pattern id={`${id}-2`} width="8" height="8" patternUnits="userSpaceOnUse">{base(2)}<path d="M-2 2 L2 -2 M0 8 L8 0 M6 10 L10 6" {...cover} /></pattern>
        <pattern id={`${id}-3`} width="8" height="8" patternUnits="userSpaceOnUse">{base(3)}<circle cx="2" cy="2" r="1.1" fill="var(--surface)" opacity="0.8" /><circle cx="6" cy="6" r="1.1" fill="var(--surface)" opacity="0.8" /></pattern>
        <pattern id={`${id}-4`} width="8" height="8" patternUnits="userSpaceOnUse">{base(4)}<path d="M0 4 H8" {...cover} /></pattern>
        <pattern id={`${id}-5`} width="8" height="8" patternUnits="userSpaceOnUse">{base(5)}<path d="M4 0 V8" {...cover} /></pattern>
        <pattern id={`${id}-6`} width="8" height="8" patternUnits="userSpaceOnUse">{base(6)}<path d="M0 0 L8 8 M8 0 L0 8" {...cover} strokeWidth={1.2} /></pattern>
      </defs>
    </svg>
  );
}

export function DonutCard({ title, slices, centerLabel, centerValue, demo, language = "es", description }: {
  title: string; slices: readonly DonutSlice[]; centerLabel?: string; centerValue?: string; demo?: boolean; language?: Lang; description?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const reduced = usePrefersReducedMotion();
  const clean = slices.filter((s) => s.weight > 0);
  const summary = clean.map((s) => `${s.label} ${pct(s.weight * 100, language)}`).join(", ");
  return (
    <article className="dash-card dash-donut" aria-label={title}>
      <header className="dash-card__head"><h3>{title}</h3>{demo && <DemoBadge language={language} />}</header>
      {description && <p className="dash-card__desc">{description}</p>}
      <Patterns id={uid} />
      <div className="dash-donut__body">
        <div className="dash-donut__chart" role="img" aria-label={`${title}: ${summary}`}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie data={clean} dataKey="weight" nameKey="label" innerRadius="62%" outerRadius="94%" paddingAngle={2} stroke="var(--surface)" strokeWidth={2} startAngle={90} endAngle={-270} isAnimationActive={!reduced}>
                {clean.map((s, i) => <Cell key={s.id} fill={`url(#${uid}-${(i % 6) + 1})`} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {(centerValue || centerLabel) && <div className="dash-donut__center" aria-hidden="true"><strong>{centerValue}</strong><span>{centerLabel}</span></div>}
        </div>
        <ul className="dash-donut__legend">
          {clean.map((s, i) => (
            <li key={s.id}>
              <svg width="16" height="16" viewBox="0 0 8 8" aria-hidden="true" focusable="false"><rect width="8" height="8" rx="1.5" fill={`url(#${uid}-${(i % 6) + 1})`} /></svg>
              <span className="dash-donut__name">{s.label}{s.detail && <small>{s.detail}</small>}</span>
              <span className="dash-donut__pct">{pct(s.weight * 100, language)}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
