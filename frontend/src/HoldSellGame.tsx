import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight } from 'lucide-react';
import type { Instrument } from './catalog';
import type { Language } from './copy';
import { requestJson, isGameComparison, type GameComparison, type GameSpec, type NavHistory } from './server-api';
import { GameInputError, buildGameSpec, gameDates, gameDefaults, gameInstruments, gameMaxMonths, localizeAssumption, summarizeGame, validateGame, type GameField, type GameSummary } from './game-domain';
import './hold-sell-game.css';

type Level = 'beginner' | 'intermediate' | 'advanced';
type Props = {
  language: Language;
  level: Level;
  mode: 'server' | 'local';
  instruments: Instrument[];
  navHistory: Pick<NavHistory, 'instruments' | 'source'>;
  /** Initial state only: later changes in the simulator do not overwrite what the user typed here. */
  defaults: { instrumentId: string; initial: string; monthly: string; months: string };
  /** Versión guiada (nivel Básico): solo fondo, importe y mes de venta; el resto usa los valores por defecto. */
  guided?: boolean;
};

const words = {
  es: {
    number: '03 / ¿Y si vendo?', title: '¿Y si vendo en el mes X?',
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
    guidedIntro: 'En palabras sencillas: elige un fondo y un mes y verás cuánto dinero tendrías si hubieras vendido ese mes o si hubieras esperado hasta el final. Es solo un ejercicio con datos reales del pasado; no se hace ninguna operación.',
    guidedSummary: (months: string, monthly: string) => `Se usan ${months} meses y una aportación de ${monthly} € al mes (valores de ejemplo). Para cambiarlos, pasa al nivel Intermedio.`,
    assumptions: 'Supuestos', engine: 'Motor de cálculo', dataset: 'Versión de los datos', unitNote: 'Participaciones virtuales fraccionarias del valor liquidativo; no son órdenes reales.',
  },
  en: {
    number: '03 / What if I sell?', title: 'What if I sell in month X?',
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
    guidedIntro: 'In plain words: pick a fund and a month and you will see how much money you would have had if you had sold that month or waited until the end. It is only an exercise with real past data; no transaction takes place.',
    guidedSummary: (months: string, monthly: string) => `Example values are used: ${months} months and a contribution of ${monthly} € per month. To change them, switch to the Intermediate level.`,
    assumptions: 'Assumptions', engine: 'Calculation engine', dataset: 'Data version', unitNote: 'Fractional virtual units of the net asset value; they are not real orders.',
  },
} as const;

type Fields = { instrumentId: string; initial: string; monthly: string; months: string; sellMonth: string; buyFee: string; sellFee: string };
type Outcome = { spec: GameSpec; response: GameComparison; summary: GameSummary };
const numberOf = (value: string) => (value.trim() === '' ? NaN : Number(value));
const fieldId = { instrument: 'hsg-fund', initial: 'hsg-initial', monthly: 'hsg-monthly', amounts: 'hsg-initial', months: 'hsg-months', sellMonth: 'hsg-sell', buyFee: 'hsg-buy-fee', sellFee: 'hsg-sell-fee' } as const;

export default function HoldSellGame({ language, level, mode, instruments, navHistory, defaults, guided = false }: Props) {
  const t = words[language];
  const locale = language === 'es' ? 'es-ES' : 'en-GB';
  const eligible = useMemo(() => gameInstruments(instruments).filter(i => gameMaxMonths(i, navHistory) >= 1), [instruments, navHistory]);
  const maxFor = (item: Instrument | undefined) => gameMaxMonths(item, navHistory);
  const [fields, setFields] = useState<Fields>(() => { const d = gameDefaults(eligible, defaults.instrumentId, defaults.initial, defaults.monthly, defaults.months, maxFor); return { ...d, buyFee: '0', sellFee: '0' }; });
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [invalid, setInvalid] = useState<GameField | null>(null);
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'invalidated'>('idle');
  const [tableOpen, setTableOpen] = useState(false);
  const [feesOpen, setFeesOpen] = useState(false);
  const request = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);

  const invalidate = () => {
    generation.current++; request.current?.abort(); request.current = null;
    setBusy(false); setOutcome(null); setFailed(false); setInvalid(null); setTableOpen(false);
    setStatus(previous => (previous === 'success' || previous === 'pending' ? 'invalidated' : previous));
  };
  useEffect(() => { invalidate(); return () => { generation.current++; request.current?.abort(); }; }, [language, mode, instruments, navHistory]);

  const instrument = eligible.find(i => i.instrumentId === fields.instrumentId) ?? eligible[0];
  const maxMonths = maxFor(instrument);
  const dates = useMemo(() => gameDates(instrument, navHistory), [instrument, navHistory]);
  const dateText = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
  const money = (n: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(n);
  const signed = (n: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', signDisplay: 'exceptZero' }).format(n);
  const percent = (n: number) => new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'exceptZero' }).format(n);

  const edit = (next: Partial<Fields>) => { invalidate(); setFields(old => ({ ...old, ...next })); };
  const changeFund = (id: string) => {
    const item = eligible.find(i => i.instrumentId === id);
    const max = maxFor(item);
    const months = Math.max(1, Math.min(Number(fields.months) || 12, max));
    edit({ instrumentId: id, months: String(months), sellMonth: String(Math.min(Number(fields.sellMonth) || 0, months)) });
  };

  const message = (field: GameField) => {
    const e = t.errors;
    return field === 'months' ? e.months(maxMonths) : field === 'sellMonth' ? e.sellMonth(numberOf(fields.months) || maxMonths) : e[field];
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    invalidate();
    let spec: GameSpec;
    try {
      spec = buildGameSpec({ initial: numberOf(fields.initial), monthly: numberOf(fields.monthly), months: numberOf(fields.months), sellMonth: numberOf(fields.sellMonth), buyFeePercent: numberOf(fields.buyFee), sellFeePercent: numberOf(fields.sellFee) }, instrument, maxMonths);
    } catch (error) {
      const field = error instanceof GameInputError ? error.field : 'instrument';
      setInvalid(field);
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
      if (generation.current === current) { setFailed(true); setStatus('idle'); }
    } finally {
      if (generation.current === current) { setBusy(false); request.current = null; }
    }
  };

  const heading = <><div className="panel-number">{t.number}</div><h2 id="hsg-title">{t.title}</h2></>;
  if (mode === 'local') return <section className="hsg" aria-labelledby="hsg-title">{heading}<p className="hsg-notice" role="status">{t.local}</p></section>;
  if (!instrument) return <section className="hsg" aria-labelledby="hsg-title">{heading}<p className="hsg-notice" role="status">{t.noFunds}</p></section>;

  const flagged = (field: GameField) => invalid === field || (invalid === 'amounts' && (field === 'initial' || field === 'monthly'));
  const describedBy = (field: GameField, ...ids: string[]) => [...ids, flagged(field) ? 'hsg-form-error' : ''].filter(Boolean).join(' ') || undefined;
  const sellNumber = numberOf(fields.sellMonth);
  const sellDate = Number.isInteger(sellNumber) ? dates[sellNumber] : undefined;
  const monthsNumber = numberOf(fields.months);
  const closeDate = Number.isInteger(monthsNumber) ? dates[monthsNumber] : undefined;
  const aria = (field: GameField) => ({ 'aria-invalid': flagged(field) ? true : undefined });

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
      <h3 id="hsg-results-title" className="hsg-results-title">{t.results}</h3>
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
    <p className="hsg-intro">{guided ? t.guidedIntro : t.intro}</p>
    <p className="hsg-notice hsg-note">{t.note}</p>
    <form ref={formRef} className="hsg-form" onSubmit={submit} noValidate aria-busy={busy}>
      <div className="hsg-fields">
        <div className="hsg-field hsg-wide"><label htmlFor="hsg-fund">{t.fund}</label>
          <select id="hsg-fund" value={instrument.instrumentId} onChange={e => changeFund(e.target.value)} aria-describedby={describedBy('instrument', 'hsg-fund-help')} {...aria('instrument')}>{eligible.map(i => <option key={i.instrumentId} value={i.instrumentId}>{i.name[language]} · {i.manager}</option>)}</select>
          <small id="hsg-fund-help">{t.periodOf(dateText(dates[0] ?? ''), dateText(dates[maxMonths] ?? ''))}. {t.startNote(dateText(dates[0] ?? ''))}</small>
        </div>
        <div className="hsg-field"><label htmlFor="hsg-initial">{t.initial}</label><input id="hsg-initial" type="number" inputMode="decimal" min={0} max={1000000000} step="any" value={fields.initial} onChange={e => edit({ initial: e.target.value })} aria-describedby={describedBy('initial', 'hsg-initial-help')} {...aria('initial')} /><small id="hsg-initial-help">{t.initialHelp}</small></div>
        {!guided && <div className="hsg-field"><label htmlFor="hsg-monthly">{t.monthly}</label><input id="hsg-monthly" type="number" inputMode="decimal" min={0} max={1000000000} step="any" value={fields.monthly} onChange={e => edit({ monthly: e.target.value })} aria-describedby={describedBy('monthly', 'hsg-monthly-help')} {...aria('monthly')} /><small id="hsg-monthly-help">{t.monthlyHelp}</small></div>}
        {!guided && <div className="hsg-field"><label htmlFor="hsg-months">{t.months}</label><input id="hsg-months" type="number" inputMode="numeric" min={1} max={maxMonths} step={1} value={fields.months} onChange={e => edit({ months: e.target.value })} aria-describedby={describedBy('months', 'hsg-months-help')} {...aria('months')} /><small id="hsg-months-help">{t.monthsHelp(maxMonths)}{closeDate ? ` ${t.closeOf(fields.months, dateText(closeDate))}.` : ''}</small></div>}
        <div className="hsg-field"><label htmlFor="hsg-sell">{t.sellMonth}</label><input id="hsg-sell" type="number" inputMode="numeric" min={0} max={Number.isInteger(monthsNumber) ? monthsNumber : maxMonths} step={1} value={fields.sellMonth} onChange={e => edit({ sellMonth: e.target.value })} aria-describedby={describedBy('sellMonth', 'hsg-sell-help')} {...aria('sellMonth')} /><small id="hsg-sell-help">{t.sellHelp(Number.isInteger(monthsNumber) ? monthsNumber : maxMonths)}{sellDate ? ` ${t.closeOf(fields.sellMonth, dateText(sellDate))}.` : ''}</small></div>
      </div>
      {guided && <p className="hsg-notice">{t.guidedSummary(fields.months, fields.monthly)}</p>}
      {!guided && <details className="hsg-fees" open={feesOpen} onToggle={e => setFeesOpen(e.currentTarget.open)}>
        <summary>{t.fees}</summary>
        <p>{t.feesHelp}</p>
        <div className="hsg-fields">
          <div className="hsg-field"><label htmlFor="hsg-buy-fee">{t.buyFee}</label><input id="hsg-buy-fee" type="number" inputMode="decimal" min={0} max={5} step="any" value={fields.buyFee} onChange={e => edit({ buyFee: e.target.value })} aria-describedby={describedBy('buyFee')} {...aria('buyFee')} /></div>
          <div className="hsg-field"><label htmlFor="hsg-sell-fee">{t.sellFee}</label><input id="hsg-sell-fee" type="number" inputMode="decimal" min={0} max={5} step="any" value={fields.sellFee} onChange={e => edit({ sellFee: e.target.value })} aria-describedby={describedBy('sellFee')} {...aria('sellFee')} /></div>
        </div>
      </details>}
      {invalid && <p id="hsg-form-error" className="hsg-error">{message(invalid)}</p>}
      {failed && <p role="alert" className="hsg-error">{t.error}</p>}
      <button className="hsg-run" type="submit" disabled={busy}>{busy ? t.running : t.run}<ArrowRight size={17} aria-hidden="true" /></button>
    </form>
    <div role="status" aria-live="polite" className="sr-only">{status === 'pending' ? t.pending : status === 'success' ? t.ready : status === 'invalidated' ? t.cleared : ''}</div>
    {outcome && renderResults(outcome)}
  </section>;
}
