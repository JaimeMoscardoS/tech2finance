from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class RequestModel(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False, strict=True)


Identifier = Annotated[str, Field(min_length=1, max_length=100)]
Amount = Annotated[float, Field(ge=0, le=1_000_000_000)]
Periods = Annotated[int, Field(ge=1, le=120)]
Language = Literal["es", "en"]


class SimulationSpec(RequestModel):
    instrumentId: Identifier
    initial: Amount
    recurringContribution: Amount
    periods: Periods
    startDate: str | None = None
    contributionFrequency: Literal['monthly', 'annual'] = 'monthly'


class DeclineSpec(RequestModel):
    basis: Literal["instrument", "portfolio_demo", "portfolio_cnmv"]
    language: Language
    instrumentId: Identifier | None = None
    periods: Periods | None = None
    startDate: str | None = None

    @model_validator(mode="after")
    def validate_basis(self):
        if self.basis == "instrument" and (self.instrumentId is None or self.periods is None):
            raise ValueError("instrumentId and periods are required for instrument")
        if self.basis in ("portfolio_demo", "portfolio_cnmv") and (self.instrumentId is not None or self.periods is not None or self.startDate is not None):
            raise ValueError(f"{self.basis} does not accept instrumentId or periods")
        return self


class Decision(RequestModel):
    goal: Annotated[str, Field(max_length=200)] | None = None
    horizonYears: Annotated[float, Field(ge=0, le=100)] | None = None
    needsLiquidity: Literal["yes", "no", "unknown"] | None = None


class HistoryMessage(RequestModel):
    role: Literal["user", "assistant"]
    text: Annotated[str, Field(max_length=3000)]
    intent: Annotated[str, Field(max_length=100)] | None = None


class TutorContext(RequestModel):
    page: Literal["home", "explore", "simulator", "portfolio", "learn", "game"]
    level: Literal["beginner", "intermediate", "advanced"]
    language: Language
    bankId: Identifier = "demo"
    portfolioBasis: Literal["cnmv", "unavailable"] | None = None
    instrumentId: Identifier | None = None
    simulation: SimulationSpec | None = None
    decline: DeclineSpec | None = None
    decision: Decision | None = None

    @model_validator(mode="after")
    def consistent_context(self):
        if self.simulation and self.instrumentId and self.simulation.instrumentId != self.instrumentId:
            raise ValueError("simulation instrument does not match context")
        if self.decline and self.decline.language != self.language:
            raise ValueError("decline language does not match context")
        if self.decline and self.decline.basis == "instrument" and self.instrumentId and self.decline.instrumentId != self.instrumentId:
            raise ValueError("decline instrument does not match context")
        if self.simulation and self.decline and self.decline.basis == "instrument" and self.simulation.instrumentId != self.decline.instrumentId:
            raise ValueError("simulation and decline instruments do not match")
        if self.simulation and self.page != "simulator":
            raise ValueError("simulation is only available on simulator page")
        return self


Rate = Annotated[float, Field(ge=0, le=0.05)]


class GameSpec(RequestModel):
    instrumentId: Identifier
    initial: Amount
    monthly: Amount
    months: Annotated[int, Field(ge=1, le=120)]
    sellMonth: Annotated[int, Field(ge=0, le=120)]
    buyFeeRate: Rate
    sellFeeRate: Rate
    startDate: str | None = None

    @model_validator(mode="after")
    def validate_game(self):
        if self.sellMonth > self.months:
            raise ValueError("sellMonth must not exceed months")
        if self.initial + self.monthly <= 0:
            raise ValueError("initial or monthly must be positive")
        return self


class TutorRequest(RequestModel):
    message: Annotated[str, Field(min_length=1, max_length=1500)]
    history: Annotated[list[HistoryMessage], Field(max_length=8)] = Field(default_factory=list)
    context: TutorContext

class SpeechTokenRequest(RequestModel):
    language: Language

class SpeechSynthesisRequest(RequestModel):
    text: Annotated[str, Field(min_length=1, max_length=3000, pattern=r'\S')]
    language: Language

class DeclineExplanationRequest(RequestModel):
    decline: DeclineSpec
    level: Literal['beginner', 'intermediate', 'advanced']
    decision: Decision | None = None

class DeclineEventRequest(RequestModel):
    decline: DeclineSpec


Pct = Annotated[float, Field(ge=-1000, le=1000)]


class InsightWeight(RequestModel):
    name: Annotated[str, Field(min_length=1, max_length=80)]
    weightPct: Annotated[float, Field(ge=0, le=100)]


class InsightFacts(RequestModel):
    """Cifras ya calculadas por el código del cliente: contexto para redactar (el modelo no las repite)."""
    dataKind: Literal["historical_nav", "fictional"]
    months: Annotated[int, Field(ge=1, le=600)]
    valueEur: Annotated[float, Field(ge=0, le=1e9)]
    contributedEur: Annotated[float, Field(ge=0, le=1e9)]
    resultPct: Pct
    lastMonthPct: Pct | None = None
    volatilityPct: Pct | None = None
    maxDrawdownPct: Pct | None = None
    sharpe: Annotated[float, Field(ge=-100, le=100)] | None = None
    equityExposurePct: Annotated[float, Field(ge=0, le=100)] | None = None
    averageRisk: Annotated[float, Field(ge=1, le=7)] | None = None
    goalProgressPct: Pct | None = None
    planExpectedPct: Pct | None = None
    weights: Annotated[list[InsightWeight], Field(max_length=8)] = []


class InsightRequest(RequestModel):
    kind: Literal["agent", "what", "how"]
    page: Literal["home", "portfolio"]
    level: Literal["beginner", "intermediate", "advanced"]
    language: Literal["es", "en"]
    facts: InsightFacts
