import httpx
import pytest
from fastapi.testclient import TestClient

from backend import providers, voice_tts
from backend.app import app

client = TestClient(app, raise_server_exceptions=False)
KEY = 'sk_test_SECRET_KEY_123'
AUDIO = b'ID3\x04fakemp3bytes'


@pytest.fixture(autouse=True)
def reset_rate_limit():
    providers._token_requests.clear()
    yield
    providers._token_requests.clear()


class Calls(list):
    pass


@pytest.fixture
def calls(monkeypatch):
    seen = Calls()
    seen.handler = lambda request: httpx.Response(200, content=AUDIO, headers={'content-type': 'audio/mpeg'})

    def transport(request):
        seen.append(request)
        return seen.handler(request)
    monkeypatch.setattr(voice_tts, 'TRANSPORT', httpx.MockTransport(transport))
    monkeypatch.setenv('T2F_SPEECH_PROVIDER', 'elevenlabs')
    monkeypatch.setenv('ELEVENLABS_API_KEY', KEY)
    return seen


def post(text='Hola mundo'):
    return client.post('/api/tts', json={'text': text})


def assert_no_key(response):
    assert KEY.encode() not in response.content
    assert KEY not in str(response.headers)


def test_disabled_by_default(monkeypatch):
    monkeypatch.delenv('T2F_SPEECH_PROVIDER', raising=False)
    monkeypatch.delenv('ELEVENLABS_API_KEY', raising=False)
    called = []
    monkeypatch.setattr(voice_tts, 'TRANSPORT', httpx.MockTransport(lambda r: called.append(r)))
    response = post()
    assert response.status_code == 503 and response.json()['error']['code'] == 'tts_disabled'
    assert not called
    assert client.get('/api/health').json()['speechProvider'] == 'browser_local'


def test_enabled_by_key_without_variable(calls, monkeypatch):
    monkeypatch.delenv('T2F_SPEECH_PROVIDER')
    assert post().status_code == 200
    assert client.get('/api/health').json()['speechProvider'] == 'elevenlabs'


def test_browser_local_is_disabled(calls, monkeypatch):
    monkeypatch.setenv('T2F_SPEECH_PROVIDER', 'browser_local')
    response = post()
    assert response.status_code == 503 and response.json()['error']['code'] == 'tts_disabled'
    assert not calls


def test_rate_limited(calls):
    for _ in range(30):
        assert post().status_code == 200
    response = post()
    assert response.status_code == 429 and response.json()['error']['code'] == 'speech_rate_limited'
    assert len(calls) == 30


def test_success_and_outgoing_request(calls, monkeypatch):
    response = post()
    assert response.status_code == 200
    assert response.headers['content-type'] == 'audio/mpeg'
    assert response.headers['cache-control'] == 'no-store'
    assert response.content == AUDIO
    assert_no_key(response)
    request = calls[0]
    assert request.headers['xi-api-key'] == KEY
    assert '/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL' in str(request.url)
    assert b'"model_id":"eleven_multilingual_v2"' in request.content.replace(b' ', b'')
    monkeypatch.setenv('T2F_ELEVENLABS_VOICE_ID', 'CustomVoice12345')
    monkeypatch.setenv('T2F_ELEVENLABS_MODEL_ID', 'eleven_turbo_v2_5')
    assert post().status_code == 200
    assert '/v1/text-to-speech/CustomVoice12345' in str(calls[1].url)
    assert b'eleven_turbo_v2_5' in calls[1].content


def test_health_reflects_provider(calls):
    body = client.get('/api/health').json()
    assert body['speechProvider'] == 'elevenlabs' and body['externalProviders'] is True


@pytest.mark.parametrize('text', ['', '   ', 'a' * 1501])
def test_invalid_text(calls, text):
    assert post(text).status_code == 422
    assert not calls


def test_configuration_errors(calls, monkeypatch):
    monkeypatch.setenv('T2F_ELEVENLABS_VOICE_ID', '../bad')
    response = post()
    assert response.status_code == 503 and response.json()['error']['code'] == 'tts_configuration_error'
    monkeypatch.delenv('T2F_ELEVENLABS_VOICE_ID')
    monkeypatch.delenv('ELEVENLABS_API_KEY')
    response = post()
    assert response.status_code == 503 and response.json()['error']['code'] == 'tts_configuration_error'
    assert not calls


@pytest.mark.parametrize('handler', [
    lambda r: httpx.Response(401, json={'detail': KEY}),
    lambda r: httpx.Response(500, text=KEY),
    lambda r: httpx.Response(200, content=AUDIO, headers={'content-type': 'application/json'}),
    lambda r: httpx.Response(200, content=b'', headers={'content-type': 'audio/mpeg'}),
    lambda r: httpx.Response(200, content=b'x' * (voice_tts.MAX_AUDIO_BYTES + 1), headers={'content-type': 'audio/mpeg'}),
])
def test_provider_failures(calls, handler):
    calls.handler = handler
    response = post()
    assert response.status_code == 503 and response.json()['error']['code'] == 'tts_provider_error'
    assert_no_key(response)


def test_redirect_not_followed(calls):
    calls.handler = lambda r: httpx.Response(302, headers={'location': 'https://evil.example/x'})
    response = post()
    assert response.status_code == 503 and response.json()['error']['code'] == 'tts_provider_error'
    assert len(calls) == 1


def test_timeout(calls):
    def boom(request):
        raise httpx.ReadTimeout('slow')
    calls.handler = boom
    response = post()
    assert response.status_code == 503 and response.json()['error']['code'] == 'tts_provider_error'
    assert_no_key(response)


def test_rejects_missing_content_type(calls):
    response = client.post('/api/tts', content=b'{"text":"hola"}')
    assert response.status_code == 403 and response.json()['error']['code'] == 'forbidden_origin'
    assert not calls


@pytest.mark.parametrize('headers', [{'origin': 'https://attacker.example'}, {'sec-fetch-site': 'cross-site'}])
def test_rejects_cross_origin(calls, headers):
    response = client.post('/api/tts', json={'text': 'hola'}, headers=headers)
    assert response.status_code == 403 and response.json()['error']['code'] == 'forbidden_origin'
    assert not calls


def test_allowed_origin_and_nosniff(calls):
    response = client.post('/api/tts', json={'text': 'hola'}, headers={'origin': 'http://localhost:5173'})
    assert response.status_code == 200
    assert response.headers['x-content-type-options'] == 'nosniff'


def test_busy_slots(calls):
    assert voice_tts._slots.acquire(blocking=False) and voice_tts._slots.acquire(blocking=False)
    try:
        response = post()
        assert response.status_code == 503 and response.json()['error']['code'] == 'tts_provider_error'
        assert not calls
    finally:
        voice_tts._slots.release()
        voice_tts._slots.release()


def test_key_not_logged_on_failure(calls, caplog):
    calls.handler = lambda r: httpx.Response(500, text=KEY)
    with caplog.at_level('DEBUG'):
        assert post().status_code == 503
    assert KEY not in caplog.text
