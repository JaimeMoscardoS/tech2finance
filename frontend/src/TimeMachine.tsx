import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Check, CircleHelp, Flag, Info, Lightbulb, Minus, Pause, Play, RotateCcw, SkipForward, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import type { Instrument } from './catalog';
import type { Language } from './copy';
import { requestJson, isGameComparison, type NavHistory } from './server-api';
import { GAME_EXCLUDED_BANK_IDS, buildGameSpec, gameInstruments, gameMaxMonths, localizeAssumption, summarizeGame, validateGame, type GameSummary } from './game-domain';
import { monthLabel } from './journey-domain';
import { detectPausePoints, offersDecision, pauseAt, standing, visibleWindow, type PausePoint, type ReplayRow } from './time-machine-domain';
import { tmCopy } from './time-machine-copy';
import './time-machine.css';

type Props = {
  language: Language;
  mode: 'server' | 'local';
  fund: Instrument;
  instruments: Instrument[];
  navHistory: Pick<NavHistory, 'instruments' | 'source'>;
  result: { initial: number; monthly: number; months: number; timeline: readonly ReplayRow[] };
  frequency: 'monthly' | 'annual';
  euro: (value: number) => string;
  /** Localized assumption text of the step 2 result, used when no sale was calculated. */
  assumption: string;
  /** Final reveal of step 2 (final value, prediction check, tutor shortcuts): shown only inside the summary, after the last month. */
  renderReveal?: (sold: boolean) => ReactNode;
  onFinished?: (finished: boolean) => void;
  /** True once the first month has been shown (and false again after a restart or unmount). */
  onStarted?: (started: boolean) => void;
};
type Answer = { month: number; label: string; text: string; ok: boolean | null };
type Sale = { month: number; summary: GameSummary; assumptions: string[] };
const SPEEDS = [1, 2] as const;
const TICK_MS = 1000;

function useReducedMotion() {
  const query = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)'); } catch { return null; } };
  const [reduced, setReduced] = useState(() => query()?.matches ?? false);
  useEffect(() => {
    const media = query();
    if (!media) return;
    const update = () => setReduced(media.matches);
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

export default function TimeMachine({ language, mode, fund, instruments, navHistory, result, frequency, euro, assumption, renderReveal, onFinished, onStarted }: Props) {
  const t = tmCopy[language];
  const locale = language === 'es' ? 'es-ES' : 'en-GB';
  const rows = result.timeline;
  const last = rows.length - 1;
  const pauses = useMemo(() => detectPausePoints(rows), [rows]);
  const dropPause = pauses.find(p => p.kinds.includes('drop'));
  const reduced = useReducedMotion();

  const [month, setMonth] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [resolved, setResolved] = useState<ReadonlySet<number>>(new Set());
  const [open, setOpen] = useState<PausePoint | null>(null);
  const [cardAnswer, setCardAnswer] = useState<Answer | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [sale, setSale] = useState<Sale | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const request = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const cardHeading = useRef<HTMLHeadingElement>(null);
  const summaryHeading = useRef<HTMLHeadingElement>(null);
  const finished = month === last && open === null;
  useEffect(() => { onFinished?.(finished); }, [finished]);
  useEffect(() => { onStarted?.(month > 0); }, [month > 0]);
  useEffect(() => () => { generation.current++; request.current?.abort(); onFinished?.(false); onStarted?.(false); }, []);

  const dateText = (row: ReplayRow | undefined, index: number) => (row?.date ? monthLabel(row.date, language) || `${t.axisMonth} ${index}` : `${t.axisMonth} ${index}`);
  const signed = (n: number) => `${n > 0 ? '+' : ''}${euro(n)}`;
  const row = rows[month];
  const profitKind = standing(row);
  const announce = (text: string) => setAnnouncement(text);
  const monthText = (m: number) => t.live.month(m, last, euro(rows[m].value), euro(rows[m].contributed));

  const decisionBlock: 'local' | 'bank' | 'annual' | null =
    mode === 'local' ? 'local' : !gameInstruments(instruments).some(i => i.instrumentId === fund.instrumentId) || GAME_EXCLUDED_BANK_IDS.includes(fund.bankId) ? 'bank' : frequency === 'annual' ? 'annual' : null;

  const arrive = (next: number, source: 'play' | 'step') => {
    setMonth(next);
    const pause = pauseAt(pauses, next);
    if (pause && !resolved.has(next)) {
      setPlaying(false);
      setCardAnswer(null);
      setFailed(false);
      setOpen(pause);
      announce(`${t.live.paused(next)} ${t.pauseBadge[pause.kinds[0]]}. ${monthText(next)}${next === last ? ` ${t.live.end}` : ''}`);
    } else if (source === 'step') announce(monthText(next));
  };
  const next = (source: 'play' | 'step') => { if (!open && month < last) arrive(month + 1, source); };
  useEffect(() => {
    if (!playing || open || reduced || month >= last) return;
    const timer = setTimeout(() => next('play'), TICK_MS / speed);
    return () => clearTimeout(timer);
  }, [playing, open, month, speed, reduced]);
  useEffect(() => { if (reduced) setPlaying(false); }, [reduced]);
  useEffect(() => { if (open) requestAnimationFrame(() => cardHeading.current?.focus()); }, [open]);

  const backToControls = (atEnd: boolean) => requestAnimationFrame(() => {
    if (atEnd) summaryHeading.current?.focus();
    else document.getElementById(reduced ? 'tm-next' : 'tm-play')?.focus();
  });
  const closePause = (pause: PausePoint) => {
    setResolved(previous => new Set(previous).add(pause.month));
    setOpen(null);
    setCardAnswer(null);
    backToControls(pause.month === last);
  };
  const record = (answer: Answer) => setAnswers(previous => [...previous, answer]);

  // The question of a pause, built only from months up to the visible one.
  const question = (pause: PausePoint) => {
    const r = rows[pause.month];
    const paid = euro(r.contributed);
    const value = euro(r.value);
    const primary = pause.kinds[0];
    if (primary === 'high') {
      return {
        text: t.qOwn,
        options: [{ key: 'paid', label: t.aOwnPaid(paid) }, { key: 'all', label: t.aOwnAll(value) }],
        evaluate: (key: string) => { const ok = key === 'paid'; return { ok, feedback: t.fOwn(paid, euro(Math.abs(r.profit)), ok) }; },
      };
    }
    if (primary === 'end') {
      return {
        text: t.qEnd,
        options: [{ key: 'yes', label: t.aEnd.yes }, { key: 'no', label: t.aEnd.no }],
        evaluate: (key: string) => { const ok = key === 'no'; return { ok, feedback: t.fEnd(ok) }; },
      };
    }
    const labels = primary === 'recover' ? t.aStandingRecover : t.aStanding;
    const actual = standing(r);
    return {
      text: primary === 'recover' ? t.qStandingRecover(paid, value) : t.qStanding(paid, value),
      options: (['more', 'less', 'same'] as const).map(key => ({ key, label: labels[key] })),
      evaluate: (key: string) => { const ok = key === actual; return { ok, feedback: t.fStanding(euro(Math.abs(r.profit)), actual, ok) }; },
    };
  };
  const answer = (pause: PausePoint, key: string, label: string) => {
    const q = question(pause);
    const outcome = q.evaluate(key);
    const entry: Answer = { month: pause.month, label: `${q.text} → ${label}`, text: outcome.feedback, ok: outcome.ok };
    setCardAnswer(entry);
    record(entry);
    announce(`${t.yourAnswer}: ${label}. ${outcome.feedback}`);
  };

  const keep = (pause: PausePoint) => {
    if (busy) return; // a sale is in flight: keeping now would race with its response
    record({ month: pause.month, label: t.kept(pause.month), text: '', ok: null });
    announce(t.kept(pause.month));
    closePause(pause);
  };
  const sell = async (pause: PausePoint) => {
    if (busy || sale) return;
    let spec;
    try {
      spec = buildGameSpec({ initial: result.initial, monthly: result.monthly, months: result.months, sellMonth: pause.month, buyFeePercent: 0, sellFeePercent: 0 }, fund, gameMaxMonths(fund, navHistory));
    } catch { setFailed(true); return; }
    const current = ++generation.current;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true); setFailed(false);
    try {
      const response = await requestJson('/api/game/compare', isGameComparison, spec, controller.signal);
      validateGame(spec, response);
      const summary = summarizeGame(response);
      if (generation.current !== current) return;
      const point = summary.series[pause.month];
      const text = t.sold(pause.month, euro(point.sell), euro(point.hold));
      setSale({ month: pause.month, summary, assumptions: response.assumptions });
      record({ month: pause.month, label: t.sell, text, ok: null });
      announce(text);
      closePause(pause);
    } catch {
      if (generation.current === current) setFailed(true);
    } finally {
      if (generation.current === current) { setBusy(false); request.current = null; }
    }
  };

  const restart = () => {
    generation.current++; request.current?.abort(); request.current = null;
    setMonth(0); setPlaying(false); setResolved(new Set()); setOpen(null); setCardAnswer(null); setAnswers([]); setSale(null); setBusy(false); setFailed(false);
    announce('');
    requestAnimationFrame(() => document.getElementById(reduced ? 'tm-next' : 'tm-play')?.focus());
  };

  // Everything drawn or written below comes from `visible`: months after the visible one never reach the DOM.
  const visible = visibleWindow(rows, month);
  const data = visible.map((r, i) => ({
    month: i,
    hold: sale ? sale.summary.series[i].hold : r.value,
    contributed: r.contributed,
    sell: sale && i >= sale.month ? sale.summary.series[i].sell : undefined,
  }));
  const saleNow = sale && month >= sale.month ? sale.summary.series[month] : null;
  const holdValue = sale ? sale.summary.series[month].hold : row.value;
  const holdProfit = holdValue - row.contributed;
  const dropVisible = dropPause && month >= dropPause.month ? dropPause : null;
  const compact = (n: number) => new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  const pct = (n: number) => `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(Math.abs(n))} %`;
  const trend = (n: number) => (n > 0.005 ? 'up' : n < -0.005 ? 'down' : 'flat');
  const profitTrend = trend(holdProfit);
  const TrendIcon = profitTrend === 'up' ? TrendingUp : profitTrend === 'down' ? TrendingDown : Minus;
  const trendWord = profitTrend === 'up' ? t.gain : profitTrend === 'down' ? t.loss : t.level;
  const q = open ? question(open) : null;
  const canDecide = open ? offersDecision(open, last) : false;
  const controlsLocked = open !== null;
  const atEnd = month >= last;

  const learned = [
    t.learned.own,
    ...(dropPause?.dropPercent !== undefined ? [t.learned.drop(pct(dropPause.dropPercent), dateText(rows[dropPause.month], dropPause.month))] : []),
    t.learned.past,
    ...(sale ? [t.learned.liquidity] : []),
  ];
  if (learned.length > 3) learned.splice(1, 1);
  const period = rows[0].date && rows[last].date ? `${monthLabel(rows[0].date, language)} – ${monthLabel(rows[last].date, language)}` : '';
  const assumptions = sale ? sale.assumptions.map(a => localizeAssumption(a, language)) : [assumption];

  return (
    <div className="tm" data-month={month}>
      <p className="jr-step-label">{t.stepLabel}</p>
      <h2 id="tm-title" tabIndex={-1}>{t.title}</h2>
      <p className="jr-intro">{t.intro}</p>

      <div className="tm-stage">
        <p className="tm-month"><Flag size={16} aria-hidden="true" /><span>{t.monthOf(month, last)}</span><span className="tm-date">{dateText(row, month)}</span></p>
        <div className="tm-bar" aria-hidden="true"><span style={{ width: `${last > 0 ? (month / last) * 100 : 0}%` }} /></div>

        <dl className="tm-readout">
          <div className="tm-big tm-value"><dt>{sale ? t.ifHold : t.valueToday}</dt><dd>{euro(holdValue)}</dd></div>
          <div className="tm-big"><dt>{t.paid}</dt><dd>{euro(row.contributed)}</dd></div>
          <div className={`tm-big tm-gl tm-${profitTrend}`}>
            <dt>{t.gainLoss}</dt>
            <dd><TrendIcon size={22} aria-hidden="true" /><span>{signed(holdProfit)}</span><small>{trendWord}</small></dd>
          </div>
          {saleNow && (
            <div className="tm-big tm-decision"><dt>{t.yourDecision}</dt><dd><span>{euro(saleNow.sell)}</span><small>{signed(saleNow.sell - row.contributed)}</small></dd></div>
          )}
        </dl>

        <div className="tm-controls" role="group" aria-label={t.controls}>
          {!reduced && (playing
            ? <button type="button" id="tm-play" className="tm-btn tm-primary" onClick={() => { setPlaying(false); announce(`${t.pause}. ${monthText(month)}`); }}><Pause size={18} aria-hidden="true" />{t.pause}</button>
            : <button type="button" id="tm-play" className="tm-btn tm-primary" aria-disabled={controlsLocked || atEnd || undefined} onClick={() => { if (!controlsLocked && !atEnd) setPlaying(true); }}><Play size={18} aria-hidden="true" />{t.play}</button>)}
          <button type="button" id="tm-next" className="tm-btn" aria-disabled={controlsLocked || atEnd || undefined} onClick={() => { if (!controlsLocked && !atEnd) { setPlaying(false); next('step'); } }}><SkipForward size={18} aria-hidden="true" />{t.next}</button>
          {!reduced && (
            <div className="tm-speed" role="group" aria-label={t.speed}>
              {SPEEDS.map(s => <button key={s} type="button" className="tm-btn tm-chip" aria-pressed={speed === s} onClick={() => setSpeed(s)}>{t.speedOf(s)}</button>)}
            </div>
          )}
          {atEnd && !open && <button type="button" className="tm-btn" onClick={restart}><RotateCcw size={18} aria-hidden="true" />{t.restart}</button>}
        </div>
        {reduced && <p className="tm-note">{t.reduced}</p>}
      </div>

      {open && q && (
        <section className={`tm-card tm-kind-${open.kinds[0]}`} aria-labelledby="tm-q-title" data-pause={open.month} data-kinds={open.kinds.join(' ')}>
          <p className="tm-badge">
            {open.kinds[0] === 'drop' ? <TrendingDown size={16} aria-hidden="true" /> : open.kinds[0] === 'end' ? <Flag size={16} aria-hidden="true" /> : <Lightbulb size={16} aria-hidden="true" />}
            <span>{open.kinds.map(k => t.pauseBadge[k]).join(' · ')}</span>
          </p>
          <h3 id="tm-q-title" tabIndex={-1} ref={cardHeading}>{q.text}</h3>
          <p className="tm-fact">
            {open.kinds[0] === 'drop' && open.dropPercent !== undefined ? t.dropFact(pct(open.dropPercent))
              : open.kinds[0] === 'high' ? t.highFact : open.kinds[0] === 'recover' ? t.recoverFact : open.kinds[0] === 'end' ? t.endFact : ''}
          </p>
          {!cardAnswer ? (
            <div className="tm-options">
              {q.options.map(o => <button key={o.key} type="button" className="tm-btn tm-option" onClick={() => answer(open, o.key, o.label)}>{o.label}</button>)}
            </div>
          ) : (
            <div className="tm-feedback">
              <p className={`tm-verdict ${cardAnswer.ok ? 'is-ok' : 'is-miss'}`}>{cardAnswer.ok ? <Check size={16} aria-hidden="true" /> : <CircleHelp size={16} aria-hidden="true" />}<span>{cardAnswer.text}</span></p>
              {canDecide ? (
                <div className="tm-decide">
                  <h4>{t.decisionTitle}</h4>
                  {sale ? <p className="tm-note">{t.decisionDone}</p>
                    : decisionBlock ? <p className="tm-note" data-block={decisionBlock}>{decisionBlock === 'local' ? t.decisionLocal : decisionBlock === 'annual' ? t.decisionAnnual : t.decisionBank}</p>
                    : <p className="tm-note">{t.decisionHelp}</p>}
                  {failed && <p role="alert" className="tm-error">{t.sellError}</p>}
                  <div className="tm-options">
                    {!sale && !decisionBlock && (
                      <>
                        <button type="button" className="tm-btn" aria-disabled={busy || undefined} onClick={() => keep(open)}>{t.keep}</button>
                        <button type="button" className="tm-btn" aria-disabled={busy || undefined} onClick={() => void sell(open)}>{busy ? t.selling : t.sell}</button>
                      </>
                    )}
                    {(sale || decisionBlock) && <button type="button" className="tm-btn tm-primary" onClick={() => closePause(open)}>{t.cont}</button>}
                  </div>
                </div>
              ) : (
                <div className="tm-options"><button type="button" className="tm-btn tm-primary" onClick={() => closePause(open)}>{t.cont}</button></div>
              )}
            </div>
          )}
          {!cardAnswer && <button type="button" className="tm-skip" onClick={() => closePause(open)}>{t.skip}</button>}
        </section>
      )}

      <div className="tm-chart">
        <div className="tm-legend" aria-hidden="true">
          <span><i className="tm-key tm-key-hold" />{sale ? t.legendHold : t.legendValue}</span>
          <span><i className="tm-key tm-key-paid" />{t.legendPaid}</span>
          {sale && <span><i className="tm-key tm-key-sell" />{t.legendSell}</span>}
          {dropVisible && <span><TrendingDown size={13} />{t.legendDrop}</span>}
        </div>
        <div className="tm-plot" role="img" aria-label={t.chartLabel(month, euro(row.contributed), euro(holdValue), saleNow ? euro(saleNow.sell) : null)}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={data} accessibilityLayer={false} margin={{ top: 16, right: 16, bottom: 6, left: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--jr-grid)" strokeDasharray="2 4" />
              <XAxis type="number" dataKey="month" domain={[0, last]} allowDecimals={false} stroke="var(--muted)" tick={{ fill: 'var(--muted)', fontSize: 12 }} />
              <YAxis stroke="var(--muted)" width={56} tick={{ fill: 'var(--muted)', fontSize: 12 }} tickFormatter={compact} domain={['auto', 'auto']} />
              <Line type="linear" dataKey="contributed" name={t.legendPaid} stroke="var(--jr-line-paid)" strokeWidth={2} strokeDasharray="3 4" dot={false} isAnimationActive={false} />
              <Line type="linear" dataKey="hold" name={sale ? t.legendHold : t.legendValue} stroke="var(--jr-line-hold)" strokeWidth={3} dot={false} isAnimationActive={false} />
              {sale && <Line type="linear" dataKey="sell" name={t.legendSell} stroke="var(--jr-line-sell)" strokeWidth={3} strokeDasharray="8 5" dot={false} connectNulls={false} isAnimationActive={false} />}
              {sale && month >= sale.month && <ReferenceLine x={sale.month} stroke="var(--jr-line-sell)" strokeDasharray="2 3" label={{ value: t.legendSale, position: 'insideTopLeft', fill: 'var(--ink)', fontSize: 12, fontWeight: 600 }} />}
              {dropVisible && <ReferenceDot x={dropVisible.month} y={sale ? sale.summary.series[dropVisible.month].hold : rows[dropVisible.month].value} r={6} fill="var(--jr-coral)" stroke="var(--ink)" strokeWidth={2} ifOverflow="extendDomain" />}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <details className="tm-table-details">
          <summary>{t.table}</summary>
          <div className="tm-table-wrap" role="region" aria-label={t.tableCaption} tabIndex={0}>
            <table>
              <caption>{t.tableCaption}</caption>
              <thead><tr><th scope="col">{t.colMonth}</th><th scope="col">{t.colDate}</th><th scope="col">{t.colValue}</th><th scope="col">{t.colPaid}</th><th scope="col">{t.colGain}</th>{sale && <th scope="col">{t.colSell}</th>}</tr></thead>
              <tbody>
                {visible.map((r, i) => (
                  <tr key={i}>
                    <th scope="row">{i}</th><td>{dateText(r, i)}</td><td>{euro(data[i].hold)}</td><td>{euro(r.contributed)}</td><td>{signed(data[i].hold - r.contributed)}</td>
                    {sale && <td>{data[i].sell === undefined ? '—' : euro(data[i].sell!)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>

      {answers.length > 0 && (
        <section className="tm-answers" aria-labelledby="tm-answers-title">
          <h3 id="tm-answers-title">{t.answersTitle}</h3>
          <ul>
            {answers.map((a, i) => <li key={i}><strong>{t.monthOf(a.month, last)}</strong> · {a.label}{a.text && <><br /><span>{a.text}</span></>}</li>)}
          </ul>
        </section>
      )}

      {finished && (
        <section className="tm-summary" aria-labelledby="tm-summary-title">
          <h3 id="tm-summary-title" tabIndex={-1} ref={summaryHeading}>{t.summaryTitle}</h3>
          <p className="tm-summary-text">
            {sale
              ? t.summarySold(sale.month, euro(sale.summary.series[last].sell), euro(sale.summary.series[last].hold))
              : t.summaryHeld(euro(row.contributed), euro(row.value), signed(row.profit))}
          </p>
          {renderReveal?.(!!sale)}
          <h4>{t.learnedTitle}</h4>
          <ul className="tm-learned">{learned.map((text, i) => <li key={i}><Lightbulb size={15} aria-hidden="true" />{text}</li>)}</ul>
          <details className="tm-more">
            <summary><Info size={16} aria-hidden="true" />{t.more}</summary>
            <div>
              <p><Wallet size={14} aria-hidden="true" /> <strong>{fund.name[language]}</strong> · {fund.manager}</p>
              {period && <p>{t.period}: {period}</p>}
              {fund.sourceUrl && <p><a href={fund.sourceUrl} target="_blank" rel="noreferrer">{t.sourceLink}</a>{fund.sourceDate ? ` · ${t.checked}: ${fund.sourceDate}` : ''}</p>}
              {/^https:\/\//.test(navHistory.source?.legalUrl ?? '') && <p><a href={navHistory.source.legalUrl} target="_blank" rel="noreferrer">{t.legal}</a></p>}
              <h4>{t.assumptions}</h4>
              <ul>{assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
              <p className="tm-note">{t.learnMore}</p>
            </div>
          </details>
        </section>
      )}

      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true" id="tm-live">{announcement}</div>
    </div>
  );
}
