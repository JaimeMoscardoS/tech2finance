import aliases from '../../shared/fund-aliases.json' with { type: 'json' };
import type { Instrument } from './catalog';

type Localized = { es: string; en: string };
const bases: Record<string, Localized> = aliases;
const key = (s: string) => s.normalize('NFKC').toLocaleLowerCase('en').replace(/[^\p{L}\p{N}]+/gu, '');

/** Resolve against the complete catalogue before applying any bank or eligibility filter. */
export function fundDisplayNames(items: readonly Instrument[]): Map<string, Localized> {
  const result = new Map<string, Localized>();
  for (const item of items) {
    const base = bases[item.instrumentId];
    if (!base) continue;
    const peers = items.filter(other => {
      const candidate = bases[other.instrumentId];
      return candidate && (key(candidate.es) === key(base.es) || key(candidate.en) === key(base.en));
    }).map(other => other.instrumentId).sort();
    const suffix = peers.length > 1 ? ` ${peers.indexOf(item.instrumentId) + 1}` : '';
    result.set(item.instrumentId, {es: base.es + suffix, en: base.en + suffix});
  }
  return result;
}

export function displayCatalog(items: readonly Instrument[]): Instrument[] {
  const names = fundDisplayNames(items);
  return items.map(item => ({...item, officialName: item.officialName ?? item.name, name: names.get(item.instrumentId) ?? item.name}));
}
