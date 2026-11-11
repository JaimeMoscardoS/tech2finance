import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, Award } from 'lucide-react';
import type { Instrument } from './catalog';
import type { Language } from './copy';
import { requestJson, isGameComparison, type GameComparison, type GameSpec, type NavHistory } from './server-api';
import { GameInputError, buildGameSpec, gameDates, gameInstruments, gameMaxMonths, localizeAssumption, summarizeGame, validateGame, type GameField, type GameSummary } from './game-domain';
import { evaluateSellPrediction, longMonthLabel, monthChange, monthLabel, navSeries, type Guess } from './journey-domain';
import './hold-sell-game.css';

type Level = 'beginner' | 'intermediate' | 'advanced';
type Props = {
  language: Language;
  level: Level;
  mode: 'server' | 'local';
  instruments: Instrument[];
  navHistory: Pick<NavHistory, 'instruments' | 'source'>;
  /** The journey's selected fund and amounts: step 3 follows them live instead of keeping its own copy. */
  fund: Instrument | undefined;
  initial: string;
  monthly: string;
  months: string;
  frequency: 'monthly' | 'annual';
  /** Picks another fund for the whole journey (used when the current fund is excluded from this challenge). */
  onSelectFund: (item: Instrument) => void;
  onUseMonthly: () => void;
  onRevealed?: (revealed: boolean) => void;
};

const words = {
  es: {
    number: 'Paso 3 de 3', title: '¿Y si vendo en el mes X?',
    intro: 'Compara dos recorridos con los mismos datos reales: mantener el fondo hasta el final del periodo o venderlo en el mes que elijas. Es un ejercicio de aprendizaje: no se realiza ninguna operación.',
    note: 'El resultado depende del mes elegido y del recorrido real de este fondo en ese periodo. Los resultados pasados no predicen los futuros y esto no es una recomendación: la decisión es tuya y conviene que tengas en cuenta tus necesidades de liquidez, tu horizonte y tu objetivo.',
    local: 'Este ejercicio solo está disponible con el servidor de la demo. En el modo de datos locales no se calcula nada ni se envía ninguna petición.',
    noFunds: 'No hay fondos con histórico mensual verificado disponibles para este ejercicio en esta entidad.',
    fund: 'Fondo', initial: 'Importe inicial (€)', monthly: 'Aportación mensual (€)', months: 'Meses', sellMonth: 'Mes de venta',
    initialHelp: 'Entre 0 y 1.000.000.000 €.', monthlyHelp: 'Entre 0 y 1.000.000.000 €. Importe inicial y aportación no pueden ser ambos 0.',
    monthsHelp: (max: number) => `Entre 1 y ${max} meses (máximo con el histórico de este fondo).`,
    sellHelp: (months: number) => `Entre 0 y ${months}. El mes 0 es el primer cierre.`,
    closeOf: (month: string, date: string) => `Cierre del mes ${month}: ${date}`,
    periodOf: (a: string, b: string) => `Periodo: ${a} – ${b}`,
    startNote: (a: string) => `El ejercicio empieza en el primer cierre observado (${a}) y cubre hasta 72 meses.`,
    fees: 'Comisiones (opcional)', feesHelp: 'Comisiones del ejercicio, entre 0 y 5 % de cada operación y aparte de los costes ya incluidos en el valor liquidativo. No se incluyen impuestos.', buyFee: 'Comisión de compra (%)', sellFee: 'Comisión de venta (%)',
    run: 'Comparar mantener y vender', running: 'Calculando…',
    pending: 'Calculando la comparación.', ready: 'Comparación lista.', cleared: 'La comparación anterior se ha borrado. Vuelve a comparar.',
    error: 'No se ha podido completar la comparación. Inténtalo de nuevo.',
    errors: { instrument: 'Elige un fondo disponible.', initial: 'El importe inicial debe estar entre 0 y 1.000.000.000 €.', monthly: 'La aportación mensual debe estar entre 0 y 1.000.000.000 €.', amounts: 'El importe inicial y la aportación mensual no pueden ser ambos 0.', months: (max: number) => `Los meses deben ser un número entero entre 1 y ${max}.`, sellMonth: (months: number) => `El mes de venta debe ser un número entero entre 0 y ${months}.`, buyFee: 'La comisión de compra debe estar entre 0 y 5 %.', sellFee: 'La comisión de venta debe estar entre 0 y 5 %.' },
    results: 'Resultado de la comparación', hold: 'Si mantengo', holdSub: (month: number, date: string) => `Sin vender hasta el mes ${month} (${date})`, sell: (month: number) => `Si vendo en el mes ${month}`, sellSub: (date: string) => `Venta en el cierre del ${date}; después queda efectivo`,
    final: 'Dinero final', contributed: 'Total aportado', feesPaid: 'Comisiones', profit: 'Ganancia o pérdida', simple: 'Variación simple', units: 'Participaciones al final',
    chartTitle: 'Valor total en cada mes', holdLine: 'Si mantengo', sellLine: 'Si vendo', sellMarker: (month: number) => `Venta · mes ${month}`, monthAxis: 'Mes', euroAxis: 'Euros',
    chartLabel: (a: string, b: string, months: number, hold: string, sell: string, sellMonth: number) => `Gráfico de dos líneas del valor total, del ${a} al ${b} (${months} meses). Al final: si mantengo, ${hold}; si vendo en el mes ${sellMonth}, ${sell}.`,
    showTable: 'Ver tabla', hideTable: 'Ocultar tabla', tableCaption: 'Valor total por mes', colMonth: 'Mes', colDate: 'Fecha', colHold: 'Si mantengo', colSell: 'Si vendo', colContributed: 'Aportado',
    source: 'Datos y fuente', dataLabel: 'Valores liquidativos mensuales publicados por la CNMV', period: 'Periodo', sourceLink: 'Ficha de la fuente', legal: 'Condiciones de reutilización de la CNMV', realData: 'Datos históricos reales observados, no ficticios.',
    excluded: 'Este reto no usa este fondo; elige otro para jugar.', excludedHelp: 'Al elegir otro fondo, los pasos 1 y 2 también pasan a usarlo.', pickFund: 'Fondo para el reto',
    annualNotice: 'El reto usa aportación mensual. Ahora tienes elegida la aportación anual.', useMonthly: 'Usar aportación mensual',
    sellTitle: 'Mueve para elegir el mes de venta', sellValue: (month: number, date: string) => `Mes ${month}${date ? `, ${date}` : ''}`,
    challenge: (month: string, change: string | null) => change ? `Prueba a vender en ${month}, un mes en que el valor liquidativo de este fondo cambió un ${change} respecto al cierre anterior. ¿Qué cambia?` : `Prueba a vender en ${month}. ¿Qué cambia?`, challengeBtn: (month: string) => `Elegir ${month}`,
    question: (month: number) => `¿Qué crees que pasó si vendías en el mes ${month}?`, questionHelp: 'Compara con mantener el fondo hasta el final del mismo periodo. Habla del pasado: solo comprobamos qué ocurrió, sin recomendar nada.',
    answers: { more: 'Acabé con más dinero que manteniendo', less: 'Acabé con menos dinero que manteniendo', same: 'Acabé con algo parecido' } as const, short: { more: 'más', less: 'menos', same: 'parecido' } as const,
    outcome: (month: number, sold: string, held: string) => `Vendiendo en el mes ${month} acabaste con ${sold}; manteniendo, con ${held}.`,
    actual: { more: 'Vender en ese mes acabó con más dinero que mantener.', less: 'Vender en ese mes acabó con menos dinero que mantener.', same: 'Vender en ese mes acabó con algo parecido a mantener (diferencia de hasta el 1 %).' } as const,
    yourGuess: (a: string) => `Tu respuesta: ${a}.`, matched: 'Tu respuesta coincide con lo que ocurrió.', missed: 'Tu respuesta no coincide con lo que ocurrió.',
    achievement: 'Has descubierto: el resultado depende del momento', pastNote: 'Es lo que ocurrió en este periodo; no indica qué ocurrirá después.',
    fixHint: 'Corrígelo en el paso 2.',
    assumptions: 'Supuestos', engine: 'Motor de cálculo', dataset: 'Versión de los datos', unitNote: 'Participaciones virtuales fraccionarias del valor liquidativo; no son órdenes reales.',
  },
  en: {
    number: 'Step 3 of 3', title: 'What if I sell in month X?',
    intro: 'Compare two paths using the same real data: keep the fund until the end of the period or sell it in the month you choose. This is a learning exercise: no transaction takes place.',
    note: 'The result depends on the month you choose and on this fund’s real path in that period. Past results do not predict future results and this is not a recommendation: the decision is yours and should consider your liquidity needs, your time horizon and your goal.',
    local: 'This exercise is only available with the demo server. In local data mode nothing is calculated and no request is sent.',
    noFunds: 'No funds with a verified monthly history are available for this exercise at this institution.',
    fund: 'Fund', initial: 'Initial amount (€)', monthly: 'Monthly contribution (€)', months: 'Months', sellMonth: 'Sale month',
    initialHelp: 'Between 0 and 1,000,000,000 €.', monthlyHelp: 'Between 0 and 1,000,000,000 €. The initial amount and the contribution cannot both be 0.',
    monthsHelp: (max: number) => `Between 1 and ${max} months (the maximum allowed by this fund’s history).`,
    sellHelp: (months: number) => `Between 0 and ${months}. Month 0 is the first close.`,
    closeOf: (month: string, date: string) => `Close of month ${month}: ${date}`,
    periodOf: (a: string, b: string) => `Period: ${a} – ${b}`,
    startNote: (a: string) => `The exercise starts at the first observed close (${a}) and covers up to 72 months.`,
    fees: 'Fees (optional)', feesHelp: 'Exercise fees, between 0 and 5% of each transaction and separate from costs already included in the net asset value. Taxes are not included.', buyFee: 'Purchase fee (%)', sellFee: 'Sale fee (%)',
    run: 'Compare holding and selling', running: 'Calculating…',
    pending: 'Calculating the comparison.', ready: 'Comparison ready.', cleared: 'The previous comparison was cleared. Compare again.',
    error: 'The comparison could not be completed. Please try again.',
    errors: { instrument: 'Choose an available fund.', initial: 'The initial amount must be between 0 and 1,000,000,000 €.', monthly: 'The monthly contribution must be between 0 and 1,000,000,000 €.', amounts: 'The initial amount and the monthly contribution cannot both be 0.', months: (max: number) => `Months must be a whole number between 1 and ${max}.`, sellMonth: (months: number) => `The sale month must be a whole number between 0 and ${months}.`, buyFee: 'The purchase fee must be between 0 and 5%.', sellFee: 'The sale fee must be between 0 and 5%.' },
    results: 'Comparison result', hold: 'If I hold', holdSub: (month: number, date: string) => `No sale until month ${month} (${date})`, sell: (month: number) => `If I sell in month ${month}`, sellSub: (date: string) => `Sale at the close of ${date}; the rest stays in cash`,
    final: 'Final money', contributed: 'Total contributed', feesPaid: 'Fees', profit: 'Gain or loss', simple: 'Simple change', units: 'Units at the end',
    chartTitle: 'Total value each month', holdLine: 'If I hold', sellLine: 'If I sell', sellMarker: (month: number) => `Sale · month ${month}`, monthAxis: 'Month', euroAxis: 'Euros',
    chartLabel: (a: string, b: string, months: number, hold: string, sell: string, sellMonth: number) => `Two-line chart of total value, from ${a} to ${b} (${months} months). At the end: if I hold, ${hold}; if I sell in month ${sellMonth}, ${sell}.`,
    showTable: 'View table', hideTable: 'Hide table', tableCaption: 'Total value by month', colMonth: 'Month', colDate: 'Date', colHold: 'If I hold', colSell: 'If I sell', colContributed: 'Contributed',
    source: 'Data and source', dataLabel: 'Monthly net asset values published by the CNMV', period: 'Period', sourceLink: 'Source page', legal: 'CNMV reuse conditions', realData: 'Real observed historical data, not fictional.',
    excluded: 'This challenge does not use this fund; pick another to play.', excludedHelp: 'When you pick another fund, steps 1 and 2 use it too.', pickFund: 'Fund for the challenge',
    annualNotice: 'The challenge uses a monthly contribution. You currently have the annual contribution selected.', useMonthly: 'Use monthly contribution',
    sellTitle: 'Move to choose the sale month', sellValue: (month: number, date: string) => `Month ${month}${date ? `, ${date}` : ''}`,
    challenge: (month: string, change: string | null) => change ? `Try selling in ${month}, a month in which this fund’s net asset value changed by ${change} against the previous close. What changes?` : `Try selling in ${month}. What changes?`, challengeBtn: (month: string) => `Choose ${month}`,
    question: (month: number) => `What do you think happened if you sold in month ${month}?`, questionHelp: 'Compare with holding the fund until the end of the same period. It is about the past: we only check what happened and recommend nothing.',
    answers: { more: 'I ended with more money than holding', less: 'I ended with less money than holding', same: 'I ended with something similar' } as const, short: { more: 'more', less: 'less', same: 'similar' } as const,
    outcome: (month: number, sold: string, held: string) => `Selling in month ${month} you ended with ${sold}; holding, with ${held}.`,
    actual: { more: 'Selling in that month ended with more money than holding.', less: 'Selling in that month ended with less money than holding.', same: 'Selling in that month ended with something similar to holding (a difference of up to 1%).' } as const,
    yourGuess: (a: string) => `Your answer: ${a}.`, matched: 'Your answer matches what happened.', missed: 'Your answer does not match what happened.',
    achievement: 'You discovered: the result depends on the moment', pastNote: 'This is what happened in this period; it does not indicate what will happen next.',
    fixHint: 'Fix it in step 2.',
    assumptions: 'Assumptions', engine: 'Calculation engine', dataset: 'Data version', unitNote: 'Fractional virtual units of the net asset value; they are not real orders.',
  },
} as const;

type Outcome = { spec: GameSpec; response: GameComparison; summary: GameSummary };
type Field = GameField | 'none';
const numberOf = (value: string) => (value.trim() === '' ? NaN : Number(value));
const fieldId = { instrument: 'hsg-form-error', initial: 'hsg-form-error', monthly: 'hsg-form-error', amounts: 'hsg-form-error', months: 'hsg-form-error', sellMonth: 'hsg-sell', buyFee: 'hsg-buy-fee', sellFee: 'hsg-sell-fee' } as const;

export default function HoldSellGame({ language, level, mode, instruments, navHistory, fund, initial, monthly, months, frequency, onSelectFund, onUseMonthly, onRevealed }: Props) {
  const t = words[language];
  const locale = language === 'es' ? 'es-ES' : 'en-GB';
  const eligible = useMemo(() => gameInstruments(instruments).filter(i => gameMaxMonths(i, navHistory) >= 1), [instruments, navHistory]);
  const maxFor = (item: Instrument | undefined) => gameMaxMonths(item, navHistory);
  /** The journey's fund when it can play; undefined when it is excluded (CaixaBank) or has no usable history. */
  const instrument = fund ? eligible.find(i => i.instrumentId === fund.instrumentId) : undefined;
  const monthsNumber = numberOf(months);
  const [sell, setSell] = useState(() => Math.floor((Number.isInteger(Number(months)) && Number(months) > 0 ? Number(months) : 12) / 2));
  const [buyFee, setBuyFee] = useState('0');
  const [sellFee, setSellFee] = useState('0');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [guess, setGuess] = useState<Guess | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [invalid, setInvalid] = useState<GameField | null>(null);
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'invalidated'>('idle');
  const [tableOpen, setTableOpen] = useState(false);
  const [feesOpen, setFeesOpen] = useState(false);
  const request = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const focusOutcome = useRef(false);
  const sellMonth = Number.isInteger(monthsNumber) ? Math.max(0, Math.min(sell, monthsNumber)) : sell;

  const invalidate = () => {
    generation.current++; request.current?.abort(); request.current = null;
    setBusy(false); setOutcome(null); setGuess(null); setFailed(false); setInvalid(null); setTableOpen(false);
    setStatus(previous => (previous === 'success' || previous === 'pending' ? 'invalidated' : previous));
  };
  // Any change to what the exercise depends on (the journey's fund and amounts, the sale month, fees, language, mode, data) clears the previous comparison.
  useEffect(() => { invalidate(); return () => { generation.current++; request.current?.abort(); }; }, [language, mode, instruments, navHistory, instrument?.instrumentId, initial, monthly, months, frequency, sellMonth, buyFee, sellFee]);
  useEffect(() => { onRevealed?.(outcome !== null); }, [outcome]);
  // The answer buttons disappear with the question: move focus to the results heading.
  useEffect(() => {
    if (!outcome || !focusOutcome.current) return;
    focusOutcome.current = false;
    requestAnimationFrame(() => document.getElementById('hsg-results-title')?.focus());
  }, [outcome]);

  const maxMonths = maxFor(instrument);
  const dates = useMemo(() => gameDates(instrument, navHistory), [instrument, navHistory]);
  const rows = useMemo(() => navSeries(navHistory, instrument?.identifier), [instrument, navHistory]);
  const dateText = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
  const money = (n: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(n);
  const signed = (n: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', signDisplay: 'exceptZero' }).format(n);
  const percent = (n: number) => new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'exceptZero' }).format(n);

  const message = (field: GameField) => {
    const e = t.errors;
    const text = field === 'months' ? e.months(maxMonths) : field === 'sellMonth' ? e.sellMonth(monthsNumber || maxMonths) : e[field];
    return field === 'sellMonth' || field === 'buyFee' || field === 'sellFee' ? text : `${text} ${t.fixHint}`;
  };

  const submit = async (event?: FormEvent, chosenGuess?: Guess) => {
    event?.preventDefault();
    invalidate();
    if (chosenGuess) { setGuess(chosenGuess); focusOutcome.current = true; }
    let spec: GameSpec;
    try {
      spec = buildGameSpec({ initial: numberOf(initial), monthly: monthly.trim() === '' ? 0 : numberOf(monthly), months: monthsNumber, sellMonth, buyFeePercent: numberOf(buyFee), sellFeePercent: numberOf(sellFee) }, instrument, maxMonths);
    } catch (error) {
      const field = error instanceof GameInputError ? error.field : 'instrument';
      setInvalid(field);
      setGuess(null); focusOutcome.current = false;
      if (field === 'buyFee' || field === 'sellFee') setFeesOpen(true);
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`#${fieldId[field]}`)?.focus());
      return;
    }
    const current = ++generation.current;
    const controller = new AbortController(); request.current = controller;
    setBusy(true); setStatus('pending');
    try {
      const response = await requestJson('/api/game/compare', isGameComparison, spec, controller.signal);
      validateGame(spec, response);
      const summary = summarizeGame(response);
      if (generation.current !== current) return;
      setOutcome({ spec, response, summary }); setStatus('success');
    } catch {
      if (generation.current === current) { setFailed(true); setGuess(null); focusOutcome.current = false; setStatus('idle'); }
    } finally {
      if (generation.current === current) { setBusy(false); request.current = null; }
    }
  };

  const heading = <><div className="panel-number">{t.number}</div><h2 id="hsg-title" tabIndex={-1}>{t.title}</h2></>;
  if (mode === 'local') return <section className="hsg" aria-labelledby="hsg-title">{heading}<p className="hsg-notice" role="status">{t.local}</p></section>;
  if (!eligible.length) return <section className="hsg" aria-labelledby="hsg-title">{heading}{fund && <p className="hsg-notice">{t.excluded}</p>}<p className="hsg-notice" role="status">{t.noFunds}</p></section>;
  if (!instrument) return <section className="hsg" aria-labelledby="hsg-title">{heading}
    <p className="hsg-notice" role="status">{t.excluded}</p>
    <div className="hsg-field hsg-wide hsg-pick"><label htmlFor="hsg-fund">{t.pickFund}</label>
      <select id="hsg-fund" value="" onChange={e => { const item = eligible.find(i => i.instrumentId === e.target.value); if (item) onSelectFund(item); }}>
        <option value="" disabled>—</option>
        {eligible.map(i => <option key={i.instrumentId} value={i.instrumentId}>{i.name[language]} · {i.manager}</option>)}
      </select>
      <small>{t.excludedHelp}</small>
    </div></section>;
  if (frequency === 'annual') return <section className="hsg" aria-labelledby="hsg-title">{heading}
    <p className="hsg-notice" role="status">{t.annualNotice}</p>
    <button type="button" className="hsg-toggle" onClick={onUseMonthly}>{t.useMonthly}</button></section>;

  const flagged = (field: GameField) => invalid === field;
  const describedBy = (field: GameField, ...ids: string[]) => [...ids, flagged(field) ? 'hsg-form-error' : ''].filter(Boolean).join(' ') || undefined;
  const amountText = (raw: string) => (raw.trim() === '' ? money(0) : Number.isFinite(Number(raw)) ? money(Number(raw)) : raw);
  const statusDetail = (o: Outcome) => {
    const verdict = guess ? evaluateSellPrediction(guess, o.summary.sell.value, o.summary.hold.value) : null;
    return `${t.outcome(o.spec.sellMonth, money(o.summary.sell.value), money(o.summary.hold.value))}${verdict && guess ? ` ${t.yourGuess(t.short[guess])} ${t.actual[verdict.actual]} ${verdict.matched ? t.matched : t.missed}` : ''}`;
  };
  const sellDate = dates[sellMonth];
  const maxSell = Number.isInteger(monthsNumber) ? monthsNumber : maxMonths;
  const aria = (field: GameField) => ({ 'aria-invalid': flagged(field) ? true : undefined });
  const challenge = (() => {
    const change = monthChange(rows, '2020-03');
    if (!change || change.index > maxSell) return null;
    return { index: change.index, label: longMonthLabel(dates[change.index], language), percent: percent(change.percent / 100) };
  })();

  const renderCard = (kind: 'hold' | 'sell', o: Outcome) => {
    const side = o.summary[kind];
    return <article className="hsg-card" aria-labelledby={`hsg-${kind}-title`}>
      <h3 id={`hsg-${kind}-title`}>{kind === 'hold' ? t.hold : t.sell(o.spec.sellMonth)}</h3>
      <p>{kind === 'hold' ? t.holdSub(o.spec.months, dateText(o.summary.periodEnd)) : t.sellSub(dateText(o.summary.sellDate))}</p>
      <dl>
        <div><dt>{t.final}</dt><dd>{money(side.value)}</dd></div>
        <div><dt>{t.contributed}</dt><dd>{money(side.contributed)}</dd></div>
        <div><dt>{t.feesPaid}</dt><dd>{money(side.fees)}</dd></div>
        <div><dt>{t.profit}</dt><dd>{signed(side.profit)}</dd></div>
        {level !== 'beginner' && side.simpleReturn !== null && <div><dt>{t.simple}</dt><dd>{percent(side.simpleReturn)}</dd></div>}
        {level === 'advanced' && <div><dt>{t.units}</dt><dd>{new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(side.units)}</dd></div>}
      </dl>
    </article>;
  };

  const renderResults = (o: Outcome) => {
    const { summary, response, spec } = o;
    const compact = (n: number) => new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
    return <div className="hsg-results" aria-labelledby="hsg-results-title" role="region">
      <h3 id="hsg-results-title" className="hsg-results-title" tabIndex={-1}>{t.results}</h3>
      <div className="hsg-feedback">
        <p>{t.outcome(spec.sellMonth, money(summary.sell.value), money(summary.hold.value))}</p>
        {guess && (() => { const verdict = evaluateSellPrediction(guess, summary.sell.value, summary.hold.value); return <p>{t.yourGuess(t.short[guess])} {t.actual[verdict.actual]} <strong>{verdict.matched ? t.matched : t.missed}</strong></p>; })()}
        <p>{t.pastNote}</p>
        <p className="hsg-achievement"><Award size={16} aria-hidden="true" />{t.achievement}</p>
      </div>
      <div className="hsg-cards">{renderCard('hold', o)}{renderCard('sell', o)}</div>
      <section className="hsg-chart" aria-labelledby="hsg-chart-title">
        <h3 id="hsg-chart-title">{t.chartTitle}</h3>
        <div className="hsg-legend" aria-hidden="true"><span><i className="hsg-key hsg-key-hold" />{t.holdLine}</span><span><i className="hsg-key hsg-key-sell" />{t.sellLine}</span></div>
        <div className="hsg-plot" role="img" aria-label={t.chartLabel(dateText(summary.periodStart), dateText(summary.periodEnd), spec.months, money(summary.hold.value), money(summary.sell.value), spec.sellMonth)}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={summary.series} margin={{ top: 22, right: 18, bottom: 8, left: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />
              <XAxis type="number" dataKey="month" domain={[0, spec.months]} allowDecimals={false} stroke="var(--muted)" tick={{ fill: 'var(--muted)', fontSize: 12 }} label={{ value: t.monthAxis, position: 'insideBottomRight', offset: -2, fill: 'var(--muted)', fontSize: 12 }} />
              <YAxis stroke="var(--muted)" width={58} tick={{ fill: 'var(--muted)', fontSize: 12 }} tickFormatter={compact} domain={['auto', 'auto']} />
              <Tooltip isAnimationActive={false} content={({ active, payload }) => {
                const row = active ? payload?.[0]?.payload as GameSummary['series'][number] | undefined : undefined;
                if (!row) return null;
                return <div className="hsg-tooltip"><strong>{t.monthAxis} {row.month} · {dateText(row.date)}</strong><span>{t.holdLine}: {money(row.hold)}</span><span>{t.sellLine}: {money(row.sell)}</span><span>{t.colContributed}: {money(row.contributed)}</span></div>;
              }} />
              <ReferenceLine x={spec.sellMonth} stroke="var(--ink)" strokeDasharray="2 3" label={{ value: t.sellMarker(spec.sellMonth), position: spec.sellMonth > spec.months / 2 ? 'insideTopRight' : 'insideTopLeft', fill: 'var(--ink)', fontSize: 12, fontWeight: 600 }} />
              <Line type="linear" dataKey="hold" name={t.holdLine} stroke="var(--hsg-hold)" strokeWidth={3} dot={false} activeDot={{ r: 5 }} isAnimationActive={false} />
              <Line type="linear" dataKey="sell" name={t.sellLine} stroke="var(--hsg-sell)" strokeWidth={3} strokeDasharray="8 5" dot={false} activeDot={{ r: 5 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <button type="button" className="hsg-toggle" aria-expanded={tableOpen} aria-controls="hsg-table-region" onClick={() => setTableOpen(open => !open)}>{tableOpen ? t.hideTable : t.showTable}</button>
        <div id="hsg-table-region" className="hsg-table-wrap" role="region" aria-label={t.tableCaption} tabIndex={0} hidden={!tableOpen}>
          {tableOpen && <table><caption>{t.tableCaption}</caption><thead><tr><th scope="col">{t.colMonth}</th><th scope="col">{t.colDate}</th><th scope="col">{t.colHold}</th><th scope="col">{t.colSell}</th><th scope="col">{t.colContributed}</th></tr></thead><tbody>{summary.series.map(row => <tr key={row.month}><th scope="row">{row.month}</th><td>{dateText(row.date)}</td><td>{money(row.hold)}</td><td>{money(row.sell)}</td><td>{money(row.contributed)}</td></tr>)}</tbody></table>}
        </div>
      </section>
      <section className="hsg-source" aria-labelledby="hsg-source-title">
        <h3 id="hsg-source-title">{t.source}</h3>
        <p><strong>{instrument.name[language]}</strong> · {instrument.manager}</p>
        <p>{t.dataLabel}. {t.realData}</p>
        <p>{t.period}: {dateText(summary.periodStart)} – {dateText(summary.periodEnd)}{instrument.sourceUrl && <> · <a href={instrument.sourceUrl} target="_blank" rel="noreferrer">{t.sourceLink}</a></>}</p>
        {/^https:\/\//.test(navHistory.source?.legalUrl ?? '') && <p><a href={navHistory.source.legalUrl} target="_blank" rel="noreferrer">{t.legal}</a></p>}
        <h4>{t.assumptions}</h4>
        <ul>{response.assumptions.map((text, i) => <li key={i}>{localizeAssumption(text, language)}</li>)}</ul>
        {level === 'advanced' && <dl className="hsg-technical"><div><dt>{t.engine}</dt><dd>{response.engine}</dd></div><div><dt>{t.dataset}</dt><dd>{response.provenance.datasetVersion}</dd></div><div><dt>{t.units}</dt><dd>{t.unitNote}</dd></div></dl>}
      </section>
    </div>;
  };

  return <section className="hsg" aria-labelledby="hsg-title">
    {heading}
    <p className="hsg-intro">{t.intro}</p>
    <p className="hsg-notice hsg-note">{t.note}</p>
    <dl className="hsg-synced">
      <div><dt>{t.fund}</dt><dd>{instrument.name[language]} · {instrument.manager}</dd></div>
      <div><dt>{t.initial}</dt><dd>{amountText(initial)}</dd></div>
      <div><dt>{t.monthly}</dt><dd>{amountText(monthly)}</dd></div>
      <div><dt>{t.months}</dt><dd>{months}</dd></div>
    </dl>
    <p className="hsg-help">{t.periodOf(dateText(dates[0] ?? ''), dateText(dates[maxMonths] ?? ''))}. {t.startNote(dateText(dates[0] ?? ''))}</p>
    <form ref={formRef} className="hsg-form" onSubmit={event => { if (busy) { event.preventDefault(); return; } void submit(event); }} noValidate aria-busy={busy}>
      <div className="hsg-field hsg-slider"><label htmlFor="hsg-sell">{t.sellTitle}</label>
        <input id="hsg-sell" type="range" min={0} max={Math.max(0, maxSell)} step={1} value={sellMonth} aria-valuetext={t.sellValue(sellMonth, monthLabel(sellDate, language))} onChange={e => setSell(Number(e.target.value))} aria-describedby={describedBy('sellMonth', 'hsg-sell-help')} {...aria('sellMonth')} />
        <output htmlFor="hsg-sell" className="hsg-sell-value">{t.sellValue(sellMonth, monthLabel(sellDate, language))}</output>
        <small id="hsg-sell-help">{t.sellHelp(maxSell)}{sellDate ? ` ${t.closeOf(String(sellMonth), dateText(sellDate))}.` : ''}</small>
      </div>
      {challenge && <div className="hsg-challenge"><span>{t.challenge(challenge.label, challenge.percent)}</span><button type="button" className="hsg-toggle" onClick={() => setSell(challenge.index)}>{t.challengeBtn(challenge.label)}</button></div>}
      <details className="hsg-fees" open={feesOpen} onToggle={e => setFeesOpen(e.currentTarget.open)}>
        <summary>{t.fees}</summary>
        <p>{t.feesHelp}</p>
        <div className="hsg-fields">
          <div className="hsg-field"><label htmlFor="hsg-buy-fee">{t.buyFee}</label><input id="hsg-buy-fee" type="number" inputMode="decimal" min={0} max={5} step="any" value={buyFee} onChange={e => setBuyFee(e.target.value)} aria-describedby={describedBy('buyFee')} {...aria('buyFee')} /></div>
          <div className="hsg-field"><label htmlFor="hsg-sell-fee">{t.sellFee}</label><input id="hsg-sell-fee" type="number" inputMode="decimal" min={0} max={5} step="any" value={sellFee} onChange={e => setSellFee(e.target.value)} aria-describedby={describedBy('sellFee')} {...aria('sellFee')} /></div>
        </div>
      </details>
      {invalid && <p id="hsg-form-error" className="hsg-error" tabIndex={-1}>{message(invalid)}</p>}
      {failed && <p role="alert" className="hsg-error">{t.error}</p>}
      {!outcome && <div className="hsg-predict" role="group" aria-labelledby="hsg-q">
        <p id="hsg-q" className="hsg-question">{t.question(sellMonth)}</p>
        <p className="hsg-help">{t.questionHelp}</p>
        <div className="hsg-answers">{(['more', 'less', 'same'] as const).map(g => <button key={g} type="button" className="hsg-answer" aria-disabled={busy || undefined} onClick={() => { if (!busy) void submit(undefined, g); }}>{t.answers[g]}</button>)}</div>
      </div>}
      <button className="hsg-run" type="submit" aria-disabled={busy || undefined}>{busy ? t.running : t.run}<ArrowRight size={17} aria-hidden="true" /></button>
    </form>
    <div role="status" aria-live="polite" className="sr-only">{status === 'pending' ? t.pending : status === 'success' ? `${t.ready}${outcome ? ` ${statusDetail(outcome)}` : ''}` : status === 'invalidated' ? t.cleared : ''}</div>
    {outcome && renderResults(outcome)}
  </section>;
}
