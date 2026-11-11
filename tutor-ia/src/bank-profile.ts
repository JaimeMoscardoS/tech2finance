import type { TutorContext, TutorHistoryMessage } from './types.ts';

type Answer = { text: string; intent: string };
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 1000;
const localized = (value: unknown, lang: 'es' | 'en'): string | undefined => {
  if (!value || typeof value !== 'object') return;
  const result = (value as Record<string, unknown>)[lang];
  return text(result) ? result : undefined;
};
const number = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= 1000000;

export function bankAnswer(message: string, context: TutorContext, history: readonly TutorHistoryMessage[] = []): Answer | undefined {
  const m = norm(message).replace(/^\s*¿/, ''), en = context?.language === 'en', lang = en ? 'en' : 'es';
  if (/ignore|ignora|system prompt|api.?key|secret|password/.test(m)) return;
  const missing = /(?:simular|simulate|simulation|simulacion).*(?:no|cannot|can't|unavailable)|(?:no puedo|cannot|can't|why).*(?:simular|simulate)/.test(m);
  if (missing && context?.instrument?.dataKind === 'missing_history') return {intent: 'bank_missing_history', text: en ? 'The selected instrument has no available history, so it cannot be simulated.' : 'El instrumento seleccionado no tiene histórico disponible, por lo que no se puede simular.'};
  const bank = context?.bank;
  if (!bank) return;
  const unavailable = (intent = 'unknown'): Answer => ({ intent, text: en ? 'That information is not available for the requested bank or product.' : 'No hay información disponible para el banco o producto solicitado.' });
  const last = [...history].slice(-8).reverse().find(item => item?.role === 'assistant');
  const followFee = /^(?:y eso|and (?:is )?that|is (?:that|it)|se|esta|is it).*(?:descontad|deducted|included)/.test(m) && last?.intent === 'bank_fees';
  const feeQuery = /(?:cuanto (?:cuesta|cobran)|comision|coste|fees?|charg(?:e|es|ed)|costs?)/.test(m);
  const genericFee = /^(?:¿?\s*)?(?:que es|que son|que significa(?:n)?|what is|what are) (?:una |unas |un |unos |la |las |el |los |a |the )?(?:comision(?:es)?|costes?|fees?|charges?)[?¿.!\s]*$/.test(m);
  const foreign = /\b(bbva|santander|caixabank|tesla)\b/.test(m);
  const named = m.match(/(?:fondo|fund|etf|accion|stock|share)\s+(?:de\s+|of\s+)?(?!de\b|del\b|selected\b|seleccionad|este\b|this\b|cost\b|costs\b|charge\b)([a-z0-9][a-z0-9 ]*)/);
  const namedDirect = m.match(/(?:cuanto cuesta|how much does)\s+(?!(?:este|esta|el|la|this|the)\b)([a-z0-9 ]+?)(?:\s+cost)?[?!.]*$/)?.[1]?.trim();
  const namedFee = m.match(/\b(?:fees?\s+(?:for|of)|comisiones?\s+(?:tiene|de|del))\s+([a-z0-9][a-z0-9 ]*)[?!.]*$/)?.[1]?.trim();
  const active = norm(context.instrument?.name ?? '');
  const feeTarget = namedFee?.replace(/^(?:the|el|la)\s+/, '');
  const contextualTarget = feeTarget && /^(?:(?:this|selected)\s+(?:fund|etf|stock|share|instrument|product)|(?:este|esta|ese|esa)\s+(?:fondo|etf|accion|instrumento|producto)|(?:fund|fondo|product|producto|instrument|instrumento))$/.test(feeTarget);
  const requested = named?.[1]?.trim() ?? namedDirect ?? (contextualTarget ? undefined : feeTarget);
  const foreignProduct = !!requested && (!active || (requested !== active && requested !== active.replace(/^(?:fondo|fund)\s+/, '')));
  const validBank = bank.bankId === 'demo' && bank.classification === 'synthetic_demo' && bank.profileVersion === 'bank-demo-2026-11-10.1' && bank.source?.kind === 'synthetic_seed' && bank.source.asOf === '2026-11-10' && !!localized(bank.name, lang) && !!localized(bank.description, lang) && Array.isArray(bank.services) && bank.services.length > 0 && bank.services.length <= 20 && Array.from(bank.services).every(s => s && text(s.id) && !!localized(s.name, lang) && !!localized(s.description, lang)) && Array.isArray(bank.products) && bank.products.length > 0 && bank.products.length <= 50 && Array.from(bank.products).every(p => p && text(p.instrumentId)) && Array.isArray(bank.faq) && bank.faq.length > 0 && bank.faq.length <= 30 && Array.from(bank.faq).every(f => f && text(f.id) && !!localized(f.question, lang) && !!localized(f.answer, lang));
  const identity = /bancot2f|banco t2f|(?:what|que).*(?:bank|banco).*(?:this|este|demo)/.test(m);
  const conditions = /condicion|terms|maintenance|mantenimiento|(?:cuenta|account).*(?:demo|fictici|fictional)/.test(m);
  const services = /servicios|services|ofrece|offer/.test(m);
  const maintenance = /maintenance|mantenimiento/.test(m);
  const externalProducts = /(?:all|todos|todas).*(?:products|productos).*(?:bancot2f|banco t2f)|(?:bancot2f|banco t2f).*(?:all|todos|todas).*(?:products|productos)/.test(m);
  const bancoName = m.match(/\bbanco\s*([a-z0-9]+)/)?.[1];
  const otherBanco = !!bancoName && !['t2f', 'de', 'demo', 'ficticio', 'ficticia', 'actual', 'seleccionado'].includes(bancoName);
  const otherBank = /\b(?:[a-z0-9]+bank[a-z0-9]*|bank[a-z0-9]+)\b/.test(m);
  const page = /que estoy viendo|what am i (?:seeing|looking at)|what is this page/.test(m);
  const forecast = /(?:ganar[eé]|earn|profit|return|rentabilidad|beneficio).*(?:proxim[oa]|next|futuro|future|manana|tomorrow)/.test(m);
  if (forecast) return { intent: 'unknown', text: en ? 'Future returns are not available or predictable from this demonstration.' : 'La rentabilidad futura no está disponible y esta demostración no permite predecirla.' };
  if ((foreign || otherBanco || otherBank) && (identity || conditions || services || feeQuery)) return unavailable();
  if (!(identity || conditions || services || page || (feeQuery && !genericFee) || followFee)) return;
  if (!validBank) return unavailable();
  const notice = localized(bank.calculationNotice, lang);
  if (externalProducts) {
    const answer = localized(bank.faq.find(f => f.id === 'external_products')?.answer, lang);
    return answer ? {intent: 'bank_external_products', text: answer} : unavailable();
  }
  if (conditions && (!feeQuery || maintenance)) {
    const terms = localized(bank.conditions?.text, lang);
    const minimums = localized(bank.faq.find(f => f.id === 'conditions')?.answer, lang);
    const validMinimums = bank.products.every(p => p.minimumInitialEur === 0 && p.minimumRecurringEur === 0);
    return terms && minimums && validMinimums && bank.conditions?.currency === 'EUR' && bank.conditions.maintenanceMonthlyEur === 0 && bank.conditions.requiresRealAccount === false && bank.conditions.realOrdersAvailable === false && bank.conditions.externalConnections === false ? {intent: 'bank_conditions', text: `${terms} ${minimums}`} : unavailable();
  }
  if (followFee || (feeQuery && !genericFee)) {
    if (foreignProduct || foreign) return unavailable();
    const product = context.instrument?.product;
    const matchingProduct = bank.products.find(p => p?.instrumentId === product?.instrumentId);
    const selected = (context.page === 'explore' || context.page === 'simulator') && context.instrument && product && product.instrumentId === context.instrument.id && matchingProduct && JSON.stringify(matchingProduct) === JSON.stringify(product);
    if (!selected || !product?.fees || !notice) return unavailable();
    const f = product.fees;
    if (!(f.annualOngoingBps === null || number(f.annualOngoingBps)) || !number(f.entryBps) || !number(f.exitBps) || !number(f.orderFixedEur) || !number(f.custodyAnnualBps) || f.treatment !== 'illustrative_excluded') return unavailable();
    const fmt = (x: number) => new Intl.NumberFormat(en ? 'en-GB' : 'es-ES', {maximumFractionDigits: 2}).format(x);
    const annual = f.annualOngoingBps === null ? (en ? 'Annual ongoing fee is unknown.' : 'La comisión anual corriente no está disponible.') : (en ? `Annual ongoing fee: ${fmt(f.annualOngoingBps)} basis points (${fmt(f.annualOngoingBps / 100)}%).` : `Comisión anual corriente: ${fmt(f.annualOngoingBps)} puntos básicos (${fmt(f.annualOngoingBps / 100)}%).`);
    const rest = en ? ` Entry ${fmt(f.entryBps / 100)}%, exit ${fmt(f.exitBps / 100)}%, annual custody ${fmt(f.custodyAnnualBps / 100)}%, order ${fmt(f.orderFixedEur)} EUR.` : ` Entrada ${fmt(f.entryBps / 100)}%, salida ${fmt(f.exitBps / 100)}%, custodia anual ${fmt(f.custodyAnnualBps / 100)}%, orden ${fmt(f.orderFixedEur)} EUR.`;
    return {intent: 'bank_fees', text: `${context.instrument!.name}: ${annual}${rest} ${notice}`};
  }
  if (services) {
    const names = bank.services.map(service => localized(service?.name, lang));
    return names.length && names.every(Boolean) ? {intent: 'bank_services', text: `${en ? 'Services' : 'Servicios'}: ${names.join(', ')}.`} : unavailable();
  }
  if (page) {
    const labels = en ? {home:'home', explore:'catalogue', simulator:'simulator', portfolio:'sample portfolio', learn:'learning', game:'game'} : {home:'inicio', explore:'catálogo', simulator:'simulador', portfolio:'cartera de ejemplo', learn:'educación', game:'juego'};
    const selected = (context.page === 'explore' || context.page === 'simulator') ? (text(context.instrument?.name) ? (en ? ` Selected instrument: ${context.instrument.name}.` : ` Instrumento seleccionado: ${context.instrument.name}.`) : (en ? ' No instrument selected.' : ' No hay instrumento seleccionado.')) : '';
    return {intent: 'bank_page', text: `${localized(bank.name, lang)}: ${labels[context.page] ?? (en ? 'page unavailable' : 'pantalla no disponible')}. ${localized(bank.description, lang)}${selected}`};
  }
  return {intent: 'bank_identity', text: `${localized(bank.name, lang)}: ${localized(bank.description, lang)} ${en ? 'Synthetic source' : 'Fuente sintética'}: ${bank.profileVersion}, ${bank.source.asOf}.`};
}
