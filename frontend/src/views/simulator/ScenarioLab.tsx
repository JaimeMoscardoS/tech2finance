import { ArrowRight } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { EvolutionChart, KpiCard, KpiRow, PeriodSelector, Section, type EvolutionPoint } from "../../components/dashboard/index.ts";
import type { Lang } from "../../components/dashboard/copy.ts";
import { eur, pct, signedEur, signedPct } from "../../components/dashboard/format.ts";
import { MAX_YEARS, SCENARIOS, compareHorizons, runAll, runScenario, validateParams, type ScenarioDef, type SimParams } from "../../game-scenarios.ts";
import type { Level } from "../../types/level.ts";
import "./simulator.css";

type Bi = { es: string; en: string };
const names: Record<string, { name: Bi; desc: Bi }> = {
  prudent: { name: { es: "Prudente", en: "Cautious" }, desc: { es: "Supone 2 % bruto anual, coste 0,45 %", en: "Assumes 2% gross a year, 0.45% cost" } },
  balanced: { name: { es: "Equilibrado", en: "Balanced" }, desc: { es: "Supone 4 % bruto anual, coste 1,1 %", en: "Assumes 4% gross a year, 1.1% cost" } },
  dynamic: { name: { es: "Dinámico", en: "Dynamic" }, desc: { es: "Supone 6 % bruto anual, coste 0,9 %", en: "Assumes 6% gross a year, 0.9% cost" } },
  cycle: { name: { es: "Ciclo con caídas", en: "Cycle with falls" }, desc: { es: "Ciclo mensual ficticio de 12 meses que incluye caídas; coste 0,9 %", en: "Fictional 12-month cycle including falls; 0.9% cost" } },
};

const tx = {
  es: {
    title: "Escenarios ilustrativos", subtitle: "Simulación ilustrativa con supuestos ficticios (DEMO). No predice ni garantiza rendimientos y no usa datos reales.",
    guided: "Elige cuánto ahorrarías al mes", guidedDesc: "Inversión inicial de 1.000 € durante 5 años en un escenario equilibrado ilustrativo.", monthlyGroup: "Ahorro al mes",
    params: "Parámetros del escenario", initial: "Capital inicial (€)", monthly: "Ahorro mensual (€)", years: "Años", scenario: "Escenario", yearsUnit: (n: number) => `${n} ${n === 1 ? "año" : "años"}`,
    contributed: "Aportado", finalValue: "Valor final ilustrativo", result: "Resultado", resultPct: "Rentabilidad simple", costs: "Costes restados (aprox.)",
    chart: "Evolución ilustrativa", year: (n: number) => `Año ${n}`, series: "Valor simulado", compare: "Lo aportado",
    horizons: "Comparación de periodos", horizonsDesc: "El mismo escenario evaluado a distintos plazos.", horizon: "Plazo", value: "Valor",
    scenarios: "Escenarios múltiples", scenariosDesc: "Mismos importes y plazo bajo distintos supuestos.", scenarioTable: "Tabla de resultados por escenario", assumptions: "Supuestos",
    conditions: "Condiciones y costes", conditionsList: [
      "Los rendimientos son supuestos de la demo, no datos de mercado ni previsiones; los resultados reales pueden ser distintos, incluidas pérdidas.",
      "Las aportaciones se hacen al inicio de cada mes y después se aplica el rendimiento mensual.",
      "El coste anual se descuenta de forma proporcional cada mes. No se incluyen impuestos, comisiones de compra o venta ni inflación.",
      "El ciclo con caídas repite 12 rendimientos mensuales ficticios; no corresponde a ningún mercado.",
    ],
    explain: "Explícame esta simulación", compareTitle: "Comparar escenarios y plazos", compareDesc: "Mismos importes con supuestos ficticios DEMO, a distintos plazos.", fullTitle: "Escenarios, plazos y costes", fullDesc: "Cuatro escenarios ficticios DEMO con costes y condiciones.",
    invalidAmount: "Introduce importes entre 0 y 1.000.000.000 €.", invalidYears: `Indica un número entero de años entre 1 y ${MAX_YEARS}.`, invalidZero: "Indica un importe inicial o una aportación mensual mayores que cero.",
    note: "Ilustrativo: no es una predicción.", inChart: "en el gráfico", pickScenario: "Escenario del gráfico", errorChart: "No se puede calcular con estos valores.",
  },
  en: {
    title: "Illustrative scenarios", subtitle: "Illustrative simulation with fictional assumptions (DEMO). It neither predicts nor guarantees returns and uses no real data.",
    guided: "Choose how much you would save each month", guidedDesc: "Initial investment of 1,000 € over 5 years in an illustrative balanced scenario.", monthlyGroup: "Saving per month",
    params: "Scenario parameters", initial: "Starting capital (€)", monthly: "Monthly saving (€)", years: "Years", scenario: "Scenario", yearsUnit: (n: number) => `${n} ${n === 1 ? "year" : "years"}`,
    contributed: "Contributed", finalValue: "Illustrative final value", result: "Result", resultPct: "Simple return", costs: "Costs deducted (approx.)",
    chart: "Illustrative evolution", year: (n: number) => `Year ${n}`, series: "Simulated value", compare: "Amount contributed",
    horizons: "Period comparison", horizonsDesc: "The same scenario evaluated over different terms.", horizon: "Term", value: "Value",
    scenarios: "Multiple scenarios", scenariosDesc: "Same amounts and term under different assumptions.", scenarioTable: "Results table by scenario", assumptions: "Assumptions",
    conditions: "Conditions and costs", conditionsList: [
      "Returns are demo assumptions, not market data or forecasts; real results may differ, including losses.",
      "Contributions are made at the start of each month and the monthly return is applied afterwards.",
      "The annual cost is deducted proportionally each month. Taxes, buy or sell fees and inflation are not included.",
      "The cycle with falls repeats 12 fictional monthly returns; it corresponds to no market.",
    ],
    explain: "Explain this simulation", compareTitle: "Compare scenarios and terms", compareDesc: "Same amounts under fictional DEMO assumptions, over different terms.", fullTitle: "Scenarios, terms and costs", fullDesc: "Four fictional DEMO scenarios with costs and conditions.",
    invalidAmount: "Enter amounts between 0 and 1,000,000,000 €.", invalidYears: `Enter a whole number of years between 1 and ${MAX_YEARS}.`, invalidZero: "Enter an initial amount or a monthly contribution greater than zero.",
    note: "Illustrative: not a prediction.", inChart: "in the chart", pickScenario: "Chart scenario", errorChart: "Cannot compute with these values.",
  },
} as const;

const BALANCED = SCENARIOS.find((s) => s.id === "balanced") as ScenarioDef;
const toNum = (s: string) => (s.trim() === "" ? NaN : Number(s.replace(",", ".")));

function chartData(r: ReturnType<typeof runScenario>, label: (n: number) => string): EvolutionPoint[] {
  return r.yearly.map((y) => ({ label: label(y.year), value: y.value, compare: y.contributed }));
}

export default function ScenarioLab({ language, level, onExplain }: { language: Lang; level: Level; onExplain?: () => void }) {
  const t = tx[language];
  const uid = useId();
  const [monthlyChoice, setMonthlyChoice] = useState("100");
  const [initial, setInitial] = useState("1000");
  const [monthly, setMonthly] = useState("100");
  const [years, setYears] = useState("5");
  const [scenarioId, setScenarioId] = useState("balanced");

  const params: SimParams = level === "beginner"
    ? { initial: 1000, monthly: Number(monthlyChoice), years: 5 }
    : { initial: toNum(initial), monthly: toNum(monthly), years: toNum(years) };
  const err = validateParams(params);
  const errText = err === "amount" ? t.invalidAmount : err === "years" ? t.invalidYears : err === "zero" ? t.invalidZero : null;
  const errId = `${uid}-err`;
  const amountBad = err === "amount" || err === "zero";
  const def = level === "beginner" ? BALANCED : (SCENARIOS.find((s) => s.id === scenarioId) ?? BALANCED);

  const computed = useMemo(() => {
    if (validateParams(params)) return null;
    try {
      return {
        main: runScenario(params, def),
        horizons: level === "beginner" ? [] : compareHorizons(params, def, [1, 3, 5, 10]),
        all: level === "advanced" ? runAll(params) : [],
      };
    } catch { return null; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.initial, params.monthly, params.years, def, level]);

  const main = computed?.main;
  const kpis = main && (
    <KpiRow label={t.result}>
      <KpiCard label={t.contributed} value={eur(main.sim.contributed, language)} language={language} />
      <KpiCard label={t.finalValue} value={eur(main.sim.value, language)} caption={t.note} language={language} />
      <KpiCard label={t.result} value={signedEur(main.sim.profit, language)} delta={main.sim.simpleReturnPercent} language={language} />
      {level !== "beginner" && <KpiCard label={t.costs} value={eur(main.costEur, language)} language={language} />}
    </KpiRow>
  );

  const chart = (
    <EvolutionChart
      title={t.chart} description={`${names[def.id].name[language]}: ${names[def.id].desc[language]}`}
      data={main ? chartData(main, t.year) : []} seriesName={t.series} compareName={t.compare}
      changePct={main?.sim.simpleReturnPercent ?? null} demo language={language}
      error={errText ?? (!main ? t.errorChart : undefined)} errorAlert={!errText} headingLevel={3}
    />
  );

  const monthlyOptions = [50, 100, 200].map((n) => ({ id: String(n), label: eur(n, language) }));

  const form = (
    <form className="dash-card sim-form" onSubmit={(e) => e.preventDefault()} noValidate aria-label={t.params}>
      <h3>{t.params}</h3>
      <div className="sim-form__grid">
        <label htmlFor={`${uid}-i`}>{t.initial}<input id={`${uid}-i`} type="number" inputMode="decimal" min={0} step="any" value={initial} onChange={(e) => setInitial(e.target.value)} aria-invalid={amountBad} aria-describedby={amountBad ? errId : undefined} /></label>
        <label htmlFor={`${uid}-m`}>{t.monthly}<input id={`${uid}-m`} type="number" inputMode="decimal" min={0} step="any" value={monthly} onChange={(e) => setMonthly(e.target.value)} aria-invalid={amountBad} aria-describedby={amountBad ? errId : undefined} /></label>
        <label htmlFor={`${uid}-y`}>{t.years}<input id={`${uid}-y`} type="number" inputMode="numeric" min={1} max={MAX_YEARS} step={1} value={years} onChange={(e) => setYears(e.target.value)} aria-invalid={err === "years"} aria-describedby={err === "years" ? errId : undefined} /></label>
        <label htmlFor={`${uid}-s`}>{t.scenario}
          <select id={`${uid}-s`} value={scenarioId} onChange={(e) => setScenarioId(e.target.value)}>
            {SCENARIOS.map((s) => <option key={s.id} value={s.id}>{names[s.id].name[language]}</option>)}
          </select>
        </label>
      </div>
      {errText && <p className="sim-error" id={errId} role="alert">{errText}</p>}
    </form>
  );

  return (
    <div className={`sim sim--${level}`}>
      {level === "beginner" && (
        <Section title={t.guided} description={t.guidedDesc} demo language={language}
          actions={<PeriodSelector label={t.monthlyGroup} options={monthlyOptions} value={monthlyChoice} onChange={setMonthlyChoice} />}>
          {kpis}
          {chart}
          {onExplain && <div className="sim-explain"><button type="button" className="button dark" onClick={onExplain}>{t.explain}<ArrowRight size={17} aria-hidden="true" /></button></div>}
        </Section>
      )}

      {level === "intermediate" && (
        <Section title={t.compareTitle} description={t.subtitle} demo language={language}>
          <div className="sim-stack">
          {form}
          {kpis}
          {chart}
          <Section level={3} title={t.horizons} description={t.horizonsDesc} language={language}>
            {computed && <HorizonTable rows={computed.horizons} language={language} t={t} />}
          </Section>
        </div></Section>
      )}

      {level === "advanced" && (
        <Section title={t.fullTitle} description={t.subtitle} demo language={language}>
          <div className="sim-stack">
          {form}
          {kpis}
          {chart}
          <Section level={3} title={t.scenarios} description={t.scenariosDesc} language={language}>
            {computed ? (
              <div className="dash-card">
                <div className="dash-funds__scroll" role="region" aria-label={t.scenarioTable} tabIndex={0}>
                  <table className="sim-table">
                    <caption className="dash-sr">{t.scenarioTable}</caption>
                    <thead><tr>
                      <th scope="col">{t.scenario}</th><th scope="col">{t.assumptions}</th><th scope="col" className="is-num">{t.contributed}</th><th scope="col" className="is-num">{t.finalValue}</th>
                      <th scope="col" className="is-num">{t.result}</th><th scope="col" className="is-num">{t.resultPct}</th><th scope="col" className="is-num">{t.costs}</th>
                    </tr></thead>
                    <tbody>{computed.all.map((r) => (
                      <tr key={r.def.id} className={r.def.id === def.id ? "is-current" : undefined} aria-current={r.def.id === def.id ? "true" : undefined}>
                        <th scope="row">{names[r.def.id].name[language]}{r.def.id === def.id && <small className="sim-current"> ({t.inChart})</small>}</th>
                        <td>{names[r.def.id].desc[language]}</td>
                        <td className="is-num">{eur(r.sim.contributed, language)}</td>
                        <td className="is-num">{eur(r.sim.value, language)}</td>
                        <td className="is-num">{signedEur(r.sim.profit, language)}</td>
                        <td className="is-num">{r.sim.simpleReturnPercent == null ? "–" : signedPct(r.sim.simpleReturnPercent, language, 1)}</td>
                        <td className="is-num">{eur(r.costEur, language)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            ) : <p className="dash-state">{errText ?? t.errorChart}</p>}
          </Section>
          <Section level={3} title={t.horizons} description={t.horizonsDesc} language={language}>
            {computed && <HorizonTable rows={computed.horizons} language={language} t={t} />}
          </Section>
          <Section level={3} title={t.conditions} language={language}>
            <ul className="dash-card sim-conditions">{t.conditionsList.map((c) => <li key={c}>{c}</li>)}</ul>
          </Section>
        </div></Section>
      )}
      {level !== "advanced" && <p className="sim-foot">{t.conditionsList[0]}</p>}
    </div>
  );
}

function HorizonTable({ rows, language, t }: { rows: ReturnType<typeof compareHorizons>; language: Lang; t: (typeof tx)[Lang] }) {
  return (
    <div className="dash-card">
      <div className="dash-funds__scroll" role="region" aria-label={t.horizons} tabIndex={0}>
        <table className="sim-table">
          <caption className="dash-sr">{t.horizons}</caption>
          <thead><tr><th scope="col">{t.horizon}</th><th scope="col" className="is-num">{t.contributed}</th><th scope="col" className="is-num">{t.value}</th><th scope="col" className="is-num">{t.result}</th><th scope="col" className="is-num">{t.resultPct}</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.years}>
              <th scope="row">{t.yearsUnit(r.years)}</th>
              <td className="is-num">{eur(r.contributed, language)}</td>
              <td className="is-num">{eur(r.value, language)}</td>
              <td className="is-num">{signedEur(r.profit, language)}</td>
              <td className="is-num">{r.simpleReturnPercent == null ? "–" : pct(r.simpleReturnPercent, language, 1)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
