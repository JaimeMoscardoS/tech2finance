"""Deterministic scenarios and drawdowns from observed values."""
from __future__ import annotations
from decimal import Decimal, localcontext
from fractions import Fraction
from copy import deepcopy
from typing import Any
from .series import InputError, Series, number
from .engine import ZERO, ONE, CALC_CONTEXT, text

def scenarios(request: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(request, dict):
        raise InputError('request must be an object')
    initial = number(request.get('initial'), 'initial', ZERO, Decimal('1e15'))
    monthly = number(request.get('monthly'), 'monthly', ZERO, Decimal('1e15'))
    months = request.get('months')
    if isinstance(months, bool) or not isinstance(months, int) or not 1 <= months <= 1200:
        raise InputError('months must be an integer between 1 and 1200')
    if initial == ZERO and monthly == ZERO:
        raise InputError('initial or monthly must be positive')
    rates = request.get('annual_rates')
    if not isinstance(rates, dict) or set(rates) != {'unfavorable', 'central', 'favorable'}:
        raise InputError('annual_rates must contain unfavorable, central and favorable')
    parsed = {k: number(v, k, Decimal('-0.999999'), Decimal('1')) for k, v in rates.items()}
    if not parsed['unfavorable'] <= parsed['central'] <= parsed['favorable']:
        raise InputError('rates must be ordered unfavorable <= central <= favorable')
    results = {}
    with localcontext(CALC_CONTEXT):
        for name, rate in parsed.items():
            factor = (ONE + rate) ** (ONE / Decimal(12))
            value = initial
            for _ in range(months):
                value = value * factor + monthly
            contributed = initial + monthly * months
            results[name] = {'annual_rate': text(rate), 'value': text(value), 'contributed': text(contributed), 'profit': text(value - contributed)}
    return {'schema_version': '1.0', 'results': results, 'assumptions': ['Hypothetical constant annual effective rates, not predictions or guarantees.', 'Monthly factor = (1 + annual rate)^(1/12); contributions at end of month.', 'No taxes, fees or inflation modeled.']}

def drawdowns(series: Series, threshold: Any = '0') -> dict[str, Any]:
    if not isinstance(series, Series):
        raise InputError('series must be a Series')
    threshold = number(threshold, 'threshold', ZERO, ONE)
    obs = series.observations
    peak = obs[0]
    trough = None
    episodes = []
    with localcontext(CALC_CONTEXT):
        def append(recovery):
            exact_depth = (Fraction(peak.value) - Fraction(trough.value)) / Fraction(peak.value)
            if exact_depth >= Fraction(threshold):
                with localcontext() as precision:
                    precision.prec = 120
                    depth = Decimal(exact_depth.numerator) / Decimal(exact_depth.denominator)
                end = recovery.date if recovery else obs[-1].date
                episodes.append({'peak_date': peak.date.isoformat(), 'peak_value': text(peak.value), 'trough_date': trough.date.isoformat(), 'trough_value': text(trough.value), 'depth': text(depth), 'recovery_date': recovery.date.isoformat() if recovery else None, 'days_to_trough': (trough.date - peak.date).days, 'days_to_recovery': (end - peak.date).days if recovery else None, 'observed_days': (end - peak.date).days, 'status': 'recovered' if recovery else 'open'})
        for point in obs[1:]:
            if point.value >= peak.value:
                if trough is not None:
                    append(point)
                    trough = None
                peak = point
            elif trough is None or point.value < trough.value:
                trough = point
        if trough is not None:
            append(None)
    return {'schema_version': '1.0', 'threshold': text(threshold), 'episodes': episodes, 'provenance': deepcopy(series.metadata), 'gaps': deepcopy(list(series.gaps)), 'comparison': {'status': 'insufficient_evidence', 'reason': 'No independently justified comparable series supplied.'}, 'causes': {'status': 'unknown', 'sources': []}, 'assumptions': ['Based on observations only, not portfolio cashflows; exact intragap extrema and recovery dates are unknown.', 'Recovery means first observed value at or above the previous peak.', 'No prediction, causal attribution or guarantee.']}
