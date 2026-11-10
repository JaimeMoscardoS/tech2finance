"""Demo-domain functions. No provider calls or client-supplied facts."""
from copy import deepcopy
import math

from simulador.periodic import replay
from .provenance import load_verified_dataset

_DATA, _PROVENANCE = load_verified_dataset()


class DomainError(ValueError):
    def __init__(self, code, status=422, message=None):
        self.code, self.status = code, status
        super().__init__(message or code)
        self.message = message or code


def get_catalog():
    return deepcopy({**{key: _DATA[key] for key in ('schemaVersion', 'banks', 'instruments', 'annualHistory', 'bankProfile')}, 'provenance': _PROVENANCE})


def _instrument(identifier):
    for instrument in _DATA['instruments']:
        if instrument['instrumentId'] == identifier:
            return instrument
    raise DomainError('instrument_not_found', 404, 'Instrument not found')


def _source(instrument, language='es'):
    if not instrument['sourceUrl']:
        return []
    return [{'label': 'Ficha oficial' if language == 'es' else 'Official product page', 'url': instrument['sourceUrl'], 'checkedAt': instrument['sourceDate']}]


def _rates(instrument, periods):
    if isinstance(periods, bool) or not isinstance(periods, int) or not 1 <= periods <= 120:
        raise DomainError('invalid_periods', message='Invalid periods')
    if instrument['dataStatus'] == 'missing_history':
        raise DomainError('missing_history', 422, 'Instrument history is unavailable')
    if instrument['dataStatus'] == 'annual_history':
        if periods != 5:
            raise DomainError('invalid_periods', message='Annual history requires five periods')
        history = _DATA['annualHistory']
        return ([row['rate'] for row in history['returns']],
                [history['baseline']] + [f"{row['year']}-12-31" for row in history['returns']], 'annual_history')
    returns = instrument['returns']
    return ([returns[i % len(returns)] for i in range(periods)], [None] * (periods + 1), 'fictional_monthly')


def run_simulation(spec):
    try:
        instrument = _instrument(spec['instrumentId'])
        initial, contribution, periods = spec['initial'], spec['recurringContribution'], spec['periods']
    except (KeyError, TypeError):
        raise DomainError('invalid_simulation', message='Invalid simulation') from None
    for value in (initial, contribution):
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not 0 <= value <= 1_000_000_000 or not math.isfinite(value):
            raise DomainError('invalid_amount', message='Invalid amount')
    rates, dates, kind = _rates(instrument, periods)
    result = replay(initial, contribution, rates, dates, kind)
    result.update(instrumentId=instrument['instrumentId'], currency='EUR', sources=_source(instrument),
                  contributionTiming='month_start' if kind == 'fictional_monthly' else 'year_end_after_return',
                  assumptions=(['Fictional monthly returns repeat; outcomes do not predict future returns.'] if kind == 'fictional_monthly' else ['Published annual returns are rounded; contributions occur after each annual return.']))
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
            values = _DATA['portfolioPoints']
            name = 'Cartera de ejemplo' if language == 'es' else 'Sample portfolio'
            labels = [f"{'Punto' if language == 'es' else 'Point'} {i+1}" for i in range(len(values))]
            kind, sources = 'fictional', []
        elif basis == 'instrument':
            inst = _instrument(spec['instrumentId'])
            rates, dates, simkind = _rates(inst, spec['periods'])
            result = replay(100, 0, rates, dates, simkind)
            values = result['points']
            labels = [date or f"{'MES' if language == 'es' else 'MONTH'} {i}" for i, date in enumerate(dates)]
            name, sources = inst['name'][language], _source(inst, language)
            kind = 'annual_published_returns' if simkind == 'annual_history' else 'fictional'
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
    return report


def build_tutor_context(context):
    try:
        page, level, language = context['page'], context['level'], context['language']
        if page not in ('home', 'explore', 'simulator', 'portfolio') or level not in ('beginner', 'intermediate', 'advanced') or language not in ('es', 'en'):
            raise ValueError
        allowed = {'page', 'level', 'language', 'bankId', 'instrumentId', 'simulation', 'decline', 'decision'}
        if set(context) - allowed:
            raise ValueError
        if context.get('bankId', 'demo') != _DATA['bankProfile']['bankId']:
            raise DomainError('unknown_bank', 400, 'Bank not found.')
        sim, decline = context.get('simulation'), context.get('decline')
        if sim and page != 'simulator':
            raise ValueError
        ids = [x for x in (context.get('instrumentId'), sim.get('instrumentId') if sim else None, decline.get('instrumentId') if decline and decline.get('basis') == 'instrument' else None) if x is not None]
        if len(set(ids)) > 1 or decline and decline.get('language') != language:
            raise ValueError
        if ids:
            _instrument(ids[0])
        result = {'page': page, 'level': level, 'language': language, 'bank': deepcopy(_DATA['bankProfile'])}
        if page in ('explore', 'simulator') and ids:
            inst = _instrument(ids[0])
            result['instrument'] = {'id': ids[0], 'name': inst['name'][language], 'currency': inst['currency'],
                                    'dataKind': 'annual_published_returns' if inst['dataStatus'] == 'annual_history' else inst['dataStatus'], 'sources': _source(inst, language)}
            product = next((p for p in _DATA['bankProfile']['products'] if p['instrumentId'] == ids[0]), None)
            if product is not None:
                result['instrument']['product'] = deepcopy(product)
        if sim:
            calculated = run_simulation(sim)
            facts = {'kind': calculated['kind'], 'initial': sim['initial'], 'recurringContribution': sim['recurringContribution'],
                     'periods': sim['periods'], 'contributionTiming': calculated['contributionTiming'], 'finalValue': calculated['value'],
                     'totalContributed': calculated['contributed'], 'profit': calculated['profit'], 'simpleReturnPercent': calculated['simpleReturnPercent'],
                     'instrumentReturnPercent': calculated['timeline'][-1]['instrumentReturnPercent']}
            if calculated['kind'] == 'annual_history':
                facts.update(periodStart=_DATA['annualHistory']['baseline'], periodEnd=calculated['timeline'][-1]['date'],
                             annualReturns=[{'year': r['year'], 'ratePercent': r['rate'] * 100} for r in _DATA['annualHistory']['returns']])
            result['simulation'] = facts
        if page in ('home', 'portfolio'):
            result['portfolio'] = {'name': 'Cartera de ejemplo' if language == 'es' else 'Sample portfolio', 'value': _DATA['portfolioPoints'][-1], 'initial': _DATA['portfolioPoints'][0], 'dataKind': 'fictional'}
        if decline:
            result['decline'] = analyze_decline(decline)
        if 'decision' in context:
            result['decision'] = deepcopy(context['decision'])
        return result
    except (KeyError, TypeError, ValueError) as exc:
        if isinstance(exc, DomainError):
            raise
        raise DomainError('invalid_context', message='Invalid tutor context') from None
