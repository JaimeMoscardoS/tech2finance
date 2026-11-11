"""Create the active source registry from the frozen catalogue and NAV manifest."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
catalog = json.loads((ROOT / 'shared/demo-data.json').read_text(encoding='utf-8'))
history = json.loads((ROOT / 'shared/nav-history.json').read_text(encoding='utf-8'))
by_isin = {item['isin']: item for item in history['instruments']}
registry = {'description': 'Inventario de fuentes; la reutilización de CNMV está condicionada y requiere revisión para cada uso.', 'instruments': []}
for item in catalog['instruments']:
    series = by_isin.get(item['identifier'])
    registry['instruments'].append({
        'instrumentId': item['instrumentId'], 'classification': 'official_historical_nav' if series else 'unsupported_distributions',
        'identifier': item['identifier'], 'sourceUrl': item['sourceUrl'], 'sourceConsultation': item['sourceDate'],
        'lastObservation': series['monthly'][-1]['date'] if series and series['monthly'] else None,
        'currency': item['currency'], 'shareClass': item['shareClass'],
        'methodology': 'Último valor liquidativo observado por mes, sin interpolación; importes y aportaciones virtuales al cierre.' if series else 'Referencia no ejecutable por distribuciones no modeladas.',
        'costs': 'El valor liquidativo refleja gastos incorporados; no se añaden costes externos. Condiciones actuales no verificadas.',
        'distributions': 'Sin distribuciones registradas a la precisión publicada en los informes consultados durante 2020–2025; no garantiza política futura.' if series else 'Distribuciones registradas; tratamiento no implementado.',
        'rights': {'access': 'public', 'internalUse': 'conditional_review', 'commercialUse': 'conditional_review',
                   'redistribution': 'conditional_review', 'derivatives': 'conditional_review',
                   'legalUrl': history['source']['legalUrl'],
                   'notice': 'Reproducción fiel; si se cobra por el medio, informar de la disponibilidad gratuita de los originales en CNMV.'}
    })
(ROOT / 'datos/registro-fuentes.json').write_text(json.dumps(registry, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
