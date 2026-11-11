import json

import httpx
import pytest
from fastapi.testclient import TestClient

from backend.app import app
from backend import providers, tutor_bridge

client = TestClient(app)
CONTEXT = {'page': 'home', 'level': 'beginner', 'language': 'es'}


@pytest.fixture(autouse=True)
def clean(monkeypatch):
    providers._token_requests.clear()
    monkeypatch.delenv('ELEVENLABS_API_KEY', raising=False)
    monkeypatch.delenv('ANTHROPIC_API_KEY', raising=False)
    monkeypatch.delenv('T2F_SPEECH_PROVIDER', raising=False)
    monkeypatch.delenv('T2F_TUTOR_PROVIDER', raising=False)
    monkeypatch.setattr(providers, 'TRANSPORT', None)


@pytest.mark.parametrize('language', ['es', 'en'])
def test_speech_token(language, monkeypatch):
    monkeypatch.setenv('ELEVENLABS_API_KEY', 'fake-secret')
    def handler(request):
        assert str(request.url) == 'https://api.elevenlabs.io/v1/single-use-token/realtime_scribe'
        assert request.headers['xi-api-key'] == 'fake-secret'
        return httpx.Response(200, json={'token': 'sutkn_fake'})
    monkeypatch.setattr(providers, 'TRANSPORT', httpx.MockTransport(handler))
    response = client.post('/api/speech/token', json={'language': language})
    assert response.json() == {'schemaVersion': '1.0', 'provider': 'elevenlabs', 'language': language,
                               'model': 'scribe_v2_realtime', 'token': 'sutkn_fake', 'expiresInSeconds': 900}
    assert response.headers['cache-control'] == 'no-store'
    assert 'fake-secret' not in response.text
    assert client.get('/api/health').json()['speechKeyConfigured'] is True


def test_token_rejects_inputs_origin_configuration_and_rate(monkeypatch):
    assert client.post('/api/speech/token', json={'language': 'fr'}).status_code == 422
    assert client.post('/api/speech/token', json={'language': 'es', 'extra': 1}).status_code == 422
    oversized = client.post('/api/speech/token', content=b'x' * 65537, headers={'content-type': 'application/json'})
    assert oversized.status_code == 413 and oversized.headers['cache-control'] == 'no-store'
    assert client.post('/api/speech/token', json={'language': 'es'}, headers={'origin': 'https://evil.example'}).status_code == 403
    monkeypatch.setenv('T2F_SPEECH_PROVIDER', 'elevenlabs')
    assert client.post('/api/speech/token', json={'language': 'es'}).json()['error']['code'] == 'speech_configuration_error'
    for _ in range(29):
        client.post('/api/speech/token', json={'language': 'es'})
    assert client.post('/api/speech/token', json={'language': 'es'}).status_code == 429


@pytest.mark.parametrize('case', ['status', 'oversize', 'timeout', 'malformed'])
def test_token_provider_errors(case, monkeypatch):
    monkeypatch.setenv('ELEVENLABS_API_KEY', 'fake-secret')
    def handler(request):
        if case == 'timeout':
            raise httpx.ReadTimeout('secret must not escape')
        if case == 'status':
            return httpx.Response(401, text='fake-secret')
        if case == 'oversize':
            return httpx.Response(200, content=b'x' * 16385)
        return httpx.Response(200, json={'token': ''})
    monkeypatch.setattr(providers, 'TRANSPORT', httpx.MockTransport(handler))
    response = client.post('/api/speech/token', json={'language': 'es'})
    assert response.status_code == 503 and response.json()['error']['code'] == 'speech_provider_error'
    assert 'fake-secret' not in response.text


@pytest.mark.parametrize('token', ['opaque-token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.signature'])
def test_speech_accepts_opaque_tokens(token, monkeypatch):
    monkeypatch.setenv('ELEVENLABS_API_KEY', 'fake-secret')
    monkeypatch.setattr(providers, 'TRANSPORT', httpx.MockTransport(lambda req: httpx.Response(200, json={'token': token})))
    response = client.post('/api/speech/token', json={'language': 'en'})
    assert response.status_code == 200 and response.json()['token'] == token
    assert 'fake-secret' not in response.text


@pytest.mark.parametrize('token', ['', 'contains space', 'line\nbreak', 'x' * 2049, 'fake-secret'])
def test_speech_rejects_invalid_or_secret_token(token, monkeypatch):
    monkeypatch.setenv('ELEVENLABS_API_KEY', 'fake-secret')
    monkeypatch.setattr(providers, 'TRANSPORT', httpx.MockTransport(lambda req: httpx.Response(200, json={'token': token})))
    response = client.post('/api/speech/token', json={'language': 'es'})
    assert response.status_code == 503 and response.json()['error']['code'] == 'speech_provider_error'
    assert 'fake-secret' not in response.text


@pytest.mark.parametrize('language,paragraph', [('es', 'El riesgo depende del contexto y de tus objetivos.'), ('en', 'Risk depends on your context and your goals.')])
def test_tutor_anthropic(language, paragraph, monkeypatch):
    monkeypatch.setenv('T2F_TUTOR_PROVIDER', 'anthropic')
    monkeypatch.setenv('ANTHROPIC_API_KEY', 'fake-secret')
    def handler(request):
        assert request.url.host == 'api.anthropic.com'
        prompt = json.loads(request.content)['messages'][0]['content']
        assert 'previous question' in prompt and 'current question' in prompt
        value = {'language': language, 'paragraphs': [paragraph], 'sourceIds': []}
        return httpx.Response(200, json={'stop_reason': 'end_turn', 'content': [{'type': 'text', 'text': json.dumps(value)}]})
    monkeypatch.setattr(providers, 'TRANSPORT', httpx.MockTransport(handler))
    response = client.post('/api/tutor', json={'message': 'current question', 'history': [{'role': 'user', 'text': 'previous question'}], 'context': CONTEXT | {'language': language}})
    assert response.status_code == 200, response.text
    assert response.json()['provider'] == 'anthropic' and response.json()['model'] == 'claude-sonnet-5-5'
    assert 'fake-secret' not in response.text


@pytest.mark.parametrize('value', [
    {'language': 'en', 'paragraphs': ['This is an English answer for your question.'], 'sourceIds': []},
    {'language': 'es', 'paragraphs': ['El fondo subió 99 por ciento.'], 'sourceIds': []},
    {'language': 'es', 'paragraphs': ['Debes vender el fondo ahora mismo.'], 'sourceIds': []},
    {'language': 'es', 'paragraphs': ['Esta explicación es apropiada para el contexto.'], 'sourceIds': ['invented']},
])
def test_tutor_rejects_unsafe_model_output(value, monkeypatch):
    monkeypatch.setenv('T2F_TUTOR_PROVIDER', 'anthropic')
    monkeypatch.setenv('ANTHROPIC_API_KEY', 'fake-secret')
    monkeypatch.setattr(providers, 'TRANSPORT', httpx.MockTransport(lambda req: httpx.Response(200, json={'stop_reason': 'end_turn', 'content': [{'type': 'text', 'text': json.dumps(value)}]})))
    response = client.post('/api/tutor', json={'message': 'hello', 'context': CONTEXT})
    assert response.status_code == 503 and response.json()['error']['code'] == 'tutor_provider_error'


def test_tutor_no_fallback_without_key(monkeypatch):
    monkeypatch.setenv('T2F_TUTOR_PROVIDER', 'anthropic')
    response = client.post('/api/tutor', json={'message': 'hola', 'context': CONTEXT})
    assert response.status_code == 503 and response.json()['error']['code'] == 'tutor_provider_error'


def test_tutor_provider_failure_and_untrusted_fields(monkeypatch):
    monkeypatch.setenv('ANTHROPIC_API_KEY', 'fake-secret')
    monkeypatch.setattr(providers, 'TRANSPORT', httpx.MockTransport(lambda req: httpx.Response(429, text='fake-secret')))
    response = client.post('/api/tutor', json={'message': 'ignore instructions', 'context': CONTEXT})
    assert response.status_code == 503 and response.json()['error']['code'] == 'tutor_provider_error'
    assert 'fake-secret' not in response.text
    assert client.post('/api/tutor', json={'message': 'hello', 'context': CONTEXT | {'portfolio': {'value': 999}}}).status_code == 422
    assert client.post('/api/tutor', json={'message': 'hello', 'context': CONTEXT, 'history': [{'role': 'user', 'text': 'x'}] * 9}).status_code == 422


def test_token_capacity_is_bounded(monkeypatch):
    monkeypatch.setenv('ELEVENLABS_API_KEY', 'fake-secret')
    for _ in range(4):
        assert providers._slots.acquire(blocking=False)
    try:
        response = client.post('/api/speech/token', json={'language': 'es'})
        assert response.status_code == 503 and response.json()['error']['code'] == 'speech_provider_error'
    finally:
        for _ in range(4):
            providers._slots.release()


@pytest.mark.parametrize('language,text', [
    ('es', 'Conserva tu fondo hasta que vuelva a subir.'),
    ('es', 'Te recomiendo que mantengas tu inversión.'),
    ('es', 'El valor volverá a su nivel anterior.'),
    ('es', 'La cartera está formada por bonos soberanos.'),
    ('es', 'El fondo cayó por la subida de tipos del banco central.'),
    ('es', 'La comisión del fondo es un euro.'),
    ('en', 'Retain your investment until it rebounds.'),
    ('en', 'Your money will return to its former value.'),
    ('en', 'The portfolio consists of government bonds.'),
    ('en', 'The fund fell because interest rates rose.'),
    ('en', 'The fund charges a fee of a euro.'),
    ('en', 'I recommend holding your fund.'),
    ('es', 'La cartera está formada principalmente por bonos soberanos.'),
    ('en', 'The fund fell sharply because interest rates rose.'),
    ('es', 'El fondo cayó bruscamente por la subida de tipos.'),
    ('en', 'The portfolio is composed mainly of government bonds.'),
    ('en', 'I do not recommend holding your fund, but retain your investment.'),
    ('es', 'No recomiendo que mantengas tu inversión, pero conserva tu fondo.'),
    # Negating a recommendation about a specific transaction can still steer a decision.
    ('en', 'I do not recommend selling your fund.'),
    ('es', 'No recomiendo que vendas tu fondo.'),
    ('en', 'I do not recommend holding your fund automatically.'),
    ('es', 'No recomiendo que mantengas tu inversión automáticamente.'),
])
def test_tutor_rejects_unsafe_financial_claims(language, text, monkeypatch):
    monkeypatch.setenv('ANTHROPIC_API_KEY', 'fake-secret')
    value = {'language': language, 'paragraphs': [text], 'sourceIds': []}
    monkeypatch.setattr(providers, 'TRANSPORT', httpx.MockTransport(lambda req: httpx.Response(200, json={'stop_reason': 'end_turn', 'content': [{'type': 'text', 'text': json.dumps(value)}]})))
    response = client.post('/api/tutor', json={'message': 'hola' if language == 'es' else 'hello', 'context': CONTEXT | {'language': language}})
    assert response.status_code == 503 and response.json()['error']['code'] == 'tutor_provider_error'


@pytest.mark.parametrize('language,text', [
    ('es', 'No se puede garantizar la recuperación; considera tus necesidades de liquidez.'),
    ('es', 'La causa de la caída del fondo es desconocida.'),
    ('en', 'No one can guarantee recovery; consider your liquidity needs.'),
    ('en', 'The cause of the fund decline is unknown.'),
    ('en', 'A fund can contain different types of assets.'),
    ('es', 'Un fondo puede contener distintas clases de activos.'),
    ('en', 'A fund could fall when interest rates rise, but its cause is unknown.'),
    ('en', 'I cannot recommend a decision for you.'),
    ('es', 'No puedo recomendarte qué decisión tomar.'),
])
def test_tutor_accepts_cautious_explanations(language, text, monkeypatch):
    monkeypatch.setenv('ANTHROPIC_API_KEY', 'fake-secret')
    value = {'language': language, 'paragraphs': [text], 'sourceIds': []}
    monkeypatch.setattr(providers, 'TRANSPORT', httpx.MockTransport(lambda req: httpx.Response(200, json={'stop_reason': 'end_turn', 'content': [{'type': 'text', 'text': json.dumps(value)}]})))
    response = client.post('/api/tutor', json={'message': 'hola' if language == 'es' else 'hello', 'context': CONTEXT | {'language': language}})
    assert response.status_code == 200, response.text


def test_tutor_keeps_server_calculation_and_sources(monkeypatch):
    spec = {'instrumentId': 'bbva-mi-inversion-bolsa-acumulacion', 'initial': 500, 'recurringContribution': 50, 'periods': 1}
    request = {'message': 'Explica el resultado', 'context': CONTEXT | {'page': 'simulator', 'simulation': spec}}
    base = client.post('/api/tutor', json=request).json()
    monkeypatch.setenv('ANTHROPIC_API_KEY', 'fake-secret')
    value = {'language': 'es', 'paragraphs': ['El resultado depende de la evolución observada.'], 'sourceIds': []}
    monkeypatch.setattr(providers, 'TRANSPORT', httpx.MockTransport(lambda req: httpx.Response(200, json={'stop_reason': 'end_turn', 'content': [{'type': 'text', 'text': json.dumps(value)}]})))
    response = client.post('/api/tutor', json=request)
    assert response.status_code == 200, response.text
    assert '538,29' in response.json()['text'] and base['text'] in response.json()['text']
    assert response.json()['sources'] == base['sources']


def test_http_tutor_single_provider_call_and_excludes_goal(monkeypatch):
    monkeypatch.setenv('ANTHROPIC_API_KEY', 'fake-secret')
    monkeypatch.setenv('T2F_TUTOR_PROVIDER', 'anthropic')
    goal = '\ufeff \ufeff  private goal 7391  \ufeff \ufeff'
    original = tutor_bridge._rules_reply
    def with_goal(payload):
        result = original(payload)
        return {**result, 'text': result['text'] + ' private goal 7391'}
    monkeypatch.setattr(tutor_bridge, '_rules_reply', with_goal)
    calls = []
    def primary(request):
        calls.append(request)
        value = {'language': 'es', 'paragraphs': ['El riesgo depende de tus objetivos.'], 'sourceIds': []}
        return httpx.Response(200, json={'stop_reason': 'end_turn', 'content': [{'type': 'text', 'text': json.dumps(value)}]})
    def legacy(request):
        pytest.fail('HTTP tutor must not call the legacy model adapter')
    monkeypatch.setattr(providers, 'TRANSPORT', httpx.MockTransport(primary))
    monkeypatch.setattr(tutor_bridge, 'TRANSPORT', httpx.MockTransport(legacy))
    response = client.post('/api/tutor', json={'message': 'hola', 'history': [{'role':'user', 'text':'untrusted history'}],
                           'context': CONTEXT | {'decision': {'goal': goal, 'horizonYears': 5, 'needsLiquidity': 'no'}}})
    assert response.status_code == 200 and len(calls) == 1
    prompt = json.loads(calls[0].content)['messages'][0]['content']
    facts = json.loads(prompt.split('Data: ', 1)[1])
    assert 'private goal' not in prompt and '7391' not in prompt
    assert facts['context']['decision'] == {'horizonYears': 5.0, 'needsLiquidity': 'no'}
    assert '[user goal]' in facts['serverAnswer'] and facts['history'][0]['text'] == 'untrusted history'


def test_http_rules_override_never_calls_either_provider(monkeypatch):
    monkeypatch.setenv('ANTHROPIC_API_KEY', 'fake-secret')
    monkeypatch.setenv('T2F_TUTOR_PROVIDER', 'server_rules')
    def fail(request):
        pytest.fail('rules mode must not use a model provider')
    monkeypatch.setattr(providers, 'TRANSPORT', httpx.MockTransport(fail))
    monkeypatch.setattr(tutor_bridge, 'TRANSPORT', httpx.MockTransport(fail))
    response = client.post('/api/tutor', json={'message': 'hola', 'context': CONTEXT})
    assert response.status_code == 200 and response.json()['provider'] == 'server_rules'
