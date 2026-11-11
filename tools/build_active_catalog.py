"""Build the new catalogue from the immutable legacy snapshot and CNMV NAV data."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
old = json.loads((ROOT / 'shared/snapshots/demo-2026-11-10.1/demo-data.json').read_text(encoding='utf-8'))
nav = json.loads((ROOT / 'shared/nav-history.json').read_text(encoding='utf-8'))
specs = {
    'ES0138045002': ('caixabank-monetario-estandar', 'caixabank', 'CaixaBank Asset Management', 'Estándar'),
    'ES0112793007': ('santander-rf-ahorro', 'santander', 'Santander Asset Management', 'A'),
    'ES0125269003': ('bbva-mi-inversion-bolsa-acumulacion', 'bbva', 'BBVA Asset Management SGIIC', 'Clase 0'),
    'ES0146133006': ('santander-renta-fija-a', 'santander', 'Santander Asset Management', 'A'),
    'ES0118857004': ('bbva-estrategia-0-50', 'bbva', 'BBVA Asset Management SGIIC', 'Clase 0'),
}
old['schemaVersion'] = '2.0'
old['instruments'] = []
for entry in nav['instruments']:
    identifier, bank, manager, share_class = specs[entry['isin']]
    name = entry['name']
    old['instruments'].append({'instrumentId': identifier, 'assetType': 'fund', 'assetClass': 'unknown',
        'bankId': bank, 'manager': manager, 'relationship': 'unknown', 'identifier': entry['isin'],
        'shareClass': share_class, 'currency': entry['currency'], 'sourceUrl': nav['source']['indexUrl'],
        'sourceDate': '2026-11-11', 'dataStatus': 'historical_nav', 'name': {'es': name, 'en': name},
        'riskIndicator': None, 'annualFee': None, 'minimumInitial': None, 'horizon': None})
legacy = next(item for item in json.loads((ROOT / 'shared/snapshots/demo-2026-11-10.1/demo-data.json').read_text(encoding='utf-8'))['instruments'] if item['instrumentId'] == 'bbva-mi-inversion-bolsa')
legacy['dataStatus'] = 'unsupported_distributions'
old['instruments'].append(legacy)
old['demoStudyInstrumentIds'] = [specs[entry['isin']][0] for entry in nav['instruments']]
old.pop('portfolioPoints', None)
old['portfolioExample'] = {'instrumentId': 'bbva-mi-inversion-bolsa-acumulacion', 'startDate': '2019-12-31',
                           'initial': 1000, 'recurringContribution': 0, 'periods': 3}
profile = old['bankProfile']
profile['products'] = []
profile['calculationNotice'] = {'es': 'Las comisiones de los productos reales no están disponibles en esta demo. El valor liquidativo ya refleja los gastos incorporados al fondo; no se añade ningún coste externo.',
                                'en': 'Real product fees are not available in this demo. NAV already reflects costs embedded in the fund; no external cost is added.'}
for item in profile['faq']:
    if item['id'] == 'conditions':
        item['answer'] = {'es': 'Sin mantenimiento mensual, cuenta real ni órdenes reales. Las condiciones de cada producto no están disponibles.',
                          'en': 'No monthly maintenance, real account or real orders. Individual product terms are unavailable.'}
    if item['id'] == 'fees':
        item['answer'] = profile['calculationNotice']
(ROOT / 'shared/demo-data.json').write_text(json.dumps(old, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
