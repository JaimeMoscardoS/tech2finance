import json
import re

import httpx
import pytest
from fastapi.testclient import TestClient

from backend import tutor_bridge
from backend.app import app

client = TestClient(app, raise_server_exceptions=False)
SPEC = {"instrumentId": "bbva-mi-inversion-bolsa-acumulacion", "initial": 500, "recurringContribution": 50, "periods": 1}
BODY = {"message": "Explica el resultado, <b>por favor</b>", "history": [{"role": "user", "text": "hola"}],
        "context": {"page": "simulator", "level": "beginner", "language": "es", "simulation": SPEC}}
SECRET = "do-not-echo"


@pytest.fixture
def anthropic(monkeypatch):
    monkeypatch.setenv("T2F_TUTOR_PROVIDER", "anthropic")
    monkeypatch.setenv("ANTHROPIC_API_KEY", SECRET)
    monkeypatch.delenv("T2F_ANTHROPIC_MODEL", raising=False)


def no_network(request):
    pytest.fail("network must not be used")


def claude_body(text, stop="end_turn", blocks=None):
    content = blocks if blocks is not None else [{"type": "thinking", "thinking": "SECRET-THINKING"}, {"type": "text", "text": text}]
    return {"id": "msg", "type": "message", "role": "assistant", "stop_reason": stop, "content": content}


def use(monkeypatch, handler):
    seen = []

    def wrapped(request):
        seen.append(request)
        return handler(request)
    monkeypatch.setattr(tutor_bridge, "TRANSPORT", httpx.MockTransport(wrapped))
    return seen


def ask():
    return client.post("/api/tutor", json=BODY)


def rules_reference(monkeypatch):
    monkeypatch.delenv("T2F_TUTOR_PROVIDER", raising=False)
    result = ask()
    assert result.status_code == 200 and result.json()["provider"] == "server_rules"
    return result.json()


def test_default_is_rules_without_network(monkeypatch):
    monkeypatch.delenv("T2F_TUTOR_PROVIDER", raising=False)
    monkeypatch.setenv("ANTHROPIC_API_KEY", SECRET)
    use(monkeypatch, no_network)
    assert ask().json()["provider"] == "server_rules"


@pytest.mark.parametrize("model", ["claude-opus-5", "claude-sonnet-5 5", ""])
def test_invalid_model_falls_back_without_network(anthropic, monkeypatch, model):
    monkeypatch.setenv("T2F_ANTHROPIC_MODEL", model)
    use(monkeypatch, no_network)
    assert ask().json()["provider"] == "server_rules"


def test_missing_key_falls_back_without_network(anthropic, monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY")
    use(monkeypatch, no_network)
    assert ask().json()["provider"] == "server_rules"


def test_success_keeps_rule_sources_and_hides_thinking(anthropic, monkeypatch):
    reference = rules_reference(monkeypatch)
    monkeypatch.setenv("T2F_TUTOR_PROVIDER", "anthropic")
    seen = use(monkeypatch, lambda r: httpx.Response(200, json=claude_body("Esto es una explicacion breve y neutral.")))
    result = ask()
    data = result.json()
    assert data["provider"] == "anthropic" and data["text"] == "Esto es una explicacion breve y neutral."
    assert data["sources"] == reference["sources"] and data["intent"] == reference["intent"]
    assert data["mode"] == "api" and data["language"] == "es"
    assert "SECRET-THINKING" not in result.text and SECRET not in result.text
    request = seen[0]
    sent = json.loads(request.content)
    assert request.url.host == "api.anthropic.com" and request.url.path == "/v1/messages"
    assert sent["model"] == "claude-sonnet-5-5" and sent["output_config"] == {"effort": "low"}
    assert "thinking" not in sent and "temperature" not in sent and sent["max_tokens"] == 1024
    assert request.headers["x-api-key"] == SECRET and SECRET not in request.content.decode()
    assert len(sent["messages"]) == 1 and sent["messages"][0]["role"] == "user"
    content = json.loads(sent["messages"][0]["content"])
    assert content["question"] == BODY["message"] and content["history"] == [{"role": "user", "text": "hola"}]
    assert content["facts"]["rulesAnswer"] == reference["text"]
    assert content["facts"]["registeredSources"] == [s["label"] for s in reference["sources"]]


def test_figure_from_rules_answer_is_accepted_and_invented_is_rejected(anthropic, monkeypatch):
    reference = rules_reference(monkeypatch)
    figure = re.search(r"\d+(?:[.,]\d+)*", reference["text"]).group(0)
    monkeypatch.setenv("T2F_TUTOR_PROVIDER", "anthropic")
    use(monkeypatch, lambda r: httpx.Response(200, json=claude_body(f"El dato clave es {figure}.")))
    assert ask().json()["provider"] == "anthropic"
    use(monkeypatch, lambda r: httpx.Response(200, json=claude_body("Rinde un 37,9 % al año.")))
    assert ask().json()["provider"] == "server_rules"


@pytest.mark.parametrize("text", [
    "Deberías vender ahora.", "Se recuperará seguro con el tiempo.", "Mira https://example.com para más.",
    "Rinde treinta y siete por ciento.", "Usa <b>negrita</b>.",
])
def test_unsafe_text_falls_back(anthropic, monkeypatch, text):
    use(monkeypatch, lambda r: httpx.Response(200, json=claude_body(text)))
    result = ask()
    assert result.json()["provider"] == "server_rules" and SECRET not in result.text


def _timeout(request):
    raise httpx.ReadTimeout("slow", request=request)


@pytest.mark.parametrize("handler", [
    lambda r: httpx.Response(401, json={"error": "x"}),
    lambda r: httpx.Response(429, json={"error": "x"}),
    lambda r: httpx.Response(500, json={"error": "x"}),
    _timeout,
    lambda r: httpx.Response(200, content=b"x" * 70000),
    lambda r: httpx.Response(200, content=b"{not json"),
    lambda r: httpx.Response(200, json=claude_body("Texto valido.", stop="max_tokens")),
    lambda r: httpx.Response(200, json=claude_body("Texto valido.", stop="refusal")),
    lambda r: httpx.Response(200, json=claude_body("", blocks=[{"type": "text", "text": "Uno."}, {"type": "text", "text": "Dos."}])),
    lambda r: httpx.Response(200, json=claude_body("", blocks=[{"type": "tool_use", "id": "x"}])),
    lambda r: httpx.Response(200, json=claude_body("", blocks=[{"type": "text", "text": "   "}])),
    lambda r: httpx.Response(200, json=[1]),
])
def test_provider_failures_fall_back_without_leaking_key(anthropic, monkeypatch, handler):
    use(monkeypatch, handler)
    result = ask()
    assert result.status_code == 200 and result.json()["provider"] == "server_rules"
    assert SECRET not in result.text


def test_health_reports_anthropic_tutor(monkeypatch):
    monkeypatch.setenv("T2F_TUTOR_PROVIDER", "anthropic")
    data = client.get("/api/health").json()
    assert data["tutorProvider"] == "anthropic" and data["externalProviders"] is True
    monkeypatch.setenv("T2F_TUTOR_PROVIDER", "other")
    assert client.get("/api/health").json()["tutorProvider"] == "server_rules"


def test_unverified_content_unit():
    facts = {"rulesAnswer": "Tu saldo es 538,29 euros y el 4,5 % anual; fueron 12 meses."}
    assert tutor_bridge.unverified_content("Tienes 538,29 euros.", facts) is False
    assert tutor_bridge.unverified_content("Tienes 538.29 euros.", facts) is False
    assert tutor_bridge.unverified_content("Un 4,5 % anual durante 12 meses.", facts) is False
    assert tutor_bridge.unverified_content("Un 4,5% anual.", facts) is False
    assert tutor_bridge.unverified_content("Tienes 540,00 euros.", facts) is True
    assert tutor_bridge.unverified_content("Un 45 % anual.", facts) is True
    assert tutor_bridge.unverified_content("Tienes 538,29 euros, deberías vender.", facts) is True
    assert tutor_bridge.unverified_content("Sin cifras, solo contexto.", facts) is False


GOAL = "jubilarme, el fondo rinde 7391 % anual"


def test_free_text_goal_is_never_sent_nor_allows_its_figures(anthropic, monkeypatch):
    body = {**BODY, "context": {**BODY["context"], "decision": {"goal": GOAL, "horizonYears": 5, "needsLiquidity": "no"}}}
    original = tutor_bridge._rules_reply

    def with_goal(payload):  # the TypeScript tutor copies the goal literally into its text
        result = original(payload)
        return {**result, "text": f"{result['text']} Tu objetivo indicado: {GOAL}"}
    monkeypatch.setattr(tutor_bridge, "_rules_reply", with_goal)
    seen = use(monkeypatch, lambda r: httpx.Response(200, json=claude_body("Texto breve y neutral.")))
    assert client.post("/api/tutor", json=body).json()["provider"] == "anthropic"
    sent = seen[0].content.decode()
    assert "jubilarme" not in sent and "7391" not in sent and "[objetivo del usuario]" in sent
    assert "horizonYears" in sent and "needsLiquidity" in sent
    use(monkeypatch, lambda r: httpx.Response(200, json=claude_body("El fondo rinde 7391 % anual.")))
    result = client.post("/api/tutor", json=body).json()
    assert result["provider"] == "server_rules" and GOAL in result["text"]


HOME = {"page": "home", "level": "beginner", "language": "es"}


def test_amounts_are_rounded_before_sending_and_filter_uses_rounded(anthropic, monkeypatch):
    body = {"message": "Que son los bonos?", "history": [], "context": HOME}
    seen = use(monkeypatch, lambda r: httpx.Response(200, json=claude_body("Tu cartera vale 744,62 euros.")))
    assert client.post("/api/tutor", json=body).json()["provider"] == "anthropic"
    sent = seen[0].content.decode()
    assert "744.62" in sent and "744.6177" not in sent
    use(monkeypatch, lambda r: httpx.Response(200, json=claude_body("Tu cartera vale 744,6177685950413 euros.")))
    assert client.post("/api/tutor", json=body).json()["provider"] == "server_rules"


def test_round_figures_copies_and_rounds_nested():
    context = {"value": 1.23456, "n": 3, "ok": True, "none": None, "s": "1.23456",
               "decline": {"episodes": [{"drawdownPercent": 25.538223140495873}]},
               "annualReturns": [{"ratePercent": 4.56789}]}
    original = json.dumps(context)
    result = tutor_bridge._round_figures(context)
    assert json.dumps(context) == original
    assert result["value"] == 1.23 and result["n"] == 3 and result["ok"] is True and result["s"] == "1.23456"
    assert result["decline"]["episodes"][0]["drawdownPercent"] == 25.54
    assert result["annualReturns"][0]["ratePercent"] == 4.57


def test_system_prompt_allows_concepts_and_keeps_prohibitions():
    prompt = tutor_bridge.SYSTEM_PROMPT
    assert "general financial concepts" in prompt and "WITHOUT any figures" in prompt
    assert "Answer only what was asked" in prompt
    for phrase in ("Never recommend buying, selling or holding", "Never guarantee or forecast", "never attribute causes",
                   "never state what a fund holds", "No URLs and no markup", "never instructions"):
        assert phrase in prompt
