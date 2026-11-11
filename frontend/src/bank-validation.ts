import type { BankProfile } from '../../shared/bank-profile';

const obj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const loc = (v: unknown) => obj(v) && typeof v.es === 'string' && typeof v.en === 'string';
const amount = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const unique = (v: string[]) => new Set(v).size === v.length;
const ids = (v: unknown, expected: string[]) => Array.isArray(v) && v.length === expected.length && v.every(x => obj(x) && expected.includes(x.id)) && unique(v.map(x => x.id));

export function isBankProfile(v: unknown, instruments: {instrumentId:string; bankId:string; dataStatus:string}[]): v is BankProfile {
 if (!obj(v) || v.bankId !== 'demo' || v.profileVersion !== 'bank-demo-2026-11-10.1' || v.classification !== 'synthetic_demo' || !loc(v.name) || !loc(v.description) || !obj(v.source) || v.source.kind !== 'synthetic_seed' || v.source.asOf !== '2026-11-10' || !loc(v.calculationNotice)) return false;
 if (!ids(v.services,['catalogue','practice','tutor','portfolio_pause']) || !v.services.every((s: any) => loc(s.name) && loc(s.description)) || !ids(v.faq,['identity','services','conditions','fees','real_money','external_products']) || !v.faq.every((f: any) => loc(f.question) && loc(f.answer))) return false;
 const c = v.conditions;
 if (!obj(c) || c.currency !== 'EUR' || c.maintenanceMonthlyEur !== 0 || c.requiresRealAccount !== false || c.realOrdersAvailable !== false || c.externalConnections !== false || !loc(c.text)) return false;
 const expectedProducts: string[] = [];
 if (!Array.isArray(v.products) || v.products.length !== expectedProducts.length || !v.products.every((p: unknown) => obj(p) && typeof p.instrumentId === 'string' && expectedProducts.includes(p.instrumentId) && instruments.some(i => i.instrumentId === p.instrumentId && i.bankId === v.bankId && i.dataStatus === 'fictional') && amount(p.minimumInitialEur) && amount(p.minimumRecurringEur) && loc(p.description) && obj(p.fees) && (p.fees.annualOngoingBps === null || amount(p.fees.annualOngoingBps)) && ['entryBps','exitBps','orderFixedEur','custodyAnnualBps'].every(k => amount(p.fees[k])) && p.fees.treatment === 'illustrative_excluded') || !unique(v.products.map(p => p.instrumentId))) return false;
 return true;
}
