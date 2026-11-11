"""Demo-domain functions. No provider calls or client-supplied facts."""
from copy import deepcopy
import math
from .provenance import load_verified_dataset, read_json, ROOT
from .nav_history import NavHistoryError, select_nav, replay_nav

_DATA, _PROVENANCE = load_verified_dataset()
_NAV = read_json(ROOT / 'nav-history.json')


class DomainError(ValueError):
    def __init__(self, code, status=422, message=None):
        self.code, self.status = code, status
        super().__init__(message or code)
        self.message = message or code


def get_catalog():
    return deepcopy({**{key: _DATA[key] for key in ('schemaVersion', 'banks', 'instruments', 'annualHistory', 'bankProfile', 'demoStudyInstrumentIds', 'portfolioExample')}, 'navHistory': _NAV, 'provenance': _PROVENANCE})


def _instrument(identifier):
    for instrument in _DATA['instruments']:
        if instrument['instrumentId'] == identifier:
            return instrument
    raise DomainError('instrument_not_found', 404, 'Instrument not found')


def _source(instrument, language='es'):
    if not instrument['sourceUrl']:
        return []
    return [{'label': 'CNMV: datos oficiales' if language == 'es' else 'CNMV: official data', 'url': instrument['sourceUrl'], 'checkedAt': instrument['sourceDate']}]


def run_simulation(spec):
    try:
        instrument = _instrument(spec['instrumentId'])
        initial, contribution, periods = spec['initial'], spec['recurringContribution'], spec['periods']
    except (KeyError, TypeError):
        raise DomainError('invalid_simulation', message='Invalid simulation') from None
    for value in (initial, contribution):
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not 0 <= value <= 1_000_000_000 or not math.isfinite(value):
            raise DomainError('invalid_amount', message='Invalid amount')
    if instrument['dataStatus'] != 'historical_nav':
        raise DomainError('missing_history', 422, 'Instrument history is unavailable')
    try:
        rows = select_nav(_NAV, instrument['identifier'], spec.get('startDate'), periods)
    except NavHistoryError:
        raise DomainError('invalid_periods', 422, 'History unavailable or outside coverage') from None
    try:
        result = replay_nav(rows, initial, contribution, spec.get('contributionFrequency', 'monthly'))
    except NavHistoryError:
        raise DomainError('invalid_simulation', 422, 'Invalid contribution frequency') from None
    result.update(instrumentId=instrument['instrumentId'], currency='EUR', sources=_source(instrument),
                  assumptions=['Published CNMV NAV; contributions after each monthly close.', 'Embedded fund costs are reflected in NAV; no external fees or taxes are applied.', 'Past results do not predict future returns.'])
    result['provenance'] = deepcopy(_PROVENANCE)
    return result


def analyze_decline(spec):
    try:
        basis, language = spec['basis'], spec['language']
        if language not in ('es', 'en'):
            raise ValueError
        if basis == 'portfolio_demo':
            if 'instrumentId' in spec or 'periods' in spec:
                raise ValueError
            result = run_simulation(_DATA['portfolioExample'])
            values = result['points']
            name = 'Cartera de ejemplo' if language == 'es' else 'Sample portfolio'
            labels = [row['date'] for row in result['timeline']]
            kind, sources = 'historical_nav', result['sources']
        elif basis == 'instrument':
            inst = _instrument(spec['instrumentId'])
            result = run_simulation({'instrumentId': inst['instrumentId'], 'initial': 100, 'recurringContribution': 0, 'periods': spec['periods'], 'startDate': spec.get('startDate')})
            values = result['points']
            labels = [row['date'] for row in result['timeline']]
            name, sources = inst['name'][language], _source(inst, language)
            kind = 'historical_nav'
        else:
            raise ValueError
    except (KeyError, TypeError, ValueError) as exc:
        if isinstance(exc, DomainError):
            raise
        raise DomainError('invalid_decline', message='Invalid decline request') from None
    report = {'status': 'ok', 'basisName': name, 'dataKind': kind, 'observationCount': len(values),
              'latestLabel': labels[-1], 'latestValue': values[-1], 'peakValue': None,
              'currentDrawdownPercent': None, 'maxDrawdownPercent': 0, 'episodes': [], 'sources': sources,
              'causesStatus': 'unknown', 'comparablesStatus': 'not_available',
              'limitations': ['Solo se analizan las observaciones facilitadas; no se conocen las causas ni hay comparables.', 'La recuperación observada no garantiza una recuperación futura.']}
    peak, peak_i, trough = values[0], 0, None
    def episode(end):
        return {'peakLabel': labels[peak_i], 'troughLabel': labels[trough], 'recoveryLabel': labels[end] if end is not None else None,
                'drawdownPercent': (1 - values[trough] / peak) * 100, 'observationsToTrough': trough - peak_i,
                'observationsToRecovery': end - peak_i if end is not None else None}
    for i in range(1, len(values)):
        if values[i] >= peak:
            if trough is not None:
                report['episodes'].append(episode(i))
                trough = None
            peak, peak_i = values[i], i
        else:
            if trough is None or values[i] < values[trough]:
                trough = i
            report['maxDrawdownPercent'] = max(report['maxDrawdownPercent'], (1 - values[i] / peak) * 100)
    if trough is not None:
        report['episodes'].append(episode(None))
    report['peakValue'] = peak
    report['currentDrawdownPercent'] = (1 - values[-1] / peak) * 100
    events = [event for event in _NAV['events'] if labels[0] <= event['date'] <= labels[-1]]
    if events:
        report['historicalContext'] = {'events': deepcopy(events)}
    return report


def build_tutor_context(context):
    try:
        page, level, language = context['page'], context['level'], context['language']
        if page not in ('home', 'explore', 'simulator', 'portfolio') or level not in ('beginner', 'intermediate', 'advanced') or language not in ('es', 'en'):
            raise ValueError
        allowed = {'page', 'level', 'language', 'bankId', 'instrumentId', 'simulation', 'decline', 'decision'}
        if set(context) - allowed:
            raise ValueError
        bank_id = context.get('bankId', 'demo')
        if bank_id not in {bank['id'] for bank in _DATA['banks']}:
            raise DomainError('unknown_bank', 400, 'Bank not found.')
        sim, decline = context.get('simulation'), context.get('decline')
        if sim and page != 'simulator':
            raise ValueError
        ids = [x for x in (context.get('instrumentId'), sim.get('instrumentId') if sim else None, decline.get('instrumentId') if decline and decline.get('basis') == 'instrument' else None) if x is not None]
        if len(set(ids)) > 1 or decline and decline.get('language') != language:
            raise ValueError
        if ids:
            selected_instrument = _instrument(ids[0])
            if 'bankId' in context and bank_id != _DATA['bankProfile']['bankId'] and selected_instrument['bankId'] != bank_id:
                raise ValueError
        result = {'page': page, 'level': level, 'language': language}
        if bank_id == _DATA['bankProfile']['bankId']:
            result['bank'] = deepcopy(_DATA['bankProfile'])
        if page in ('explore', 'simulator') and ids:
            inst = _instrument(ids[0])
            result['instrument'] = {'id': ids[0], 'name': inst['name'][language], 'currency': inst['currency'],
                                    'dataKind': inst['dataStatus'], 'sources': _source(inst, language)}
            product = next((p for p in _DATA['bankProfile']['products'] if p['instrumentId'] == ids[0]), None) if bank_id == _DATA['bankProfile']['bankId'] else None
            if product is not None:
                result['instrument']['product'] = deepcopy(product)
        if sim:
            calculated = run_simulation(sim)
            facts = {'kind': calculated['kind'], 'initial': sim['initial'], 'recurringContribution': sim['recurringContribution'],
                     'periods': sim['periods'], 'contributionTiming': calculated['contributionTiming'], 'contributionFrequency': calculated['contributionFrequency'], 'finalValue': calculated['value'],
                     'totalContributed': calculated['contributed'], 'profit': calculated['profit'], 'simpleReturnPercent': calculated['simpleReturnPercent'],
                     'instrumentReturnPercent': calculated['timeline'][-1]['instrumentReturnPercent'],
                     'periodStart': calculated['timeline'][0]['date'], 'periodEnd': calculated['timeline'][-1]['date']}
            if calculated['kind'] == 'annual_history':
                facts.update(periodStart=_DATA['annualHistory']['baseline'], periodEnd=calculated['timeline'][-1]['date'],
                             annualReturns=[{'year': r['year'], 'ratePercent': r['rate'] * 100} for r in _DATA['annualHistory']['returns']])
            result['simulation'] = facts
        if page in ('home', 'portfolio'):
            portfolio = run_simulation(_DATA['portfolioExample'])
            result['portfolio'] = {'name': 'Cartera de ejemplo' if language == 'es' else 'Sample portfolio', 'value': portfolio['value'], 'initial': _DATA['portfolioExample']['initial'], 'dataKind': 'historical_nav'}
        if decline:
            result['decline'] = analyze_decline(decline)
        if 'decision' in context:
            result['decision'] = deepcopy(context['decision'])
        return result
    except (KeyError, TypeError, ValueError) as exc:
        if isinstance(exc, DomainError):
            raise
        raise DomainError('invalid_context', message='Invalid tutor context') from None
