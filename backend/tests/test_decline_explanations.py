import pytest
from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app, raise_server_exceptions=False)
SPEC = {'decline': {'basis': 'portfolio_demo', 'language': 'es'}, 'level': 'beginner'}

def test_detailed_demo_is_server_owned(monkeypatch):
    monkeypatch.setenv('T2F_ANALYSIS_PROVIDER', 'demo')
    response = client.post('/api/decline-explanations', json=SPEC)
    assert response.status_code == 200
    body = response.json()
    assert body['mode'] == 'demo' and body['provider'] == 'local_rules'
    assert [s['id'] for s in body['sections']] == ['observed', 'context', 'mechanism', 'portfolio', 'decision', 'uncertainty']
    assert client.post('/api/decline-explanations', json=SPEC | {'report': {}}).status_code == 422
    assert client.post('/api/decline-explanations', json=SPEC | {'decline': SPEC['decline'] | {'sources': []}}).status_code == 422

def test_missing_provider_configuration_is_not_demo(monkeypatch):
    monkeypatch.setenv('T2F_ANALYSIS_PROVIDER', 'anthropic')
    monkeypatch.delenv('ANTHROPIC_API_KEY', raising=False)
    response = client.post('/api/decline-explanations', json=SPEC)
    assert response.status_code == 503
    assert response.json()['error']['code'] == 'analysis_configuration_error'

def test_anthropic_success_and_rejected_output(monkeypatch):
    import json
    import httpx
    from backend import decline_explanations as module
    monkeypatch.setenv('T2F_ANALYSIS_PROVIDER', 'anthropic')
    monkeypatch.setenv('ANTHROPIC_API_KEY', 'test-key')
    def fake(request):
        assert request.url.host == 'api.anthropic.com'
        body = json.loads(request.content)
        assert body['model'] == 'claude-sonnet-5-5'
        prompt = body['messages'][0]['content']
        assert 'ESMA' in prompt and 'ECB' in prompt and 'advanced' in prompt and 'yes' in prompt
        piece = {'paragraphs':['Las expectativas influyen en las valoraciones.', 'La evolución pasada no garantiza una recuperación futura.'], 'sourceIds':[]}
        narration = {'summary':'El periodo muestra una variación que requiere contexto.', 'context':piece, 'mechanism':piece, 'portfolio':piece}
        return httpx.Response(200, json={'content':[{'type':'thinking','thinking':'private reasoning','signature':'opaque'}, {'type':'text','text':json.dumps(narration)}], 'stop_reason':'end_turn'})
    monkeypatch.setattr(module, 'TRANSPORT', httpx.MockTransport(fake))
    historical = {'decline':{'basis':'instrument', 'instrumentId':'bbva-mi-inversion-bolsa-acumulacion', 'periods':3, 'language':'es'}, 'level':'advanced', 'decision':{'needsLiquidity':'yes'}}
    response = client.post('/api/decline-explanations', json=historical)
    assert response.status_code == 200
    assert 'private reasoning' not in response.text
    assert response.json()['mode'] == 'ai' and response.json()['provider'] == 'anthropic'
    assert all('Las expectativas influyen' in ' '.join(s['paragraphs']) for s in response.json()['sections'][1:4])
    def bad(request):
        piece = {'paragraphs':['Las expectativas influyen en las valoraciones.', 'El fondo se recuperará en 99 días.'], 'sourceIds':[]}
        narration = {'summary':'El periodo muestra una variación que requiere contexto.', 'context':piece, 'mechanism':piece, 'portfolio':piece}
        return httpx.Response(200, json={'content':[{'type':'text','text':json.dumps(narration)}], 'stop_reason':'end_turn'})
    monkeypatch.setattr(module, 'TRANSPORT', httpx.MockTransport(bad))
    assert client.post('/api/decline-explanations', json=SPEC).status_code == 503

@pytest.mark.parametrize('case', ['auth', 'rate', 'timeout', 'malformed', 'unknown_source'])
def test_provider_failures_are_sanitized_without_fallback(monkeypatch, case):
    import json
    import httpx
    from backend import decline_explanations as module
    monkeypatch.setenv('T2F_ANALYSIS_PROVIDER', 'anthropic')
    monkeypatch.setenv('ANTHROPIC_API_KEY', 'do-not-echo')
    def fake(request):
        if case == 'timeout':
            raise httpx.ReadTimeout('secret')
        if case in ('auth', 'rate'):
            return httpx.Response(401 if case == 'auth' else 429, text='do-not-echo')
        section = {'paragraphs':['A plausible explanation without numeric values.', 'A second qualifying explanation without numbers.'], 'sourceIds':['made-up']}
        narration = {'summary':'A possible explanation of the observed change.', 'context':section, 'mechanism':section, 'portfolio':section}
        text = 'not json' if case == 'malformed' else json.dumps(narration)
        return httpx.Response(200, json={'content':[{'type':'text','text':text}], 'stop_reason':'end_turn'})
    monkeypatch.setattr(module, 'TRANSPORT', httpx.MockTransport(fake))
    response = client.post('/api/decline-explanations', json=SPEC)
    assert response.status_code == 503
    assert response.json()['error']['code'] == 'analysis_provider_error'
    assert 'do-not-echo' not in response.text

def test_primary_context_is_scoped_to_period(monkeypatch):
    monkeypatch.setenv('T2F_ANALYSIS_PROVIDER', 'demo')
    spec = {'basis':'instrument', 'instrumentId':'bbva-mi-inversion-bolsa-acumulacion', 'periods':3, 'language':'es'}
    data = client.post('/api/decline-explanations', json={'decline':spec,'level':'advanced'}).json()
    assert any('esma.europa.eu' in s['url'] for s in data['sources'])
    assert any('ecb.europa.eu' in s['url'] for s in data['sources'])
    data = client.post('/api/decline-explanations', json={'decline':spec | {'periods':2},'level':'advanced'}).json()
    assert not any('esma.europa.eu' in s['url'] or 'ecb.europa.eu' in s['url'] for s in data['sources'])

def test_provider_health_and_configuration(monkeypatch):
    monkeypatch.setenv('T2F_ANALYSIS_PROVIDER', 'anthropic')
    assert client.get('/api/health').json()['externalProviders'] is True
    monkeypatch.setenv('T2F_ANTHROPIC_MODEL', 'claude-opus-5')
    monkeypatch.setenv('ANTHROPIC_API_KEY', 'test')
    assert client.post('/api/decline-explanations', json=SPEC).json()['error']['code'] == 'analysis_configuration_error'

@pytest.mark.parametrize('unsafe', ['Se garantiza una recuperación futura.', 'Debes vender las participaciones ahora.', 'You should hold the fund because recovery is certain.', 'The pandemic caused this fund decline.', 'The fund invests mainly in technology stocks.', 'The decline was twenty percent.', 'La caída fue del veinte por ciento.', 'La pandemia causó la caída de este fondo.', 'El fondo invierte principalmente en acciones tecnológicas.', 'Te recomiendo mantener el fondo.', 'The fund will recover.', 'There is no reason to worry, you should hold the fund.', 'No hay motivo de alarma: te aconsejo mantener el fondo.', 'No vendas el fondo ahora mismo.', 'There is no guarantee, but the fund will recover.', 'No conocemos la causa y el fondo se recuperará.'])
def test_provider_rejects_positive_guarantee_or_order(monkeypatch, unsafe):
    import json
    import httpx
    from backend import decline_explanations as module
    monkeypatch.setenv('T2F_ANALYSIS_PROVIDER', 'anthropic')
    monkeypatch.setenv('ANTHROPIC_API_KEY', 'test-key')
    section = {'paragraphs':['Las expectativas influyen en las valoraciones.', unsafe], 'sourceIds':[]}
    narration = {'summary':'El periodo muestra una variación que requiere contexto.', 'context':section, 'mechanism':section, 'portfolio':section}
    monkeypatch.setattr(module, 'TRANSPORT', httpx.MockTransport(lambda request: httpx.Response(200, json={'content':[{'type':'text','text':json.dumps(narration)}], 'stop_reason':'end_turn'})))
    assert client.post('/api/decline-explanations', json=SPEC).status_code == 503

def test_provider_malformed_block_is_sanitized(monkeypatch):
    import httpx
    from backend import decline_explanations as module
    monkeypatch.setenv('T2F_ANALYSIS_PROVIDER', 'anthropic')
    monkeypatch.setenv('ANTHROPIC_API_KEY', 'test-key')
    monkeypatch.setattr(module, 'TRANSPORT', httpx.MockTransport(lambda request: httpx.Response(200, json={'content':[123], 'stop_reason':'end_turn'})))
    response = client.post('/api/decline-explanations', json=SPEC)
    assert response.status_code == 503
    assert response.json()['error']['code'] == 'analysis_provider_error'

def test_provider_response_limit_during_stream(monkeypatch):
    import httpx
    from backend import decline_explanations as module
    monkeypatch.setenv('T2F_ANALYSIS_PROVIDER', 'anthropic')
    monkeypatch.setenv('ANTHROPIC_API_KEY', 'test-key')
    consumed = []
    class LargeStream(httpx.AsyncByteStream):
        async def __aiter__(self):
            for number in range(3):
                consumed.append(number)
                yield b'x' * 40000
    monkeypatch.setattr(module, 'TRANSPORT', httpx.MockTransport(lambda request: httpx.Response(200, stream=LargeStream())))
    response = client.post('/api/decline-explanations', json=SPEC)
    assert response.status_code == 503
    assert response.json()['error']['code'] == 'analysis_provider_error'
    assert consumed == [0, 1]

def test_provider_total_deadline_cancels_a_slow_stream(monkeypatch):
    import asyncio
    import httpx
    from backend import decline_explanations as module
    monkeypatch.setenv('T2F_ANALYSIS_PROVIDER', 'anthropic')
    monkeypatch.setenv('ANTHROPIC_API_KEY', 'test-key')
    monkeypatch.setattr(module, 'PROVIDER_DEADLINE', 0.05)
    class SlowStream(httpx.AsyncByteStream):
        async def __aiter__(self):
            yield b'{'
            await asyncio.sleep(1)
            yield b'}'
    monkeypatch.setattr(module, 'TRANSPORT', httpx.MockTransport(lambda request: httpx.Response(200, stream=SlowStream())))
    response = client.post('/api/decline-explanations', json=SPEC)
    assert response.status_code == 503
    assert response.json()['error']['code'] == 'analysis_provider_error'

@pytest.mark.parametrize('warning', [
    'La evolución pasada no garantiza una recuperación futura.',
    'Past performance does not guarantee future recovery.',
    'Future recovery is not guaranteed.',
    'No one can guarantee a recovery.',
    'La causa concreta de la caída del fondo es desconocida.',
    'The cause of the fund decline is unknown.',
    'We do not know the cause of this fund decline.',
])
def test_directly_negated_guarantee_remains_permitted(warning):
    from backend.decline_explanations import unsafe_narrative
    assert not unsafe_narrative(warning)

def test_number_in_words_is_still_rejected_with_no_one_warning():
    from backend.decline_explanations import unsafe_narrative
    assert unsafe_narrative('No one can guarantee recovery, but the decline was one percent.')
    assert unsafe_narrative('The cause is unknown, but the pandemic caused this fund decline.')
