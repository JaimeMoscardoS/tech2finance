import { useState } from "react";
import { ArrowRight, MessageCircle, Mic } from "lucide-react";
import type { Bank, Instrument, BankProfile } from "./catalog";
import { ProductCosts } from "./BankInfo";
import type { Language } from "./copy";
import type { Catalog } from "./server-api";
import "./funds-explorer.css";
import GoalsPanel from "./GoalsPanel";
import { annualPeriods } from "./annual-periods";
import { LEVELS, LEVEL_LABELS, type Level } from "./types/level";

type Props = {
  language: Language;
  level: Level;
  onLevel: (level: Level) => void;
  banks: Bank[];
  instruments: Instrument[];
  history: Catalog["annualHistory"];
  bankProfile?: BankProfile;
  selectedId: string;
  onSelect: (item: Instrument) => void;
  onPractice: (item: Instrument) => void;
  onVoice: () => void;
  onText: () => void;
};

export default function FundsExplorer({
  language,
  level,
  onLevel,
  banks,
  instruments,
  history,
  bankProfile,
  selectedId,
  onSelect,
  onPractice,
  onVoice,
  onText,
}: Props) {
  const es = language === "es";
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterHistory, setFilterHistory] = useState("all");
  const [sort, setSort] = useState("name");
  const [filterKnown, setFilterKnown] = useState("all");
  const [comparison, setComparison] = useState<Record<string, string[]>>({});
  const [chartSelection, setChartSelection] = useState<string[] | null>(null);
  // These educational examples are invented solely for the fictional demo funds.
  const examples: Record<string, { risk: number; years: number }> =
    {
      "demo-mixed": { risk: 3, years: 3 },
      "demo-equity": { risk: 5, years: 5 },
      "demo-fixed": { risk: 2, years: 2 },
    };

  const feeFor = (id: string): number | null => {
    const bps = bankProfile?.products.find((p) => p.instrumentId === id)?.fees.annualOngoingBps;
    return bps == null ? null : bps / 100;
  };
  const feeText = (id: string) => { const fee = feeFor(id); return fee === null ? (es ? "No definido" : "Not defined") : `${fee.toLocaleString(es ? "es-ES" : "en-GB", {minimumFractionDigits: 2, maximumFractionDigits: 2})} %`; };

  const funds = instruments.filter((i) => i.assetType === "fund");
  const availableBanks = banks.filter((b) =>
    funds.some((i) => i.bankId === b.id),
  );
  const bankId =
    funds.find((i) => i.instrumentId === selectedId)?.bankId ??
    availableBanks.find((b) => b.id === "demo")?.id ??
    availableBanks[0]?.id ??
    "";
  const bankFunds = funds.filter((i) => i.bankId === bankId);
  const compared =
    comparison[bankId] ?? bankFunds.slice(0, 3).map((i) => i.instrumentId);
  const selected =
    bankFunds.find((i) => i.instrumentId === selectedId) ?? bankFunds[0];
  const visibleFunds = bankFunds
    .filter(
      (i) =>
        i.name[language]
          .toLocaleLowerCase()
          .includes(search.toLocaleLowerCase()) &&
        (filterKnown === "all" ||
          (filterKnown === "known"
            ? i.dataStatus === "fictional" && !!examples[i.instrumentId]
            : !(i.dataStatus === "fictional" && !!examples[i.instrumentId]))) &&
        (filterType === "all" || i.assetClass === filterType) &&
        (filterHistory === "all" ||
          (filterHistory === "available"
            ? (i.dataStatus === "fictional" && !!i.returns?.length) ||
              (i.dataStatus === "annual_history" &&
                i.instrumentId === history.instrumentId &&
                history.returns.length > 0)
            : !(
                (i.dataStatus === "fictional" && !!i.returns?.length) ||
                (i.dataStatus === "annual_history" &&
                  i.instrumentId === history.instrumentId &&
                  history.returns.length > 0)
              ))),
    )
    .sort((a, b) =>
      sort === "type"
        ? a.assetClass.localeCompare(b.assetClass) ||
          a.name[language].localeCompare(b.name[language])
        : sort === "data"
          ? a.dataStatus.localeCompare(b.dataStatus) ||
            a.name[language].localeCompare(b.name[language])
          : ["risk", "fee", "horizon"].includes(sort)
            ? ((sort === "fee" ? feeFor(a.instrumentId) : sort === "risk" ? examples[a.instrumentId]?.risk : examples[a.instrumentId]?.years) ?? Infinity) -
              ((sort === "fee" ? feeFor(b.instrumentId) : sort === "risk" ? examples[b.instrumentId]?.risk : examples[b.instrumentId]?.years) ?? Infinity) ||
              a.name[language].localeCompare(b.name[language])
            : a.name[language].localeCompare(b.name[language]),
    );
  const type = (i: Instrument) =>
    ({
      mixed: es ? "Mixto" : "Mixed",
      equity: es ? "Renta variable" : "Equity",
      fixed: es ? "Renta fija" : "Fixed income",
      unknown: es ? "No disponible" : "Unavailable",
    })[i.assetClass] ?? (es ? "No disponible" : "Unavailable");
  const historyLabel = (i: Instrument) =>
    i.dataStatus === "fictional"
      ? es
        ? "Serie simulada mensual"
        : "Simulated monthly series"
      : i.dataStatus === "annual_history" &&
          i.instrumentId === history.instrumentId &&
          history.returns.length > 0
        ? es
          ? "Rentabilidades anuales publicadas"
          : "Published annual returns"
        : es
          ? "Histórico no disponible"
          : "History unavailable";
  const unavailable = es ? "No disponible" : "Unavailable";
  const percent = (n: number) =>
    new Intl.NumberFormat(es ? "es-ES" : "en-GB", {
      style: "percent",
      signDisplay: "exceptZero",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  const rowsFor = (i: Instrument) => {
    const rows =
      i.dataStatus === "annual_history" &&
      i.instrumentId === history.instrumentId
        ? history.returns.map((row) => ({
            label: String(row.year),
            rate: row.rate,
          }))
        : i.dataStatus === "fictional" && i.returns
          ? i.returns.map((rate, index) => ({
              label: `${es ? "Mes" : "Month"} ${index + 1}`,
              rate,
            }))
          : [];
    return rows.every(
      (row) =>
        Number.isFinite(row.rate) &&
        row.rate >= -1 &&
        Number.isFinite(row.rate * 100),
    )
      ? rows
      : [];
  };
  const sameSeries = (a: Instrument, b: Instrument) =>
    a.dataStatus === b.dataStatus &&
    rowsFor(a).length > 0 &&
    rowsFor(a).length === rowsFor(b).length &&
    rowsFor(a).every((row, index) => row.label === rowsFor(b)[index].label);
  const firstChart = bankFunds.find((i) => rowsFor(i).length > 0);
  const defaultCharts = firstChart
    ? bankFunds
        .filter((i) => sameSeries(firstChart, i))
        .slice(0, 3)
        .map((i) => i.instrumentId)
    : [];
  const dashboardMax = Math.max(
    ...bankFunds
      .filter((item) =>
        (chartSelection ?? defaultCharts).includes(item.instrumentId),
      )
      .flatMap((item) => rowsFor(item).map((row) => Math.abs(row.rate))),
    0.001,
  );
  const download = (i: Instrument) => {
    const rows = rowsFor(i);
    if (!rows.length) return;
    const csv = [
      "period,rate_percent,data_kind",
      ...rows.map((row) => `${row.label},${row.rate * 100},${i.dataStatus}`),
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${i.instrumentId}-rates.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const periodSummary = (i: Instrument) =>
    i.dataStatus === "annual_history" &&
    i.instrumentId === history.instrumentId && (
      <section className="period-summary">
        <h3>
          {es
            ? "Rentabilidad derivada por periodo"
            : "Derived returns by period"}
        </h3>
        <p>
          {es
            ? "Compuesta a partir de cifras anuales publicadas y redondeadas; no predice resultados. Sin impuestos ni costes externos."
            : "Compounded from rounded published annual figures; not a forecast. Excludes taxes and external costs."}
        </p>
        <table>
          <thead>
            <tr>
              <th scope="col">{es ? "Años" : "Years"}</th>
              <th scope="col">{es ? "Acumulada" : "Cumulative"}</th>
              <th scope="col">{es ? "Anualizada" : "Annualised"}</th>
            </tr>
          </thead>
          <tbody>
            {[1, 3, 5].map((n) => {
              const value = annualPeriods(history.returns, n);
              return (
                <tr key={n}>
                  <th scope="row">
                    {n}
                    {value ? ` (${value.start}–${value.end})` : ""}
                  </th>
                  <td>{value ? percent(value.cumulative) : unavailable}</td>
                  <td>{value ? percent(value.annualised) : unavailable}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    );
  const source = (i: Instrument) =>
    i.sourceUrl ? (
      <p className="fund-source">
        <a href={i.sourceUrl} target="_blank" rel="noreferrer">
          {es ? "Consultar ficha oficial" : "View official product page"}
        </a>{" "}
        · {i.sourceDate ?? unavailable}
      </p>
    ) : (
      <p className="fund-source">
        {i.dataStatus === "fictional"
          ? es
            ? "Serie simulada; sin fuente externa."
            : "Simulated series; no external source."
          : es
            ? "Fuente no disponible."
            : "Source unavailable."}
      </p>
    );
  const chart = (i: Instrument, compact = false) => {
    const rows = rowsFor(i);
    const max = compact
      ? dashboardMax
      : Math.max(...rows.map((row) => Math.abs(row.rate)), 0.001);
    return (
      <div
        className={`fund-chart${compact ? " fund-chart--compact" : ""}`}
        data-instrument={i.instrumentId}
      >
        <h4>{historyLabel(i)}</h4>
        {rows.length ? (
          <>
            {!compact && (
              <p>
                {i.dataStatus === "fictional"
                  ? es
                    ? "Una secuencia inventada, no datos históricos ni una previsión."
                    : "An invented sequence, not historical data or a forecast."
                  : es
                    ? "Cifras anuales redondeadas, no precios ni previsiones. Gastos corrientes deducidos; sin impuestos ni costes externos."
                    : "Rounded annual figures, not prices or forecasts. Ongoing charges deducted; excludes taxes and external costs."}
              </p>
            )}
            {compact ? (
              <>
                <div className="mini-bars" aria-hidden="true">
                  {rows.map((row) => (
                    <span className="mini-column" key={row.label}>
                      <i
                        className={
                          row.rate < 0
                            ? "negative"
                            : row.rate > 0
                              ? "positive"
                              : "flat"
                        }
                        style={{
                          height: `${(Math.abs(row.rate) / max) * 50}%`,
                        }}
                      />
                    </span>
                  ))}
                </div>
                <div className="mini-range">
                  <span>{rows[0].label}</span>
                  <span>{rows[rows.length - 1].label}</span>
                </div>
                <details>
                  <summary>{es ? "Ver cifras" : "View figures"}</summary>
                  <table className="mini-values">
                    <caption>{historyLabel(i)}</caption>
                    <thead>
                      <tr>
                        <th scope="col">{es ? "Periodo" : "Period"}</th>
                        <th scope="col">{es ? "Variación" : "Change"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.label}>
                          <th scope="row">{row.label}</th>
                          <td>{percent(row.rate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              </>
            ) : (
              <div className="annual-bars">
                {rows.map((row) => (
                  <div className="annual-row" key={row.label}>
                    <span>{row.label}</span>
                    <span className="annual-track" aria-hidden="true">
                      <span
                        className={
                          row.rate < 0
                            ? "negative"
                            : row.rate > 0
                              ? "positive"
                              : "flat"
                        }
                        style={{ width: `${(Math.abs(row.rate) / max) * 50}%` }}
                      />
                    </span>
                    <strong>{percent(row.rate)}</strong>
                  </div>
                ))}
              </div>
            )}
            {compact && (
              <p>
                {i.dataStatus === "fictional"
                  ? es
                    ? "Una secuencia inventada, no datos históricos ni una previsión."
                    : "An invented sequence, not historical data or a forecast."
                  : es
                    ? "Cifras anuales redondeadas, no precios ni previsiones. Gastos corrientes deducidos; sin impuestos ni costes externos."
                    : "Rounded annual figures, not prices or forecasts. Ongoing charges deducted; excludes taxes and external costs."}
              </p>
            )}
            <p>
              {es
                ? "Verde: positivo; rojo: negativo; gris: cero."
                : "Green: positive; red: negative; grey: zero."}
            </p>
          </>
        ) : (
          <p className="fund-empty">
            {es
              ? "No hay serie verificada para este fondo."
              : "No verified series is available for this fund."}
          </p>
        )}
      </div>
    );
  };
  const actions = (i: Instrument) => (
    <>
      <div className="fund-actions">
        <button
          className="button dark"
          disabled={rowsFor(i).length === 0}
          onClick={() => onPractice(i)}
        >
          {es ? "Practicar con este fondo" : "Practise with this fund"}{" "}
          <ArrowRight size={16} />
        </button>
        <button className="fund-voice" onClick={onVoice}>
          <Mic size={17} />
          {es ? "Preguntar por voz" : "Ask by voice"}
        </button>
      </div>
      {rowsFor(i).length === 0 && (
        <p className="fund-voice-note">
          {es
            ? "No se puede practicar con este fondo: falta una serie histórica verificada."
            : "Practice is unavailable for this fund: a verified historical series is missing."}
        </p>
      )}
      <p className="fund-voice-note">
        {es
          ? "El asistente por reglas usa el fondo seleccionado como contexto; la voz depende del dispositivo."
          : "The rule-based assistant uses the selected fund as context; voice depends on the device."}
      </p>
    </>
  );
  if (!selected)
    return (
      <p role="status">
        {es
          ? "No hay fondos disponibles en este catálogo."
          : "No funds are available in this catalogue."}
      </p>
    );
  return (
    <section className="funds-explorer" aria-labelledby="funds-title">
      <div className="page-heading internal">
        <div>
          <div className="eyebrow">
            {es ? "CATÁLOGO DE EJEMPLO" : "SAMPLE CATALOGUE"}
          </div>
          <h1 id="funds-title">
            {level === "beginner"
              ? es
                ? "Descubre tu primer fondo."
                : "Discover your first fund."
              : level === "intermediate"
                ? es
                  ? "Compara los fondos."
                  : "Compare funds."
                : es
                  ? "Panel de análisis de fondos."
                  : "Fund analysis dashboard."}
          </h1>
          <p>
            {es
              ? "Explora información disponible y sus límites. No son recomendaciones."
              : "Explore the available information and its limits. These are not recommendations."}
          </p>
        </div>
      </div>
      <div className="fund-level">
        <span>{es ? "Nivel de detalle" : "Detail level"}</span>
        <div role="group" aria-label={es ? "Nivel de detalle" : "Detail level"}>
          {LEVELS.map(
            (item) => (
              <button
                key={item}
                type="button"
                aria-pressed={level === item}
                onClick={() => {
                  onLevel(item);
                  if (item === "beginner") {
                    setFilterHistory("all");
                    setFilterKnown("all");
                    setSort("name");
                  }
                }}
              >
                {LEVEL_LABELS[es ? "es" : "en"][item]}
              </button>
            ),
          )}
        </div>
        <p>
          {level === "beginner"
            ? es
              ? "Conoce un fondo paso a paso."
              : "Learn about one fund step by step."
            : level === "intermediate"
              ? es
                ? "Compara opciones y piensa en tu plazo."
                : "Compare options and consider your time horizon."
              : es
                ? "Analiza los datos disponibles por fondo."
                : "Analyse available data by fund."}
        </p>
      </div>
      <p className="institution-label">
        {es ? "Catálogo de" : "Catalogue of"}:{" "}
        {availableBanks.find((b) => b.id === bankId)?.name[language]} ·{" "}
        {es ? "Catálogo de fondos" : "Fund catalogue"}
      </p>
      <aside
        className="fund-help"
        aria-label={es ? "Ayuda para entender" : "Help understanding"}
      >
        <div>
          <strong>
            {es
              ? "¿Necesitas ayuda para entender lo que ves?"
              : "Need help understanding what you see?"}
          </strong>
          <p>
            {es
              ? "Pregunta al asistente por reglas sobre el fondo seleccionado. La voz usa funciones locales del dispositivo cuando están disponibles."
              : "Ask the rule-based assistant about the selected fund. Voice uses local device features when available."}
          </p>
        </div>
        <div>
          <button type="button" onClick={onText}>
            <MessageCircle size={20} />
            {es ? "Escribir al asistente" : "Write to assistant"}
          </button>
          <button type="button" onClick={onVoice}>
            <Mic size={20} />
            {es ? "Hablar con el asistente" : "Talk to assistant"}
          </button>
        </div>
      </aside>
      <GoalsPanel language={language} />
      {
        <details
          className="filter-disclosure"
          open={level === "intermediate" ? true : undefined}
        >
          <summary>{es ? "Más filtros" : "More filters"}</summary>
          <div className="fund-filters">
            <label>
              {es ? "Buscar fondo" : "Search funds"}
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label>
              {es ? "Tipo" : "Type"}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">{es ? "Todos" : "All"}</option>
                <option value="mixed">{es ? "Mixto" : "Mixed"}</option>
                <option value="equity">
                  {es ? "Renta variable" : "Equity"}
                </option>
                <option value="fixed">
                  {es ? "Renta fija" : "Fixed income"}
                </option>
                <option value="unknown">{unavailable}</option>
              </select>
            </label>
            <label>
              {es ? "Serie" : "Series"}
              <select
                value={filterHistory}
                onChange={(e) => setFilterHistory(e.target.value)}
              >
                <option value="all">{es ? "Todas" : "All"}</option>
                <option value="available">
                  {es ? "Disponible" : "Available"}
                </option>
                <option value="missing">{unavailable}</option>
              </select>
            </label>
            <label>
              {es ? "Riesgo, coste y plazo" : "Risk, fee and horizon"}
              <select
                value={filterKnown}
                onChange={(e) => setFilterKnown(e.target.value)}
              >
                <option value="all">{es ? "Todos" : "All"}</option>
                <option value="known">
                  {es
                    ? "Características disponibles"
                    : "Features available"}
                </option>
                <option value="missing">{unavailable}</option>
              </select>
            </label>
            <label>
              {es ? "Ordenar por" : "Sort by"}
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="name">{es ? "Nombre" : "Name"}</option>
                <option value="type">{es ? "Tipo" : "Type"}</option>
                <option value="data">
                  {es ? "Datos disponibles" : "Data availability"}
                </option>
                <option value="risk">
                  {es ? "Riesgo" : "Risk"}
                </option>
                <option value="fee">
                  {es ? "Coste" : "Fee"}
                </option>
                <option value="horizon">
                  {es ? "Plazo" : "Horizon"}
                </option>
              </select>
            </label>
            <p>
              {es
                ? `Fondo seleccionado para el asistente: ${selected.name[language]}. Los filtros no lo cambian.`
                : `Fund selected for the assistant: ${selected.name[language]}. Filters do not change it.`}
            </p>
          </div>
        </details>
      }
      {level === "beginner" && (
        <div className="beginner-layout" data-layout="beginner">
          <div className="beginner-guide">
            <span className="kicker">
              01 / {es ? "ELIGE UN FONDO" : "CHOOSE A FUND"}
            </span>
            <h2>{es ? "Empecemos por uno." : "Start with one."}</h2>
            <p>
              {es
                ? "Selecciona un ejemplo para conocer lo esencial."
                : "Select an example to learn the essentials."}
            </p>
            <label>
              {es ? "Buscar por nombre" : "Search by name"}
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label>
              {es ? "¿En qué invierte?" : "What does it invest in?"}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">{es ? "Todos" : "All"}</option>
                <option value="equity">{es ? "Acciones" : "Shares"}</option>
                <option value="fixed">{es ? "Bonos" : "Bonds"}</option>
                <option value="mixed">
                  {es ? "Combinación" : "Combination"}
                </option>
                <option value="unknown">
                  {es ? "No disponible" : "Unavailable"}
                </option>
              </select>
            </label>
            <p>
              {es
                ? `Coincidencias: ${visibleFunds.length}. Selección conservada: ${selected.name[language]}.`
                : `Matches: ${visibleFunds.length}. Kept selection: ${selected.name[language]}.`}
            </p>
            <label>
              {es ? "Fondo" : "Fund"}
              <select
                value={selected.instrumentId}
                onChange={(e) => {
                  const item = bankFunds.find(
                    (i) => i.instrumentId === e.target.value,
                  );
                  if (item) onSelect(item);
                }}
              >
                {[
                  selected,
                  ...visibleFunds.filter(
                    (i) => i.instrumentId !== selected.instrumentId,
                  ),
                ].map((i) => (
                  <option key={i.instrumentId} value={i.instrumentId}>
                    {i.name[language]}
                  </option>
                ))}
              </select>
            </label>
            <details>
              <summary>{es ? "¿Qué es un fondo?" : "What is a fund?"}</summary>
              <p>
                {es
                  ? "Reúne aportaciones para invertir según una estrategia. Su valor puede subir o bajar."
                  : "It pools contributions to invest according to a strategy. Its value can rise or fall."}
              </p>
            </details>
            <details>
              <summary>
                {es ? "¿Qué son riesgo y costes?" : "What are risk and fees?"}
              </summary>
              <p>
                {es
                  ? "El riesgo incluye la posibilidad de pérdida; los costes reducen el resultado."
                  : "Risk includes the possibility of loss; fees reduce the outcome."}
              </p>
            </details>
          </div>
          <article className="fund-detail beginner-card">
            <span className="kicker">
              02 / {es ? "LO ESENCIAL" : "THE ESSENTIALS"}
            </span>
            <h2>{selected.name[language]}</h2>
            <p className="fund-intro">
              {selected.relationship === "fictional"
                ? es
                  ? "Características ilustrativas, no recomendaciones. Comisiones informativas: no se descuentan en la simulación."
                  : "Illustrative characteristics, not recommendations. Fees are informational and are not deducted in the simulation."
                : es
                  ? "Ficha de ejemplo con datos disponibles."
                  : "Sample product with available data."}
            </p>
            <div className="beginner-questions">
              <div>
                <strong>
                  {es
                    ? "¿Qué es y dónde invierte?"
                    : "What is it and where does it invest?"}
                </strong>
                <p>
                  {type(selected)}
                  {selected.dataStatus === "fictional"
                    ? es
                      ? " · categoría del ejemplo inventado"
                      : " · invented example category"
                    : ""}
                </p>
              </div>
              <div>
                <strong>
                  {es ? "¿Cuánto puedo perder?" : "How much could I lose?"}
                </strong>
                <p>
                  {examples[selected.instrumentId] &&
                  selected.dataStatus === "fictional"
                    ? `${examples[selected.instrumentId].risk} / 7 · ${es ? "riesgo ilustrativo" : "illustrative risk"}`
                    : unavailable}
                  .{" "}
                  {es
                    ? "El valor puede bajar; el indicador no limita la pérdida máxima y el nivel 1 no elimina pérdidas."
                    : "Value can fall; the indicator does not cap losses and level 1 does not eliminate them."}
                </p>
              </div>
              <div>
                <strong>{es ? "¿Cuánto cuesta?" : "What does it cost?"}</strong>
                <p>
                  {examples[selected.instrumentId] &&
                  selected.dataStatus === "fictional"
                    ? feeText(selected.instrumentId)
                    : unavailable}
                </p>
              </div>
              <div>
                <strong>
                  {es
                    ? "¿Cuándo puedo recuperar el dinero?"
                    : "When can I access the money?"}
                </strong>
                <p>
                  {examples[selected.instrumentId] &&
                  selected.dataStatus === "fictional"
                    ? `${es ? "Plazo de ejemplo" : "Illustrative horizon"}: ${examples[selected.instrumentId].years} ${es ? "años" : "years"}. `
                    : ""}
                  {es
                    ? "Disponibilidad y condiciones: no disponibles."
                    : "Availability and conditions: unavailable."}
                </p>
              </div>
            </div>
            {bankProfile && <ProductCosts product={bankProfile.products.find(p => p.instrumentId === selected.instrumentId)} profile={bankProfile} language={language} />}
            <details>
              <summary>{es ? "Ver detalles" : "View details"}</summary>
              <p>
                {es ? "Gestora" : "Manager"}: {selected.dataStatus === "fictional" ? (es ? "No especificada" : "Not specified") : (selected.manager || unavailable)}{" "}
                · ISIN: {selected.identifier ?? unavailable}
              </p>
            </details>
            <div className="beginner-summary">
              <strong>{historyLabel(selected)}</strong>
              <p>
                {selected.instrumentId === history.instrumentId &&
                selected.dataStatus === "annual_history" &&
                history.returns.length > 0
                  ? es
                    ? `Último año publicado: ${history.returns.at(-1)!.year}, ${percent(history.returns.at(-1)!.rate)}. Son cifras redondeadas, no una predicción.`
                    : `Latest published year: ${history.returns.at(-1)!.year}, ${percent(history.returns.at(-1)!.rate)}. Rounded figures, not a forecast.`
                  : selected.dataStatus === "fictional"
                    ? es
                      ? "Los cambios se han inventado para practicar."
                      : "Changes are invented for practice."
                    : es
                      ? "No hay una serie histórica verificada para practicar."
                      : "No verified historical series is available for practice."}
              </p>
            </div>
            {source(selected)}
            {actions(selected)}
          </article>
        </div>
      )}
      {level === "intermediate" && (
        <div className="compare-layout" data-layout="intermediate">
          <section className="compare-panel">
            <span className="kicker">01 / {es ? "COMPARA" : "COMPARE"}</span>
            <h2>
              {es
                ? "Opciones de esta entidad"
                : "Options from this institution"}
            </h2>
            <p>
              {es
                ? "Selecciona un fondo para ver sus datos. Riesgo y costes solo están disponibles como supuestos ilustrativos en los ejemplos marcados."
                : "Select a fund to view its data. Risk and fees are available only as illustrative assumptions in marked examples."}
            </p>
            {bankFunds.length === 1 && (
              <p>
                {es
                  ? "Solo hay un fondo de esta entidad en el catálogo de la demo."
                  : "Only one fund from this institution is in the demo catalogue."}
              </p>
            )}
            {visibleFunds.length === 0 && (
              <p role="status">
                {es
                  ? "Ningún fondo coincide con los filtros."
                  : "No funds match the filters."}
              </p>
            )}
            <fieldset className="compare-picker">
              <legend>
                {es
                  ? "Elige hasta tres fondos para comparar"
                  : "Choose up to three funds to compare"}
              </legend>
              {visibleFunds.map((i) => (
                <label key={i.instrumentId}>
                  <input
                    type="checkbox"
                    checked={compared.includes(i.instrumentId)}
                    disabled={
                      !compared.includes(i.instrumentId) && compared.length >= 3
                    }
                    onChange={(e) =>
                      setComparison({
                        ...comparison,
                        [bankId]: e.target.checked
                          ? [...compared, i.instrumentId]
                          : compared.filter((id) => id !== i.instrumentId),
                      })
                    }
                  />{" "}
                  {i.name[language]}
                </label>
              ))}
            </fieldset>
            <div className="fund-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">{es ? "Fondo" : "Fund"}</th>
                    <th scope="col">{es ? "Tipo" : "Type"}</th>
                    <th scope="col">
                      {es ? "Riesgo / coste / plazo" : "Risk / fee / horizon"}
                    </th>
                    <th scope="col">{es ? "Datos" : "Data"}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleFunds
                    .filter((i) => compared.includes(i.instrumentId))
                    .map((i) => (
                      <tr key={i.instrumentId}>
                        <th scope="row">
                          <button
                            className="fund-table-select"
                            aria-pressed={
                              selected.instrumentId === i.instrumentId
                            }
                            onClick={() => onSelect(i)}
                          >
                            {i.name[language]}
                            {selected.instrumentId === i.instrumentId
                              ? es
                                ? " · Seleccionado"
                                : " · Selected"
                              : ""}
                          </button>
                        </th>
                        <td>{type(i)}</td>
                        <td>
                          {i.dataStatus === "fictional" &&
                          examples[i.instrumentId]
                            ? `${examples[i.instrumentId].risk}/7 · ${feeText(i.instrumentId)} · ${examples[i.instrumentId].years} ${es ? "años" : "years"}`
                            : unavailable}
                        </td>
                        <td>{historyLabel(i)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <p>
              {es
                ? "Los riesgos y costes ilustrativos son supuestos educativos y no se aplican en las simulaciones."
                : "Risks and fees are educational assumptions and are not applied in simulations."}
            </p>
            <aside className="planning-prompt">
              <strong>{es ? "Antes de practicar" : "Before practising"}</strong>
              <p>
                {es
                  ? "Considera tu plazo y si podrías necesitar el dinero. Una simulación no predice resultados."
                  : "Consider your time horizon and whether you may need the money. A simulation does not predict results."}
              </p>
            </aside>
          </section>
          <article className="fund-detail compare-selected">
            <span className="kicker">
              02 / {es ? "FONDO SELECCIONADO" : "SELECTED FUND"}
            </span>
            <h2>{selected.name[language]}</h2>
            {chart(selected)}
            {bankProfile && <ProductCosts product={bankProfile.products.find(p => p.instrumentId === selected.instrumentId)} profile={bankProfile} language={language} />}
            {periodSummary(selected)}
            <details className="comparison-details">
              <summary>
                {es
                  ? "Composición, costes e identidad"
                  : "Composition, fees and identity"}
              </summary>
              <p>
                {es
                  ? "Composición, índice de referencia, valor liquidativo y fecha, condiciones de liquidez: no disponibles. El plazo es un supuesto ilustrativo solo en los ejemplos marcados."
                  : "Composition, benchmark, net asset value and date, liquidity conditions are unavailable. Horizon is an illustrative assumption only in marked examples."}
              </p>
              <p>
                {es ? "Gestora" : "Manager"}: {selected.dataStatus === "fictional" ? (es ? "No especificada" : "Not specified") : (selected.manager || unavailable)}{" "}
                · ISIN: {selected.identifier ?? unavailable}
              </p>
            </details>
            {source(selected)}
            {actions(selected)}
          </article>
        </div>
      )}
      {level === "advanced" && (
        <div className="advanced-layout" data-layout="advanced">
          <section>
            <div className="dashboard-heading">
              <div>
                <span className="kicker">
                  01 / {es ? "PANEL DE FONDOS" : "FUND DASHBOARD"}
                </span>
                <h2>{es ? "Series disponibles" : "Available series"}</h2>
              </div>
              <p>
                {es
                  ? `Selecciona un fondo para inspeccionar su identidad y fuente. Escala común: ±${percent(dashboardMax).replace("+", "")}; las variaciones son por periodo.`
                  : `Select a fund to inspect its identity and source. Shared scale: ±${percent(dashboardMax).replace("+", "")}; changes are per period.`}
              </p>
            </div>
            {visibleFunds.length === 0 && (
              <p role="status">
                {es
                  ? "Ningún fondo coincide con los filtros."
                  : "No funds match the filters."}
              </p>
            )}
            <fieldset className="compare-picker">
              <legend>
                {es
                  ? "Elige hasta tres series del mismo periodo para comparar"
                  : "Choose up to three series from the same period to compare"}
              </legend>
              {bankFunds.map((i) => {
                const ids = chartSelection ?? defaultCharts;
                const reference = bankFunds.find(
                  (item) => item.instrumentId === ids[0],
                );
                const compatible = !reference || sameSeries(reference, i);
                return (
                  <label key={i.instrumentId}>
                    <input
                      type="checkbox"
                      checked={ids.includes(i.instrumentId)}
                      disabled={
                        !ids.includes(i.instrumentId) &&
                        (ids.length >= 3 ||
                          !compatible ||
                          rowsFor(i).length === 0)
                      }
                      onChange={(e) =>
                        setChartSelection(
                          e.target.checked
                            ? [...ids, i.instrumentId]
                            : ids.filter((id) => id !== i.instrumentId),
                        )
                      }
                    />{" "}
                    {i.name[language]} · {historyLabel(i)}
                  </label>
                );
              })}
            </fieldset>
            {defaultCharts.length === 0 && (
              <p role="status">
                {es
                  ? "No hay series válidas para comparar en esta entidad."
                  : "No valid series are available for comparison at this institution."}
              </p>
            )}
            {(chartSelection ?? defaultCharts).length < 2 && (
              <p>
                {es
                  ? "Selecciona al menos dos series compatibles para compararlas; no se combinan periodos ni datos simulados con publicados."
                  : "Select at least two compatible series to compare; periods and simulated and published data are not mixed."}
              </p>
            )}
            <div className="fund-dashboard">
              {visibleFunds
                .filter((i) =>
                  (chartSelection ?? defaultCharts).includes(i.instrumentId),
                )
                .map((i) => (
                  <article
                    className={`dashboard-card ${selected.instrumentId === i.instrumentId ? "selected" : ""}`}
                    key={i.instrumentId}
                  >
                    <button
                      className="dashboard-select"
                      type="button"
                      aria-pressed={selected.instrumentId === i.instrumentId}
                      onClick={() => onSelect(i)}
                    >
                      <span>
                        {selected.instrumentId === i.instrumentId
                          ? es
                            ? "SELECCIONADO"
                            : "SELECTED"
                          : es
                            ? "SELECCIONAR"
                            : "SELECT"}
                      </span>
                      <strong>{i.name[language]}</strong>
                    </button>
                    {chart(i, true)}
                    {source(i)}
                  </article>
                ))}
            </div>
          </section>
          <article className="fund-detail technical-inspector">
            <span className="kicker">
              02 / {es ? "INSPECTOR DEL FONDO" : "FUND INSPECTOR"}
            </span>
            <h2>{selected.name[language]}</h2>
            <dl className="fund-identity">
              <div>
                <dt>{es ? "Tipo" : "Type"}</dt>
                <dd>{type(selected)}</dd>
              </div>
              <div>
                <dt>{es ? "Gestora" : "Manager"}</dt>
                <dd>{selected.dataStatus === "fictional" ? (es ? "No especificada" : "Not specified") : (selected.manager || unavailable)}</dd>
              </div>
              <div>
                <dt>ISIN</dt>
                <dd>{selected.identifier ?? unavailable}</dd>
              </div>
              <div>
                <dt>{es ? "Clase" : "Share class"}</dt>
                <dd>{selected.shareClass ?? unavailable}</dd>
              </div>
              <div>
                <dt>{es ? "Moneda" : "Currency"}</dt>
                <dd>{selected.currency ?? unavailable}</dd>
              </div>
              <div>
                <dt>{es ? "Ficha consultada" : "Page checked"}</dt>
                <dd>{selected.sourceDate ?? unavailable}</dd>
              </div>
              <div>
                <dt>
                  {es ? "Riesgo / coste / plazo" : "Risk / fee / horizon"}
                </dt>
                <dd>
                  {selected.dataStatus === "fictional" &&
                  examples[selected.instrumentId]
                    ? `${examples[selected.instrumentId].risk}/7 · ${feeText(selected.instrumentId)} · ${examples[selected.instrumentId].years} ${es ? "años" : "years"}`
                    : unavailable}
                </dd>
              </div>
            </dl>
            {selected.instrumentId === history.instrumentId &&
              selected.dataStatus === "annual_history" && (
                <details>
                  <summary>
                    {es
                      ? "Ver tabla anual publicada"
                      : "View published annual table"}
                  </summary>
                  <div className="fund-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">{es ? "Año" : "Year"}</th>
                          <th scope="col">{es ? "Rentabilidad" : "Return"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.returns.map((row) => (
                          <tr key={row.year}>
                            <th scope="row">{row.year}</th>
                            <td>{percent(row.rate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            {selected.dataStatus === "fictional" && (
              <p className="fund-voice-note">
                {es
                  ? "Características ilustrativas. Comisiones informativas: no se descuentan en la simulación."
                  : "Illustrative characteristics. Fees are informational and are not deducted in the simulation."}
              </p>
            )}
            {bankProfile && <ProductCosts product={bankProfile.products.find(p => p.instrumentId === selected.instrumentId)} profile={bankProfile} language={language} />}
            {periodSummary(selected)}
            <div className="technical-groups">
              <details>
                <summary>
                  {es ? "Política y composición" : "Policy and composition"}
                </summary>
                <p>
                  {es
                    ? "Objetivo, índice de referencia, posiciones y distribución: no disponibles en este catálogo."
                    : "Objective, benchmark, holdings and allocation: unavailable in this catalogue."}
                </p>
              </details>
              <details>
                <summary>
                  {es
                    ? "Costes, valor liquidativo y métricas"
                    : "Fees, NAV and metrics"}
                </summary>
                <p>
                  {es
                    ? "Valor liquidativo, volatilidad, máxima caída, Sharpe, beta y tracking error: no disponibles."
                    : "Net asset value, volatility, maximum drawdown, Sharpe, beta and tracking error: unavailable."}
                </p>
              </details>
            </div>
            <button
              className="fund-export"
              type="button"
              disabled={!rowsFor(selected).length}
              onClick={() => download(selected)}
            >
              {es
                ? "Descargar serie disponible (CSV)"
                : "Download available series (CSV)"}
            </button>
            {source(selected)}
            {actions(selected)}
          </article>
        </div>
      )}
      <details className="fund-documents">
        <summary>
          {es ? "Documentación legal y fuentes" : "Legal documents and sources"}
        </summary>
        <p>
          {es
            ? "Documento de datos fundamentales: no disponible. Folleto: no disponible. Informes anual y semestral: no disponibles. La ficha oficial enlazada, cuando existe, es una fuente del catálogo y no se presenta como documentación precontractual."
            : "Key information document: unavailable. Prospectus: unavailable. Annual and half-year reports: unavailable. The linked official page, when available, is a catalogue source and is not presented as pre-contractual documentation."}
        </p>
        {source(selected)}
      </details>
    </section>
  );
}
