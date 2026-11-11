import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { DemoBadge } from "../../components/dashboard/index.ts";
import type { MatrixRow } from "../../funds-metrics.ts";
import { matrixMaxAbs } from "../../funds-metrics.ts";
import { fc, type Lang } from "./copy.ts";
import "./funds.css";

const locale = (l: Lang) => (l === "es" ? "es-ES" : "en-GB");
const fmt = (n: number, l: Lang, digits = 1) => new Intl.NumberFormat(locale(l), { minimumFractionDigits: digits, maximumFractionDigits: digits, signDisplay: "exceptZero" }).format(n);

/**
 * Mapa de calor de rentabilidad mensual. Accesible: es una tabla real con cabeceras, el valor con signo
 * está siempre visible en cada celda y se acompaña de flecha (▲/▼); el color solo refuerza la magnitud.
 */
export function Heatmap({ rows, language = "es", title, description, demo = true }: { rows: readonly MatrixRow[]; language?: Lang; title: string; description?: string; demo?: boolean }) {
  const t = fc[language];
  const max = matrixMaxAbs(rows) || 1;
  // Signo, icono y color según el valor redondeado que se muestra (evita «+0,0» con color de subida).
  const shown = (v: number) => Number(v.toFixed(1)) || 0;
  const cellStyle = (raw: number) => {
    const v = shown(raw);
    const intensity = Math.round(Math.min(1, Math.abs(v) / max) * 34) + 6;
    return { background: `color-mix(in srgb, var(${v > 0 ? "--positive" : v < 0 ? "--negative" : "--muted"}) ${intensity}%, var(--surface))` };
  };
  const Icon = (raw: number) => { const v = shown(raw); return v > 0 ? ArrowUp : v < 0 ? ArrowDown : Minus; };
  const months = Array.from({ length: rows[0]?.months.length ?? 12 }, (_, i) => i + 1);
  return (
    <article className="dash-card fd-heat" aria-label={title}>
      <header className="dash-card__head">
        <div>
          <h3>{title}{demo && <> <DemoBadge language={language} /></>}</h3>
          {description && <p className="dash-card__desc">{description}</p>}
        </div>
      </header>
      {!rows.length ? <p className="dash-state">{language === "es" ? "Sin datos para mostrar." : "No data to show."}</p> : (
        <>
          <div className="fd-heat__scroll" role="region" aria-label={title} tabIndex={0}>
            <table>
              <caption className="dash-sr">{title}. {description}</caption>
              <thead>
                <tr>
                  <th scope="col">{t.heatYear}</th>
                  {months.map((m) => <th scope="col" key={m} className="is-num">{language === "es" ? "Mes" : "Month"} {m}</th>)}
                  <th scope="col" className="is-num">{t.heatTotal}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.row}>
                    <th scope="row">{r.row + 1}</th>
                    {r.months.map((v, i) => {
                      if (v == null) return <td key={i} className="is-num is-empty"><span className="dash-sr">{t.heatCell(r.row + 1, i + 1)}: {t.na}</span><span aria-hidden="true">·</span></td>;
                      const I = Icon(v);
                      return (
                        <td key={i} className="is-num" style={cellStyle(v)}>
                          <span className="dash-sr">{t.heatCell(r.row + 1, i + 1)}: </span>
                          <I size={10} aria-hidden="true" />{fmt(v, language)}<span className="dash-sr"> %</span>
                        </td>
                      );
                    })}
                    <td className="is-num is-total">{r.total == null ? t.na : <>{fmt(r.total, language)} %</>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="fd-heat__legend">{t.heatLegend} {language === "es" ? "Valores en %." : "Values in %."}</p>
        </>
      )}
    </article>
  );
}
