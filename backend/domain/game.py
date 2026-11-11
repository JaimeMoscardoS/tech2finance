"""Educational hold/sell comparison using observed monthly CNMV NAV closes."""
import math
from decimal import Decimal, InvalidOperation
from simulador import InputError, compare, parse_series
from backend.domain import DomainError, _NAV, _PROVENANCE, _instrument
from backend.domain.nav_history import NavHistoryError, select_nav

CALCULATION_VERSION = 'simulador-nav-close-2.0.0'
_POINT_FIELDS = ('price', 'contributed', 'cash', 'units', 'fees', 'total')
_SIDE_FIELDS = (('unitType', 'unit_type'), ('contributed', 'contributed'), ('cash', 'cash'), ('units', 'units'),
                ('fees', 'fees'), ('value', 'value'), ('profit', 'profit'), ('simpleReturn', 'simple_return'))


def _number_ok(value, upper):
    return not isinstance(value, bool) and isinstance(value, (int, float)) and math.isfinite(value) and 0 <= value <= upper


def _side(result, by_date):
    if result['gaps']:
        raise DomainError('invalid_game', 422, 'History has gaps')
    out = {key: result[source] for key, source in _SIDE_FIELDS}
    out['timeline'] = []
    for point in result['timeline']:
        index = by_date[point['date']]
        item = {'month': index, 'periodIndex': index, 'date': point['date'],
                **{key: point[key] for key in _POINT_FIELDS}, 'operations': []}
        for op in point['operations']:
            row = {'type': op['type'], 'scheduledDate': op['scheduled_date'], 'executionDate': point['date'], 'gross': op['gross']}
            if 'source' in op:
                row['source'] = op['source']
            if 'fee' in op:
                row['fee'] = op['fee']
            item['operations'].append(row)
        out['timeline'].append(item)
    return out


def run_game(spec):
    try:
        instrument = _instrument(spec['instrumentId'])
        months, sell_month = spec['months'], spec['sellMonth']
        if any(not _number_ok(spec[k], upper) for k, upper in (('initial', 1_000_000_000), ('monthly', 1_000_000_000), ('buyFeeRate', 0.05), ('sellFeeRate', 0.05))):
            raise ValueError
        if spec['initial'] + spec['monthly'] <= 0 or isinstance(sell_month, bool) or not isinstance(sell_month, int) or not 0 <= sell_month <= months:
            raise ValueError
        rows = select_nav(_NAV, instrument['identifier'], spec.get('startDate'), months)
        series = parse_series({'schema_version': '1.0', 'metadata': {
            'instrument_id': instrument['instrumentId'], 'instrument_name': instrument['name']['es'],
            'instrument_class': 'fund', 'currency': 'EUR', 'value_type': 'nav',
            'source': _NAV['source']['indexUrl'], 'license': 'CNMV conditional reuse; see legal notice',
            'license_date': '2026-11-11', 'frequency': 'observed monthly close', 'max_gap_days': 40,
            'embedded_costs': 'Fund costs reflected in NAV; no external costs except explicit game fees',
            'distribution_policy': 'No distributions recorded at published precision in consulted reports',
            'data_kind': 'real'}, 'observations': [{'date': row['date'], 'value': row['nav']} for row in rows]})
        request = {'start': rows[0]['date'], 'end': rows[-1]['date'], 'sell_date': rows[sell_month]['date'],
                   'initial': str(Decimal(str(spec['initial']))), 'monthly': str(Decimal(str(spec['monthly']))),
                   'buy_fee_rate': str(Decimal(str(spec['buyFeeRate']))), 'sell_fee_rate': str(Decimal(str(spec['sellFeeRate']))),
                   'contribution_dates': [row['date'] for row in rows[1:]]}
        raw = compare(series, request)
    except DomainError:
        raise
    except (KeyError, TypeError, ValueError, InvalidOperation, InputError, NavHistoryError, IndexError):
        raise DomainError('invalid_game', 422, 'Invalid request or unavailable history') from None
    index = {row['date']: n for n, row in enumerate(rows)}
    return {'schemaVersion': '2.0', 'engine': CALCULATION_VERSION, 'instrumentId': instrument['instrumentId'],
            'currency': 'EUR', 'dataKind': 'historical_nav', 'months': months, 'sellMonth': sell_month,
            'hold': _side(raw['hold'], index), 'sell': _side(raw['sell'], index),
            'provenance': {**_PROVENANCE, 'calculationVersion': CALCULATION_VERSION},
            'assumptions': ['Observed CNMV NAV; monthly contributions execute on observed closes after NAV change.',
                            'Sale-date contribution is invested before sale; later contributions remain cash.',
                            'Reported distributions are zero at published precision; no future policy is guaranteed.',
                            'Costs embedded in NAV are not deducted again; explicit game fees are separate.',
                            'No taxes, real orders, prediction or recommendation.']}
