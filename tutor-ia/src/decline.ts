import type { DeclineEpisode, DeclineInput, DeclineReport, SourceRef } from './types.ts';

export function safeSources(sources: readonly SourceRef[] | undefined): SourceRef[] {
  if (!Array.isArray(sources)) return [];
  return sources.slice(0, 20).flatMap((source) => {
    if (!source || typeof source.label !== 'string' || !source.label.trim() || source.label.length > 200 || typeof source.url !== 'string' || source.url.length > 2048) return [];
    try {
      const url = new URL(source.url);
      if (url.protocol !== 'https:' || url.username || url.password) return [];
      return [{ label: source.label, url: source.url, ...(typeof source.checkedAt === 'string' && source.checkedAt.length <= 50 ? { checkedAt: source.checkedAt } : {}) }];
    } catch { return []; }
  });
}

export function analyzeDecline(input: DeclineInput): DeclineReport {
  const observations = Array.isArray(input?.observations) ? input.observations : [];
  const valid = typeof input?.name === 'string' && !!input.name.trim() && input.name.length <= 200 && (input.dataKind === 'fictional' || input.dataKind === 'annual_published_returns' || input.dataKind === 'historical_nav') && observations.length >= 2 && observations.length <= 500 && Array.from(observations).every((o) => o && typeof o.label === 'string' && !!o.label.trim() && o.label.length <= 100 && typeof o.value === 'number' && Number.isFinite(o.value) && o.value > 0);
  const report: DeclineReport = {
    status: valid ? 'ok' : 'insufficient_data', basisName: typeof input?.name === 'string' ? input.name.slice(0, 200) : '',
    dataKind: input?.dataKind === 'annual_published_returns' ? 'annual_published_returns' : input?.dataKind === 'historical_nav' ? 'historical_nav' : 'fictional', observationCount: observations.length,
    latestLabel: null, latestValue: null, peakValue: null, currentDrawdownPercent: null, maxDrawdownPercent: null,
    episodes: [], sources: safeSources(input?.sources), causesStatus: 'unknown', comparablesStatus: 'not_available',
    limitations: ['Solo se analizan las observaciones facilitadas; no se conocen las causas ni hay comparables.', 'La recuperación observada no garantiza una recuperación futura.'],
  };
  if (!valid) return report;
  let peak = observations[0].value, peakIndex = 0, troughIndex = -1, max = 0;
  for (let i = 1; i < observations.length; i++) {
    const value = observations[i].value;
    if (value >= peak) {
      if (troughIndex >= 0) {
        report.episodes.push(episode(observations, peakIndex, troughIndex, i));
        troughIndex = -1;
      }
      peak = value; peakIndex = i;
    } else {
      if (troughIndex < 0 || value < observations[troughIndex].value) troughIndex = i;
      max = Math.max(max, (1 - value / peak) * 100);
    }
  }
  if (troughIndex >= 0) report.episodes.push(episode(observations, peakIndex, troughIndex, null));
  const last = observations[observations.length - 1];
  report.latestLabel = last.label; report.latestValue = last.value; report.peakValue = peak;
  report.currentDrawdownPercent = (1 - last.value / peak) * 100; report.maxDrawdownPercent = max;
  return report;
}

function episode(obs: DeclineInput['observations'], peak: number, trough: number, recovery: number | null): DeclineEpisode {
  return { peakLabel: obs[peak].label, troughLabel: obs[trough].label, recoveryLabel: recovery === null ? null : obs[recovery].label,
    drawdownPercent: (1 - obs[trough].value / obs[peak].value) * 100, observationsToTrough: trough - peak,
    observationsToRecovery: recovery === null ? null : recovery - peak };
}
