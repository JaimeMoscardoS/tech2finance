import json
import shutil
import subprocess
import sys
from decimal import ROUND_DOWN, localcontext
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend.app import app
from backend.domain import analyze_decline, build_tutor_context, get_catalog, run_simulation
from backend.domain.provenance import ROOT, canonical_bytes, load_verified_dataset, read_json
from simulador.periodic import replay

BASE = Path(__file__).resolve().parents[2]
SPEC = {'instrumentId': 'demo-mixed', 'initial': 500, 'recurringContribution': 50, 'periods': 1}


def test_registry_covers_catalog_and_known_caixa_costs():
    registry = read_json(BASE / 'datos/registro-fuentes.json')
    entries = registry['instruments']
    ids = [entry['instrumentId'] for entry in entries]
    assert len(ids) == len(set(ids)) == 8
    assert set(ids) == {entry['instrumentId'] for entry in get_catalog()['instruments']}
    caixa = next(entry for entry in entries if entry['instrumentId'] == 'caixabank-monetario-estandar')
    assert 'ficha consultada el 2026-11-09' in caixa['costs']
    assert 'gastos corrientes están deducidos' in caixa['costs']
    assert caixa['distributions'] == 'unknown'


def test_verifier_cli_has_json_output_without_runtime_warning():
    result = subprocess.run([sys.executable, '-m', 'backend.verify_data'], cwd=BASE,
                            capture_output=True, text=True, check=True)
    assert json.loads(result.stdout) == load_verified_dataset()[1]
    assert 'RuntimeWarning' not in result.stderr


def test_golden_periodic_and_hostile_decimal_context():
    fixture = read_json(BASE / 'simulador/fixtures/golden-periodic-v1.json')
    for case in fixture['cases']:
        with localcontext() as ctx:
            ctx.prec, ctx.rounding, ctx.Emax, ctx.Emin = 3, ROUND_DOWN, 2, -2
            result = replay(case['initial'], case['contribution'], case['rates'],
                            [None] * (len(case['rates']) + 1), case['kind'])
        for key in ('points', 'contributed', 'profit', 'simpleReturnPercent'):
            assert result[key] == case[key]


def test_snapshot_reproduces_authoritative_replay(tmp_path):
    shutil.copytree(ROOT, tmp_path / 'shared')
    root = tmp_path / 'shared'
    snapshot = read_json(root / 'snapshots/demo-2026-11-09.1/demo-data.json')
    rates = snapshot['instruments'][0]['returns'][:1]
    result = replay(500, 50, rates, [None, None], 'fictional_monthly')
    assert result['value'] == 558.25
    assert result['points'] == run_simulation(SPEC)['points']
    live = read_json(root / 'demo-data.json')
    live['instruments'][0]['returns'][0] = 0.5
    (root / 'demo-data.json').write_text(json.dumps(live), encoding='utf-8')
    with pytest.raises(ValueError):
        load_verified_dataset(root)
    retained = read_json(root / 'snapshots/demo-2026-11-09.1/demo-data.json')
    manifest = read_json(root / 'data-manifest.json')
    assert manifest['calculationVersion'] == 'demo-calculations-1.0.0'
    assert replay(500, 50, retained['instruments'][0]['returns'][:1], [None, None], 'fictional_monthly') == result


def test_metadata_stable_isolated_and_legacy_fields():
    data, metadata = load_verified_dataset()
    catalog = get_catalog()
    assert {key: catalog[key] for key in ('schemaVersion', 'banks', 'instruments', 'annualHistory')} == {key: data[key] for key in ('schemaVersion', 'banks', 'instruments', 'annualHistory')}
    assert catalog['provenance'] == run_simulation(SPEC)['provenance'] == metadata
    catalog['provenance']['datasetVersion'] = 'changed'
    assert get_catalog()['provenance'] == run_simulation(SPEC)['provenance'] == metadata
    assert run_simulation(SPEC) == run_simulation(SPEC)
    context = build_tutor_context({'page':'simulator', 'level':'beginner', 'language':'es', 'simulation':SPEC})
    assert 'provenance' not in context and 'provenance' not in context['simulation']


@pytest.mark.parametrize('path', ['demo-data.json', 'snapshots/demo-2026-11-09.1/demo-data.json', 'data-manifest.json'])
def test_integrity_detects_drift(tmp_path, path):
    shutil.copytree(ROOT, tmp_path / 'shared')
    root = tmp_path / 'shared'
    target = root / path
    content = read_json(target)
    content['unexpected'] = 1 if path != 'data-manifest.json' else None
    if path == 'data-manifest.json':
        content['datasetSha256'] = '0' * 64
    target.write_text(json.dumps(content), encoding='utf-8')
    with pytest.raises(ValueError):
        load_verified_dataset(root)


def test_canonicalization_and_invalid_json(tmp_path):
    assert canonical_bytes(json.loads('{"a":1,"b":2}')) == canonical_bytes(json.loads('{ "b":2, "a":1 }'))
    for text in ('{"x":1,"x":2}', '{"x":NaN}', '{"x":Infinity}'):
        path = tmp_path / 'bad.json'
        path.write_text(text, encoding='utf-8')
        with pytest.raises(ValueError):
            read_json(path)


def test_decline_episodes_and_tutor_contract(monkeypatch):
    import backend.domain as domain
    monkeypatch.setitem(domain._DATA, 'portfolioPoints', [100, 80, 100, 90])
    spec = {'basis':'portfolio_demo', 'language':'es'}
    report = analyze_decline(spec)
    assert 'provenance' not in report
    assert [(e['peakLabel'], e['troughLabel'], e['recoveryLabel']) for e in report['episodes']] == [('Punto 1', 'Punto 2', 'Punto 3'), ('Punto 3', 'Punto 4', None)]
    client = TestClient(app, raise_server_exceptions=False)
    assert client.get('/api/health').json() == {'status':'ok', 'mode':'demo', 'tutorProvider':'server_rules', 'externalProviders':False}
    response = client.post('/api/tutor', json={'message':'Explica la caída', 'context':{'page':'portfolio','level':'beginner','language':'es','decline':spec}})
    assert response.status_code == 200, response.text
    assert response.json()['provider'] == 'server_rules'
