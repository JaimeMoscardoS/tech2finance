import { lazy, Suspense, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  CircleHelp,
  FlaskConical,
  Lightbulb,
  Lock,
  MessageCircle,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { type Instrument, type BankProfile } from "./catalog";
import { ProductCosts } from "./BankInfo";
import { copy, type Language } from "./copy";
import { MAX_SIMULATION_AMOUNT, type SimulationResult } from "./simulation-types";
import type { NavHistory } from "./server-api";
import { gameDates } from "./game-domain";
import { journeyCopy } from "./journey-copy";
import { PRESETS, evaluatePrediction, fundMetrics, matchesPreset, monthLabel, sliderMonths, sparklinePoints, navSeries, type Guess } from "./journey-domain";
import { tmCopy } from "./time-machine-copy";
import "./simulator-journey.css";

const TimeMachine = lazy(() => import("./TimeMachine"));

export type FieldError = "initial" | "monthly" | "annual" | "amounts" | "general" | null;
import type { Level } from "./types/level";
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
  mode: "server" | "local";
  navHistory: Pick<NavHistory, "instruments" | "source">;
  /** True when the user already chose a fund elsewhere in this visit (for example in the catalogue). */
  prechosen?: boolean;
  /** True when the app opened the simulator with a ready-made example (result already requested): no prediction is asked. */
  example?: boolean;
  /** Reports whether step 2 has been revealed, so the tutor only receives a result the user has seen. */
  onRevealed?: (revealed: boolean) => void;
  bankProfile?: BankProfile;
  instruments: Instrument[];
  selected: Instrument;
  result: ViewResult | null;
  error: FieldError;
  initial: string;
  monthly: string;
  months: string;
  maxMonths: number;
  contributionFrequency: "monthly" | "annual";
  setContributionFrequency: Dispatch<SetStateAction<"monthly" | "annual">>;
  setInitial: Dispatch<SetStateAction<string>>;
  setMonthly: Dispatch<SetStateAction<string>>;
  setMonths: Dispatch<SetStateAction<string>>;
  setResult: Dispatch<SetStateAction<ViewResult | null>>;
  setError: Dispatch<SetStateAction<FieldError>>;
  selectInstrument: (item: Instrument) => void;
  run: (event: FormEvent) => void;
  openAssistant: (question?: string) => void;
  openSimulationDecline: () => void;
  euro: (value: number) => string;
  /** Dentro de la página «Simulador» (que ya tiene su h1): la introducción del recorrido no repite el h1. */
  embedded?: boolean;
};
type Step = 1 | 2 | 3;
const DEBOUNCE_MS = 400;
const MINUS = "−";

export default function Simulator({
  t, language, level, mode, navHistory, prechosen = false, example = false, onRevealed, selected, bankProfile, instruments, result, error,
  initial, monthly, months, maxMonths, contributionFrequency, setContributionFrequency, setInitial, setMonthly,
  setMonths, setResult, setError, selectInstrument, run, openAssistant, openSimulationDecline, euro, embedded,
}: Props) {
  const j = journeyCopy[language];
  const tm = tmCopy[language];
  const locale = language === "es" ? "es-ES" : "en-GB";
  const [chosen, setChosen] = useState(prechosen);
  const [guess, setGuess] = useState<Guess | null>(null);
  const [current, setCurrent] = useState<Step>(prechosen ? 2 : 1);
  const [pickedId, setPickedId] = useState(selected.instrumentId);
  useEffect(() => setPickedId(selected.instrumentId), [selected.instrumentId]);
  const [guideOpen, setGuideOpen] = useState(level !== "advanced");
  const [quiet, setQuiet] = useState(false);
  const [replayDone, setReplayDone] = useState(false);
  // Step 1 folds into a one-line summary while a replay is under way (so its full-series sparklines are not on screen); a restart or a fund change unfolds it.
  const [replayStarted, setReplayStarted] = useState(false);
  const [step1Open, setStep1Open] = useState(false);
  useEffect(() => { if (!replayStarted) setStep1Open(false); }, [replayStarted]);
  useEffect(() => setGuideOpen(level !== "advanced"), [level]);

  const [exampleShown] = useState(example);
  const revealed = guess !== null || exampleShown;
  const unlocked: Step = chosen ? (revealed ? 3 : 2) : 1;
  // The tutor only receives the result once the replay is finished: before that the user has not lived it.
  useEffect(() => { onRevealed?.(revealed && replayDone); return () => onRevealed?.(false); }, [revealed, replayDone]);
  const cap = Math.min(72, maxMonths);
  const dates = useMemo(() => gameDates(selected, navHistory), [selected, navHistory]);
  const monthsNumber = Number(months);
  const endLabel = Number.isInteger(monthsNumber) ? monthLabel(dates[monthsNumber], language) : "";
  const currentResult = result && result.instrumentId === selected.instrumentId && selected.dataStatus === "historical_nav" ? result : null;
  const resultRef = useRef(currentResult);
  resultRef.current = currentResult;
  const seenResult = useRef(false);
  if (currentResult) seenResult.current = true;
  const runRef = useRef(run);
  runRef.current = run;
  const immediate = useRef(false);
  const pendingSelect = useRef<Instrument | null>(null);

  const requestedKey = useRef<string | null>(null);
  const keyFor = (id: string, i = initial, m = monthly, n = months, f = contributionFrequency) => `${id}|${i}|${m}|${n}|${f}`;
  const edit = (apply: () => void) => { apply(); requestedKey.current = null; setResult(null); setError(null); };
  const focusResult = useRef(false);
  const money = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
  const signedEuro = (n: number) => `${n > 0 ? "+" : ""}${euro(n)}`;

  const monthsFor = (item: Instrument) => sliderMonths(navSeries(navHistory, item.identifier).length);
  const chooseFund = (item: Instrument) => {
    setChosen(true);
    setPickedId(item.instrumentId);
    setQuiet(false);
    setCurrent(c => (c === 1 ? 2 : c));
    const itemCap = monthsFor(item);
    if (itemCap > 0 && Number(months) > itemCap) {
      pendingSelect.current = item;
      edit(() => setMonths(String(itemCap)));
    } else { requestedKey.current = keyFor(item.instrumentId); selectInstrument(item); }
  };
  useEffect(() => {
    const item = pendingSelect.current;
    if (item && Number(months) <= monthsFor(item)) { pendingSelect.current = null; requestedKey.current = keyFor(item.instrumentId); selectInstrument(item); }
  }, [months]);
  useEffect(() => { if (cap > 0 && monthsNumber > cap) setMonths(String(cap)); }, [cap, monthsNumber]);
  // First time the fund is chosen, bring step 2 into view without moving focus (the radio group keeps it).
  const firstChoice = useRef(true);
  useEffect(() => {
    if (!chosen || !firstChoice.current || prechosen) return;
    firstChoice.current = false;
    requestAnimationFrame(() => document.getElementById("jr-step-2")?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "nearest" }));
  }, [chosen]);

  const invalidField = (): FieldError => {
    const valid = (value: string, required: boolean) => (!required && !value.trim()) || (value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= MAX_SIMULATION_AMOUNT);
    if (!valid(initial, true)) return "initial";
    if (!valid(monthly, false)) return "monthly";
    return Number(initial) + Number(monthly || 0) <= 0 ? "amounts" : null;
  };
  // A language change aborts the request in flight (App), so forget what was requested and ask again if needed.
  useEffect(() => { requestedKey.current = null; }, [language]);
  // Live updates: validate at once; recalculate only when valid, after a pause, and only once the first result was revealed.
  useEffect(() => {
    if (!chosen) return;
    const delay = immediate.current ? 0 : DEBOUNCE_MS;
    immediate.current = false;
    const invalid = invalidField();
    if (invalid) { setError(invalid); return; }
    if (!revealed || resultRef.current) return;
    if (exampleShown && !seenResult.current) return; // the app is still computing the ready-made example
    const key = keyFor(selected.instrumentId);
    const timer = setTimeout(() => {
      if (resultRef.current || requestedKey.current === key) return;
      requestedKey.current = key;
      runRef.current({ preventDefault() {} } as FormEvent);
    }, delay);
    return () => clearTimeout(timer);
  }, [initial, monthly, months, contributionFrequency, chosen, revealed, language]);

  // After the answer the focused button disappears: move focus to the result heading.
  useEffect(() => {
    if (!revealed || !focusResult.current) return;
    focusResult.current = false;
    requestAnimationFrame(() => document.getElementById("jr-result-title")?.focus({ preventScroll: false }));
  }, [revealed]);

  const answer = (value: Guess) => {
    if (error || invalidField()) return;
    immediate.current = true;
    focusResult.current = true;
    if (!resultRef.current) requestedKey.current = null;
    setQuiet(false);
    setGuess(value);
  };

  const goTo = (step: Step) => {
    if (step > unlocked) return;
    if (step === 1) setStep1Open(true);
    setQuiet(false);
    setCurrent(step);
    // Step 3 loads lazily: wait (a few frames at most) for its heading before moving focus.
    let frames = 0;
    const settle = () => {
      const heading = document.getElementById(step === 3 ? "tm-title" : `jr-h-${step}`);
      if (!heading && frames++ < 90) { requestAnimationFrame(settle); return; }
      document.getElementById(`jr-step-${step}`)?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
      heading?.focus({ preventScroll: true });
    };
    requestAnimationFrame(settle);
  };

  const detail = level === "advanced" ? "short" : level === "intermediate" ? "short" : "full";
  const guideKey = current === 1 ? (chosen ? "s1back" : "s1") : current === 2 ? (revealed ? "s2post" : "s2pre") : replayDone ? "s3post" : "s3pre";
  // Moving between steps by focus or click only updates the display: it is not announced.
  // Pointer focus is not tracked here (the click that follows is): updating the guide on mouse down would shift the layout under the pointer and the click could miss.
  const trackFocus = (event: { target: EventTarget }, n: Step) => { const el = event.target as Element; if (typeof el.matches === "function" && el.matches(":focus-visible")) track(n); };
  const track = (n: Step) => { if (n <= unlocked && n !== current) { setQuiet(true); setCurrent(n); } };
  const guideText = j.guide[guideKey][detail];

  const barPart = (r: ViewResult) => {
    const total = Math.max(r.value, r.contributed);
    if (!(total > 0)) return null;
    const own = Math.min(r.value, r.contributed);
    const delta = Math.abs(r.profit);
    return { own: (own / total) * 100, delta: (delta / total) * 100, kind: (r.profit > 0.005 ? "gain" : r.profit < -0.005 ? "loss" : "none") as "gain" | "loss" | "none" };
  };


  const verdict = currentResult && guess ? evaluatePrediction(guess, currentResult.profit, currentResult.contributed) : null;
  const actualText = verdict ? (verdict.actual === "more" ? j.actualMore : verdict.actual === "less" ? j.actualLess : j.actualSame) : "";

  /** What step 2 used to show. It is rendered only inside the replay summary, once the whole journey has been lived. */
  const renderReveal = () => {
    if (!currentResult) return null;
    const bar = barPart(currentResult);
    return (
      <div className="sim-result">
        <h3>{j.resultTitle}</h3>
        <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {`${t.resultUpdated}: ${euro(currentResult.value)}, ${t.totalPaid}: ${euro(currentResult.contributed)}.${verdict && guess ? ` ${j.yourGuess(j.answers[guess])} ${actualText} ${verdict.matched ? j.matched : j.missed}` : ""}`}
        </span>
        <div className="jr-feedback">
          <p className="jr-fact">{j.fact(euro(currentResult.value), euro(currentResult.contributed), signedEuro(currentResult.profit))}</p>
          {verdict && guess && <p>{j.yourGuess(j.answers[guess])} {actualText} <strong>{verdict.matched ? j.matched : j.missed}</strong></p>}
        </div>
        <dl className="sim-values">
          <div><dt>{t.finalValue}</dt><dd><strong>{euro(currentResult.value)}</strong></dd></div>
          <div><dt>{t.totalPaid}</dt><dd><strong>{euro(currentResult.contributed)}</strong></dd></div>
          <div><dt>{t.delta}</dt><dd><strong>{euro(currentResult.profit)}</strong><small>{t.gainDefinition}</small></dd></div>
        </dl>
        {bar && (
          <div className="jr-split" role="img" aria-label={j.barLabel(euro(Math.min(currentResult.value, currentResult.contributed)), euro(Math.abs(currentResult.profit)), bar.kind)}>
            <span className="jr-split-own" style={{ width: `${bar.own}%` }} />
            {bar.kind !== "none" && <span className={`jr-split-${bar.kind}`} style={{ width: `${bar.delta}%` }} />}
            <span className="jr-split-legend" aria-hidden="true">
              <span><i className="jr-key-own" />{j.ownMoney}</span>
              {bar.kind === "gain" && <span><i className="jr-key-gain" />{j.gain}</span>}
              {bar.kind === "loss" && <span><i className="jr-key-loss" />{j.loss}</span>}
            </span>
          </div>
        )}
        <p className="jr-achievement"><Award size={16} aria-hidden="true" />{j.achievement}</p>
        <div className="result-help">
          <MessageCircle size={23} aria-hidden="true" />
          <div><strong>{t.explainResult}</strong><p>{j.helpText}</p></div>
          <button className="button dark" type="button" onClick={() => openAssistant(language === "es" ? "¿Qué significa este resultado?" : "What does this result mean?")}>{j.explain}<ArrowRight size={17} /></button>
        </div>
        <button className="button outline decline-trigger" type="button" onClick={openSimulationDecline}><TrendingDown size={17} />{j.declines}</button>
      </div>
    );
  };

  const cards = useMemo(() => instruments.map(item => ({ item, metrics: fundMetrics(navHistory, item.identifier) })), [instruments, navHistory]);
  const numberFmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });

  return (
    <>
      <PageIntro title={t.simTitle} description={j.pageIntro} embedded={embedded} />

      <div className="journey" data-level={level}>
        <nav className="jr-stepper" aria-label={j.navLabel}>
          <p className="jr-progress">{j.stepOf(current)}</p>
          <ol>
            {([1, 2, 3] as const).map(n => {
              const locked = n > unlocked;
              return (
                <li key={n}>
                  <button
                    type="button"
                    className={`jr-step-btn jr-c${n}`}
                    aria-current={current === n ? "step" : undefined}
                    aria-disabled={locked || undefined}
                    onClick={() => goTo(n)}
                  >
                    <span className="jr-num" aria-hidden="true">{locked ? <Lock size={13} /> : n}</span>
                    <span>{j.steps[n - 1]}</span>
                    {locked && <span className="sr-only"> ({j.locked[n - 1]})</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className={`jr-guide jr-c${current}`}>
          <Lightbulb size={20} aria-hidden="true" />
          <div className="jr-guide-body">
            <strong>{j.guideLabel}</strong>
            <div aria-live={quiet ? "off" : "polite"} aria-atomic="true" id="jr-guide-text">{guideOpen && <p>{guideText}</p>}</div>
          </div>
          {level === "advanced" && (
            <button type="button" className="jr-guide-toggle" aria-expanded={guideOpen} aria-controls="jr-guide-text" onClick={() => setGuideOpen(open => !open)}>
              {guideOpen ? j.guideHide : j.guideShow}
            </button>
          )}
        </div>

        <section id="jr-step-1" className="jr-step jr-c1" aria-labelledby="jr-h-1" onFocusCapture={event => trackFocus(event, 1)} onClickCapture={() => track(1)}>
          <p className="jr-step-label">{j.stepOf(1)}</p>
          <h2 id="jr-h-1" tabIndex={-1}>{j.s1Title}</h2>
          {replayStarted && !step1Open ? (
            // While the replay runs the full-series sparklines and drawdowns are not on screen: only the chosen fund remains.
            <div className="jr-collapsed">
              <p><strong>{j.chosenFund}:</strong> {selected.name[language]} · {selected.manager}</p>
              {/* Opens on pointer down too: the click itself can miss because the guide text above changes height as soon as the step 1 section takes focus. */}
              <button type="button" className="button outline" onPointerDown={event => { if (event.button === 0) { setStep1Open(true); goTo(1); } }} onClick={() => { setStep1Open(true); goTo(1); }}>{j.changeFund}</button>
            </div>
          ) : (
            <>
          <p className="jr-intro">{j.s1Intro}</p>
            <p className="jr-source-note"><FlaskConical size={16} aria-hidden="true" /><span>{!chosen || selected.dataStatus === "historical_nav" ? j.banner : selected.dataStatus === "fictional" ? t.simWarning : selected.dataStatus === "annual_history" ? t.historyIntro : t.missingHistory}</span></p>
            <div className="jr-funds" role="radiogroup" aria-label={t.instrument}>
              {cards.map(({ item, metrics }) => {
                const usable = item.dataStatus === "historical_nav" && metrics.values.length > 1;
                const checked = chosen && pickedId === item.instrumentId;
                const points = sparklinePoints(metrics.values, 120, 36);
                const id = `jr-fund-${item.instrumentId}`;
                return (
                  <label key={item.instrumentId} className={`jr-fund${checked ? " is-checked" : ""}${usable ? "" : " is-disabled"}`}>
                    <input
                      type="radio"
                      name="jr-fund"
                      value={item.instrumentId}
                      checked={checked}
                      disabled={!usable}
                      aria-labelledby={`${id}-name`}
                      aria-describedby={`${id}-info`}
                      onChange={() => chooseFund(item)}
                    />
                    <span className="jr-fund-card">
                      <span className="jr-fund-name" id={`${id}-name`}>{item.name[language]} · {item.manager}</span>
                      <span id={`${id}-info`} className="jr-fund-info">
                        {item.assetClass !== "unknown" && <span className="jr-chip">{j.assetClass[item.assetClass]}</span>}
                        {usable ? (
                          <>
                            {points && (
                              <svg className="jr-spark" viewBox="0 0 120 36" aria-hidden="true" focusable="false"><polyline points={points} fill="none" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" /></svg>
                            )}
                            <dl className="jr-fund-facts">
                              <div>
                                <dt>{j.drawdown}</dt>
                                <dd>{metrics.maxDrawdown === null ? j.drawdownNone : metrics.maxDrawdown === 0 ? "0 %" : `${MINUS}${numberFmt.format(Math.abs(metrics.maxDrawdown))} %`}</dd>
                              </div>
                            </dl>
                            <small>{j.period(monthLabel(metrics.first, language), monthLabel(metrics.last, language))}</small>
                            {level === "beginner" && <small>{j.drawdownHelp}</small>}
                            {level === "advanced" && <small>{t.identifierLabel}: {item.identifier}{item.shareClass ? ` · ${t.classLabel}: ${item.shareClass}` : ""}</small>}
                          </>
                        ) : (
                          <small>{t.missingHistory}</small>
                        )}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            {chosen && (
              <div className="jr-costs">
                <ProductCosts product={bankProfile?.products.find(p => p.instrumentId === selected.instrumentId)} profile={bankProfile} language={language} />
              </div>
            )}
            </>
          )}
        </section>

        {unlocked >= 2 && (
          <section id="jr-step-2" className="jr-step jr-c2" aria-labelledby="jr-h-2" onFocusCapture={event => trackFocus(event, 2)} onClickCapture={() => track(2)}>
            <p className="jr-step-label">{j.stepOf(2)}</p>
            <h2 id="jr-h-2" tabIndex={-1}>{j.s2Title}</h2>
            <p className="jr-intro">{j.s2Intro}</p>
            <form className="jr-form" noValidate onSubmit={event => { event.preventDefault(); if (revealed) run(event); }}>
              <div className="jr-presets" role="group" aria-label={j.presets}>
                {PRESETS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className="jr-preset"
                    aria-pressed={matchesPreset(p, initial, monthly) && contributionFrequency === "monthly"}
                    onClick={() => { if (initial === String(p.initial) && monthly === String(p.monthly) && contributionFrequency === "monthly") return; edit(() => { setInitial(String(p.initial)); setMonthly(String(p.monthly)); setContributionFrequency("monthly"); }); }}
                  >
                    {p.id === "lump" ? j.lump(money(p.initial)) : j.gradual(money(p.monthly))}
                  </button>
                ))}
              </div>
              <div className="jr-inputs">
                <label className="jr-input">
                  <span className="jr-input-label">{t.initial}</span>
                  <span className="jr-field">
                    <input
                      type="number" inputMode="decimal" min="0" max={MAX_SIMULATION_AMOUNT} step="any"
                      aria-invalid={error === "initial" || error === "amounts"} aria-describedby={error === "initial" || error === "amounts" ? "sim-error" : undefined}
                      value={initial} required
                      onChange={e => edit(() => setInitial(e.target.value))}
                    />
                    <span aria-hidden="true">€</span>
                  </span>
                </label>
                <label className="jr-input">
                  <span className="jr-input-label">{contributionFrequency === "annual" ? j.annualAmount : t.monthly} <small>{t.optional.toLowerCase()}</small></span>
                  <span className="jr-field">
                    <input
                      type="number" inputMode="decimal" min="0" max={MAX_SIMULATION_AMOUNT} step="any"
                      aria-invalid={error === "monthly" || error === "amounts"} aria-describedby={error === "monthly" || error === "amounts" ? "sim-error" : undefined}
                      value={monthly}
                      onChange={e => edit(() => setMonthly(e.target.value))}
                    />
                    <span aria-hidden="true">{contributionFrequency === "annual" ? j.perYear : t.perMonth}</span>
                  </span>
                </label>
              </div>
              {error && (
                <p id="sim-error" className="error" role="alert">
                  {error === "amounts" ? j.bothZero : <>{error === "initial" ? t.initial : error === "annual" ? t.annualContribution : error === "monthly" ? t.monthly : t.invalid}: {t.amountError}</>}
                </p>
              )}
              <div className="jr-slider">
                <label htmlFor="jr-months">{t.duration}</label>
                <input
                  id="jr-months" type="range" min={1} max={Math.max(1, cap)} step={1}
                  value={Number.isInteger(monthsNumber) ? Math.min(Math.max(monthsNumber, 1), Math.max(1, cap)) : 12}
                  aria-valuetext={j.monthsText(monthsNumber, endLabel)}
                  onChange={e => edit(() => setMonths(e.target.value))}
                />
                <output htmlFor="jr-months">{j.monthsValue(monthsNumber)}{endLabel && <> · {j.until(endLabel)}</>}</output>
              </div>
              <details className="jr-more">
                <summary>{j.moreOptions}</summary>
                <label className="jr-input">
                  <span className="jr-input-label">{j.frequency}</span>
                  <span className="jr-field">
                    <select value={contributionFrequency} onChange={e => edit(() => setContributionFrequency(e.target.value as "monthly" | "annual"))}>
                      <option value="monthly">{j.monthlyOpt}</option>
                      <option value="annual">{j.annualOpt}</option>
                    </select>
                  </span>
                </label>
                {contributionFrequency === "annual" && <p className="jr-note">{j.annualNote}</p>}
              </details>
              {revealed && (
                <div className="jr-refresh">
                  <button className="button outline" type="submit">{j.refresh}</button>
                  <small>{j.refreshHelp}</small>
                </div>
              )}
            </form>

            {!revealed && (
              <div className="jr-predict" role="group" aria-labelledby="jr-q">
                <p id="jr-q" className="jr-question">{j.question}</p>
                <p className="jr-note">{error ? j.invalidAnswer : j.questionHelp}</p>
                <div className="jr-answers">
                  {(["more", "less", "same"] as const).map(g => {
                    const Icon = g === "more" ? TrendingUp : g === "less" ? TrendingDown : Minus;
                    return <button key={g} type="button" className="jr-answer" aria-disabled={error ? true : undefined} onClick={() => answer(g)}><Icon size={18} aria-hidden="true" />{j.answers[g]}</button>;
                  })}
                </div>
              </div>
            )}

            {revealed && (
              <div className="jr-ack" aria-busy={!currentResult && !error}>
                <div className="jr-result-head">
                  <h3 id="jr-result-title" tabIndex={-1}>{j.ackTitle}</h3>
                  <span className="pill">{j.pill}</span>
                </div>
                <p><strong>{selected.name[language]}</strong> · {j.manager}: {selected.manager}</p>
                <div className="jr-feedback" role="status" aria-live="polite" aria-atomic="true">
                  {guess ? <p className="jr-fact">{j.yourGuess(j.answers[guess])}</p> : null}
                  <p>{guess ? j.ackLater : j.ackExample}</p>
                </div>
                {!currentResult && (
                  <div role="status" className="jr-pending">
                    <p>{error ? t.amountError : j.pending}</p>
                  </div>
                )}
                <details className="jr-more jr-info">
                  <summary>{j.moreInfo}</summary>
                  <div className="source-details">
                    <p>
                      {t.managerLabel}: {selected.manager}
                      {selected.identifier && <> · {t.identifierLabel}: {selected.identifier}</>}
                      {selected.shareClass && <> · {t.classLabel}: {selected.shareClass}</>}
                      {selected.currency && <> · {selected.currency}</>}
                    </p>
                    {selected.sourceUrl && (
                      <p>
                        <a href={selected.sourceUrl} target="_blank" rel="noreferrer">CNMV <ArrowUpRight size={14} /></a> · {t.sourceChecked}: {selected.sourceDate}
                      </p>
                    )}
                  </div>
                  <div className="assumption"><CircleHelp size={16} /><span>{j.assumption}</span></div>
                </details>
                <button className="button dark jr-next" type="button" onClick={() => goTo(3)}>{j.goStep3}<ArrowRight size={16} /></button>
              </div>
            )}
          </section>
        )}

        {unlocked >= 3 && (
          <section id="jr-step-3" className="jr-step jr-c3" aria-labelledby="tm-title" onFocusCapture={event => trackFocus(event, 3)} onClickCapture={() => track(3)}>
            {currentResult ? (
              <Suspense fallback={<p role="status">{language === "es" ? "Cargando recorrido…" : "Loading journey…"}</p>}>
                <TimeMachine
                  key={`${selected.instrumentId}|${currentResult.initial}|${currentResult.monthly}|${currentResult.months}|${contributionFrequency}|${currentResult.value}`}
                  language={language} mode={mode} fund={selected} instruments={instruments} navHistory={navHistory}
                  result={{ initial: currentResult.initial, monthly: currentResult.monthly, months: currentResult.months, timeline: currentResult.timeline }}
                  frequency={contributionFrequency} euro={euro} assumption={j.assumption} onFinished={setReplayDone} onStarted={setReplayStarted} renderReveal={renderReveal}
                />
              </Suspense>
            ) : (
              <>
                <p className="jr-step-label">{tm.stepLabel}</p>
                <h2 id="tm-title" tabIndex={-1}>{tm.title}</h2>
                <p role="status" className="jr-pending">{error ? t.amountError : tm.pending}</p>
              </>
            )}
          </section>
        )}
      </div>
    </>
  );
}

function reducedMotion() {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
}

function PageIntro({ title, description, embedded }: { title: string; description: string; embedded?: boolean }) {
  return (
    <div className={`page-heading internal${embedded ? " embedded" : ""}`}>
      <div>
        {!embedded && <h1>{title}</h1>}
        <p>{description}</p>
      </div>
    </div>
  );
}
