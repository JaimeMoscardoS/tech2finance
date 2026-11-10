import sys
import subprocess

import pytest
from fastapi.testclient import TestClient

from backend.app import app
from backend import tutor_bridge


client = TestClient(app, raise_server_exceptions=False)
VALID = {"instrumentId": "fictional", "initial": 100, "recurringContribution": 10, "periods": 12}
CONTEXT = {"page": "home", "level": "beginner", "language": "es"}


def test_health_and_catalog():
    response = client.get("/api/health")
    assert response.json() == {"status": "ok", "mode": "demo", "tutorProvider": "server_rules", "externalProviders": False}
    catalog = client.get("/api/catalog")
    assert catalog.status_code == 200
    assert {"schemaVersion", "banks", "instruments", "annualHistory"} <= set(catalog.json())


def test_simulation_decline_and_real_local_tutor():
    spec = VALID | {"instrumentId": "demo-mixed", "initial": 500, "recurringContribution": 50, "periods": 1}
    simulation = client.post("/api/simulations", json=spec)
    assert simulation.status_code == 200
    assert simulation.json()["value"] == 558.25
    decline = client.post("/api/declines", json={"basis": "instrument", "language": "es", "instrumentId": "demo-mixed", "periods": 1})
    assert decline.status_code == 200
    assert decline.json()["causesStatus"] == "unknown"
    context = CONTEXT | {"page": "simulator", "simulation": spec}
    tutor = client.post("/api/tutor", json={"message": "Explica el resultado", "context": context})
    assert tutor.status_code == 200, tutor.text
    assert tutor.json()["mode"] == "api" and tutor.json()["provider"] == "server_rules"
    assert "558,25" in tutor.json()["text"]


def test_missing_and_unknown_instruments_have_distinct_errors():
    missing = client.post("/api/simulations", json=VALID | {"instrumentId": "bbva-mi-inversion-bolsa"})
    unknown = client.post("/api/simulations", json=VALID | {"instrumentId": "unknown"})
    assert missing.status_code == 409 and missing.json()["error"]["code"] == "history_unavailable"
    assert unknown.status_code == 404 and unknown.json()["error"]["code"] == "unknown_instrument"


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
    def fail(_payload):
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
