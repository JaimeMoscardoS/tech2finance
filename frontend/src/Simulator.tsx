import type { Dispatch, SetStateAction, FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CircleHelp,
  FlaskConical,
  MessageCircle,
  TrendingDown,
} from "lucide-react";
import { annualHistory } from "./annual-history";
import { type Bank, type Instrument, type BankProfile } from "./catalog";
import { ProductCosts } from "./BankInfo";
import { copy, type Language } from "./copy";
import {
  MAX_SIMULATION_AMOUNT,
  type SimulationResult,
} from "./simulation-types";
import InvestmentChart from "./LazyInvestmentChart";
import type { Level } from "./types/level";

export type FieldError = "initial" | "monthly" | "annual" | "general" | null;
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
  banks: Bank[];
  bankProfile?: BankProfile;
  instruments: Instrument[];
  history: typeof annualHistory;
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
  openSimulationDecline: () => void;
  euro: (value: number) => string;
  /** Anidado bajo un h2 de «Simulador»: el título de la introducción baja a h3 para mantener un único h1. */
  embedded?: boolean;
};
export default function Simulator({
  t,
  language,
  level,
  selected,
  bankProfile,
  banks,
  instruments,
  history,
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
  openSimulationDecline,
  euro,
  embedded,
}: Props) {
  return (
    <>
      <PageIntro
        label={t.configure}
        title={t.simTitle}
        description={t.simIntro}
        embedded={embedded}
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
      {instruments.some(item => item.instrumentId === history.instrumentId) && (
      <button
        className="text-link history-shortcut"
        type="button"
        onClick={() =>
          selectInstrument(
            instruments.find(
              (item) => item.instrumentId === history.instrumentId,
            )!,
          )
        }
      >
        {t.tryHistory}
        <ArrowRight size={15} />
      </button>
      )}
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
                {instruments.some(i => i.assetType === "fund") && <option value="fund">{t.mixedAsset}</option>}
                {instruments.some(i => i.assetType === "etf") && <option value="etf">{t.equityAsset}</option>}
                {instruments.some(i => i.assetType === "stock") && <option value="stock">{t.fixedAsset}</option>}
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
          {bankProfile && <ProductCosts product={bankProfile.products.find(p=>p.instrumentId === selected.instrumentId)} profile={bankProfile} language={language} />}
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
              <div className="result-help">
                <MessageCircle size={23} aria-hidden="true" />
                <div><strong>{t.explainResult}</strong><p>{language === "es" ? "Pregunta al asistente por este ejemplo y sus datos." : "Ask the assistant about this example and its data."}</p></div>
                <button className="button dark" type="button" onClick={openAssistant}>{language === "es" ? "Explícame este resultado" : "Explain this result"}<ArrowRight size={17}/></button>
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
                    {history.returns.map((row) => (
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
              <button className="button outline decline-trigger" type="button" onClick={openSimulationDecline}><TrendingDown size={17}/>{language === "es" ? "Entender las caídas" : "Understand declines"}</button>
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

    </>
  );
}
function PageIntro({
  label,
  title,
  description,
  embedded,
}: {
  label: string;
  title: string;
  description: string;
  embedded?: boolean;
}) {
  const Heading = embedded ? "h3" : "h1";
  return (
    <div className={`page-heading internal${embedded ? " embedded" : ""}`}>
      <div>
        <div className="eyebrow">{label}</div>
        <Heading>{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}
