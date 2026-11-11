import scenario from '../../shared/decline-demo.json' with { type: 'json' };
import type { DeclineReport, DemoDeclineContext } from './types.ts';
export function withDemoDecline(report: DeclineReport, instrumentId: string, periods: number): DeclineReport {
  if (report.status !== 'ok' || report.dataKind !== 'fictional' || instrumentId !== scenario.instrumentId || periods !== scenario.periods) return report;
  return { ...report, demoContext: scenario as DemoDeclineContext };
}
