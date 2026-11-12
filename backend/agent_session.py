"""Issue short-lived ElevenLabs agent sessions without exposing the API key."""
import asyncio
import json
import os
import re
import threading
import time
from collections import deque
from urllib.parse import urlsplit

import httpx

from backend.providers import ProviderError

TRANSPORT = None
_lock = threading.Lock()
_requests = deque()
_slots = threading.BoundedSemaphore(4)


def agent_configured():
    return bool(os.environ.get('ELEVENLABS_API_KEY') and os.environ.get('ELEVENLABS_AGENT_ID'))


def conversation_provider():
    selected = os.environ.get('T2F_CONVERSATION_PROVIDER')
    return 'elevenlabs' if selected == 'elevenlabs' or (selected is None and agent_configured()) else 'disabled'


async def create_session(context, text_only):
    if conversation_provider() != 'elevenlabs' or not agent_configured():
        raise ProviderError('agent_configuration_error')
    agent_id = os.environ['ELEVENLABS_AGENT_ID']
    if not re.fullmatch(r'[A-Za-z0-9_-]{1,100}', agent_id):
        raise ProviderError('agent_configuration_error')
    with _lock:
        now = time.monotonic()
        while _requests and _requests[0] <= now - 60:
            _requests.popleft()
        if len(_requests) >= 30:
            raise ProviderError('agent_rate_limited', 429)
        _requests.append(now)
    if not _slots.acquire(blocking=False):
        raise ProviderError('agent_provider_error')
    try:
        try:
            async with asyncio.timeout(10):
                async with httpx.AsyncClient(timeout=10, follow_redirects=False, transport=TRANSPORT) as client:
                    async with client.stream('GET', 'https://api.elevenlabs.io/v1/convai/conversation/get-signed-url',
                                             params={'agent_id': agent_id, 'include_conversation_id': 'true'},
                                             headers={'xi-api-key': os.environ['ELEVENLABS_API_KEY'], 'accept-encoding': 'identity'}) as response:
                        response.raise_for_status()
                        body = bytearray()
                        async for chunk in response.aiter_bytes():
                            if len(body) + len(chunk) > 16384:
                                raise ValueError('response too large')
                            body.extend(chunk)
            url = json.loads(body)['signed_url']
            if not isinstance(url, str):
                raise ValueError('invalid signed URL')
            parsed = urlsplit(url)
            if len(url) > 8192 or parsed.scheme != 'wss' or parsed.netloc != 'api.elevenlabs.io' or not parsed.query or any(c.isspace() for c in url):
                raise ValueError('invalid signed URL')
        except (httpx.HTTPError, TimeoutError, ValueError, KeyError, TypeError):
            raise ProviderError('agent_provider_error') from None
    finally:
        _slots.release()
    language = context['language']
    facts = {k: v for k, v in context.items() if k not in ('page', 'level', 'language')}
    return {'provider': 'elevenlabs', 'mode': 'agent', 'signedUrl': url,
            'dynamicVariables': {'language': language, 'knowledge_level': context['level'], 'page_context': context['page'],
                                 'portfolio_facts': json.dumps(facts, ensure_ascii=False, separators=(',', ':'))},
            'overrides': {'agent': {'language': language, 'firstMessage': 'Hola, soy tu tutor financiero. ¿En qué puedo ayudarte?' if language == 'es' else 'Hello, I am your financial tutor. How can I help?'},
                          'conversation': {'textOnly': text_only}}}
