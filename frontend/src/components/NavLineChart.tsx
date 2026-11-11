import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PeriodSelector } from "./dashboard/index.ts";
import { monthLabel, num, signedPct } from "./dashboard/format.ts";
import { usePrefersReducedMotion } from "./dashboard/useReducedMotion.ts";

type Period = "12" | "36" | "all";
const MONTHS: Record<Exclude<Period, "all">, number> = { "12": 12, "36": 36 };

/**
 * Evolución compacta del valor liquidativo mensual (base 100 al inicio del periodo) con selector de periodo.
 * Sustituye en Explorar al gráfico de barras de una fila por mes. La tabla completa sigue en «Ver cifras».
 */
export default function NavLineChart({ rows, language, label }: { rows: readonly { date: string; nav: string }[]; language: "es" | "en"; label: string }) {
  const es = language === "es";
  const reduced = usePrefersReducedMotion();
  const [period, setPeriod] = useState<Period>("all");
  const n = period === "all" ? rows.length : Math.min(rows.length, MONTHS[period] + 1);
  const shown = rows.slice(rows.length - n);
  const base = Number(shown[0]?.nav ?? 1);
  const data = shown.map((r) => ({ label: r.date, value: (Number(r.nav) / base) * 100 }));
  const change = data.length > 1 ? data[data.length - 1].value - 100 : null;
  if (data.length < 2) return null;
  return (
    <div className="nav-line">
      <div className="nav-line__head">
        <p><strong>{change == null ? "" : signedPct(change, language)}</strong> {es ? `de ${monthLabel(shown[0].date, language)} a ${monthLabel(shown[shown.length - 1].date, language)}` : `from ${monthLabel(shown[0].date, language)} to ${monthLabel(shown[shown.length - 1].date, language)}`}</p>
        <PeriodSelector<Period> label={es ? "Periodo del gráfico" : "Chart period"} value={period} onChange={setPeriod}
          options={[{ id: "12", label: es ? "1A" : "1Y" }, { id: "36", label: es ? "3A" : "3Y" }, { id: "all", label: es ? "Máx" : "Max" }]} />
      </div>
      <div className="nav-line__plot" role="img" aria-label={`${label}. ${es ? "Valor liquidativo en base 100" : "Net asset value rebased to 100"}${change == null ? "" : `: ${signedPct(change, language)}`}.`}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={data} accessibilityLayer={false} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid, var(--hairline))" strokeDasharray="2 4" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} minTickGap={36} interval="preserveStartEnd" tickFormatter={(l: string) => monthLabel(l, language)} />
            <YAxis width={40} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} domain={["auto", "auto"]} tickFormatter={(v: number) => num(v, language, 0)} />
            <Tooltip cursor={{ stroke: "var(--muted)", strokeDasharray: "3 3" }} content={({ active, payload, label: l }) => {
              if (!active || !payload?.length) return null;
              const v = payload[0].payload as { value: number };
              return <div className="dash-tip"><strong>{monthLabel(String(l), language)}</strong><div>{es ? "Base 100" : "Base 100"}: <b>{num(v.value, language, 1)}</b></div></div>;
            }} />
            <Line type="monotone" dataKey="value" stroke="var(--chart-line, var(--accent))" strokeWidth={2.2} dot={false} isAnimationActive={!reduced} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
