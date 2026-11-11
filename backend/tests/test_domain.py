import math
import json
import subprocess
from decimal import ROUND_DOWN, localcontext
import pytest

from backend.domain import DomainError, analyze_decline, build_tutor_context, get_catalog, run_simulation


def spec(instrument='bbva-mi-inversion-bolsa-acumulacion', initial=500, recurring=50, periods=1):
    return {'instrumentId': instrument, 'initial': initial, 'recurringContribution': recurring, 'periods': periods}


def test_monthly_and_zero():
    result = run_simulation(spec())
    assert result['value'] == pytest.approx(500 * float(result['timeline'][1]['nav']) / float(result['timeline'][0]['nav']) + 50)
    assert result['timeline'][1]['valueBeforeContribution'] == pytest.approx(result['value'] - 50)
    assert result['contributionTiming'] == 'month_end_after_return'
    zero = run_simulation(spec(initial=0, recurring=0))
    assert zero['value'] == 0 and zero['simpleReturnPercent'] is None
    assert len(run_simulation(spec(periods=72))['timeline']) == 73
    with pytest.raises(DomainError):
        run_simulation(spec(periods=73))


def test_annual_and_decimal_context():
    expected = run_simulation(spec('caixabank-monetario-estandar', 500, 100, 5))
    with localcontext() as caller:
        caller.prec = 3
        caller.rounding = ROUND_DOWN
        caller.Emax = 2
        caller.Emin = -2
        result = run_simulation(spec('caixabank-monetario-estandar', 500, 100, 5))
    assert result == expected
    assert result['value'] == pytest.approx(999.0381832853009)
    assert result['contributed'] == 1000
    assert result['profit'] == pytest.approx(-0.9618167146991)
    assert result['timeline'][0]['date'] == '2019-12-31'
    assert result['timeline'][1]['valueBeforeContribution'] == pytest.approx(500 * float(result['timeline'][1]['nav']) / float(result['timeline'][0]['nav']))


@pytest.mark.parametrize('amount', [True, math.inf, math.nan, -1, 1_000_000_001, 10**400])
def test_invalid_amounts(amount):
    with pytest.raises(DomainError):
        run_simulation(spec(initial=amount))


def test_missing_history_and_decline():
    with pytest.raises(DomainError, match='unavailable'):
        run_simulation(spec('bbva-mi-inversion-bolsa'))
    decline = analyze_decline({'basis': 'instrument', 'language': 'es', 'instrumentId': spec()['instrumentId'], 'periods': 12})
    assert decline['causesStatus'] == 'unknown' and decline['comparablesStatus'] == 'not_available'
    assert decline['observationCount'] == 13
    assert decline['latestLabel'] == '2020-12-31'
    assert decline['maxDrawdownPercent'] > 0


def test_context_recomputes_and_has_no_unrelated_page_facts():
    context = build_tutor_context({'page':'simulator', 'level':'beginner', 'language':'es', 'simulation':spec()})
    assert context['simulation']['finalValue'] == run_simulation(spec())['value']
    assert 'portfolio' not in context
    selected = build_tutor_context({'page':'simulator', 'level':'beginner', 'language':'es', 'instrumentId':'bbva-mi-inversion-bolsa'})
    assert 'simulation' not in selected and selected['instrument']['dataKind'] == 'unsupported_distributions'
    explore = build_tutor_context({'page':'explore', 'level':'advanced', 'language':'es', 'instrumentId':'caixabank-monetario-estandar'})
    assert explore['instrument']['id'] == 'caixabank-monetario-estandar'
    assert explore['instrument']['dataKind'] == 'historical_nav'
    assert explore['instrument']['sources'] and 'simulation' not in explore
    with pytest.raises(DomainError):
        build_tutor_context({'page':'home', 'level':'beginner', 'language':'es', 'simulation':spec()})
    with pytest.raises(DomainError):
        build_tutor_context({'page':'home', 'level':'beginner', 'language':'es', 'portfolio':{'value':999}})


def test_catalog_is_copy():
    catalog = get_catalog()
    catalog['banks'].clear()
    assert len(get_catalog()['banks']) == 4


def test_typescript_simulation_and_decline_parity():
    code = """
import {simulateNav} from './frontend/src/nav-history.ts';
import data from './shared/nav-history.json' with {type:'json'};
import {analyzeDecline} from './tutor-ia/src/decline.ts';
const simulation = simulateNav(data.instruments.find(x=>x.isin==='ES0125269003').monthly,500,50,12);
const caixa = simulateNav(data.instruments.find(x=>x.isin==='ES0138045002').monthly,500,100,5);
const observations = simulation.timeline.map(p => ({label:p.date, value:100*(1+p.instrumentReturnPercent/100)}));
console.log(JSON.stringify({simulation, caixa, decline:analyzeDecline({name:'BBVA', dataKind:'historical_nav', observations, sources:[]})}));
"""
    node = subprocess.run(['node', '--experimental-strip-types', '--input-type=module', '-e', code],
                          capture_output=True, check=True)
    ts = json.loads(node.stdout.decode('utf-8'))
    for actual, expected in [(run_simulation(spec(periods=12)), ts['simulation']),
                             (run_simulation(spec('caixabank-monetario-estandar', 500, 100, 5)), ts['caixa'])]:
        for key in ('value', 'contributed', 'profit', 'simpleReturnPercent'):
            assert actual[key] == pytest.approx(expected[key])
        assert actual['points'] == pytest.approx(expected['points'])
        for left, right in zip(actual['timeline'], expected['timeline']):
            assert left['date'] == right['date']
            for key in ('valueBeforeContribution', 'contribution', 'value', 'profit', 'instrumentReturnPercent'):
                assert left[key] == pytest.approx(right[key], abs=1e-10)
    decline = analyze_decline({'basis':'instrument', 'language':'es', 'instrumentId':spec()['instrumentId'], 'periods':12})
    assert decline['maxDrawdownPercent'] == pytest.approx(ts['decline']['maxDrawdownPercent'])
    assert [(e['peakLabel'], e['troughLabel'], e['recoveryLabel']) for e in decline['episodes']] == [(e['peakLabel'], e['troughLabel'], e['recoveryLabel']) for e in ts['decline']['episodes']]
