import json

import httpx
import pytest
from fastapi.testclient import TestClient

from backend.app import app
from backend import speech_playback as playback
from backend.speech_text import normalize_speech


@pytest.fixture(autouse=True)
def settings(monkeypatch):
    monkeypatch.setenv('ELEVENLABS_API_KEY', 'test-secret')
    monkeypatch.setenv('T2F_TTS_PROVIDER', 'elevenlabs')
    monkeypatch.delenv('ELEVENLABS_VOICE_ID_ES', raising=False)
    monkeypatch.delenv('ELEVENLABS_VOICE_ID_EN', raising=False)
    monkeypatch.delenv('ELEVENLABS_TTS_MODEL', raising=False)
    playback._requests.clear()


@pytest.mark.parametrize(('language', 'voice'), [('es', 'Nh2zY9kknu6z4pZy6FhD'), ('en', 'WQP7cQUF5aAS6Axh5yaa')])
def test_voice_and_payload(monkeypatch, language, voice):
    def vendor(request):
        assert request.url.path.endswith('/' + voice)
        assert request.url.params['output_format'] == 'mp3_44100_128'
        assert json.loads(request.content) == {'text': 'hello', 'model_id': 'eleven_flash_v2_5', 'language_code': language, 'voice_settings': {'stability': 0.55, 'similarity_boost': 0.75}}
        return httpx.Response(200, content=b'ID3audio', headers={'content-type': 'audio/mpeg'})
    monkeypatch.setattr(playback, 'TRANSPORT', httpx.MockTransport(vendor))
    response = TestClient(app).post('/api/speech/synthesize', json={'text': 'hello', 'language': language})
    assert response.status_code == 200
    assert response.content == b'ID3audio'
    assert response.headers['cache-control'] == 'no-store'
    assert 'test-secret' not in str(response.headers)


def test_multilingual_override_and_invalid_extra(monkeypatch):
    monkeypatch.setenv('ELEVENLABS_TTS_MODEL', 'eleven_multilingual_v2')
    monkeypatch.setenv('ELEVENLABS_VOICE_ID_ES', 'custom-voice')
    def vendor(request):
        assert request.url.path.endswith('/custom-voice')
        assert 'language_code' not in json.loads(request.content)
        return httpx.Response(200, content=b'ID3audio', headers={'content-type': 'application/octet-stream'})
    monkeypatch.setattr(playback, 'TRANSPORT', httpx.MockTransport(vendor))
    client = TestClient(app)
    assert client.post('/api/speech/synthesize', json={'text': 'hola', 'language': 'es'}).status_code == 200
    for body in ({'text': 'hola', 'language': 'es', 'voice_id': 'bad'}, {'text': 'a' * 3001, 'language': 'es'}, {'text': '  ', 'language': 'es'}):
        response = client.post('/api/speech/synthesize', json=body)
        assert response.status_code == 422
        assert response.headers['cache-control'] == 'no-store'


def test_errors_do_not_leak_and_limit(monkeypatch):
    client = TestClient(app)
    monkeypatch.setattr(playback, 'TRANSPORT', httpx.MockTransport(lambda request: httpx.Response(200, text='test-secret', headers={'content-type': 'application/json'})))
    response = client.post('/api/speech/synthesize', json={'text': 'hola', 'language': 'es'})
    assert response.status_code == 503 and 'test-secret' not in response.text
    monkeypatch.setenv('ELEVENLABS_VOICE_ID_ES', '../bad')
    assert client.post('/api/speech/synthesize', json={'text': 'hola', 'language': 'es'}).status_code == 503
    monkeypatch.setenv('ELEVENLABS_VOICE_ID_ES', 'valid')
    playback._requests.extend([playback.time.monotonic()] * 30)
    assert client.post('/api/speech/synthesize', json={'text': 'hola', 'language': 'es'}).status_code == 429


def test_oversized_and_timeout(monkeypatch):
    client = TestClient(app)
    monkeypatch.setattr(playback, 'TRANSPORT', httpx.MockTransport(lambda request: httpx.Response(200, content=b'ID3' + b'x' * (2 * 1024 * 1024), headers={'content-type': 'audio/mpeg'})))
    assert client.post('/api/speech/synthesize', json={'text': 'hola', 'language': 'es'}).status_code == 503
    def timeout(request):
        raise httpx.ReadTimeout('test-secret')
    monkeypatch.setattr(playback, 'TRANSPORT', httpx.MockTransport(timeout))
    response = client.post('/api/speech/synthesize', json={'text': 'hola', 'language': 'es'})
    assert response.status_code == 503 and 'test-secret' not in response.text


@pytest.mark.parametrize(('language', 'source', 'expected'), [
    ('es', '25000 EUR; 28175.75 EUR; 3175.75 EUR; 12.7 %; 2019-12-31.', 'veinticinco mil euros; veintiocho mil ciento setenta y cinco euros con setenta y cinco céntimos; tres mil ciento setenta y cinco euros con setenta y cinco céntimos; doce coma siete por ciento; treinta y uno de diciembre de dos mil diecinueve.'),
    ('en', '25,000 EUR; 28,175.75 EUR; -3,175.01 EUR; 12.70%; 2019-12-31.', 'twenty five thousand euros; twenty eight thousand one hundred seventy five euros and seventy five cents; minus three thousand one hundred seventy five euros and one cent; twelve point seven zero percent; December thirty one, two thousand nineteen.'),
    ('es', '1.234,01 €; 21 EUR; 0,02 EUR; -0,5%; Fondo bolsa 2, estrategia 0-50.', 'mil doscientos treinta y cuatro euros con un céntimo; veintiún euros; cero euros con dos céntimos; menos cero coma cinco por ciento; Fondo bolsa 2, estrategia 0-50.'),
    ('es', '28 175,75 EUR', 'veintiocho mil ciento setenta y cinco euros con setenta y cinco céntimos'),
    ('en', '28\u202f175.75 EUR', 'twenty eight thousand one hundred seventy five euros and seventy five cents'),
])
def test_financial_speech_payload_is_normalized_without_changing_request(monkeypatch, language, source, expected):
    submitted = {'text': source, 'language': language}
    def vendor(request):
        assert json.loads(request.content)['text'] == expected
        return httpx.Response(200, content=b'ID3audio', headers={'content-type': 'audio/mpeg'})
    monkeypatch.setattr(playback, 'TRANSPORT', httpx.MockTransport(vendor))
    response = TestClient(app).post('/api/speech/synthesize', json=submitted)
    assert response.status_code == 200
    assert submitted['text'] == source


def test_unsupported_precision_and_invalid_dates_are_not_reinterpreted():
    assert normalize_speech('0.123 EUR, 2020-02-30', 'en') == '0.123 euros, 2020-02-30'
