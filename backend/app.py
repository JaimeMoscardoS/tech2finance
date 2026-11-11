"""HTTP interface for the local, stateless demonstration."""

import asyncio
import hashlib
import json
import math
import os
from fastapi import Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.domain import DomainError, analyze_decline, build_tutor_context, get_catalog, run_simulation
from backend.domain.game import run_game
from backend.schemas import DeclineSpec, DeclineEventRequest, DeclineExplanationRequest, GameSpec, SimulationSpec, TtsRequest, TutorRequest, SpeechTokenRequest
from backend.decline_explanations import AnalysisUnavailable, explain, provider
from backend.news import get_news
from backend.tutor_bridge import TutorUnavailable, reply
from backend.voice_tts import TtsUnavailable, synthesize
from backend.providers import ProviderError, speech_provider, tutor_provider, speech_token, tutor_reply

MAX_BODY = 65536
ALLOWED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]


def error(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"error": {"code": code, "message": message}})


class BodyLimit:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        chunks = []
        size = 0
        while True:
            event = await receive()
            if event["type"] == "http.disconnect":
                return
            size += len(event.get("body", b""))
            if size > MAX_BODY:
                response = error(413, "request_too_large", "Request body is too large.")
                if scope.get('path') == '/api/speech/token':
                    response.headers['Cache-Control'] = 'no-store'
                await response(scope, receive, send)
                return
            chunks.append(event.get("body", b""))
            if not event.get("more_body", False):
                break
        body = b"".join(chunks)
        sent = False

        async def replay():
            nonlocal sent
            if not sent:
                sent = True
                return {"type": "http.request", "body": body, "more_body": False}
            return await receive()

        async def send_with_cache_control(event):
            if scope.get('path') == '/api/speech/token' and event['type'] == 'http.response.start':
                headers = [(k, v) for k, v in event.get('headers', []) if k.lower() != b'cache-control']
                event['headers'] = headers + [(b'cache-control', b'no-store')]
            await send(event)

        await self.app(scope, replay, send_with_cache_control)


app = FastAPI(title="Tech2Finance local demo", docs_url=None, redoc_url=None, openapi_url=None)
app.add_middleware(BodyLimit)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1", "testserver"])
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])


@app.exception_handler(RequestValidationError)
async def validation_error(_request: Request, _exc: RequestValidationError):
    return error(422, "validation_error", "Invalid request.")


@app.exception_handler(StarletteHTTPException)
async def http_error(_request: Request, exc: StarletteHTTPException):
    descriptions = {
        400: ("invalid_request", "Invalid request."),
        404: ("not_found", "Resource not found."),
        405: ("method_not_allowed", "Method not allowed."),
    }
    code, message = descriptions.get(exc.status_code, ("http_error", "Request could not be processed."))
    response = error(exc.status_code, code, message)
    if exc.status_code == 405 and exc.headers and "Allow" in exc.headers:
        response.headers["Allow"] = exc.headers["Allow"]
    return response


@app.exception_handler(DomainError)
async def domain_error(_request: Request, exc: DomainError):
    if exc.code == "instrument_not_found":
        return error(404, "unknown_instrument", "Instrument not found.")
    if exc.code == "missing_history":
        return error(409, "history_unavailable", "Instrument history is unavailable.")
    return error(exc.status, exc.code, str(exc))


@app.exception_handler(TutorUnavailable)
async def tutor_error(_request: Request, _exc: TutorUnavailable):
    return error(503, "tutor_unavailable", "Local tutor is unavailable.")


@app.exception_handler(Exception)
async def unexpected_error(_request: Request, _exc: Exception):
    return error(500, "internal_error", "The request could not be processed.")


@app.exception_handler(TtsUnavailable)
async def tts_error(_request: Request, exc: TtsUnavailable):
    return error(503, exc.code, "Voice synthesis is unavailable.")


@app.exception_handler(AnalysisUnavailable)
async def analysis_error(_request: Request, exc: AnalysisUnavailable):
    return error(503, exc.code, "Detailed analysis is unavailable.")


@app.exception_handler(ProviderError)
async def provider_error(_request: Request, exc: ProviderError):
    response = error(exc.status, exc.code, "Provider is unavailable.")
    response.headers['Cache-Control'] = 'no-store'
    return response


@app.get("/api/health")
def health():
    news_provider = os.environ.get('T2F_NEWS_PROVIDER', 'ecb_archive')
    speech, tutor = speech_provider(), tutor_provider()
    return {"status": "ok", "mode": "demo", "tutorProvider": tutor, "speechProvider": speech,
            "speechKeyConfigured": bool(os.environ.get('ELEVENLABS_API_KEY')),
            "externalProviders": provider() == "anthropic" or news_provider == 'ecb_archive' or speech == 'elevenlabs' or tutor == 'anthropic', "newsProvider": news_provider}


class ForbiddenOrigin(Exception):
    pass


@app.exception_handler(ForbiddenOrigin)
async def forbidden_origin(_request: Request, _exc: ForbiddenOrigin):
    return error(403, "forbidden_origin", "Request origin is not allowed.")


def tts_guard(request: Request):
    origin = request.headers.get("origin")
    if (not request.headers.get("content-type", "").lower().startswith("application/json")
            or request.headers.get("sec-fetch-site") == "cross-site"
            or (origin is not None and origin not in ALLOWED_ORIGINS)):
        raise ForbiddenOrigin()


@app.post("/api/tts", dependencies=[Depends(tts_guard)])
async def tts(spec: TtsRequest):
    if speech_provider() != 'elevenlabs':
        return error(503, "tts_disabled", "Voice synthesis is disabled.")
    audio = await synthesize(spec.text)
    return Response(content=audio, media_type="audio/mpeg", headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"})


@app.get("/api/catalog")
def catalog():
    return get_catalog()


@app.post("/api/simulations")
def simulation(spec: SimulationSpec):
    return run_simulation(spec.model_dump(mode="json", exclude_none=True))


@app.post("/api/game/compare")
def game_compare(spec: GameSpec):
    return run_game(spec.model_dump(mode="json"))


@app.post("/api/declines")
def decline(spec: DeclineSpec):
    return analyze_decline(spec.model_dump(mode="json", exclude_none=True))


async def event_for(spec, report):
    current = report.get('currentDrawdownPercent')
    triggered = isinstance(current, (int, float)) and not isinstance(current, bool) and math.isfinite(current) and current >= 5
    enabled = triggered and os.environ.get('T2F_NEWS_PROVIDER', 'ecb_archive') == 'ecb_archive'
    catalog = get_catalog()
    instrument_id = spec.get('instrumentId') or catalog['portfolioExample']['instrumentId']
    instrument = next(i for i in catalog['instruments'] if i['instrumentId'] == instrument_id)
    identity = tuple(dict.fromkeys([instrument['identifier'], *instrument['name'].values()]))
    reason = 'The observed decline does not reach the threshold.' if not triggered else 'External news is disabled by configuration.'
    news = await get_news(report, enabled=enabled, identity=identity, disabled_reason=reason)
    event_id = None
    if triggered:
        identity = {k: v for k, v in spec.items() if k != 'language'}
        identity.update(latestLabel=report['latestLabel'], latestValue=report['latestValue'],
                        peakValue=report['peakValue'], episodes=report['episodes'])
        event_id = hashlib.sha256(json.dumps(identity, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
    return {'schemaVersion': '1.0', 'status': 'triggered' if triggered else 'not_triggered',
            'eventId': event_id, 'thresholdPercent': 5, 'report': report, 'news': news}


@app.post('/api/decline-events')
async def decline_event(request: DeclineEventRequest):
    spec = request.decline.model_dump(mode='json', exclude_none=True)
    return await event_for(spec, analyze_decline(spec))


@app.post("/api/tutor")
async def tutor(request: TutorRequest):
    payload = request.model_dump(mode="json", exclude_none=True)
    payload["context"] = build_tutor_context(payload["context"])
    if tutor_provider() == 'server_rules':
        return await asyncio.to_thread(reply, payload, rules_only=True)
    return await tutor_reply(payload)


@app.post('/api/speech/token')
async def token(request: SpeechTokenRequest, raw_request: Request):
    origin = raw_request.headers.get('origin')
    if origin and origin not in ('http://localhost:5173', 'http://127.0.0.1:5173'):
        response = error(403, 'invalid_origin', 'Invalid origin.')
    else:
        response = JSONResponse(await speech_token(request.language))
    response.headers['Cache-Control'] = 'no-store'
    return response


@app.post("/api/decline-explanations")
async def decline_explanation(request: DeclineExplanationRequest):
    spec = request.decline.model_dump(mode="json", exclude_none=True)
    report = analyze_decline(spec)
    payload = {"report": report, "language": request.decline.language, "level": request.level}
    if request.decision is not None:
        payload["decision"] = request.decision.model_dump(mode="json", exclude_none=True)
    try:
        async with asyncio.timeout(55):
            event = await event_for(spec, report)
            payload['news'] = event['news']
            return await explain(payload)
    except TimeoutError:
        raise AnalysisUnavailable('analysis_unavailable') from None
