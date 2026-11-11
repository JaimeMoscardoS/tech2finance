/**
 * PÁGINA TEMPORAL /componentes (fase 2 del rediseño). Muestra los componentes base con datos DEMO
 * y permite cambiar nivel, tema e idioma. No está enlazada en la navegación; se retira en la fase 6
 * (o antes, cuando la fase 3 use los componentes en el dashboard real).
 * Parámetros opcionales: ?level=beginner|intermediate|advanced&theme=light|dark&lang=es|en
 * No guarda nada en localStorage: no altera las preferencias de la aplicación.
 */
import { Activity, Gauge, PiggyBank, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AgentPanel, DemoBadge, DonutCard, EvolutionChart, FundTable, KpiCard, KpiRow, PeriodSelector, Section, SparkCard, StatusChip } from "../components/dashboard/index.ts";
import { assetClassNames, currencyNames, regionNames, type Lang } from "../components/dashboard/copy.ts";
import { eur, num, pct, signedEur, signedPct } from "../components/dashboard/format.ts";
import { DEMO_RETURNS_NOTE } from "../../../shared/mock/demo-portfolio.ts";
import { changePct, cumulativeFromReturns as cumulative, lastN } from "../dashboard-metrics.ts";
import { buildDemoPortfolio, deriveAgentFacts } from "../dashboard-portfolio.ts";
import { LEVELS, LEVEL_LABELS, THEMES, type Level, type Theme } from "../types/level.ts";

const PERIODS = [
  { id: "3m", label: "3M", points: 3 },
  { id: "6m", label: "6M", points: 6 },
  { id: "1y", label: "1A", points: 12 },
  { id: "3y", label: "3A", points: 36 },
] as const;
type PeriodId = (typeof PERIODS)[number]["id"];

function fromQuery<T extends string>(key: string, options: readonly T[], fallback: T): T {
  const v = new URLSearchParams(window.location.search).get(key);
  return options.includes(v as T) ? (v as T) : fallback;
}

export default function ComponentsShowcase() {
  const [level, setLevel] = useState<Level>(() => fromQuery("level", LEVELS, "beginner"));
  const [theme, setTheme] = useState<Theme>(() => fromQuery("theme", THEMES, "light"));
  const [language, setLanguage] = useState<Lang>(() => fromQuery("lang", ["es", "en"] as const, "es"));
  const [period, setPeriod] = useState<PeriodId>("1y");
  const es = language === "es";

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.level = level;
    root.dataset.theme = theme;
    root.lang = language;
    document.title = "Componentes (temporal) · Tech2Finance";
  }, [level, theme, language]);

  const portfolio = useMemo(() => buildDemoPortfolio(), []);
  const facts = useMemo(() => deriveAgentFacts(portfolio), [portfolio]);
  const count = PERIODS.find((p) => p.id === period)!.points + 1;
  const labels = lastN(portfolio.labels, count);
  const values = lastN(portfolio.valueSeries, count);
  const bench = lastN(portfolio.benchmarkSeries, count);
  const data = labels.map((label, i) => ({ label, value: values[i], compare: bench[i] }));
  const periodChange = changePct(values, values.length - 1);
  const t = (a: string, b: string) => (es ? a : b);

  return (
    <div className="showcase">
      <header className="showcase__bar">
        <div className="showcase__banner" role="note">
          <StatusChip tone="warning">{t("Página temporal", "Temporary page")}</StatusChip>
          <p>{t("Galería de componentes de la fase 2 con datos DEMO. Se retirará más adelante y no forma parte de la navegación.", "Phase 2 component gallery with DEMO data. It will be removed later and is not part of the navigation.")}</p>
        </div>
        <div className="showcase__controls">
          <fieldset><legend>{t("Nivel", "Level")}</legend>
            {LEVELS.map((l) => <button key={l} type="button" aria-pressed={level === l} onClick={() => setLevel(l)}>{LEVEL_LABELS[language][l]}</button>)}
          </fieldset>
          <fieldset><legend>{t("Tema", "Theme")}</legend>
            {THEMES.map((th) => <button key={th} type="button" aria-pressed={theme === th} onClick={() => setTheme(th)}>{th === "light" ? t("Claro", "Light") : t("Oscuro", "Dark")}</button>)}
          </fieldset>
          <fieldset><legend>{t("Idioma", "Language")}</legend>
            {(["es", "en"] as const).map((l) => <button key={l} type="button" aria-pressed={language === l} onClick={() => setLanguage(l)}>{l.toUpperCase()}</button>)}
          </fieldset>
        </div>
      </header>

      <main className="showcase__main" id="main">
        <h1>{t("Componentes del dashboard", "Dashboard components")} <DemoBadge language={language} /></h1>
        <p className="showcase__lead">{t("Cartera ficticia: valores, pesos y métricas calculados por código a partir de entradas de ejemplo. Sin operaciones reales.", "Fictional portfolio: values, weights and metrics computed by code from sample inputs. No real transactions.")}</p>
        <p className="showcase__lead" data-testid="demo-returns-note"><DemoBadge language={language} /> {DEMO_RETURNS_NOTE[language]}</p>

        <Section title={t("KpiRow y KpiCard", "KpiRow and KpiCard")} language={language} demo>
          <KpiRow label={t("Indicadores clave", "Key indicators")}>
            <KpiCard icon={PiggyBank} label={t("Valor de la cartera", "Portfolio value")} value={eur(portfolio.totalValue, language)} caption={t(`Invertido: ${eur(portfolio.totalCost, language)}`, `Invested: ${eur(portfolio.totalCost, language)}`)} language={language} />
            <KpiCard icon={TrendingUp} label={t("Resultado", "Result")} value={signedEur(portfolio.pnlAmount, language)} delta={portfolio.pnlPercent} language={language} />
            <KpiCard icon={Gauge} label={t("Riesgo medio de productos", "Average product risk")} value={portfolio.averageRisk == null ? t("n. d.", "n/a") : `${num(portfolio.averageRisk, language)} / 7`} caption={t("Media ponderada, ficticia", "Weighted average, fictional")} language={language} />
            <KpiCard icon={Activity} label={t("Volatilidad anualizada", "Annualised volatility")} value={portfolio.volatilityPct == null ? "n. d." : pct(portfolio.volatilityPct, language)} caption={t("De 36 meses ficticios", "From 36 fictional months")} language={language} />
          </KpiRow>
        </Section>

        <Section title={t("SparkCard", "SparkCard")} language={language} demo>
          <div className="showcase__grid showcase__grid--3">
            {portfolio.positions.slice(1, 4).map((r) => {
              const idx = demoSeries(portfolio, r.fund.id);
              return <SparkCard key={r.fund.id} label={r.fund.name} value={eur(r.price, language, 2)} delta={changePct(idx, 12)} points={lastN(idx, 13)} language={language} demo />;
            })}
          </div>
        </Section>

        <Section title={t("EvolutionChart y PeriodSelector", "EvolutionChart and PeriodSelector")} language={language}>
          <EvolutionChart
            title={t("Evolución de la cartera", "Portfolio evolution")}
            description={t("Serie ficticia; la línea discontinua es un índice de referencia ficticio reescalado al mismo punto de partida.", "Fictional series; the dashed line is a fictional benchmark rescaled to the same starting point.")}
            data={data} seriesName={t("Cartera DEMO", "DEMO portfolio")} compareName={t("Índice de referencia DEMO", "DEMO benchmark")} changePct={periodChange} demo language={language}
            periodControl={<PeriodSelector label={t("Periodo del gráfico", "Chart period")} options={PERIODS} value={period} onChange={setPeriod} />}
          />
        </Section>

        <Section title={t("DonutCard", "DonutCard")} language={language} demo>
          <div className="showcase__grid showcase__grid--3">
            <DonutCard title={t("Por tipo de activo", "By asset class")} language={language} centerValue={eur(portfolio.totalValue, language)} centerLabel={t("total", "total")} slices={portfolio.byAssetClass.map((g) => ({ id: g.key, label: assetClassNames[language][g.key], weight: g.weight }))} />
            <DonutCard title={t("Por región", "By region")} language={language} slices={portfolio.byRegion.map((g) => ({ id: g.key, label: regionNames[language][g.key], weight: g.weight }))} />
            <DonutCard title={t("Por divisa", "By currency")} language={language} slices={portfolio.byCurrency.map((g) => ({ id: g.key, label: currencyNames[language][g.key], weight: g.weight }))} />
          </div>
        </Section>

        <Section title={t("FundTable", "FundTable")} language={language}>
          <FundTable rows={portfolio.positions} language={language} caption={t("Posiciones de la cartera DEMO", "DEMO portfolio positions")} demo />
        </Section>

        <Section title={t("Estados de carga, error y vacío", "Loading, error and empty states")} language={language}>
          <div className="showcase__grid showcase__grid--3">
            <FundTable rows={[]} loading language={language} caption={t("Cargando", "Loading")} />
            <FundTable rows={[]} error={t("No se pudieron cargar los datos de ejemplo.", "Sample data could not be loaded.")} language={language} caption={t("Error", "Error")} />
            <EvolutionChart title={t("Sin datos", "No data")} data={[]} seriesName="-" language={language} />
          </div>
        </Section>

        <Section title={t("StatusChip", "StatusChip")} language={language}>
          <div className="showcase__chips">
            <StatusChip tone="positive">{signedPct(1.32, language)}</StatusChip>
            <StatusChip tone="negative">{signedPct(-2.4, language)}</StatusChip>
            <StatusChip tone="neutral">{t("Sin cambio", "No change")}</StatusChip>
            <StatusChip tone="warning">{t("Dato ficticio", "Fictional data")}</StatusChip>
            <StatusChip tone="info">{t("Información", "Information")}</StatusChip>
          </div>
        </Section>

        <Section title={t("AgentPanel (según el nivel activo)", "AgentPanel (by active level)")} description={t("Cambia el nivel arriba para ver resumen, observaciones o escenarios.", "Change the level above to see summary, observations or scenarios.")} language={language}>
          <AgentPanel level={level} facts={facts} language={language} />
        </Section>
      </main>
    </div>
  );
}

function demoSeries(p: ReturnType<typeof buildDemoPortfolio>, fundId: string): number[] {
  // Serie de precios del fondo calculada por el mismo código que la cartera.
  const row = p.positions.find((r) => r.fund.id === fundId)!;
  return cumulative(row.fund.startPrice, row.fund.monthlyReturnsPct);
}
