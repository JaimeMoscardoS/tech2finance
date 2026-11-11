from decimal import Decimal, ROUND_HALF_EVEN, localcontext

import pytest

from backend.domain import DomainError, _instrument, _NAV, run_simulation
from backend.domain.game import run_game

FUNDS = ['caixabank-monetario-estandar', 'santander-rf-ahorro', 'santander-renta-fija-a', 'bbva-mi-inversion-bolsa-acumulacion', 'bbva-estrategia-0-50']


def spec(**change):
    return {'instrumentId': 'bbva-mi-inversion-bolsa-acumulacion', 'initial': 500, 'monthly': 50, 'months': 12, 'sellMonth': 6,
            'buyFeeRate': 0, 'sellFeeRate': 0} | change


def expected(s):
    isin = _instrument(s['instrumentId'])['identifier']
    rows = next(item['monthly'] for item in _NAV['instruments'] if item['isin'] == isin)
    with localcontext() as ctx:
        ctx.prec, ctx.rounding = 50, ROUND_HALF_EVEN
        index = [Decimal(row['nav']) for row in rows[:s['months'] + 1]]
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
    hold, sold = expected(spec())
    assert Decimal(result['hold']['value']) == pytest.approx(hold, abs=Decimal('1e-8'))
    assert Decimal(result['sell']['value']) == pytest.approx(sold, abs=Decimal('1e-8'))
    assert Decimal(result['hold']['contributed']) == Decimal(1100)
    assert Decimal(result['sell']['contributed']) == Decimal(1100)


@pytest.mark.parametrize('months,sell_month', [(12, 6), (12, 0), (12, 12), (1, 0), (1, 1), (72, 0), (72, 57), (72, 72)])
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
                                    {'months': True}, {'months': 2.5}, {'months': 73}, {'sellMonth': -1}])
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
    assert result['provenance']['calculationVersion'] == 'simulador-nav-close-2.0.0'
    assert set(result['provenance']) == {'datasetVersion', 'datasetSha256', 'navHistorySha256', 'calculationVersion'}
    for side in ('hold', 'sell'):
        assert set(result[side]) == {'unitType', 'contributed', 'cash', 'units', 'fees', 'value', 'profit', 'simpleReturn', 'timeline'}
        assert set(result[side]['timeline'][0]) == {'month', 'periodIndex', 'date', 'price', 'contributed', 'cash', 'units', 'fees', 'total', 'operations'}
    assert not [key for key in keys(result) if '_' in key]
    assert {'scheduledDate', 'executionDate'} <= set(result['sell']['timeline'][0]['operations'][0])
    assert all(isinstance(result[side][k], str) for side in ('hold', 'sell') for k in ('value', 'cash', 'units'))
    text = ' '.join(result['assumptions']).lower()
    assert 'no taxes' in text and 'not deducted again' in text


def test_months_and_observation_dates():
    result = run_game(spec())
    for side in ('hold', 'sell'):
        assert [p['month'] for p in result[side]['timeline']] == list(range(13))
    long = run_game(spec(months=72, sellMonth=60))
    assert long['hold']['timeline'][0]['date'] == '2019-12-31'
    assert long['hold']['timeline'][-1]['date'] == '2025-12-31'
    assert [p['periodIndex'] for p in result['sell']['timeline']] == list(range(13))


@pytest.mark.parametrize('identifier', FUNDS)
def test_all_historical_instruments(identifier):
    result = run_game(spec(instrumentId=identifier, months=72, sellMonth=72))
    assert len(result['hold']['timeline']) == 73


def test_errors():
    for identifier in ('bbva-mi-inversion-bolsa',):
        with pytest.raises(DomainError) as exc:
            run_game(spec(instrumentId=identifier))
        assert exc.value.code == 'invalid_game'
    with pytest.raises(DomainError) as exc:
        run_game(spec(instrumentId='unknown'))
    assert exc.value.code == 'instrument_not_found'
    with pytest.raises(DomainError) as exc:
        run_game(spec(sellMonth=13))
    assert exc.value.code == 'invalid_game'


def test_existing_simulation_unchanged():
    result = run_simulation({'instrumentId': 'bbva-mi-inversion-bolsa-acumulacion', 'initial': 1000, 'recurringContribution': 0, 'periods': 3})
    assert result['value'] == pytest.approx(744.6177685950413)


def test_hold_matches_simulation_and_sell_date_contribution_precedes_sale():
    game = run_game(spec(months=3, sellMonth=1))
    replay = run_simulation({'instrumentId': spec()['instrumentId'], 'initial': 500, 'recurringContribution': 50, 'periods': 3})
    assert float(game['hold']['value']) == pytest.approx(replay['value'], abs=1e-9)
    sell = game['sell']['timeline']
    assert [op['type'] for op in sell[1]['operations']] == ['buy', 'sell']
    assert all(op['scheduledDate'] == op['executionDate'] == sell[1]['date'] for op in sell[1]['operations'])
    assert all(Decimal(point['units']) == 0 for point in sell[1:])
    assert [point['operations'][0]['type'] for point in sell[2:]] == ['cash_contribution', 'cash_contribution']
    assert Decimal(sell[-1]['cash']) == pytest.approx(Decimal('500') * Decimal('9.4533') / Decimal('9.68') + 150, abs=Decimal('1e-8'))
