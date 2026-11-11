import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import data from '../../shared/demo-data.json' with {type:'json'};
import navHistory from '../../shared/nav-history.json' with {type:'json'};
import { displayCatalog, fundDisplayNames } from './fund-names.ts';
import { scopeCatalog } from './bank-scope.ts';
import type { Catalog } from './server-api.ts';

test('real duplicate names are stable across order, language, and bank filters', () => {
 const catalog = {...data, navHistory} as unknown as Catalog;
 const names = fundDisplayNames(catalog.instruments);
 assert.deepEqual(names.get('bbva-mi-inversion-bolsa'), {es:'Fondo bolsa 1',en:'Equity fund 1'});
 assert.deepEqual(names.get('bbva-mi-inversion-bolsa-acumulacion'), {es:'Fondo bolsa 2',en:'Equity fund 2'});
 assert.deepEqual(fundDisplayNames([...catalog.instruments].reverse()), names);
 const bbva = scopeCatalog(catalog,'bbva');
 assert.equal(bbva.instruments.find(i => i.instrumentId === 'bbva-mi-inversion-bolsa-acumulacion')!.name.es, 'Fondo bolsa 2');
 const shown = displayCatalog(catalog.instruments);
 assert.equal(displayCatalog(shown)[0].officialName!.es, catalog.instruments[0].name.es);
 for (const language of ['es','en'] as const) {
  const normalized = shown.map(i => i.name[language].normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,''));
  assert.equal(new Set(normalized).size, normalized.length);
 }
});
