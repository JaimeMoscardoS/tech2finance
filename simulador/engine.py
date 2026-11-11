"""Historical simulation and virtual decision comparison."""
from __future__ import annotations
import calendar
from copy import deepcopy
from datetime import date
from decimal import Context, Decimal, ROUND_HALF_EVEN, localcontext
from typing import Any
from .series import InputError, Series, day, number

ZERO = Decimal(0)
ONE = Decimal(1)
CALC_CONTEXT = Context(prec=34, rounding=ROUND_HALF_EVEN, Emin=-999999, Emax=999999)

def text(value: Decimal) -> str:
    return format(value, 'f')

def month_date(start: date, offset: int) -> date:
    index = start.year * 12 + start.month - 1 + offset
    year, month0 = divmod(index, 12)
    if year > 9999:
        raise InputError('scheduled date exceeds supported calendar')
    return date(year, month0 + 1, min(start.day, calendar.monthrange(year, month0 + 1)[1]))

def historical(series: Series, request: dict[str, Any], sell: bool = False) -> dict[str, Any]:
    if not isinstance(series, Series) or not isinstance(request, dict):
        raise InputError('series and request must be valid objects')
    start, end = day(request.get('start'), 'start'), day(request.get('end'), 'end')
    obs = series.observations
    if start > end or start < obs[0].date or end > obs[-1].date:
        raise InputError('requested range is outside available coverage or reversed')
    initial = number(request.get('initial'), 'initial', ZERO, Decimal('1e15'))
    monthly = number(request.get('monthly'), 'monthly', ZERO, Decimal('1e15'))
    buy_fee = number(request.get('buy_fee_rate'), 'buy_fee_rate', ZERO, Decimal('0.999999'))
    sell_fee = number(request.get('sell_fee_rate'), 'sell_fee_rate', ZERO, Decimal('0.999999'))
    if initial == ZERO and monthly == ZERO:
        raise InputError('initial or monthly must be positive')
    sell_day = day(request.get('sell_date'), 'sell_date') if sell else None
    if sell and not start <= sell_day <= end:
        raise InputError('sell_date must be inside the requested range')
    relevant = [o for o in obs if start <= o.date <= end]
    if not relevant:
        raise InputError('no observation in requested range')
    events = [(start, initial, 'initial')]
    explicit_dates = request.get('contribution_dates')
    if explicit_dates is not None:
        if not isinstance(explicit_dates, list):
            raise InputError('contribution_dates must be a list')
        dates = [day(value, 'contribution_dates') for value in explicit_dates]
        observed = {o.date for o in relevant}
        if any(d <= start or d > end or d not in observed for d in dates) or dates != sorted(set(dates)):
            raise InputError('contribution dates must be ordered observed dates after start')
        if monthly:
            events.extend((d, monthly, 'monthly') for d in dates)
    elif monthly:
        max_offset = (end.year - start.year) * 12 + end.month - start.month
        for n in range(1, max_offset + 1):
            d = month_date(start, n)
            if d > end:
                break
            events.append((d, monthly, 'monthly'))
    def execution(d: date) -> date:
        for o in relevant:
            if o.date >= d:
                return o.date
        raise InputError(f'no observation on or after scheduled date {d} within range')
    scheduled = {}
    for d, amount, kind in events:
        if amount:
            scheduled.setdefault(execution(d), []).append((d, amount, kind))
    sell_execution = execution(sell_day) if sell else None
    units, cash, contributed, fees = ZERO, ZERO, ZERO, ZERO
    sold = False
    timeline = []
    with localcontext(CALC_CONTEXT):
        for o in relevant:
            operations = []
            # Contributions on a sale execution date enter before selling.
            for planned, amount, kind in scheduled.get(o.date, []):
                contributed += amount
                cash += amount
                if not sold:
                    fee = amount * buy_fee
                    units += (amount - fee) / o.value
                    fees += fee
                    cash -= amount
                    operations.append({'type': 'buy', 'scheduled_date': planned.isoformat(), 'source': kind, 'gross': text(amount), 'fee': text(fee)})
                else:
                    operations.append({'type': 'cash_contribution', 'scheduled_date': planned.isoformat(), 'gross': text(amount)})
            if sell and o.date == sell_execution:
                gross = units * o.value
                fee = gross * sell_fee
                cash += gross - fee
                fees += fee
                units = ZERO
                sold = True
                operations.append({'type': 'sell', 'scheduled_date': sell_day.isoformat(), 'gross': text(gross), 'fee': text(fee)})
            total = cash + units * o.value
            timeline.append({'date': o.date.isoformat(), 'price': text(o.value), 'contributed': text(contributed), 'cash': text(cash), 'units': text(units), 'fees': text(fees), 'total': text(total), 'operations': operations})
        profit = total - contributed
        return {'schema_version': '1.0', 'currency': series.metadata['currency'], 'unit_type': 'synthetic' if series.metadata['value_type'] != 'nav' else 'fractional_virtual_nav', 'contributed': text(contributed), 'cash': text(cash), 'units': text(units), 'fees': text(fees), 'value': text(total), 'profit': text(profit), 'simple_return': text(profit / contributed) if contributed else None, 'timeline': timeline, 'provenance': deepcopy(series.metadata), 'gaps': deepcopy(list(series.gaps)), 'assumptions': ['Virtual fractional units; transaction fees apply to gross amount.', 'Scheduled contributions execute at first available observation on or after schedule, inside the requested range.', 'No taxes, interest on cash, separate distributions or unobserved prices are modeled.', 'Declared metadata and license are not independently verified.']}

def simulate(series: Series, request: dict[str, Any]) -> dict[str, Any]:
    return historical(series, request)

def compare(series: Series, request: dict[str, Any]) -> dict[str, Any]:
    return {'schema_version': '1.0', 'hold': historical(series, request), 'sell': historical(series, request, True), 'assumptions': ['Educational virtual comparison; no recommendation or guarantee.', 'Sale-date contributions are invested before sale; later contributions remain cash.']}
