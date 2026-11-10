import json
import re
from decimal import Decimal, ROUND_HALF_EVEN, localcontext

import pytest

from backend.domain import DomainError, _instrument, run_simulation
from backend.domain.game import run_game

FICTIONAL = ['demo-mixed', 'demo-equity', 'demo-fixed', 'demo-etf', 'demo-stock']


def spec(**change):
    return {'instrumentId': 'demo-equity', 'initial': 500, 'monthly': 50, 'months': 12, 'sellMonth': 6,
            'buyFeeRate': 0, 'sellFeeRate': 0} | change


def expected(s):
    returns = _instrument(s['instrumentId'])['returns']
    with localcontext() as ctx:
        ctx.prec, ctx.rounding = 50, ROUND_HALF_EVEN
        index = [Decimal(100)]
        for n in range(1, s['months'] + 1):
            step = 1 + Decimal(str(returns[(n - 1) % len(returns)]))
            index.append((index[-1] * step).quantize(Decimal('1e-10'), ROUND_HALF_EVEN))
        buy, sell_fee = 1 - Decimal(str(s['buyFeeRate'])), Decimal(str(s['sellFeeRate']))

        def play(sell):
            units, cash = Decimal(0), Decimal(0)
            for n in range(s['months'] + 1):
                amount = Decimal(s['initial']) if n == 0 else Decimal(s['monthly'])
                if sell and n > s['sellMonth']:
                    cash += amount
                else:
                    units += amount * buy / index[n]
                if sell and n == s['sellMonth']:
                    cash += units * index[n] * (1 - sell_fee)
                    units = Decimal(0)
            return cash + units * index[s['months']]
        return play(False), play(True)


def test_known_values():
    result = run_game(spec())
    assert result['hold']['value'].startswith('1159.788')
    assert result['sell']['value'].startswith('1113.02')
    assert Decimal(result['hold']['contributed']) == Decimal(1100)
    assert Decimal(result['sell']['contributed']) == Decimal(1100)


@pytest.mark.parametrize('months,sell_month', [(12, 6), (12, 0), (12, 12), (1, 0), (1, 1), (120, 0), (120, 57), (120, 120)])
@pytest.mark.parametrize('buy,sell', [(0, 0), (0.01, 0.02), (0.05, 0.05)])
def test_independent_reimplementation(months, sell_month, buy, sell):
    s = spec(months=months, sellMonth=sell_month, buyFeeRate=buy, sellFeeRate=sell)
    result = run_game(s)
    hold, sold = expected(s)
    assert abs(Decimal(result['hold']['value']) - hold) < Decimal('1e-8')
    assert abs(Decimal(result['sell']['value']) - sold) < Decimal('1e-8')


@pytest.mark.parametrize('change', [{'initial': 0}, {'monthly': 0}])
def test_one_zero_amount_works(change):
    s = spec(**change)
    result = run_game(s)
    hold, sold = expected(s)
    assert abs(Decimal(result['hold']['value']) - hold) < Decimal('1e-8')
    assert abs(Decimal(result['sell']['value']) - sold) < Decimal('1e-8')


def test_both_zero_rejected():
    with pytest.raises(DomainError) as exc:
        run_game(spec(initial=0, monthly=0))
    assert exc.value.code == 'invalid_game'


@pytest.mark.parametrize('change', [{'initial': -1}, {'monthly': 1e9 + 1}, {'initial': True}, {'initial': float('nan')},
                                    {'buyFeeRate': 0.06}, {'sellFeeRate': -0.01}, {'sellFeeRate': float('inf')},
                                    {'months': True}, {'months': 2.5}, {'months': 121}, {'sellMonth': -1}])
def test_invalid_inputs(change):
    with pytest.raises(DomainError) as exc:
        run_game(spec(**change))
    assert exc.value.code == 'invalid_game'


def keys(node):
    if isinstance(node, dict):
        for key, value in node.items():
            yield key
            yield from keys(value)
    elif isinstance(node, list):
        for value in node:
            yield from keys(value)


def test_contract_shape():
    result = run_game(spec(sellFeeRate=0.01))
    assert result['provenance']['calculationVersion'] == 'simulador-historical-1.0'
    assert set(result['provenance']) == {'datasetVersion', 'datasetSha256', 'calculationVersion'}
    for side in ('hold', 'sell'):
        assert set(result[side]) == {'unitType', 'contributed', 'cash', 'units', 'fees', 'value', 'profit', 'simpleReturn', 'timeline'}
        assert set(result[side]['timeline'][0]) == {'month', 'price', 'contributed', 'cash', 'units', 'fees', 'total', 'operations'}
    assert not [key for key in keys(result) if '_' in key]
    assert 'scheduledMonth' in result['sell']['timeline'][0]['operations'][0]
    assert all(isinstance(result[side][k], str) for side in ('hold', 'sell') for k in ('value', 'cash', 'units'))
    text = ' '.join(result['assumptions']).lower()
    assert 'could end higher or lower' in text and 'liquidity' in text


def test_months_not_dates():
    result = run_game(spec())
    for side in ('hold', 'sell'):
        assert [p['month'] for p in result[side]['timeline']] == list(range(13))
    long = run_game(spec(months=120, sellMonth=60))
    # datasetVersion legitimately embeds a build date, so provenance is excluded from the check
    for payload in (long, result):
        assert not re.search(r'\d{4}-\d{2}-\d{2}', json.dumps({k: v for k, v in payload.items() if k != 'provenance'}))


@pytest.mark.parametrize('identifier', FICTIONAL)
def test_all_fictional_instruments(identifier):
    result = run_game(spec(instrumentId=identifier, months=120, sellMonth=120))
    assert len(result['hold']['timeline']) == 121


def test_errors():
    for identifier in ('caixabank-monetario-estandar', 'bbva-mi-inversion-bolsa'):
        with pytest.raises(DomainError) as exc:
            run_game(spec(instrumentId=identifier))
        assert exc.value.code == 'game_unavailable'
    with pytest.raises(DomainError) as exc:
        run_game(spec(instrumentId='unknown'))
    assert exc.value.code == 'instrument_not_found'
    with pytest.raises(DomainError) as exc:
        run_game(spec(sellMonth=13))
    assert exc.value.code == 'invalid_game'


def test_existing_simulation_unchanged():
    result = run_simulation({'instrumentId': 'demo-mixed', 'initial': 500, 'recurringContribution': 50, 'periods': 1})
    assert result['value'] == 558.25
