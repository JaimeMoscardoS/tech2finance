import { lazy, Suspense } from "react";
import type { InvestmentChartProps } from "./components/InvestmentChart";

const Chart = lazy(() => import("./components/InvestmentChart"));

export default function LazyInvestmentChart(props: InvestmentChartProps) {
  return (
    <Suspense fallback={<p role="status">{props.language === "es" ? "Cargando gráfico…" : "Loading chart…"}</p>}>
      <Chart {...props} />
    </Suspense>
  );
}
