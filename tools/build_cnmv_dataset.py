"""Build a compact, auditable NAV dataset from the CNMV monthly extracts."""
from datetime import date
from decimal import Decimal, InvalidOperation
import json
from pathlib import Path
import sys

try:
    from .collect_cnmv import ISINS, IDENTITY
except ImportError:
    from collect_cnmv import ISINS, IDENTITY


def complete_distribution_coverage(evidence):
    required = {f'{year}{month:02d}' for year in range(2020, 2026) for month in (6, 12)}
    by_period = {item['period']: item for item in evidence}
    if len(by_period) != len(evidence) or not required.issubset(by_period):
        return False
    try:
        return all(by_period[key]['currency'] == 'EUR' and by_period[key]['grossDistribution'] is not None
                   and Decimal(by_period[key]['grossDistribution']).is_finite()
                   and Decimal(by_period[key]['grossDistribution']) == 0 for key in required)
    except (KeyError, TypeError, InvalidOperation):
        return False


def validate_identity(isin, entry):
    registry, share_class, names = IDENTITY[isin]
    class_names = {'ES0138045002': 'ESTÁNDAR', 'ES0112793007': 'CLASE A', 'ES0125269003': 'CLASE 0',
                   'ES0146133006': 'CLASE A', 'ES0118857004': 'CLASE 0'}
    if entry.get('registry') != registry or entry.get('classNumber') != share_class or entry.get('name') not in names or entry.get('className') != class_names[isin]:
        raise ValueError(f'fund identity mismatch: {isin}')


def build(cache):
    periods = ['201912'] + [f'{y}{m:02d}' for y in range(2020, 2026) for m in range(1, 13)]
    archives = []
    instruments = {isin: {'isin': isin, 'monthly': [], 'daily': [], 'identities': [], 'distributionEvidence': []} for isin in ISINS}
    for period in periods:
        item = json.loads((cache / f'{period}.json').read_text(encoding='utf-8'))
        if item['period'] != period or len(item['archiveSha256']) != 64:
            raise ValueError(f'invalid archive metadata: {period}')
        archives.append({key: item[key] for key in ('period', 'sourceUrl', 'archiveSha256')})
        for isin in ISINS:
            instrument = instruments[isin]
            entry = item['classes'].get(isin)
            if entry:
                validate_identity(isin, entry)
                observations = entry['observations']
                if any(date.fromisoformat(o['date']).strftime('%Y%m') != period or not Decimal(o['nav']).is_finite() or Decimal(o['nav']) <= 0 for o in observations):
                    raise ValueError(f'invalid NAV: {period} {isin}')
                if observations != sorted(observations, key=lambda o: o['date']) or len({o['date'] for o in observations}) != len(observations):
                    raise ValueError(f'duplicate or out-of-order NAV: {period} {isin}')
                instrument['daily'].extend(observations)
                if observations:
                    instrument['monthly'].append(observations[-1])
                instrument['identities'].append({'period': period, 'name': entry['name'], 'registry': entry['registry'], 'classNumber': entry['classNumber'], 'className': entry['className']})
            if int(period[-2:]) % 3 == 0:
                q = item.get('quarterly', {}).get(isin)
                if q and (q.get('registry'), q.get('classNumber')) != IDENTITY[isin][:2]:
                    raise ValueError(f'quarterly identity mismatch: {period} {isin}')
                instrument['distributionEvidence'].append({'period': period, 'currency': q.get('currency') if q else None,
                                                           'grossDistribution': q.get('grossDistribution') if q else None})
    for isin, instrument in instruments.items():
        evidence = instrument['distributionEvidence']
        valid_distributions = complete_distribution_coverage(evidence)
        try:
            all_reported_valid = all(e['currency'] == 'EUR' and Decimal(e['grossDistribution']).is_finite() and Decimal(e['grossDistribution']) == 0 for e in evidence if e['grossDistribution'] is not None)
        except (InvalidOperation, TypeError):
            all_reported_valid = False
        valid_distributions = valid_distributions and all_reported_valid
        instrument['eligible'] = (len(instrument['monthly']) == 73 and len(instrument['identities']) == 73 and valid_distributions)
        instrument['currency'] = 'EUR' if valid_distributions else None
        instrument['name'] = instrument['identities'][-1]['name'] if instrument['identities'] else None
    return {'schemaVersion': '1.0', 'datasetVersion': 'cnmv-nav-2019-2025.1',
            'source': {'name': 'CNMV', 'indexUrl': 'https://www.cnmv.es/portal/publicaciones/descarga-informacion-individual.aspx',
                       'legalUrl': 'https://www.cnmv.es/portal/Utilidades/NotaLegal',
                       'rights': 'Conditional reuse; retain source and faithfulness, and disclose free CNMV originals if charging for the medium.',
                       'distributionMethod': 'No distributions recorded at published precision in the consulted reports; June and December reports cover each complete semester.',
                       'distributionMethodUrl': 'https://www.cnmv.es/cnmvdia/decetes/Manual_AnexosIIC.pdf'},
            'events': [{'id': 'who-covid-pandemic-2020-03-11', 'date': '2020-03-11', 'sourceKind': 'verified_public_event',
                        'publisher': 'WHO', 'sourceUrl': 'https://www.who.int/news-room/speeches/item/who-director-general-s-opening-remarks-at-the-media-briefing-on-covid-19---11-march-2020',
                        'title': {'es': 'La OMS caracteriza la COVID-19 como pandemia', 'en': 'WHO characterizes COVID-19 as a pandemic'},
                        'summary': {'es': 'La OMS describió la situación mundial de COVID-19 como pandemia el 11 de marzo de 2020.',
                                    'en': 'WHO described the global COVID-19 situation as a pandemic on 11 March 2020.'}}],
            'archives': archives, 'instruments': list(instruments.values())}


if __name__ == '__main__':
    result = build(Path(sys.argv[1]))
    output = Path(sys.argv[2])
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for instrument in result['instruments']:
        print(instrument['isin'], len(instrument['monthly']), len(instrument['daily']), len(instrument['distributionEvidence']), instrument['eligible'], instrument['name'])
