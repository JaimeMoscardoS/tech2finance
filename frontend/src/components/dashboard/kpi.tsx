import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { DemoBadge, DeltaChip } from "./basics.tsx";
import { dash, type Lang } from "./copy.ts";
import { directionOf } from "./format.ts";
import "./dashboard.css";

/** Fila de KPIs. Es una lista de descripción: cada KpiCard aporta dt + dd. */
export function KpiRow({ label, children }: { label: string; children: ReactNode }) {
  return <dl className="dash-kpis" aria-label={label}>{children}</dl>;
}

export function KpiCard({ label, value, delta, caption, icon: Icon, demo, language = "es", children }: {
  label: string; value: ReactNode; delta?: number | null; caption?: ReactNode; icon?: LucideIcon; demo?: boolean; language?: Lang; children?: ReactNode;
}) {
  return (
    <div className="dash-card dash-kpi">
      <dt className="dash-kpi__label">{Icon && <Icon size={16} aria-hidden="true" />}<span>{label}</span>{demo && <DemoBadge language={language} />}</dt>
      <dd className="dash-kpi__value">{value}</dd>
      {delta !== undefined && <dd className="dash-kpi__delta"><DeltaChip value={delta} language={language} /></dd>}
      {caption && <dd className="dash-kpi__caption">{caption}</dd>}
      {children && <dd className="dash-kpi__extra">{children}</dd>}
    </div>
  );
}

/** Tarjeta con valor y minigráfica de tendencia (SVG; el valor y la variación van en texto). */
export function SparkCard({ label, value, delta, points, language = "es", demo }: { label: string; value: ReactNode; delta: number | null; points: readonly number[]; language?: Lang; demo?: boolean }) {
  const min = Math.min(...points), max = Math.max(...points), span = max - min || 1;
  const w = 100, h = 32;
  const coords = points.map((p, i) => `${points.length > 1 ? (i / (points.length - 1)) * w : 0},${h - 3 - ((p - min) / span) * (h - 6)}`);
  const dir = directionOf(delta);
  return (
    <article className="dash-card dash-spark" aria-label={label}>
      <header><h3>{label}</h3>{demo && <DemoBadge language={language} />}</header>
      <p className="dash-spark__value">{value}</p>
      <div className="dash-spark__foot">
        <DeltaChip value={delta} language={language} />
        {points.length > 1 && (
          <svg className={`dash-spark__line dash-spark__line--${dir}`} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <polyline points={coords.join(" ")} fill="none" vectorEffect="non-scaling-stroke" />
          </svg>
        )}
      </div>
    </article>
  );
}
