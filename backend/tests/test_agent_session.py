import json

import httpx
from fastapi.testclient import TestClient

from backend import agent_session
from backend.app import app


def test_session_reconstructs_context_and_uses_private_auth(monkeypatch):
    monkeypatch.setenv('ELEVENLABS_API_KEY', 'private-key')
    monkeypatch.setenv('ELEVENLABS_AGENT_ID', 'agent_example')
    monkeypatch.setenv('T2F_CONVERSATION_PROVIDER', 'elevenlabs')
    agent_session._requests.clear()
    def handler(request):
        assert request.headers['xi-api-key'] == 'private-key'
        assert request.url.params['include_conversation_id'] == 'true'
        return httpx.Response(200, json={'signed_url': 'wss://api.elevenlabs.io/v1/convai/conversation?signature=temporary'})
    monkeypatch.setattr(agent_session, 'TRANSPORT', httpx.MockTransport(handler))
    client = TestClient(app)
    response = client.post('/api/agent/session', headers={'Origin': 'http://localhost:5173'}, json={'context': {'page': 'home', 'level': 'beginner', 'language': 'es'}, 'textOnly': True})
    assert response.status_code == 200
    assert response.headers['cache-control'] == 'no-store'
    data = response.json()
    assert 'private-key' not in response.text
    assert data['overrides']['conversation']['textOnly'] is True
    assert json.loads(data['dynamicVariables']['portfolio_facts'])['portfolio']['holdingsKind'] == 'fictional_demo'
    assert client.post('/api/agent/session', headers={'Origin': 'http://evil.example'}, json={'context': {'page': 'home', 'level': 'beginner', 'language': 'es'}}).status_code == 403
    assert client.post('/api/agent/session', json={'context': {'page': 'home', 'level': 'beginner', 'language': 'es', 'portfolio': {'value': 100}}}).status_code == 422


def test_provider_failure_is_sanitized_and_not_cached(monkeypatch):
    monkeypatch.setenv('ELEVENLABS_API_KEY', 'private-key')
    monkeypatch.setenv('ELEVENLABS_AGENT_ID', 'agent_example')
    agent_session._requests.clear()
    monkeypatch.setattr(agent_session, 'TRANSPORT', httpx.MockTransport(lambda request: httpx.Response(500, text='private-provider-body')))
    response = TestClient(app).post('/api/agent/session', json={'context': {'page': 'learn', 'level': 'advanced', 'language': 'en'}})
    assert response.status_code == 503
    assert response.headers['cache-control'] == 'no-store'
    assert 'private-provider-body' not in response.text
    monkeypatch.setattr(agent_session, 'TRANSPORT', httpx.MockTransport(lambda request: httpx.Response(200, json={'signed_url': 123})))
    assert TestClient(app).post('/api/agent/session', json={'context': {'page': 'learn', 'level': 'advanced', 'language': 'en'}}).status_code == 503


def test_configuration_and_rate_limit(monkeypatch):
    monkeypatch.delenv('ELEVENLABS_AGENT_ID', raising=False)
    monkeypatch.setenv('T2F_CONVERSATION_PROVIDER', 'elevenlabs')
    client = TestClient(app)
    body = {'context': {'page': 'learn', 'level': 'intermediate', 'language': 'en'}}
    assert client.get('/api/health').json()['conversationProvider'] == 'elevenlabs'
    assert client.get('/api/health').json()['agentConfigured'] is False
    assert client.post('/api/agent/session', json=body).status_code == 503
    monkeypatch.setenv('ELEVENLABS_API_KEY', 'private-key')
    monkeypatch.setenv('ELEVENLABS_AGENT_ID', 'agent_example')
    monkeypatch.setenv('T2F_CONVERSATION_PROVIDER', 'elevenlabs')
    agent_session._requests.clear()
    monkeypatch.setattr(agent_session, 'TRANSPORT', httpx.MockTransport(lambda request: httpx.Response(200, json={'signed_url': 'wss://api.elevenlabs.io/v1/convai/conversation?signature=temporary'})))
    for _ in range(30):
        assert client.post('/api/agent/session', json=body).status_code == 200
    assert client.post('/api/agent/session', json=body).status_code == 429
    agent_session._requests.clear()
