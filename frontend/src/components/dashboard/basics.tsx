import { ArrowDownRight, ArrowUpRight, Info, Minus, TriangleAlert } from "lucide-react";
import { useId, type ReactNode } from "react";
import { dash, type Lang } from "./copy.ts";
import { directionOf, signedPct } from "./format.ts";
import "./dashboard.css";

/** Etiqueta DEMO: marca los datos y textos ficticios. */
export function DemoBadge({ language = "es", label, title }: { language?: Lang; label?: string; title?: string }) {
  return <span className="dash-demo" title={title ?? dash[language].demoLong}>{label ?? dash[language].demo}</span>;
}

export type Tone = "positive" | "negative" | "neutral" | "warning" | "info";
const toneIcon = { positive: ArrowUpRight, negative: ArrowDownRight, neutral: Minus, warning: TriangleAlert, info: Info } as const;

/** Chip de estado: siempre icono + texto, nunca solo color. */
export function StatusChip({ tone = "neutral", children, icon = true }: { tone?: Tone; children: ReactNode; icon?: boolean }) {
  const Icon = toneIcon[tone];
  return <span className={`dash-chip dash-chip--${tone}`}>{icon && <Icon size={14} aria-hidden="true" />}<span>{children}</span></span>;
}

/** Variación con signo y flecha; el texto lleva «Sube»/«Baja» para lectores de pantalla. */
export function DeltaChip({ value, language = "es", suffix }: { value: number | null; language?: Lang; suffix?: string }) {
  const t = dash[language];
  if (value == null) return <StatusChip tone="neutral">{t.na}</StatusChip>;
  const d = directionOf(value);
  const tone: Tone = d === "rise" ? "positive" : d === "fall" ? "negative" : "neutral";
  return <StatusChip tone={tone}><span className="dash-sr">{t[d]}: </span>{signedPct(value, language)}{suffix ? ` ${suffix}` : ""}</StatusChip>;
}

/** Barra de métrica en segmentos (p. ej. nivel de riesgo 1–7) con valor visible y role=meter. */
export function MetricBar({ label, value, max = 7, valueText, language = "es" }: { label: string; value: number; max?: number; valueText?: string; language?: Lang }) {
  const shown = Math.max(0, Math.min(max, value));
  const text = valueText ?? dash[language].riskOf(Math.round(shown), max);
  return (
    <div className="dash-meter">
      <span className="dash-meter__label">{label}</span>
      <div className="dash-meter__bar" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={shown} aria-valuetext={text}>
        {Array.from({ length: max }, (_, i) => <i key={i} className={i < Math.round(shown) ? "is-on" : ""} />)}
      </div>
      <span className="dash-meter__value">{text}</span>
    </div>
  );
}

/** Sección con encabezado, descripción y acciones. */
export function Section({ title, description, actions, demo, level = 2, children, language = "es" }: { title: string; description?: string; actions?: ReactNode; demo?: boolean; level?: 2 | 3; children: ReactNode; language?: Lang }) {
  const id = useId();
  const Heading = `h${level}` as "h2" | "h3";
  return (
    <section className="dash-section" aria-labelledby={id}>
      <header className="dash-section__head">
        <div>
          <Heading id={id}>{title}{demo && <> <DemoBadge language={language} /></>}</Heading>
          {description && <p>{description}</p>}
        </div>
        {actions && <div className="dash-section__actions">{actions}</div>}
      </header>
      {children}
    </section>
  );
}

/** Selector de periodo segmentado (botones con aria-pressed). */
export function PeriodSelector<T extends string>({ options, value, onChange, label }: { options: readonly { id: T; label: string }[]; value: T; onChange: (id: T) => void; label: string }) {
  return (
    <div className="dash-period" role="group" aria-label={label}>
      {options.map((o) => <button key={o.id} type="button" aria-pressed={o.id === value} onClick={() => onChange(o.id)}>{o.label}</button>)}
    </div>
  );
}
