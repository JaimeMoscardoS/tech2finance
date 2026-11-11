import type { TutorProvider, TutorRequest, TutorReply, SimulationFacts } from './types.ts';
import { safeSources } from './decline.ts';
import { bankAnswer } from './bank-profile.ts';
import { conceptLevelNote, declineLevelNote, decisionLevelNote, pageHint } from './level-notes.ts';

export const MAX_MESSAGE_LENGTH = 1500;
export const MAX_HISTORY_MESSAGES = 8;
const validDate = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const validAnnual = (s: SimulationFacts): boolean => s.annualReturns === undefined || (s.kind === 'annual_history' && Array.isArray(s.annualReturns) && s.annualReturns.length <= 500 && Array.from(s.annualReturns).every((item, i, values) => item && Number.isInteger(item.year) && item.year >= 1900 && item.year <= 2200 && Number.isFinite(item.ratePercent) && item.ratePercent >= -100 && item.ratePercent <= 100000 && (i === 0 || !!values[i - 1] && values[i - 1].year < item.year)));
const validFacts = (s: SimulationFacts | undefined): s is SimulationFacts => !!s &&
  (s.kind === 'fictional_monthly' || s.kind === 'annual_history' || s.kind === 'real_monthly_nav') &&
  (s.contributionTiming === 'month_start' || s.contributionTiming === 'year_end_after_return' || s.contributionTiming === 'month_end_after_return') &&
  (s.kind !== 'real_monthly_nav' || s.contributionFrequency === undefined || s.contributionFrequency === 'monthly' || s.contributionFrequency === 'annual') &&
  [s.initial, s.recurringContribution, s.periods, s.finalValue, s.totalContributed, s.profit, s.instrumentReturnPercent].every(Number.isFinite) &&
  (s.simpleReturnPercent === null || Number.isFinite(s.simpleReturnPercent)) && s.initial >= 0 && s.recurringContribution >= 0 && s.periods >= 0 && Number.isInteger(s.periods) && s.periods <= 1200 && s.finalValue >= 0 && s.totalContributed >= 0 &&
  Math.abs(s.profit - (s.finalValue - s.totalContributed)) <= 0.011 && Math.abs(s.totalContributed - (s.initial + s.recurringContribution * (s.kind === 'real_monthly_nav' && s.contributionFrequency === 'annual' ? Math.floor(s.periods / 12) : s.periods))) <= 0.011 &&
  ((s.periodStart === undefined && s.periodEnd === undefined) || (validDate(s.periodStart) && validDate(s.periodEnd) && s.periodStart <= s.periodEnd)) && validAnnual(s);

function detect(message: string): string {
  const m = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/ignore|ignora|system prompt|api.?key|secret|password/.test(m)) return 'unknown';
  if (/(fondo|fund).*\betf\b|\betf\b.*(fondo|fund)/.test(m) && /diferen|differ|compar|\bvs\b/.test(m)) return 'fund_etf';
  if (/caus|noticia|news|contexto|why.*(fall|drop)|por que.*(ca|baj)/.test(m)) return 'causes';
  if (/liquid|horizon|horizonte|plazo|vender|sell|mantener|hold/.test(m)) return 'decision';
  if (/drawdown|caida|caido|bajada|recuper|recovery|drop/.test(m)) return 'decline';
  if (/fuente|source|histor|nav|publicad/.test(m)) return 'source';
  if (/resultado|beneficio|perdida|ganancia|rentabilidad|result|profit|return|aport|contribut|\b(?:lose|lost|loss)\b|p&l|balance|simulacion|simulation/.test(m)) return 'result';
  if (/diversif/.test(m)) return 'diversification';
  if (/cost|comision|fee/.test(m)) return 'costs';
  if (/riesgo|risk|volatil/.test(m)) return 'risk';
  if (/\betf\b/.test(m)) return 'etf';
  if (/accion|stock|share/.test(m)) return 'stock';
  if (/fondo|fund/.test(m)) return 'fund';
  return 'unknown';
}

const declineWords = '\\b(?:caid\\w*|bajad\\w*|bajando|caer|perdid\\w*|drop\\w*|fall\\w*|fell|declin\\w*|loss(?:es)?)\\b';
const declinePattern = new RegExp(declineWords);
const declineTargetPattern = new RegExp(`${declineWords}\\s+(?:de|del|of)\\s+(.+)`);
function calmOutsideScope(message: string, activeName?: string, basisName?: string): boolean {
  const normalizeName = (name?: string) => name?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return message.split(/\s+(?:y|and|pero|but)\s+|[,;.!?¿]/).some(clause => {
    if (!declinePattern.test(clause)) return false;
    if (/\b(?:tomorrow|next (?:week|month|year)|in the future|manana|proxim[oa] (?:semana|mes|ano)|en el futuro)\b/.test(clause)) return true;
    const target = clause.match(declineTargetPattern)?.[1]?.trim().replace(/^(?:(?:the|this|my|el|la|mi|del)\s+)*/, '').replace(/^(?:fund|fondo|instrument|instrumento)\s+/, '');
    if (!target || /^(?:simulation|simulacion|instrument|instrumento|fund|fondo|portfolio|cartera|account|cuenta|investment|inversion)$/.test(target)) return false;
    return target !== normalizeName(activeName) && target !== normalizeName(basisName);
  });
}

export function createLocalTutorProvider(): TutorProvider {
  return { id: 'local', async reply(request: TutorRequest): Promise<TutorReply> {
    if (request.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const context = request.context;
    const en = context?.language === 'en';
    const lang = en ? 'en' : 'es';
    const message = typeof request.message === 'string' ? request.message.trim() : '';
    const bankResponse = message.length <= MAX_MESSAGE_LENGTH ? bankAnswer(message, context, Array.isArray(request.history) ? request.history : []) : undefined;
    if (bankResponse) return { ...bankResponse, text: bankResponse.text.slice(0, 3000), language: lang, mode: 'local', provider: 'local', sources: [] };
    let intent = message.length <= MAX_MESSAGE_LENGTH ? detect(message) : 'unknown';
    const concernMessage = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const calm = message.length <= MAX_MESSAGE_LENGTH && !/ignore|ignora|system prompt|api.?key|secret|password/.test(concernMessage) && /preocup|miedo|temor|asust|angust|worri|fear|afraid|anxious|panic|panico/.test(concernMessage) && (declinePattern.test(concernMessage) || /vender|venta|cartera|inversion|perder dinero|sell|portfolio|invest|losing money/.test(concernMessage));
    if (calm) intent = 'decision';
    if (intent === 'unknown' && /^(y eso|explica(?:me)? m[aá]s|m[aá]s detalles|por qu[eé]|c[oó]mo|and that|explain more|more details|why|how)[\s?¿.!]*$/i.test(message)) {
      const previous = (Array.isArray(request.history) ? request.history.slice(-MAX_HISTORY_MESSAGES) : []).reverse().find(h => h?.role === 'assistant');
      if (previous && ['result', 'source', 'decline', 'decision', 'fund', 'stock', 'etf', 'diversification', 'risk', 'costs', 'causes'].includes(previous.intent!)) intent = previous.intent!;
    }
    const fmt = (n: number) => new Intl.NumberFormat(en ? 'en-GB' : 'es-ES', { maximumFractionDigits: 2 }).format(n);
    let text = '';
    const s = context?.simulation;
    const normalized = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/^¿/, '');
    const definition = /^(?:what (?:is|does) (?:a |the )?(?:return|performance)(?: of an investment)?(?: mean)?|que (?:es|significa) (?:la )?rentabilidad(?: de una inversion)?)[\s?.!¿]*$/.test(normalized);
    const future = /\b(tomorrow|next (?:week|month|year)|in the future|manana|proxim[oa] (?:semana|mes|ano)|en el futuro)\b/.test(normalized);
    const named = (normalized.match(/\b(?:return|performance|profit|loss|rentabilidad|resultado|beneficio|perdida)\s+(?:of|for|on|de|del)\s+([^?¿,.!]+)/i)?.[1] ?? normalized.match(/^(?:what is |what's )(.+?)['’]s\s+(?:return|profit|loss|performance)\b/)?.[1])?.trim();
    const activeName = context?.instrument?.name?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const namedFull = named?.replace(/\s+(?:over this period|in this period|en este periodo|durante este periodo|in eur|en eur)$/, '').replace(/\s+(?:selected|seleccionada|seleccionado)$/, '').replace(/^(?:(?:the|this|selected|my|la|el|esta|este|mi|seleccionada|seleccionado)\s+)*/, '');
    const namedTarget = namedFull?.replace(/^(?:fund|fondo|instrument|instrumento)\s+/, '');
    const annualYear = (s?.kind === 'annual_history' || s?.kind === 'real_monthly_nav') && !!named && /^(?:19|20|21|22)\d{2}$/.test(named);
    const foreign = !!namedTarget && !annualYear && !/^(?:simulation|simulacion|instrument|instrumento|fund|fondo|portfolio|cartera|account|cuenta|period|periodo)\s*$/.test(namedTarget) && !(activeName && (namedFull === activeName || namedTarget === activeName));
    if (calm && calmOutsideScope(normalized, context?.instrument?.name, context?.decline?.basisName)) return { text: en ? 'The requested instrument or future decline is not available in this context.' : 'El instrumento o la caída futura solicitados no están disponibles en este contexto.', language: lang, mode: 'local', provider: 'local', intent: 'unknown', sources: [] };
    const concepts: Record<string, [string, string]> = {
      fund: ['Un fondo reúne el dinero de varios partícipes e invierte según una estrategia; su valor puede bajar.', 'A fund pools investors’ money under a strategy; its value can fall.'],
      fund_etf: ['Un fondo tradicional se suscribe y reembolsa con la gestora a su valor liquidativo; un ETF cotiza en bolsa como una acción, con precio de mercado y posible diferencial. Ambos pueden perder valor y tienen costes distintos.', 'A traditional fund is subscribed and redeemed with the manager at its net asset value; an ETF trades on an exchange like a share, with a market price and a possible spread. Both can lose value and have different costs.'],
      etf: ['Un ETF es un fondo que cotiza en bolsa. Su precio y los costes dependen del producto y de la operación.', 'An ETF is an exchange-traded fund. Its price and costs depend on the product and trade.'],
      stock: ['Una acción representa una parte de una empresa; su precio puede subir o bajar.', 'A share represents part ownership of a company; its price can rise or fall.'],
      diversification: ['Diversificar reparte la exposición entre inversiones. Puede reducir riesgos específicos, pero no evita pérdidas.', 'Diversification spreads exposure across investments. It can reduce specific risks, but cannot prevent losses.'],
      risk: ['El riesgo incluye la posibilidad de perder dinero; la volatilidad describe las variaciones de valor.', 'Risk includes the possibility of losing money; volatility describes changes in value.'],
      costs: ['Las comisiones y otros costes reducen el resultado. Consulta las condiciones y costes del producto.', 'Fees and other costs reduce the outcome. Check the product’s terms and costs.'],
    };
    if (concepts[intent]) {
      text = concepts[intent][en ? 1 : 0];
      if (context?.level === 'beginner' && intent === 'diversification') text += en ? ' Think of using several baskets.' : ' Es como repartir objetos en varias cestas.';
      text += conceptLevelNote(intent, context?.level, en);
    } else if (intent === 'result' && definition) {
      text = en ? 'Return describes the change in value of an investment over a period; it can be negative and depends on the measurement and costs.' : 'La rentabilidad describe la variación de valor de una inversión en un periodo; puede ser negativa y depende de cómo se mida y de los costes.';
      intent = 'unknown';
    } else if (intent === 'result' && (future || foreign)) {
      text = en ? 'The requested instrument or future return is not available in this simulation.' : 'El instrumento o la rentabilidad futura solicitados no están disponibles en esta simulación.';
      intent = 'unknown';
    } else if (intent === 'result') {
      if (!validFacts(s) || context?.instrument?.dataKind === 'missing_history' || (s.kind === 'annual_history' && s.contributionTiming !== 'year_end_after_return') || (s.kind === 'fictional_monthly' && s.contributionTiming !== 'month_start') || (s.kind === 'real_monthly_nav' && s.contributionTiming !== 'month_end_after_return')) { text = en ? 'There is not enough valid simulation data to explain a result.' : 'No hay datos válidos suficientes de la simulación para explicar un resultado.'; intent = 'unknown'; }
      else if (s.kind === 'real_monthly_nav' && /\b(?:19|20|21|22)\d{2}\b/.test(message)) {
        text = en ? 'A separate annual return for the requested year is not available in this simulation.' : 'La rentabilidad anual del año solicitado no está disponible por separado en esta simulación.';
        intent = 'unknown';
      } else {
        const name = typeof context.instrument?.name === 'string' && context.instrument.name.trim() && context.instrument.name.length <= 200 ? context.instrument.name : (en ? 'selected instrument' : 'instrumento seleccionado');
        const currency = context.instrument?.currency === 'EUR' ? ' EUR' : '';
        const period = (s.kind === 'annual_history' ? (en ? `${s.periods} annual periods` : `${s.periods} periodos anuales`) : (en ? `${s.periods} monthly periods` : `${s.periods} periodos mensuales`)) + (s.periodStart && s.periodEnd ? `, ${s.periodStart} – ${s.periodEnd}` : '');
        text = en ? `${name} (${period}): final value ${fmt(s.finalValue)}${currency}; total contributed ${fmt(s.totalContributed)}${currency}; profit or loss ${fmt(s.profit)}${currency}. Cumulative instrument return over this period: ${fmt(s.instrumentReturnPercent)}%, not an annual rate.` : `${name} (${period}): valor final ${fmt(s.finalValue)}${currency}; aportado en total ${fmt(s.totalContributed)}${currency}; beneficio o pérdida ${fmt(s.profit)}${currency}. Rentabilidad acumulada del instrumento durante ese periodo: ${fmt(s.instrumentReturnPercent)}%, no es una tasa anual.`;
        if (s.kind === 'annual_history') {
          if (!s.periodStart) text += en ? ' The dates are not available.' : ' No están disponibles las fechas.';
          const yearMatch = message.match(/\b(?:19|20|21|22)\d{2}\b/);
          if (yearMatch) {
            const annual = s.annualReturns?.find(item => item.year === Number(yearMatch[0]));
            text += annual ? (en ? ` Published return for ${annual.year}: ${fmt(annual.ratePercent)}%.` : ` Rentabilidad publicada de ${annual.year}: ${fmt(annual.ratePercent)}%.`) : (en ? ` No annual rate is available for ${yearMatch[0]}.` : ` No hay tasa anual disponible para ${yearMatch[0]}.`);
          } else if (/anual|annual/i.test(message)) {
            text += s.annualReturns?.length ? (en ? ` Published annual rates: ${s.annualReturns.map(item => `${item.year}: ${fmt(item.ratePercent)}%`).join('; ')}.` : ` Rentabilidades anuales publicadas: ${s.annualReturns.map(item => `${item.year}: ${fmt(item.ratePercent)}%`).join('; ')}.`) : (en ? ' Separate annual rates are not available.' : ' No están disponibles las tasas de cada año.');
          }
        }
        text += s.contributionTiming === 'month_end_after_return' ? (s.contributionFrequency === 'annual' ? (en ? ' Contributions enter after every 12 monthly closes.' : ' Las aportaciones entran después de cada 12 cierres mensuales.') : (en ? ' Contributions enter at month end after the return.' : ' Las aportaciones entran al cierre mensual, después de la rentabilidad.')) : s.contributionTiming === 'month_start' ? (en ? ' Contributions enter at the start of each month.' : ' Las aportaciones entran al inicio de cada mes.') : (en ? ' Contributions enter at year end after that year’s return.' : ' Las aportaciones entran al cierre de cada año, después de su rentabilidad.');
        if (context.level === 'advanced') text += en ? ' Cash flows affect the account result; instrument return describes the instrument, not the account’s time-weighted return.' : ' Los flujos afectan al resultado de la cuenta; la rentabilidad del instrumento describe el instrumento, no una rentabilidad temporal de la cuenta.';
        text += en ? ' Past or simulated outcomes do not guarantee future results.' : ' Los resultados pasados o simulados no garantizan resultados futuros.';
      }
    } else if (intent === 'source') {
      text = context?.instrument?.dataKind === 'historical_nav' ? (en ? 'Monthly closing NAVs published by CNMV; past performance does not predict future results.' : 'Valores liquidativos de cierre mensual publicados por la CNMV; el pasado no predice resultados futuros.') : context?.instrument?.dataKind === 'annual_published_returns' ? (en ? 'This reconstruction uses published annual returns; it is not a daily NAV series.' : 'Esta reconstrucción usa rentabilidades anuales publicadas; no es una serie diaria de valor liquidativo.') : context?.instrument?.dataKind === 'fictional' ? (en ? 'These are fictional example data.' : 'Son datos ficticios de ejemplo.') : (en ? 'There is no connected history to explain.' : 'No hay histórico conectado para explicar.');
    } else if (intent === 'decline') {
      const d = context?.decline;
      if (!d) text = en ? 'Maximum drawdown is the largest percentage drop from a peak to a later low within the observed period; volatility describes how much the value varies. Both are computed on past data and do not predict the future.' : 'La caída máxima (drawdown) es la mayor bajada porcentual desde un máximo hasta un mínimo posterior en el periodo observado; la volatilidad describe cuánto varía el valor. Ambas se calculan sobre datos pasados y no predicen el futuro.';
      else if (d.status !== 'ok' || !Number.isFinite(d.currentDrawdownPercent) || !Number.isFinite(d.maxDrawdownPercent) || typeof d.latestLabel !== 'string') text = en ? 'There are not enough valid observations to analyse a decline.' : 'No hay observaciones válidas suficientes para analizar una caída.';
      else text = en ? `At ${d.latestLabel}, the observed decline from the peak is ${fmt(d.currentDrawdownPercent!)}%; the largest observed decline is ${fmt(d.maxDrawdownPercent!)}%. An observed recovery does not guarantee a future recovery.` : `En ${d.latestLabel}, la caída observada desde el máximo es del ${fmt(d.currentDrawdownPercent!)}%; la mayor caída observada es del ${fmt(d.maxDrawdownPercent!)}%. Una recuperación observada no garantiza una recuperación futura.`;
      if (!d || d.status === 'ok') text += declineLevelNote(context?.level, en);
    } else if (intent === 'causes') {
      const demo = context?.decline?.demoContext;
      text = demo?.sourceKind === 'synthetic_demo' ? `${demo.explanation[lang]} ${en ? 'Fictional BancoT2F script, not verified news; no comparable cases are available.' : 'Guion ficticio BancoT2F, no son noticias verificadas; no hay casos comparables.'}` : (en ? 'The cause is unknown from the available data. There are no verified news or comparable cases here.' : 'La causa es desconocida con los datos disponibles. Aquí no hay noticias verificadas ni casos comparables.');
    }
    else if (intent === 'decision') {
      const decision = context?.decision;
      const parts: string[] = [];
      if (calm) {
        const d = context?.decline;
        parts.push(en ? 'It is understandable to feel worried when investments fall. Values fluctuate, and taking a moment to review the situation can help before an impulsive decision.' : 'Es comprensible sentir preocupación cuando una inversión baja. Los valores fluctúan y tomarse un momento para revisar la situación puede ayudar antes de decidir impulsivamente.');
        if (!d || d.status !== 'ok' || !Number.isFinite(d.currentDrawdownPercent) || !Number.isFinite(d.maxDrawdownPercent) || typeof d.latestLabel !== 'string') parts.push(en ? 'There are not enough valid observations to analyse this decline.' : 'No hay observaciones válidas suficientes para analizar esta caída.');
        parts.push(en ? 'In general, changes in expectations, interest rates or company results can affect investments; the cause of this movement is unknown from the available data.' : 'En general, los cambios de expectativas, tipos de interés o resultados empresariales pueden afectar a las inversiones; la causa de este movimiento es desconocida con los datos disponibles.');
        if (d?.demoContext?.sourceKind === 'synthetic_demo') parts.push(en ? 'Any BancoT2F scenario is a fictional script, not verified news.' : 'El escenario BancoT2F es un guion ficticio, no una noticia verificada.');
      }
      if (typeof decision?.goal === 'string' && decision.goal.trim() && decision.goal.length <= 200) parts.push(en ? `Your stated goal: ${decision.goal.trim()}.` : `Tu objetivo indicado: ${decision.goal.trim()}.`);
      if (typeof decision?.horizonYears === 'number' && Number.isFinite(decision.horizonYears) && decision.horizonYears >= 0 && decision.horizonYears <= 100) parts.push(en ? `Your stated horizon: ${fmt(decision.horizonYears)} years.` : `Tu horizonte indicado: ${fmt(decision.horizonYears)} años.`);
      if (decision?.needsLiquidity === 'yes') parts.push(en ? 'You indicated that you need liquidity.' : 'Has indicado que necesitas liquidez.');
      else if (decision?.needsLiquidity === 'no') parts.push(en ? 'You indicated that you do not need liquidity.' : 'Has indicado que no necesitas liquidez.');
      else if (decision?.needsLiquidity === 'unknown') parts.push(en ? 'Your liquidity need is not yet known.' : 'Tu necesidad de liquidez todavía no se conoce.');
      if (calm && decision?.needsLiquidity === 'yes') parts.push(en ? 'Consider when and how much money you need; that need can matter when weighing a sale.' : 'Valora cuándo y cuánto dinero necesitas; esa necesidad puede ser relevante al valorar una venta.');
      parts.push(en ? 'Consider your goal, time horizon and whether you need liquidity. A long horizon does not guarantee recovery. You can sell, hold or seek professional advice; the decision is yours.' : 'Ten en cuenta tu objetivo, horizonte y necesidad de liquidez. Un plazo largo no garantiza la recuperación. Puedes vender, mantener o consultar a un profesional; la decisión es tuya.');
      text = parts.join(' ') + decisionLevelNote(context?.level, en);
    }
    else {
      text = en ? 'This local tutor uses predefined explanations. Ask about funds, risk, costs, the simulation or an observed decline.' : 'Este tutor local utiliza explicaciones predefinidas. Pregunta por fondos, riesgo, costes, la simulación o una caída observada.';
      const hint = pageHint(context?.page, context?.level, en);
      if (hint) text = hint + ' ' + text;
    }
    const sources = calm ? [] : intent === 'decline' || intent === 'causes' ? safeSources(context?.decline?.sources) : safeSources(context?.instrument?.sources);
    if (request.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    return { text: text.slice(0, 3000), language: lang, mode: 'local', provider: 'local', intent, sources };
  } };
}
