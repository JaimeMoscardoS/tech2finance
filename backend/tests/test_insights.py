import json

import httpx
from fastapi.testclient import TestClient

from backend.app import app

client = TestClient(app, raise_server_exceptions=False)
FACTS = {'dataKind': 'historical_nav', 'months': 72, 'valueEur': 27500.0, 'contributedEur': 25000.0, 'resultPct': 10.0,
         'volatilityPct': 4.1, 'goalProgressPct': 68.7, 'planExpectedPct': 60.0, 'weights': [{'name': 'Fondo bolsa', 'weightPct': 25.0}]}
REQ = {'kind': 'how', 'page': 'home', 'level': 'beginner', 'language': 'es', 'facts': FACTS}


def test_insight_without_model_is_unavailable(monkeypatch):
    monkeypatch.setenv('T2F_ANALYSIS_PROVIDER', 'demo')
    response = client.post('/api/insights', json=REQ)
    assert response.status_code == 503
    assert response.json()['error']['code'] == 'insight_unavailable'
    assert client.post('/api/insights', json=REQ | {'kind': 'order'}).status_code == 422
    assert client.post('/api/insights', json=REQ | {'facts': FACTS | {'extra': 1}}).status_code == 422


def test_insight_with_model_and_rejected_output(monkeypatch):
    from backend import decline_explanations as module
    monkeypatch.setenv('T2F_ANALYSIS_PROVIDER', 'anthropic')
    monkeypatch.setenv('ANTHROPIC_API_KEY', 'test-key')

    def fake(request):
        body = json.loads(request.content)
        assert body['model'] == 'claude-sonnet-5-5' and 'Fondo bolsa' in body['messages'][0]['content']
        out = {'summary': 'La cartera de ejemplo avanza algo por delante del ritmo lineal del plan.',
               'points': ['Las subidas y bajadas son normales en un plazo largo.', 'Lo pasado no predice lo que ocurrirá.']}
        return httpx.Response(200, json={'content': [{'type': 'text', 'text': json.dumps(out)}], 'stop_reason': 'end_turn'})
    monkeypatch.setattr(module, 'TRANSPORT', httpx.MockTransport(fake))
    response = client.post('/api/insights', json=REQ)
    assert response.status_code == 200
    assert response.json()['mode'] == 'ai' and len(response.json()['points']) == 2

    def bad(request):
        out = {'summary': 'Debes vender ahora mismo tus fondos.', 'points': ['Ganarás un diez por ciento.']}
        return httpx.Response(200, json={'content': [{'type': 'text', 'text': json.dumps(out)}], 'stop_reason': 'end_turn'})
    monkeypatch.setattr(module, 'TRANSPORT', httpx.MockTransport(bad))
    assert client.post('/api/insights', json=REQ).status_code == 503
