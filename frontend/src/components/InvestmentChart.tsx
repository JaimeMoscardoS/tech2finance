import { useId, useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import './InvestmentChart.css'
import { directions, type Direction } from './chart-direction'

export type ChartDatum = { label: string; value: number; contributed: number; returnPercent: number }
export type InvestmentChartProps = {
  data: readonly ChartDatum[]
  language: 'es' | 'en'
  title: string
  description?: string
  initialView?: 'value' | 'return'
  compact?: boolean
}

const words = {
  es: { value: 'Capital (€)', returns: 'Evolución del instrumento (%)', contributed: 'Aportado', periodContribution: 'Aportación del período', initialAmount: 'Importe inicial', profit: 'Ganancia / pérdida', date: 'Fecha', show: 'Ver datos', empty: 'No hay datos disponibles para mostrar.', invalid: 'No se puede mostrar el gráfico porque los datos contienen valores no válidos.', hint: 'Usa las flechas del teclado para recorrer los datos.', table: 'Datos del gráfico', legendValue: 'Capital', legendReturn: 'Evolución del instrumento', rise: 'Sube', fall: 'Baja', flat: 'Sin cambio', first: 'Punto inicial', direction: 'Cambio desde el punto anterior', colorValue: 'Los colores comparan el capital con el punto anterior; el capital incluye aportaciones.', colorReturn: 'Los colores comparan la evolución acumulada del instrumento con el punto anterior.' },
  en: { value: 'Capital (€)', returns: 'Instrument performance (%)', contributed: 'Contributed', periodContribution: 'Period contribution', initialAmount: 'Initial amount', profit: 'Gain / loss', date: 'Date', show: 'View data', empty: 'No data available to display.', invalid: 'The chart cannot be displayed because the data contains invalid values.', hint: 'Use the arrow keys to explore the data.', table: 'Chart data', legendValue: 'Capital', legendReturn: 'Instrument performance', rise: 'Rises', fall: 'Falls', flat: 'No change', first: 'Starting point', direction: 'Change from previous point', colorValue: 'Colours compare capital with the previous point; capital includes contributions.', colorReturn: 'Colours compare cumulative instrument performance with the previous point.' },
}

export default function InvestmentChart({ data, language, title, description, initialView = 'value', compact = false }: InvestmentChartProps) {
  const [view, setView] = useState<'value' | 'return'>(initialView)
  const id = useId()
  const t = words[language]
  const locale = language === 'es' ? 'es-ES' : 'en-GB'
  const valid = useMemo(() => data.every((point) => Number.isFinite(point.value) && Number.isFinite(point.contributed) && Number.isFinite(point.returnPercent)), [data])
  const rows = valid ? data : []
  const money = (n: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n)
  const percent = (n: number) => `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2, signDisplay: 'exceptZero' }).format(n)} %`
  const tickMoney = (n: number) => new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n) + ' €'
  const seriesDirections = directions(rows.map(row => view === 'value' ? row.value : row.returnPercent))
  const colorFor = (direction: Direction) => `var(--chart-${direction})`
  const lineStroke = seriesDirections.some(direction => direction !== 'flat') ? `url(#${id}-direction)` : 'var(--chart-flat)'
  const gradientId = `${id}-direction`
  const ticks = rows.length <= 6 ? rows.map((row) => row.label) : Array.from({ length: 6 }, (_, i) => rows[Math.round(i * (rows.length - 1) / 5)].label)

  return <section className={`investment-chart${compact ? ' investment-chart--compact' : ''}`} aria-labelledby={`${id}-title`}>
    <div className="investment-chart__heading">
      <div><h3 id={`${id}-title`}>{title}</h3>{description && <p id={`${id}-description`}>{description}</p>}</div>
      <div className="investment-chart__switch" role="group" aria-label={language === 'es' ? 'Vista del gráfico' : 'Chart view'}>
        <button type="button" aria-pressed={view === 'value'} onClick={() => setView('value')}>{t.value}</button>
        <button type="button" aria-pressed={view === 'return'} onClick={() => setView('return')}>{t.returns}</button>
      </div>
    </div>
    <div className="investment-chart__legend" aria-label={language === 'es' ? 'Leyenda' : 'Legend'}>
      <span><i className="investment-chart__line investment-chart__line--rise" aria-hidden="true" />↑ {t.rise}</span>
      <span><i className="investment-chart__line investment-chart__line--fall" aria-hidden="true" />↓ {t.fall}</span>
      <span><i className="investment-chart__line investment-chart__line--flat" aria-hidden="true" />→ {t.flat}</span>
      {view === 'value' && <span><i className="investment-chart__line investment-chart__line--dashed" aria-hidden="true" />{t.contributed}</span>}
    </div>
    <p id={`${id}-meaning`} className="investment-chart__meaning">{view === 'value' ? t.colorValue : t.colorReturn}</p>
    {rows.length ? <figure className="investment-chart__figure" aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description ${id}-meaning ${id}-hint` : `${id}-meaning ${id}-hint`}>
      <div className="investment-chart__plot">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={rows} accessibilityLayer margin={{ top: 14, right: 12, left: 0, bottom: 4 }}>
            <defs><linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">{seriesDirections.length ? seriesDirections.flatMap((direction, index) => [<stop key={`${index}-start`} offset={`${index / seriesDirections.length * 100}%`} stopColor={colorFor(direction)} />, <stop key={`${index}-end`} offset={`${(index + 1) / seriesDirections.length * 100}%`} stopColor={colorFor(direction)} />]) : <stop offset="0%" stopColor="var(--chart-flat)" />}</linearGradient></defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />
            <XAxis dataKey="label" ticks={ticks} tickLine={false} axisLine={false} minTickGap={12} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
            <YAxis width={64} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} tickFormatter={view === 'value' ? tickMoney : (n: number) => `${new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n)}%`} domain={view === 'value' ? [(min: number) => Math.min(0, min), 'auto'] : ['auto', 'auto']} />
            <Tooltip content={({ active, payload }) => {
              const point = payload?.[0]?.payload as ChartDatum | undefined
              if (!active || !point) return null
              return <div className="investment-chart__tooltip" role="status" aria-live="polite"><strong>{point.label}</strong>{view === 'value' ? <><span>{t.legendValue}: {money(point.value)}</span><span>{t.contributed}: {money(point.contributed)}</span><span>{t.profit}: {money(point.value - point.contributed)}</span></> : <span>{t.legendReturn}: {percent(point.returnPercent)}</span>}</div>
            }} />
            {view === 'value' ? <>
              <Line type="linear" dataKey="value" stroke={lineStroke} strokeWidth={3} dot={rows.length <= 6 ? { r: 3, fill: "var(--chart-flat)", stroke: "var(--surface)" } : false} activeDot={{ r: 5 }} isAnimationActive={false} />
              <Line type="linear" dataKey="contributed" stroke="var(--muted)" strokeWidth={2} strokeDasharray="6 4" dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
            </> : <Line type="linear" dataKey="returnPercent" stroke={lineStroke} strokeWidth={3} dot={rows.length <= 6 ? { r: 3, fill: "var(--chart-flat)", stroke: "var(--surface)" } : false} activeDot={{ r: 5 }} isAnimationActive={false} />}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption id={`${id}-hint`} className="investment-chart__hint">{t.hint}</figcaption>
    </figure> : <p className="investment-chart__empty">{valid ? t.empty : t.invalid}</p>}
    {rows.length > 0 && <details className="investment-chart__details"><summary>{t.show}</summary><div className="investment-chart__table-wrap" role="region" aria-label={`${t.table}: ${title}`} tabIndex={0}><table><caption>{t.table}: {title}</caption><thead><tr><th scope="col">{t.date}</th><th scope="col">{t.legendValue}</th><th scope="col">{t.periodContribution}</th><th scope="col">{t.contributed}</th><th scope="col">{t.profit}</th><th scope="col">{t.legendReturn}</th><th scope="col">{t.direction}</th></tr></thead><tbody>{rows.map((point, index) => <tr key={`${point.label}-${index}`}><th scope="row">{point.label}</th><td>{money(point.value)}</td><td>{index === 0 && <span className="investment-chart__initial">{t.initialAmount}: </span>}{money(index === 0 ? point.contributed : point.contributed - rows[index - 1].contributed)}</td><td>{money(point.contributed)}</td><td>{money(point.value - point.contributed)}</td><td>{percent(point.returnPercent)}</td><td>{index === 0 ? t.first : t[seriesDirections[index - 1]]}</td></tr>)}</tbody></table></div></details>}
  </section>
}
