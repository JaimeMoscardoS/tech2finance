"""Optional server-side text-to-speech through ElevenLabs. The key never leaves the server."""
import asyncio
import os
import re
import threading

import httpx

TRANSPORT = None
_slots = threading.BoundedSemaphore(2)
PROVIDER_DEADLINE = 20
MAX_AUDIO_BYTES = 4 * 1024 * 1024
DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'
DEFAULT_MODEL_ID = 'eleven_multilingual_v2'


class TtsUnavailable(Exception):
    def __init__(self, code):
        self.code = code


def voice_provider():
    return 'elevenlabs' if os.environ.get('T2F_VOICE_PROVIDER') == 'elevenlabs' else 'browser'


async def synthesize(text):
    key = os.environ.get('ELEVENLABS_API_KEY', '')
    voice_id = os.environ.get('T2F_ELEVENLABS_VOICE_ID', DEFAULT_VOICE_ID)
    model = os.environ.get('T2F_ELEVENLABS_MODEL_ID', DEFAULT_MODEL_ID)
    if not key or not re.fullmatch(r'[A-Za-z0-9]{10,40}', voice_id) or not re.fullmatch(r'[a-z0-9_]{1,60}', model):
        raise TtsUnavailable('tts_configuration_error')
    if not _slots.acquire(blocking=False):
        raise TtsUnavailable('tts_provider_error')
    try:
        url = f'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_64'
        headers = {'xi-api-key': key, 'accept': 'audio/mpeg', 'content-type': 'application/json', 'accept-encoding': 'identity'}
        try:
            async with asyncio.timeout(PROVIDER_DEADLINE):
                async with httpx.AsyncClient(timeout=PROVIDER_DEADLINE, transport=TRANSPORT, follow_redirects=False) as client:
                    async with client.stream('POST', url, headers=headers, json={'text': text, 'model_id': model}) as response:
                        response.raise_for_status()
                        if response.status_code != 200 or not response.headers.get('content-type', '').lower().startswith('audio/mpeg'):
                            raise ValueError()
                        audio = bytearray()
                        async for chunk in response.aiter_bytes():
                            if len(chunk) > MAX_AUDIO_BYTES - len(audio):
                                raise ValueError()
                            audio.extend(chunk)
            if not audio:
                raise ValueError()
        except (httpx.HTTPError, TimeoutError, ValueError):
            raise TtsUnavailable('tts_provider_error') from None
        return bytes(audio)
    finally:
        _slots.release()
