import math
import json
import subprocess
from decimal import ROUND_DOWN, localcontext
import pytest

from backend.domain import DomainError, analyze_decline, build_tutor_context, get_catalog, run_simulation


def spec(instrument='demo-mixed', initial=500, recurring=50, periods=1):
    return {'instrumentId': instrument, 'initial': initial, 'recurringContribution': recurring, 'periods': periods}


def test_monthly_and_zero():
    result = run_simulation(spec())
    assert result['value'] == 558.25
    assert result['timeline'][1]['valueBeforeContribution'] == 500
    assert result['contributionTiming'] == 'month_start'
    zero = run_simulation(spec(initial=0, recurring=0))
    assert zero['value'] == 0 and zero['simpleReturnPercent'] is None
    assert len(run_simulation(spec(periods=120))['timeline']) == 121


def test_annual_and_decimal_context():
    expected = run_simulation(spec('caixabank-monetario-estandar', 500, 100, 5))
    with localcontext() as caller:
        caller.prec = 3
        caller.rounding = ROUND_DOWN
        caller.Emax = 2
        caller.Emin = -2
        result = run_simulation(spec('caixabank-monetario-estandar', 500, 100, 5))
    assert result == expected
    assert result['value'] == pytest.approx(1048.553091403868)
    assert result['contributed'] == 1000
    assert result['profit'] == pytest.approx(48.553091403868)
    assert result['timeline'][0]['date'] == '2020-12-31'
    assert result['timeline'][1]['valueBeforeContribution'] == 497.35


@pytest.mark.parametrize('amount', [True, math.inf, math.nan, -1, 1_000_000_001, 10**400])
def test_invalid_amounts(amount):
    with pytest.raises(DomainError):
        run_simulation(spec(initial=amount))


def test_missing_history_and_decline():
    with pytest.raises(DomainError, match='unavailable'):
        run_simulation(spec('bbva-mi-inversion-bolsa'))
    decline = analyze_decline({'basis': 'instrument', 'language': 'es', 'instrumentId': 'demo-mixed', 'periods': 12})
    assert decline['causesStatus'] == 'unknown' and decline['comparablesStatus'] == 'not_available'
    assert decline['observationCount'] == 13
    assert decline['latestLabel'] == 'MES 12'
    assert decline['maxDrawdownPercent'] > 0


def test_context_recomputes_and_has_no_unrelated_page_facts():
    context = build_tutor_context({'page':'simulator', 'level':'beginner', 'language':'es', 'simulation':spec()})
    assert context['simulation']['finalValue'] == 558.25
    assert 'portfolio' not in context
    selected = build_tutor_context({'page':'simulator', 'level':'beginner', 'language':'es', 'instrumentId':'bbva-mi-inversion-bolsa'})
    assert 'simulation' not in selected and selected['instrument']['dataKind'] == 'missing_history'
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
import {simulate} from './frontend/src/demo.ts';
import {replayAnnual} from './frontend/src/annual-history.ts';
import {analyzeDecline} from './tutor-ia/src/decline.ts';
const simulation = simulate(500, 50, 12);
const observations = simulation.timeline.map(p => ({label:`MES ${p.period}`, value:100*(1+p.instrumentReturnPercent/100)}));
console.log(JSON.stringify({simulation, annual:replayAnnual(500,100), decline:analyzeDecline({name:'Fondo Equilibrio', dataKind:'fictional', observations, sources:[]})}));
"""
    node = subprocess.run(['node', '--experimental-strip-types', '--input-type=module', '-e', code],
                          capture_output=True, check=True)
    ts = json.loads(node.stdout.decode('utf-8'))
    for actual, expected in [(run_simulation(spec(periods=12)), ts['simulation']),
                             (run_simulation(spec('caixabank-monetario-estandar', 500, 100, 5)), ts['annual'])]:
        for key in ('value', 'contributed', 'profit', 'simpleReturnPercent'):
            assert actual[key] == pytest.approx(expected[key])
        assert actual['points'] == pytest.approx(expected['points'])
        for left, right in zip(actual['timeline'], expected['timeline']):
            assert left['date'] == right['date']
            for key in ('valueBeforeContribution', 'contribution', 'value', 'profit', 'instrumentReturnPercent'):
                assert left[key] == pytest.approx(right[key], abs=1e-10)
    decline = analyze_decline({'basis':'instrument', 'language':'es', 'instrumentId':'demo-mixed', 'periods':12})
    assert decline['maxDrawdownPercent'] == pytest.approx(ts['decline']['maxDrawdownPercent'])
    assert [(e['peakLabel'], e['troughLabel'], e['recoveryLabel']) for e in decline['episodes']] == [(e['peakLabel'], e['troughLabel'], e['recoveryLabel']) for e in ts['decline']['episodes']]
