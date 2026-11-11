import json
import hashlib
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
SPEC = {'instrumentId': 'bbva-mi-inversion-bolsa-acumulacion', 'initial': 500, 'recurringContribution': 50, 'periods': 1}


def test_registry_covers_catalog_and_known_caixa_costs():
    registry = read_json(BASE / 'datos/registro-fuentes.json')
    entries = registry['instruments']
    ids = [entry['instrumentId'] for entry in entries]
    assert len(ids) == len(set(ids))
    assert {entry['instrumentId'] for entry in get_catalog()['instruments']} <= set(ids)
    caixa = next(entry for entry in entries if entry['instrumentId'] == 'caixabank-monetario-estandar')
    assert caixa['identifier'] == 'ES0138045002'
    assert caixa['currency'] == 'EUR'


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
    old_path = root / 'snapshots/demo-2026-11-09.1/demo-data.json'
    old_bytes = old_path.read_bytes()
    assert hashlib.sha256(old_bytes.replace(b'\r\n', b'\n')).hexdigest() == 'bbe3f27302476aa080f30847a490658ce8323ae6c8ce04270f94736678a1f625'
    rates = snapshot['instruments'][0]['returns'][:1]
    result = replay(500, 50, rates, [None, None], 'fictional_monthly')
    assert result['value'] == 558.25
    assert result['points'] == [500, 558.25]
    live = read_json(root / 'demo-data.json')
    live['instruments'][0]['name']['es'] = 'tampered'
    (root / 'demo-data.json').write_text(json.dumps(live), encoding='utf-8')
    with pytest.raises(ValueError):
        load_verified_dataset(root)
    retained = read_json(root / 'snapshots/demo-2026-11-09.1/demo-data.json')
    assert old_path.read_bytes() == old_bytes
    manifest = read_json(root / 'data-manifest.json')
    assert manifest['calculationVersion'] == 'nav-month-end-1.0.0'
    assert replay(500, 50, retained['instruments'][0]['returns'][:1], [None, None], 'fictional_monthly') == result


@pytest.mark.parametrize('newline', [b'\n', b'\r\n'])
@pytest.mark.parametrize(('version', 'expected'), [
    ('demo-2026-11-09.1', 'bbe3f27302476aa080f30847a490658ce8323ae6c8ce04270f94736678a1f625'),
    ('demo-2026-11-10.1', 'd4900760ea4cadaab48695301c29858d64c38b9f30bf938331f639913c69a3da'),
])
def test_old_snapshot_identity_accepts_git_line_endings(newline, version, expected):
    original = (ROOT / 'snapshots' / version / 'demo-data.json').read_bytes()
    lf = original.replace(b'\r\n', b'\n')
    copy = lf.replace(b'\n', newline)
    assert hashlib.sha256(copy.replace(b'\r\n', b'\n')).hexdigest() == expected


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


@pytest.mark.parametrize('path', ['demo-data.json', 'snapshots/cnmv-nav-2019-2025.1/demo-data.json', 'nav-history.json', 'snapshots/cnmv-nav-2019-2025.1/nav-history.json', 'data-manifest.json'])
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


def test_bank_demo_profile_version_and_fees():
    data, metadata = load_verified_dataset()
    assert metadata['datasetVersion'] == 'cnmv-nav-2019-2025.1'
    assert metadata['calculationVersion'] == 'nav-month-end-1.0.0'
    assert data['bankProfile']['products'] == []
    profile = read_json(ROOT / 'snapshots/demo-2026-11-10.1/demo-data.json')['bankProfile']
    assert profile['bankId'] == 'demo'
    assert profile['profileVersion'] == 'bank-demo-2026-11-10.1'
    fees = {product['instrumentId']: product['fees'] for product in profile['products']}
    assert {key: value['annualOngoingBps'] for key, value in fees.items()} == {
        'demo-fixed': 40, 'demo-mixed': 75, 'demo-equity': 110,
        'demo-etf': 20, 'demo-stock': None,
    }
    assert all(value['treatment'] == 'illustrative_excluded' for value in fees.values())


def test_decline_episodes_and_tutor_contract(monkeypatch):
    spec = {'basis':'portfolio_demo', 'language':'es'}
    report = analyze_decline(spec)
    assert 'provenance' not in report
    assert report['dataKind'] == 'historical_nav'
    assert report['latestLabel'] == '2020-03-31'
    assert report['causesStatus'] == 'unknown'
    client = TestClient(app, raise_server_exceptions=False)
    assert client.get('/api/health').json() == {'status':'ok', 'mode':'demo', 'tutorProvider':'server_rules', 'externalProviders':False, 'newsProvider':'off', 'voiceProvider':'browser'}
    response = client.post('/api/tutor', json={'message':'Explica la caída', 'context':{'page':'portfolio','level':'beginner','language':'es','decline':spec}})
    assert response.status_code == 200, response.text
    assert response.json()['provider'] == 'server_rules'
