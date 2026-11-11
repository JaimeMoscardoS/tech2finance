"""HTTP interface for the local, stateless demonstration."""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.domain import DomainError, analyze_decline, build_tutor_context, get_catalog, run_simulation
from backend.domain.game import run_game
from backend.schemas import DeclineSpec, DeclineExplanationRequest, GameSpec, SimulationSpec, TutorRequest
from backend.decline_explanations import AnalysisUnavailable, explain, provider
from backend.tutor_bridge import TutorUnavailable, reply

MAX_BODY = 65536


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
                await error(413, "request_too_large", "Request body is too large.")(scope, receive, send)
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

        await self.app(scope, replay, send)


app = FastAPI(title="Tech2Finance local demo", docs_url=None, redoc_url=None, openapi_url=None)
app.add_middleware(BodyLimit)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1", "testserver"])
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_methods=["GET", "POST"], allow_headers=["Content-Type"])


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


@app.exception_handler(AnalysisUnavailable)
async def analysis_error(_request: Request, exc: AnalysisUnavailable):
    return error(503, exc.code, "Detailed analysis is unavailable.")


@app.get("/api/health")
def health():
    return {"status": "ok", "mode": "demo", "tutorProvider": "server_rules", "externalProviders": provider() == "anthropic"}


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


@app.post("/api/tutor")
def tutor(request: TutorRequest):
    payload = request.model_dump(mode="json", exclude_none=True)
    payload["context"] = build_tutor_context(payload["context"])
    return reply(payload)


@app.post("/api/decline-explanations")
async def decline_explanation(request: DeclineExplanationRequest):
    spec = request.decline.model_dump(mode="json", exclude_none=True)
    report = analyze_decline(spec)
    payload = {"report": report, "language": request.decline.language, "level": request.level}
    if request.decision is not None:
        payload["decision"] = request.decision.model_dump(mode="json", exclude_none=True)
    return await explain(payload)
