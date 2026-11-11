import sys
import subprocess

import pytest
from fastapi.testclient import TestClient

from backend.app import app
from backend import tutor_bridge


client = TestClient(app, raise_server_exceptions=False)
VALID = {"instrumentId": "bbva-mi-inversion-bolsa-acumulacion", "initial": 100, "recurringContribution": 10, "periods": 12}
CONTEXT = {"page": "home", "level": "beginner", "language": "es"}


def test_historical_decline_is_scoped_and_server_owned():
    spec = {'basis': 'instrument', 'instrumentId': 'bbva-mi-inversion-bolsa-acumulacion', 'periods': 3, 'language': 'es'}
    result = client.post('/api/declines', json=spec)
    assert result.status_code == 200
    report = result.json()
    assert report['causesStatus'] == 'unknown'
    assert report['dataKind'] == 'historical_nav'
    assert report['currentDrawdownPercent'] == pytest.approx(25.538223140495873)
    assert report['historicalContext']['events'][0]['date'] == '2020-03-11'
    assert 'historicalContext' not in client.post('/api/declines', json=spec | {'periods': 2}).json()
    assert 'demoContext' not in report
    context = CONTEXT | {'page': 'simulator', 'instrumentId': spec['instrumentId'], 'decline': spec}
    answer = client.post('/api/tutor', json={'message': '¿Por qué ha caído?', 'context': context})
    assert answer.status_code == 200
    assert client.post('/api/tutor', json={'message': 'hola', 'context': context | {'historicalContext': report['historicalContext']}}).status_code == 422
    assert client.post('/api/declines', json=spec | {'historicalContext': report['historicalContext']}).status_code == 422


def test_bank_context_and_untrusted_fields(monkeypatch):
    captured = {}
    def capture(payload, *, rules_only=False):
        captured.clear()
        captured.update(payload['context'])
        return {'text': 'ok', 'language': 'es', 'mode': 'api', 'provider': 'server_rules', 'intent': 'unknown', 'sources': []}
    monkeypatch.setattr('backend.app.reply', capture)
    assert client.get('/api/catalog').json()['bankProfile']['bankId'] == 'demo'
    for page in ('home', 'explore', 'simulator', 'portfolio', 'learn', 'game'):
        result = client.post('/api/tutor', json={'message': 'hola', 'context': CONTEXT | {'page': page, 'instrumentId': 'bbva-mi-inversion-bolsa-acumulacion'}})
        assert result.status_code == 200
        assert captured['bank']['bankId'] == 'demo'
        assert 'product' not in captured.get('instrument', {})
    assert client.post('/api/tutor', json={'message': 'hola', 'context': CONTEXT | {'bankId': 'other'}}).json()['error']['code'] == 'unknown_bank'
    for field in ('bank', 'bankProfile', 'product', 'fees', 'results'):
        assert client.post('/api/tutor', json={'message': 'hola', 'context': CONTEXT | {field: {}}}).status_code == 422
    assert client.post('/api/tutor', json={'message': 'hola', 'context': CONTEXT | {'page': 'explore', 'instrumentId': 'bbva-mi-inversion-bolsa'}}).status_code == 200
    assert 'product' not in captured['instrument']


def test_bank_fee_through_real_bridge_and_unknown_selection():
    context = CONTEXT | {'page': 'explore', 'instrumentId': 'bbva-mi-inversion-bolsa-acumulacion'}
    response = client.post('/api/tutor', json={'message': '¿Cuánto cuesta este fondo?', 'context': context})
    assert response.status_code == 200
    body = response.json()
    assert '0,75%' not in body['text'] and '0.75%' not in body['text']
    assert body['sources'] == []
    follow = client.post('/api/tutor', json={'message': '¿Y eso está descontado?', 'context': context, 'history': [{'role': 'assistant', 'text': body['text'], 'intent': body['intent']}]})
    assert follow.status_code == 200 and '0,75%' not in follow.json()['text']
    missing = client.post('/api/tutor', json={'message': 'hola', 'context': context | {'instrumentId': 'not-a-product'}})
    assert missing.status_code == 404 and missing.json()['error']['code'] == 'unknown_instrument'


def test_annual_contributions_are_not_mistaken_for_fees():
    spec = {'instrumentId': 'caixabank-monetario-estandar', 'initial': 500, 'recurringContribution': 100, 'periods': 5}
    context = {'page': 'simulator', 'level': 'beginner', 'language': 'en', 'simulation': spec}
    reply = client.post('/api/tutor', json={'message': 'How much did I contribute?', 'context': context})
    assert reply.status_code == 200
    assert '1,000' in reply.json()['text'] and reply.json()['intent'] == 'result'


def test_health_and_catalog():
    response = client.get("/api/health")
    assert response.json() == {"status": "ok", "mode": "demo", "tutorProvider": "server_rules", "speechProvider": "browser_local", "ttsProvider": "browser_local", "speechKeyConfigured": False, "externalProviders": False, "newsProvider": "off"}
    catalog = client.get("/api/catalog")
    assert catalog.status_code == 200
    assert {"schemaVersion", "banks", "instruments", "annualHistory"} <= set(catalog.json())


def test_simulation_decline_and_real_local_tutor():
    spec = VALID | {"initial": 500, "recurringContribution": 50, "periods": 1}
    simulation = client.post("/api/simulations", json=spec)
    assert simulation.status_code == 200
    assert simulation.json()["value"] == pytest.approx(500 * 9.4533 / 9.68 + 50)
    assert simulation.json()['timeline'][0]['date'] == '2019-12-31'
    decline = client.post("/api/declines", json={"basis": "instrument", "language": "es", "instrumentId": spec['instrumentId'], "periods": 1})
    assert decline.status_code == 200
    assert decline.json()["causesStatus"] == "unknown"
    context = CONTEXT | {"page": "simulator", "simulation": spec}
    tutor = client.post("/api/tutor", json={"message": "Explica el resultado", "context": context})
    assert tutor.status_code == 200, tutor.text
    assert tutor.json()["mode"] == "api" and tutor.json()["provider"] == "server_rules"
    assert "538,29" in tutor.json()["text"]


def test_missing_and_unknown_instruments_have_distinct_errors():
    missing = client.post("/api/simulations", json=VALID | {"instrumentId": "bbva-mi-inversion-bolsa"})
    unknown = client.post("/api/simulations", json=VALID | {"instrumentId": "unknown"})
    assert missing.status_code == 409 and missing.json()["error"]["code"] == "history_unavailable"
    assert unknown.status_code == 404 and unknown.json()["error"]["code"] == "unknown_instrument"


def test_real_nav_coverage_and_retired_ids():
    spec = VALID | {'initial': 1000, 'recurringContribution': 0, 'periods': 3}
    response = client.post('/api/simulations', json=spec)
    assert response.status_code == 200
    body = response.json()
    assert body['kind'] == 'real_monthly_nav' and body['currency'] == 'EUR'
    assert body['contributionTiming'] == 'month_end_after_return'
    assert [(p['date'], p['nav']) for p in body['timeline']] == [
        ('2019-12-31', '9.68'), ('2020-01-31', '9.4533'),
        ('2020-02-29', '8.6906'), ('2020-03-31', '7.2079')]
    assert body['value'] == pytest.approx(1000 * 7.2079 / 9.68)
    assert client.post('/api/simulations', json=spec | {'startDate': '2025-12-31'}).status_code == 422
    assert client.post('/api/simulations', json=spec | {'startDate': '2020-01-30'}).status_code == 422
    for retired in ('demo-mixed', 'demo-equity', 'demo-fixed', 'demo-etf', 'demo-stock'):
        response = client.post('/api/simulations', json=spec | {'instrumentId': retired})
        assert response.status_code == 404 and response.json()['error']['code'] == 'unknown_instrument'


@pytest.mark.parametrize("change", [
    {"initial": -1}, {"initial": 1_000_000_001}, {"initial": "1"},
    {"initial": True}, {"periods": 0}, {"periods": 121},
    {"periods": 2.5}, {"sources": []},
])
def test_simulation_rejects_invalid_input(change):
    response = client.post("/api/simulations", json=VALID | change)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_nonfinite_and_malformed_json_do_not_echo_input():
    for body in ('{"initial": NaN}', '{"secret":"sensitive"'):
        response = client.post("/api/simulations", content=body, headers={"content-type": "application/json"})
        assert response.status_code == 422
        assert "sensitive" not in response.text


@pytest.mark.parametrize("body", [b'{"initial":' + b'1' * 5000 + b'}', b'{"message":"\xff"}'])
def test_invalid_json_body_uses_sanitized_error(body):
    response = client.post("/api/simulations", content=body, headers={"content-type": "application/json"})
    assert response.status_code == 400
    assert response.json() == {"error": {"code": "invalid_request", "message": "Invalid request."}}


@pytest.mark.parametrize("method,path,status,code", [
    ("get", "/api/does-not-exist", 404, "not_found"),
    ("post", "/api/health", 405, "method_not_allowed"),
])
def test_http_errors_use_sanitized_envelope(method, path, status, code):
    response = getattr(client, method)(path)
    assert response.status_code == status
    assert response.json()["error"]["code"] == code
    if status == 405:
        assert response.headers["allow"] == "GET"


def test_oversized_chunked_body_is_rejected():
    response = client.post("/api/tutor", content=b"a" * 65537, headers={"content-type": "application/json"})
    assert response.status_code == 413
    assert response.json()["error"]["code"] == "request_too_large"


@pytest.mark.parametrize("body", [
    {"basis": "portfolio_demo", "language": "es", "periods": 4},
    {"basis": "portfolio_cnmv", "language": "es", "instrumentId": "x"},
    {"basis": "portfolio_cnmv", "language": "es", "observations": [1, 2]},
    {"basis": "instrument", "language": "es", "instrumentId": "x"},
    {"basis": "instrument", "language": "es", "instrumentId": "x", "periods": 1, "observations": []},
])
def test_decline_rejects_ambiguous_or_client_supplied_data(body):
    assert client.post("/api/declines", json=body).status_code == 422


@pytest.mark.parametrize("context", [
    CONTEXT | {"simulation": VALID},
    CONTEXT | {"decline": {"basis": "portfolio_demo", "language": "en"}},
    CONTEXT | {"portfolio": {"value": 42}},
    CONTEXT | {"decision": {"horizonYears": 101}},
])
def test_tutor_rejects_inconsistent_or_untrusted_context(context):
    response = client.post("/api/tutor", json={"message": "hola", "context": context})
    assert response.status_code == 422


def test_tutor_unavailable_is_controlled(monkeypatch):
    def fail(_payload, *, rules_only=False):
        raise tutor_bridge.TutorUnavailable()
    monkeypatch.setattr("backend.app.reply", fail)
    response = client.post("/api/tutor", json={"message": "private text", "context": CONTEXT})
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "tutor_unavailable"
    assert "private text" not in response.text


def test_bridge_missing_node(monkeypatch, tmp_path):
    payload = {"message": "hola", "context": CONTEXT}
    monkeypatch.setattr(tutor_bridge, "BRIDGE", tmp_path / "missing.ts")
    monkeypatch.setattr(tutor_bridge.subprocess, "Popen", lambda *args, **kwargs: (_ for _ in ()).throw(FileNotFoundError()))
    with pytest.raises(tutor_bridge.TutorUnavailable):
        tutor_bridge.reply(payload)


@pytest.mark.parametrize("program", ["import time; time.sleep(5)", "import sys; sys.stdout.write('x'*70000)"])
def test_bridge_timeout_and_bounded_output(monkeypatch, program):
    real_popen = subprocess.Popen
    def run_fake(_command, **kwargs):
        return real_popen([sys.executable, "-c", program], **kwargs)
    monkeypatch.setattr(tutor_bridge.subprocess, "Popen", run_fake)
    monkeypatch.setattr(tutor_bridge, "TIMEOUT_SECONDS", 0.3)
    with pytest.raises(tutor_bridge.TutorUnavailable):
        tutor_bridge.reply({"message": "hola", "context": CONTEXT})


def test_body_limit_handles_actual_asgi_chunks():
    async def chunks():
        yield b"a" * 40000
        yield b"b" * 30000
    import asyncio
    import httpx
    async def exercise():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver") as async_client:
            return await async_client.post("/api/tutor", content=chunks(), headers={"content-type": "application/json"})
    assert asyncio.run(exercise()).status_code == 413


def test_valid_chunked_json_and_local_cors():
    async def chunks():
        yield b'{"basis":"portfolio_'
        yield b'demo","language":"es"}'
    import asyncio
    import httpx
    async def exercise():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver") as async_client:
            return await async_client.post("/api/declines", content=chunks(), headers={"content-type": "application/json", "origin": "http://localhost:5173"})
    response = asyncio.run(exercise())
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert "access-control-allow-origin" not in client.get("/api/health", headers={"origin": "https://attacker.example"}).headers


def test_bridge_rejects_excess_concurrency():
    for _ in range(4):
        assert tutor_bridge._slots.acquire(blocking=False)
    try:
        with pytest.raises(tutor_bridge.TutorUnavailable):
            tutor_bridge.reply({"message": "hola", "context": CONTEXT})
    finally:
        for _ in range(4):
            tutor_bridge._slots.release()


def test_unknown_host_is_rejected():
    assert client.get("/api/health", headers={"host": "attacker.example"}).status_code == 400


def test_explore_tutor_receives_selected_catalog_fund(monkeypatch):
    seen = {}
    def capture(payload, *, rules_only=False):
        seen.update(payload['context'])
        return {'text': 'Respuesta de prueba', 'language': 'es', 'mode': 'api', 'provider': 'server_rules', 'intent': 'fund', 'sources': []}
    monkeypatch.setattr('backend.app.reply', capture)
    response = client.post('/api/tutor', json={'message': '¿Qué es este fondo?', 'context': {'page': 'explore', 'level': 'advanced', 'language': 'es', 'instrumentId': 'caixabank-monetario-estandar'}})
    assert response.status_code == 200
    assert seen['instrument']['id'] == 'caixabank-monetario-estandar'
    assert seen['instrument']['dataKind'] == 'historical_nav'
    assert seen['instrument']['sources'][0]['url'].startswith('https://www.cnmv.es/')
    assert 'simulation' not in seen


GAME = {"instrumentId": "bbva-mi-inversion-bolsa-acumulacion", "initial": 500, "monthly": 50, "months": 12, "sellMonth": 6, "buyFeeRate": 0, "sellFeeRate": 0}


def test_game_compare_ok():
    response = client.post("/api/game/compare", json=GAME)
    assert response.status_code == 200
    body = response.json()
    assert {"hold", "sell", "provenance"} <= set(body)
    assert body["dataKind"] == "historical_nav" and len(body["hold"]["timeline"]) == 13


def test_game_rejects_excluded_and_invalid_requests():
    excluded = client.post("/api/game/compare", json=GAME | {"instrumentId": "bbva-mi-inversion-bolsa"})
    assert excluded.status_code == 422 and excluded.json()["error"]["code"] == "invalid_game"
    assert client.post("/api/game/compare", json=GAME | {"sellMonth": 13}).status_code == 422
    assert client.post("/api/game/compare", json=GAME | {"extra": 1}).status_code == 422
    unknown = client.post("/api/game/compare", json=GAME | {"instrumentId": "unknown"})
    assert unknown.status_code == 404 and unknown.json()["error"]["code"] == "unknown_instrument"


def test_game_edge_months_and_dates():
    for sell_month in (0, 12):
        response = client.post("/api/game/compare", json=GAME | {"sellMonth": sell_month})
        assert response.status_code == 200
        body = response.json()
        assert body['hold']['timeline'][0]['date'] == '2019-12-31'
        assert body['hold']['timeline'][-1]['date'] == '2020-12-31'


def test_game_rejects_bad_values_and_unavailable_banks():
    assert client.post("/api/game/compare", json=GAME | {"initial": 0, "monthly": 0}).status_code == 422
    for change in ({"months": True}, {"months": 2.5}, {"buyFeeRate": 0.06}, {"sellFeeRate": -0.01}):
        assert client.post("/api/game/compare", json=GAME | change).status_code == 422
    for identifier in ("bbva-mi-inversion-bolsa",):
        response = client.post("/api/game/compare", json=GAME | {"instrumentId": identifier})
        assert response.status_code == 422 and response.json()["error"]["code"] == "invalid_game"


def test_configured_external_bank_context_is_scoped(monkeypatch):
    captured = {}
    def capture(payload, *, rules_only=False):
        captured.clear()
        captured.update(payload['context'])
        return {'text': 'ok', 'language': 'es', 'mode': 'api', 'provider': 'server_rules', 'intent': 'unknown', 'sources': []}
    monkeypatch.setattr('backend.app.reply', capture)
    for bank, instrument in [('bbva', 'bbva-mi-inversion-bolsa'), ('caixabank', 'caixabank-monetario-estandar')]:
        response = client.post('/api/tutor', json={'message': 'hola', 'context': CONTEXT | {'page': 'explore', 'bankId': bank, 'instrumentId': instrument}})
        assert response.status_code == 200
        assert 'bank' not in captured and 'product' not in captured['instrument']
        assert captured['instrument']['id'] == instrument
    response = client.post('/api/tutor', json={'message': 'hola', 'context': CONTEXT | {'page': 'explore', 'bankId': 'bbva', 'instrumentId': 'caixabank-monetario-estandar'}})
    assert response.status_code == 422
    response = client.post('/api/tutor', json={'message': 'hola', 'context': CONTEXT | {'bankId': 'unknown'}})
    assert response.status_code == 400 and response.json()['error']['code'] == 'unknown_bank'


@pytest.mark.parametrize(('language', 'question', 'expected'), [
    ('es', '¿Por qué no puedo simularlo?', 'no tiene histórico disponible'),
    ('en', "Why can't I simulate it?", 'no available history'),
])
def test_external_missing_history_through_tutor_bridge(language, question, expected):
    context = {'page': 'simulator', 'level': 'beginner', 'language': language,
               'bankId': 'bbva', 'instrumentId': 'bbva-mi-inversion-bolsa'}
    response = client.post('/api/tutor', json={'message': question, 'context': context})
    assert response.status_code == 200
    answer = response.json()
    assert answer['intent'] == 'bank_missing_history'
    assert expected in answer['text']
    assert '0,75' not in answer['text'] and '0.75' not in answer['text']


def test_cnmv_portfolio_decline_endpoint():
    response = client.post("/api/declines", json={"basis": "portfolio_cnmv", "language": "en"})
    assert response.status_code == 200
    body = response.json()
    assert body["basisName"] == "My portfolio (CNMV NAVs; DEMO holdings)"
    assert body["maxDrawdownPercent"] == pytest.approx(8.7857, abs=1e-3)


def test_tutor_accepts_learn_and_game_pages(monkeypatch):
    captured = {}
    def capture(payload, *, rules_only=False):
        captured.update(payload['context'])
        return {'text': 'ok', 'language': 'es', 'mode': 'api', 'provider': 'server_rules', 'intent': 'unknown', 'sources': []}
    monkeypatch.setattr('backend.app.reply', capture)
    for page in ('learn', 'game'):
        captured.clear()
        assert client.post('/api/tutor', json={'message': 'hola', 'context': CONTEXT | {'page': page}}).status_code == 200
        assert captured['page'] == page
    assert client.post('/api/tutor', json={'message': 'hola', 'context': CONTEXT | {'page': 'other'}}).status_code == 422
