export const MAX_SIMULATION_AMOUNT = 1e9;

export type TimelinePoint = {
  period: number;
  date: string | null;
  valueBeforeContribution: number;
  contribution: number;
  contributed: number;
  value: number;
  profit: number;
  instrumentReturnPercent: number;
  periodReturn: number | null;
};

export type SimulationResult = {
  kind: 'fictional_monthly' | 'annual_history';
  points: number[];
  timeline: TimelinePoint[];
  value: number;
  contributed: number;
  profit: number;
  simpleReturnPercent: number | null;
};
