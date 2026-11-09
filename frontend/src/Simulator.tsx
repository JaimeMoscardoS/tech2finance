import type { Dispatch, SetStateAction, FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CircleHelp,
  FlaskConical,
  MessageCircle,
} from "lucide-react";
import { annualHistory } from "./annual-history";
import { banks, instruments, type Instrument } from "./catalog";
import { copy, type Language } from "./copy";
import {
  MAX_SIMULATION_AMOUNT,
  type SimulationResult,
} from "./simulation-types";
import InvestmentChart from "./LazyInvestmentChart";

export type FieldError = "initial" | "monthly" | "annual" | "general" | null;
type Level = "beginner" | "intermediate" | "advanced";
export type ViewResult = SimulationResult & {
  instrumentId: string;
  initial: number;
  monthly: number;
  annual: number;
  months: number;
};
type Props = {
  t: (typeof copy)[Language];
  language: Language;
  level: Level;
  selected: Instrument;
  result: ViewResult | null;
  error: FieldError;
  initial: string;
  monthly: string;
  annual: string;
  months: string;
  setInitial: Dispatch<SetStateAction<string>>;
  setMonthly: Dispatch<SetStateAction<string>>;
  setAnnual: Dispatch<SetStateAction<string>>;
  setMonths: Dispatch<SetStateAction<string>>;
  setResult: Dispatch<SetStateAction<ViewResult | null>>;
  setError: Dispatch<SetStateAction<FieldError>>;
  selectInstrument: (item: Instrument) => void;
  run: (event: FormEvent) => void;
  openAssistant: () => void;
  euro: (value: number) => string;
};
export default function Simulator({
  t,
  language,
  level,
  selected,
  result,
  error,
  initial,
  monthly,
  annual,
  months,
  setInitial,
  setMonthly,
  setAnnual,
  setMonths,
  setResult,
  setError,
  selectInstrument,
  run,
  openAssistant,
  euro,
}: Props) {
  return (
    <>
      <PageIntro
        label={t.configure}
        title={t.simTitle}
        description={t.simIntro}
      />
      <div className="info-banner">
        <FlaskConical size={20} />
        <span>
          {selected.dataStatus === "fictional"
            ? t.simWarning
            : selected.dataStatus === "annual_history"
              ? t.historyIntro
              : t.missingHistory}
        </span>
      </div>
      <button
        className="text-link history-shortcut"
        type="button"
        onClick={() =>
          selectInstrument(
            instruments.find(
              (item) => item.instrumentId === annualHistory.instrumentId,
            )!,
          )
        }
      >
        {t.tryHistory}
        <ArrowRight size={15} />
      </button>
      <div className="sim-grid">
        <form className="panel sim-form" onSubmit={run} noValidate>
          <div className="panel-number">01 / {t.configure}</div>
          <h2>{t.configureTitle}</h2>
          <p>{t.configureIntro}</p>
          <label>
            {t.assetType}
            <div className="field">
              <select
                aria-label={t.assetType}
                value={selected.assetType}
                onChange={(e) => {
                  const item = instruments.find(
                    (x) => x.assetType === e.target.value,
                  );
                  if (item) selectInstrument(item);
                }}
              >
                <option value="fund">{t.mixedAsset}</option>
                <option value="etf">{t.equityAsset}</option>
                <option value="stock">{t.fixedAsset}</option>
              </select>
            </div>
          </label>
          <label>
            {t.entity}
            <div className="field">
              <select
                aria-label={t.entity}
                value={selected.bankId}
                onChange={(e) => {
                  const item = instruments.find(
                    (x) =>
                      x.assetType === selected.assetType &&
                      x.bankId === e.target.value,
                  );
                  if (item) selectInstrument(item);
                }}
              >
                {banks
                  .filter((bank) =>
                    instruments.some(
                      (item) =>
                        item.assetType === selected.assetType &&
                        item.bankId === bank.id,
                    ),
                  )
                  .map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name[language]}
                    </option>
                  ))}
              </select>
            </div>
          </label>
          <label>
            {t.instrument}
            <div className="field">
              <select
                aria-label={t.instrument}
                value={selected.instrumentId}
                onChange={(e) => {
                  const item = instruments.find(
                    (x) => x.instrumentId === e.target.value,
                  );
                  if (item) selectInstrument(item);
                }}
              >
                {instruments
                  .filter(
                    (item) =>
                      item.assetType === selected.assetType &&
                      item.bankId === selected.bankId,
                  )
                  .map((item) => (
                    <option key={item.instrumentId} value={item.instrumentId}>
                      {item.name[language]}
                    </option>
                  ))}
              </select>
            </div>
            <small className="selected-instrument">
              {selected.name[language]}
            </small>
          </label>
          <label>
            {t.initial}
            <span>{t.fakeMoney}</span>
            <div className="field">
              <input
                type="number"
                min="0"
                max={MAX_SIMULATION_AMOUNT}
                step="any"
                aria-invalid={error === "initial"}
                aria-describedby={error === "initial" ? "sim-error" : undefined}
                value={initial}
                onChange={(e) => {
                  setInitial(e.target.value);
                  setResult(null);
                  setError(null);
                }}
                required
              />
              <span>€</span>
            </div>
          </label>
          {selected.dataStatus === "annual_history" ? (
            <>
              <label>
                {t.annualContribution}
                <span>{t.optional}</span>
                <div className="field">
                  <input
                    type="number"
                    min="0"
                    max={MAX_SIMULATION_AMOUNT}
                    step="any"
                    value={annual}
                    aria-invalid={error === "annual"}
                    aria-describedby={error === "annual" ? "annual-help sim-error" : "annual-help"}
                    onChange={(e) => {
                      setAnnual(e.target.value);
                      setResult(null);
                      setError(null);
                    }}
                  />
                  <span>{t.yearly}</span>
                </div>
                <small id="annual-help">{t.annualHelp}</small>
              </label>
              <div className="history-period">
                <strong>{t.historyPeriod}</strong>
                <p>{t.historyNoMonthly}</p>
              </div>
            </>
          ) : (
            <>
              <label>
                {t.monthly}
                <span>{t.optional}</span>
                <div className="field">
                  <input
                    type="number"
                    min="0"
                    max={MAX_SIMULATION_AMOUNT}
                    step="any"
                    aria-invalid={error === "monthly"}
                    aria-describedby={error === "monthly" ? "sim-error" : undefined}
                    value={monthly}
                    onChange={(e) => {
                      setMonthly(e.target.value);
                      setResult(null);
                      setError(null);
                    }}
                  />
                  <span>{t.perMonth}</span>
                </div>
              </label>
              <label>
                {t.duration}
                <div className="field">
                  <select
                    value={months}
                    onChange={(e) => {
                      setMonths(e.target.value);
                      setResult(null);
                      setError(null);
                    }}
                  >
                    <option value="6">{t.months6}</option>
                    <option value="12">{t.year1}</option>
                    <option value="36">{t.years3}</option>
                    <option value="60">{t.years5}</option>
                  </select>
                </div>
              </label>
            </>
          )}
          {error && (
            <p id="sim-error" className="error" role="alert">
              {error === "initial" ? t.initial : error === "annual" ? t.annualContribution : error === "monthly" ? t.monthly : t.invalid}: {t.amountError}
            </p>
          )}
          <button
            className="button dark full"
            type="submit"
            disabled={selected.dataStatus === "missing_history"}
          >
            {t.showExample}
            <ArrowRight size={16} />
          </button>
        </form>
        <section className="panel sim-result">
          <div className="card-heading">
            <div>
              <div className="panel-number">02 / {t.discover}</div>
              <h2>
                {selected.dataStatus === "fictional"
                  ? t.resultTitle
                  : selected.dataStatus === "annual_history"
                    ? t.historyTitle
                    : t.noHistory}
              </h2>
            </div>
            <span className="pill">
              {selected.dataStatus === "fictional"
                ? t.hypothetical
                : selected.dataStatus === "annual_history"
                  ? t.historical
                  : t.unavailable}
            </span>
          </div>
          <p>
            <strong>{selected.name[language]}</strong> ·{" "}
            {selected.relationship === "fictional"
              ? t.fictionalInstrument
              : selected.relationship === "own"
                ? t.ownFund
                : selected.relationship === "third_party"
                  ? t.thirdParty
                  : t.unknownRelation}
          </p>
          {selected.dataStatus !== "fictional" && (
            <div className="source-details">
              <p>
                {t.managerLabel}: {selected.manager}
                {selected.identifier && (
                  <>
                    {" "}
                    · {t.identifierLabel}: {selected.identifier}
                  </>
                )}
                {selected.shareClass && (
                  <>
                    {" "}
                    · {t.classLabel}: {selected.shareClass}
                  </>
                )}
                {selected.currency && <> · {selected.currency}</>}
              </p>
              {selected.sourceUrl && (
                <p>
                  <a href={selected.sourceUrl} target="_blank" rel="noreferrer">
                    {t.sourceLink} <ArrowUpRight size={14} />
                  </a>{" "}
                  · {t.sourceChecked}: {selected.sourceDate}
                </p>
              )}
            </div>
          )}
          <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{result && result.instrumentId === selected.instrumentId ? `${t.resultUpdated}: ${euro(result.value)}, ${t.totalPaid}: ${euro(result.contributed)}.` : ""}</span>
          {selected.dataStatus === "missing_history" ? (
            <div role="status">
              <p>{t.missingHistory}</p>
            </div>
          ) : !result || result.instrumentId !== selected.instrumentId ? (
            <p role="status">{error ? t.amountError : t.dirtyResult}</p>
          ) : (
            <>
              {selected.dataStatus === "fictional" && <p>{t.resultIntro}</p>}
              <div className="sim-values">
                <div>
                  <span>{t.finalValue}</span>
                  <strong>{euro(result.value)}</strong>
                </div>
                <div>
                  <span>{t.totalPaid}</span>
                  <strong>{euro(result.contributed)}</strong>
                </div>
                <div>
                  <span>{t.delta}</span><small>{t.gainDefinition}</small>
                  <strong>{euro(result.profit)}</strong>
                </div>
              </div>
              <InvestmentChart
                language={language}
                title={t.chartTitle}
                description={selected.dataStatus === "annual_history" ? `${t.chartDescription} ${t.annualClosingDescription}` : t.chartDescription}
                data={result.timeline.map((point) => ({
                  label: point.date
                    ? point.date.slice(0, 4)
                    : point.period === 0
                      ? t.start
                      : `${t.month} ${point.period}`,
                  value: point.value,
                  contributed: point.contributed,
                  returnPercent: point.instrumentReturnPercent,
                }))}
              />
              {selected.dataStatus === "annual_history" && (
                <table className="history-table">
                  <caption>{t.annualReturns}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{t.yearLabel}</th>
                      <th scope="col">{t.returnLabel}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {annualHistory.returns.map((row) => (
                      <tr key={row.year}>
                        <td>{row.year}</td>
                        <td>
                          {new Intl.NumberFormat(
                            language === "es" ? "es-ES" : "en-GB",
                            {
                              style: "percent",
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                              signDisplay: "exceptZero",
                            },
                          ).format(row.rate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="assumption">
                <CircleHelp size={16} />
                <span>
                  {selected.dataStatus === "annual_history" ? (
                    t.historyAssumption
                  ) : (
                    <>
                      {t.simulationAssumption}
                      {level !== "beginner" && t.extraIntermediate}
                      {level === "advanced" && t.extraAdvanced}
                    </>
                  )}
                </span>
              </div>
            </>
          )}
        </section>
      </div>
      {selected.dataStatus === "fictional" &&
        result?.instrumentId === selected.instrumentId && (
          <div className="tip-box">
            <MessageCircle size={19} />
            <div>
              <strong>{t.explainResult}</strong>
              <p>{t.askExample}</p>
            </div>
            <button className="button outline" onClick={openAssistant}>
              {t.askButton}
              <ArrowRight size={15} />
            </button>
          </div>
        )}
    </>
  );
}
function PageIntro({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading internal">
      <div>
        <div className="eyebrow">{label}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}
