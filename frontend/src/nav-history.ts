import { MAX_SIMULATION_AMOUNT, type SimulationResult, type TimelinePoint } from './simulation-types.ts';
export type NavPoint = { date: string; nav: string };
export function simulateNav(rows: readonly NavPoint[], initial: number, monthly: number, periods: number, startDate?: string, frequency: 'monthly' | 'annual' = 'monthly'): SimulationResult {
 if (!['monthly','annual'].includes(frequency) || ![initial, monthly].every(n => Number.isFinite(n) && n >= 0 && n <= MAX_SIMULATION_AMOUNT) || !Number.isInteger(periods) || periods < 1 || periods > 72) throw new Error('Invalid simulation inputs');
 const start = startDate === undefined ? 0 : rows.findIndex(row => row.date === startDate);
 if (start < 0 || start + periods >= rows.length) throw new Error('History outside available coverage');
 const selected = rows.slice(start, start + periods + 1);
 if (selected.some((p,i) => {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(p.date) ? new Date(`${p.date}T00:00:00Z`) : null;
  if (!date || !Number.isFinite(date.valueOf()) || date.toISOString().slice(0,10) !== p.date || !Number.isFinite(Number(p.nav)) || Number(p.nav) <= 0) return true;
  if (i === 0) return false;
  const previous = new Date(`${selected[i-1].date}T00:00:00Z`);
  return date.getUTCFullYear()*12 + date.getUTCMonth() !== previous.getUTCFullYear()*12 + previous.getUTCMonth() + 1;
 })) throw new Error('Invalid NAV history');
 let value = initial, contributed = initial;
 const timeline: TimelinePoint[] = [{ period: 0, date: selected[0].date, nav:selected[0].nav, valueBeforeContribution: 0, contribution: initial, contributed, value, profit: 0, instrumentReturnPercent: 0, periodReturn: null }];
 for (let i=1; i<selected.length; i++) {
  const rate = Number(selected[i].nav) / Number(selected[i-1].nav) - 1;
  const before = value * (1 + rate); const contribution = frequency === 'monthly' || i % 12 === 0 ? monthly : 0; value = before + contribution; contributed += contribution;
  timeline.push({period:i,date:selected[i].date,nav:selected[i].nav,valueBeforeContribution:before,contribution,contributed,value,profit:value-contributed,instrumentReturnPercent:(Number(selected[i].nav)/Number(selected[0].nav)-1)*100,periodReturn:rate});
 }
 const last = timeline[timeline.length-1];
 return {kind:'real_monthly_nav', points:timeline.map(p=>p.value), timeline, value:last.value, contributed:last.contributed, profit:last.profit, simpleReturnPercent:last.contributed ? last.profit / last.contributed * 100 : null};
}
