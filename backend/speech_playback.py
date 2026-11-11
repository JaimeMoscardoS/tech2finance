"""Bounded text-to-speech; credentials and voice selection remain server-side."""
import asyncio
import os
import re
import threading
import time
from collections import deque

import httpx

from backend.providers import ProviderError
from backend.speech_text import normalize_speech

TRANSPORT = None
_slots = threading.BoundedSemaphore(4)
_lock = threading.Lock()
_requests = deque()
_voices = {'es': 'Nh2zY9kknu6z4pZy6FhD', 'en': 'WQP7cQUF5aAS6Axh5yaa'}


def tts_provider():
    return os.environ.get('T2F_TTS_PROVIDER', 'elevenlabs' if os.environ.get('ELEVENLABS_API_KEY') else 'browser_local')


def _rate_limit():
    now = time.monotonic()
    with _lock:
        while _requests and _requests[0] <= now - 60:
            _requests.popleft()
        if len(_requests) >= 30:
            raise ProviderError('speech_rate_limited', 429)
        _requests.append(now)


async def synthesize(text, language):
    key = os.environ.get('ELEVENLABS_API_KEY', '')
    voice = os.environ.get('ELEVENLABS_VOICE_ID_' + language.upper(), _voices[language])
    model = os.environ.get('ELEVENLABS_TTS_MODEL', 'eleven_flash_v2_5')
    if tts_provider() != 'elevenlabs' or not key or not re.fullmatch(r'[A-Za-z0-9_-]{1,100}', voice) or model not in ('eleven_flash_v2_5', 'eleven_multilingual_v2'):
        raise ProviderError('speech_configuration_error')
    _rate_limit()
    if not _slots.acquire(blocking=False):
        raise ProviderError('speech_provider_error')
    try:
        payload = {'text': normalize_speech(text, language), 'model_id': model, 'voice_settings': {'stability': 0.55, 'similarity_boost': 0.75}}
        if model == 'eleven_flash_v2_5':
            payload['language_code'] = language
        try:
            async with asyncio.timeout(25):
                async with httpx.AsyncClient(timeout=25, transport=TRANSPORT, follow_redirects=False) as client:
                    async with client.stream('POST', f'https://api.elevenlabs.io/v1/text-to-speech/{voice}',
                                             params={'output_format': 'mp3_44100_128'},
                                             headers={'xi-api-key': key, 'accept-encoding': 'identity'}, json=payload) as response:
                        response.raise_for_status()
                        if response.headers.get('content-type', '').split(';')[0].strip().lower() not in ('audio/mpeg', 'application/octet-stream'):
                            raise ValueError('invalid media type')
                        body = bytearray()
                        async for chunk in response.aiter_bytes():
                            if len(chunk) > 2 * 1024 * 1024 - len(body):
                                raise ValueError('response too large')
                            body.extend(chunk)
                        if not (body.startswith(b'ID3') or (len(body) >= 2 and body[0] == 0xff and body[1] & 0xe0 == 0xe0)):
                            raise ValueError('invalid audio')
                        return bytes(body)
        except (httpx.HTTPError, TimeoutError, ValueError):
            raise ProviderError('speech_provider_error') from None
    finally:
        _slots.release()
