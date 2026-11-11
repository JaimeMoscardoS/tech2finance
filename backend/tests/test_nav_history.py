from decimal import Decimal

import pytest

from backend.domain.nav_history import NavHistoryError, select_nav, replay_nav
from tools.build_cnmv_dataset import complete_distribution_coverage, validate_identity
from backend.domain import analyze_decline, run_simulation
from backend.domain.game import run_game


@pytest.fixture
def history():
    return {'instruments': [{'isin': 'TEST', 'eligible': True, 'currency': 'EUR', 'monthly': [
        {'date': '2019-12-31', 'nav': '100'},
        {'date': '2020-01-30', 'nav': '80'},
        {'date': '2020-02-28', 'nav': '100'},
    ]}]}


def test_real_closings_use_actual_dates_and_end_contributions(history):
    selected = select_nav(history, 'TEST', None, 2)
    result = replay_nav(selected, 1000, 100)
    assert result['kind'] == 'real_monthly_nav'
    assert result['contributionTiming'] == 'month_end_after_return'
    assert [point['date'] for point in result['timeline']] == ['2019-12-31', '2020-01-30', '2020-02-28']
    assert [point['nav'] for point in result['timeline']] == ['100', '80', '100']
    assert Decimal(str(result['value'])) == 1225
    assert Decimal(str(result['contributed'])) == 1200


def test_annual_contributions_occur_only_after_twelve_months():
    rows = [{'date': f'{2019 + (11 + i) // 12}-{(11 + i) % 12 + 1:02d}-28', 'nav': '100'} for i in range(25)]
    two_years = replay_nav(rows, 1000, 100, 'annual')
    assert two_years['value'] == 1200 and two_years['contributed'] == 1200
    assert [p['period'] for p in two_years['timeline'] if p['period'] and p['contribution']] == [12, 24]
    assert replay_nav(rows[:12], 1000, 100, 'annual')['value'] == 1000
    with pytest.raises(NavHistoryError):
        replay_nav(rows, 1000, 100, 'weekly')


def test_annual_frequency_propagates_through_api_and_tutor(monkeypatch):
    from fastapi.testclient import TestClient
    from backend.app import app
    captured = {}
    def reply(payload, *, rules_only=False):
        captured.update(payload['context'])
        return {'text': 'ok', 'language': 'es', 'mode': 'api', 'provider': 'server_rules', 'intent': 'unknown', 'sources': []}
    monkeypatch.setattr('backend.app.reply', reply)
    client = TestClient(app)
    spec = {'instrumentId': 'bbva-mi-inversion-bolsa-acumulacion', 'initial': 1000,
            'recurringContribution': 100, 'periods': 24, 'contributionFrequency': 'annual'}
    response = client.post('/api/simulations', json=spec)
    assert response.status_code == 200
    result = response.json()
    assert result['contributionFrequency'] == 'annual' and result['contributed'] == 1200
    assert [p['period'] for p in result['timeline'] if p['period'] and p['contribution']] == [12, 24]
    tutor = client.post('/api/tutor', json={'message': 'hola', 'context': {'page': 'simulator', 'level': 'beginner', 'language': 'es', 'simulation': spec}})
    assert tutor.status_code == 200 and captured['simulation']['contributionFrequency'] == 'annual'
    assert client.post('/api/simulations', json={**spec, 'contributionFrequency': 'weekly'}).status_code == 422


def test_nav_rejects_gaps_unknown_currency_and_coverage(history):
    with pytest.raises(NavHistoryError):
        select_nav(history, 'TEST', None, 3)
    with pytest.raises(NavHistoryError):
        select_nav(history, 'TEST', '2020-01-31', 1)
    history['instruments'][0]['monthly'][1]['date'] = '2020-03-30'
    with pytest.raises(NavHistoryError):
        select_nav(history, 'TEST', None, 2)
    history['instruments'][0]['currency'] = 'USD'
    with pytest.raises(NavHistoryError):
        select_nav(history, 'TEST', None, 1)


def test_distribution_coverage_requires_observed_both_semesters_each_year():
    evidence = [{'period': f'{year}{month:02d}', 'currency': 'EUR', 'grossDistribution': '0.00'}
                for year in range(2020, 2026) for month in (6, 12)]
    assert complete_distribution_coverage(evidence)
    assert not complete_distribution_coverage(evidence[:-1])
    assert not complete_distribution_coverage(evidence[:-1] + [{**evidence[-1], 'grossDistribution': None}])
    assert not complete_distribution_coverage(evidence[:-1] + [{**evidence[-1], 'grossDistribution': '0.01'}])


def test_identity_requires_matching_registry_class_and_known_historical_name():
    isin = 'ES0112793007'
    valid = {'registry': '441', 'classNumber': '1', 'className': 'CLASE A', 'name': 'SPB RF AHORRO, FI'}
    validate_identity(isin, valid)
    validate_identity(isin, {**valid, 'name': 'SANTANDER RF AHORRO, FI'})
    for change in ({'registry': '999999'}, {'classNumber': '0'}, {'className': 'WRONG CLASS'}, {'name': 'WRONG FUND'}):
        with pytest.raises(ValueError):
            validate_identity(isin, {**valid, **change})


def test_real_simulation_and_game_match_on_observed_dates():
    spec = {'instrumentId': 'bbva-mi-inversion-bolsa-acumulacion', 'initial': 1000,
            'recurringContribution': 100, 'periods': 3, 'startDate': '2019-12-31'}
    simulation = run_simulation(spec)
    game = run_game({'instrumentId': spec['instrumentId'], 'initial': 1000, 'monthly': 100,
                     'months': 3, 'sellMonth': 1, 'buyFeeRate': 0, 'sellFeeRate': 0,
                     'startDate': spec['startDate']})
    assert float(game['hold']['value']) == pytest.approx(simulation['value'], abs=1e-9)
    assert len(game['hold']['timeline']) == 4
    for point, result_point in zip(game['hold']['timeline'], simulation['timeline']):
        assert point['date'] == result_point['date']
        for operation in point['operations']:
            assert operation['executionDate'] == point['date']
            assert operation['scheduledDate'] == point['date']
    assert game['hold']['contributed'] == '1300'


def test_all_active_funds_have_72_real_months_and_no_extrapolation():
    from backend.domain import DomainError, get_catalog
    catalog = get_catalog()
    assert catalog['schemaVersion'] == '2.0'
    assert len(catalog['demoStudyInstrumentIds']) == 5
    for identifier in catalog['demoStudyInstrumentIds']:
        spec = {'instrumentId': identifier, 'initial': 1000, 'recurringContribution': 0, 'periods': 72}
        result = run_simulation(spec)
        assert len(result['timeline']) == 73
        assert result['timeline'][0]['date'] == '2019-12-31'
        assert result['timeline'][-1]['date'].startswith('2025-12-')
        assert result['provenance']['navHistorySha256'] == catalog['provenance']['navHistorySha256']
        with pytest.raises(DomainError):
            run_simulation({**spec, 'periods': 73})
        with pytest.raises(DomainError):
            run_simulation({**spec, 'periods': 1, 'startDate': result['timeline'][-1]['date']})


def test_portfolio_decline_and_simulation_share_historical_basis():
    from backend.domain import build_tutor_context, get_catalog
    portfolio = get_catalog()['portfolioExample']
    simulation = run_simulation(portfolio)
    context = build_tutor_context({'page': 'portfolio', 'level': 'beginner', 'language': 'es'})
    decline = analyze_decline({'basis': 'portfolio_demo', 'language': 'es'})
    assert decline['latestLabel'] == simulation['timeline'][-1]['date']
    assert decline['latestValue'] == pytest.approx(simulation['value'])
    # El tutor de Inicio/«Mi cartera» describe la cartera mostrada (NAV CNMV), la misma que analiza portfolio_cnmv.
    shown = analyze_decline({'basis': 'portfolio_cnmv', 'language': 'es'})
    assert context['portfolio']['value'] == pytest.approx(shown['latestValue'])
    assert context['portfolio']['initial'] == 25000


@pytest.mark.parametrize('path', ['nav-history.json', 'snapshots/cnmv-nav-2019-2025.1/nav-history.json',
                                  'demo-data.json', 'snapshots/cnmv-nav-2019-2025.1/demo-data.json'])
def test_current_snapshot_tamper_is_detected(tmp_path, path):
    import json
    import shutil
    from backend.domain.provenance import ROOT, load_verified_dataset
    root = tmp_path / 'shared'
    shutil.copytree(ROOT, root)
    target = root / path
    data = json.loads(target.read_text(encoding='utf-8'))
    data['unexpected'] = 'tampered'
    target.write_text(json.dumps(data), encoding='utf-8')
    with pytest.raises(ValueError):
        load_verified_dataset(root)


def test_decline_context_is_dated_and_never_future():
    base = {'basis': 'instrument', 'language': 'en', 'instrumentId': 'bbva-mi-inversion-bolsa-acumulacion', 'startDate': '2019-12-31'}
    before = analyze_decline({**base, 'periods': 2})
    after = analyze_decline({**base, 'periods': 3})
    assert 'historicalContext' not in before
    assert after['historicalContext']['events'][0]['date'] == '2020-03-11'
    assert after['causesStatus'] == 'unknown'
    assert 'demoContext' not in after


def test_cnmv_portfolio_decline_matches_frontend_series():
    # Mismas cifras que frontend/src/portfolio-real.test.ts (recalculadas aparte): 5 fondos x 5.000 € DEMO,
    # coste 25.000 €, valor final 28.175,7467 €, caída máxima 8,7857 % entre 2019-12 y 2020-03.
    decline = analyze_decline({'basis': 'portfolio_cnmv', 'language': 'es'})
    assert decline['dataKind'] == 'historical_nav'
    assert decline['observationCount'] == 73
    assert decline['latestLabel'] == '2025-12'
    assert decline['latestValue'] == pytest.approx(28175.7467, abs=1e-3)
    assert decline['maxDrawdownPercent'] == pytest.approx(8.7857, abs=1e-3)
    assert decline['episodes'][0]['peakLabel'] == '2019-12' and decline['episodes'][0]['troughLabel'] == '2020-03'
    assert decline['sources'][0]['url'].startswith('https://www.cnmv.es/')
    assert decline['causesStatus'] == 'unknown'
    assert any(event['date'] == '2020-03-11' for event in decline['historicalContext']['events'])
    from backend.domain import DomainError
    with pytest.raises(DomainError):
        analyze_decline({'basis': 'portfolio_cnmv', 'language': 'es', 'periods': 3})
