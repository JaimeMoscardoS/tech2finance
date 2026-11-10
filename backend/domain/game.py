"""Educational hold-vs-sell game over fictional instruments, backed by simulador.compare.

Synthetic calendar dates exist only inside the engine call; the response uses month numbers.
"""
from datetime import date
import math
from decimal import Context, Decimal, InvalidOperation, ROUND_HALF_EVEN, localcontext
from functools import lru_cache

from simulador import InputError, compare, parse_series

from backend.domain import DomainError, _DATA, _PROVENANCE, _instrument
from backend.domain.provenance import DATASET_VERSION

MONTHS = 120
_QUANT = Decimal('1e-10')
_ENGINE_ASSUMPTION = 'Declared metadata and license are not independently verified.'
_SYNTHETIC_ASSUMPTION = 'Data are synthetic and generated in this repository; no third-party source applies.'
CALCULATION_VERSION = 'simulador-historical-1.0'
_EXTRA_ASSUMPTIONS = [
    'Fees are game inputs; BancoT2F or product fees are not applied automatically.',
    'Educational comparison; not a recommendation, forecast or guarantee.',
    'Results depend on this fictional path and the chosen month; with other months or paths selling could end higher or lower.',
    'Liquidity needs, goals and time horizon are not modelled; the decision remains the user\'s.',
]
_MAX_AMOUNT, _MAX_FEE = 1_000_000_000, 0.05
_POINT_FIELDS = ('price', 'contributed', 'cash', 'units', 'fees', 'total')
_SIDE_FIELDS = (('unitType', 'unit_type'), ('contributed', 'contributed'), ('cash', 'cash'), ('units', 'units'),
                ('fees', 'fees'), ('value', 'value'), ('profit', 'profit'), ('simpleReturn', 'simple_return'))


def _month_date(month):
    return date(2000 + month // 12, month % 12 + 1, 1).isoformat()


@lru_cache(maxsize=None)
def _series(instrument_id):
    instrument = _instrument(instrument_id)
    if instrument['dataStatus'] != 'fictional':
        raise DomainError('game_unavailable', 422, 'Game is only available for fictional instruments')
    returns = instrument['returns']
    value, observations = Decimal('100'), []
    with localcontext(Context(prec=34, rounding=ROUND_HALF_EVEN)):
        for month in range(MONTHS + 1):
            if month:
                value = (value * (1 + Decimal(str(returns[(month - 1) % len(returns)])))).quantize(_QUANT, ROUND_HALF_EVEN)
            observations.append({'date': _month_date(month), 'value': str(value)})
    return parse_series({'schema_version': '1.0', 'metadata': {
        'instrument_id': instrument_id, 'instrument_name': instrument['name']['es'],
        'instrument_class': f"fictional_{instrument['assetType']}", 'currency': 'EUR', 'value_type': 'price_only',
        'source': f'Tech2Finance demo dataset {DATASET_VERSION} (fictional monthly returns)',
        'license': 'Synthetic demonstration data; no third-party rights', 'license_date': '2026-11-09',
        'frequency': 'monthly synthetic month index', 'max_gap_days': 31,
        'embedded_costs': 'None; fictional returns', 'distribution_policy': 'Not applicable; synthetic price index',
        'data_kind': 'synthetic'}, 'observations': observations})


def _text(value):
    return str(Decimal(str(value)))


def _side(result, by_date):
    if result['gaps']:
        raise DomainError('invalid_game', 422, 'Invalid game request')
    out = {key: result[source] for key, source in _SIDE_FIELDS}
    out['timeline'] = []
    for point in result['timeline']:
        item = {'month': by_date[point['date']], **{key: point[key] for key in _POINT_FIELDS}, 'operations': []}
        for op in point['operations']:
            row = {'type': op['type']}
            if 'source' in op:
                row['source'] = op['source']
            row.update(scheduledMonth=by_date[op['scheduled_date']], gross=op['gross'])
            if 'fee' in op:
                row['fee'] = op['fee']
            item['operations'].append(row)
        out['timeline'].append(item)
    return out


def _number_ok(value, upper):
    return not isinstance(value, bool) and isinstance(value, (int, float)) and math.isfinite(value) and 0 <= value <= upper


def run_game(spec):
    try:
        instrument_id, months, sell_month = spec['instrumentId'], spec['months'], spec['sellMonth']
        amounts = {'initial': _text(spec['initial']), 'monthly': _text(spec['monthly']),
                   'buy_fee_rate': _text(spec['buyFeeRate']), 'sell_fee_rate': _text(spec['sellFeeRate'])}
    except (KeyError, TypeError, InvalidOperation):
        raise DomainError('invalid_game', 422, 'Invalid game request') from None
    for key, upper in (('initial', _MAX_AMOUNT), ('monthly', _MAX_AMOUNT), ('buyFeeRate', _MAX_FEE), ('sellFeeRate', _MAX_FEE)):
        if not _number_ok(spec[key], upper):
            raise DomainError('invalid_game', 422, 'Invalid game request')
    series = _series(instrument_id)
    if (isinstance(months, bool) or isinstance(sell_month, bool) or not isinstance(months, int)
            or not isinstance(sell_month, int) or not 1 <= months <= MONTHS or not 0 <= sell_month <= months):
        raise DomainError('invalid_game', 422, 'Invalid game request')
    try:
        raw = compare(series, {'start': _month_date(0), 'end': _month_date(months), 'sell_date': _month_date(sell_month), **amounts})
    except InputError:
        raise DomainError('invalid_game', 422, 'Invalid game request') from None
    by_date = {_month_date(m): m for m in range(MONTHS + 1)}
    hold, sell = _side(raw['hold'], by_date), _side(raw['sell'], by_date)
    cycle = len(_instrument(instrument_id)['returns'])
    cycle_text = (f'Fictional monthly returns repeat every {cycle} months; '
                  'month numbers are a synthetic index, not historical dates.')
    assumptions = []
    for text in raw['assumptions'] + raw['hold']['assumptions'] + [cycle_text] + _EXTRA_ASSUMPTIONS:
        text = _SYNTHETIC_ASSUMPTION if text == _ENGINE_ASSUMPTION else text
        if text not in assumptions:
            assumptions.append(text)
    return {'schemaVersion': '1.0', 'engine': 'simulador-historical-1.0', 'instrumentId': instrument_id,
            'currency': 'EUR', 'dataKind': 'fictional', 'months': months, 'sellMonth': sell_month,
            'hold': hold, 'sell': sell, 'provenance': {'datasetVersion': _PROVENANCE['datasetVersion'], 'datasetSha256': _PROVENANCE['datasetSha256'],
                           'calculationVersion': CALCULATION_VERSION}, 'assumptions': assumptions}
