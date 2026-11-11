"""Validated real NAV observations and educational close-of-month replay."""
from datetime import date
from decimal import Context, Decimal, InvalidOperation, ROUND_HALF_EVEN, localcontext


class NavHistoryError(ValueError):
    pass


def select_nav(history, isin, start, periods):
    try:
        if isinstance(periods, bool) or not isinstance(periods, int) or not 1 <= periods <= 72:
            raise NavHistoryError('Invalid period count')
        instrument = next(item for item in history['instruments'] if item['isin'] == isin)
        if instrument['eligible'] is not True or instrument['currency'] != 'EUR':
            raise NavHistoryError('History unavailable')
        monthly = instrument['monthly']
        start = start or monthly[0]['date']
        index = next(i for i, item in enumerate(monthly) if item['date'] == start)
        rows = monthly[index:index + periods + 1]
        if len(rows) != periods + 1:
            raise NavHistoryError('Outside available coverage')
        previous = None
        for row in rows:
            current = date.fromisoformat(row['date'])
            if current.isoformat() != row['date']:
                raise NavHistoryError('Invalid observation date')
            amount = Decimal(row['nav'])
            if not amount.is_finite() or amount <= 0:
                raise NavHistoryError('Invalid NAV')
            if previous is not None and (current.year * 12 + current.month) != previous + 1:
                raise NavHistoryError('Missing or duplicate month')
            previous = current.year * 12 + current.month
        return rows
    except (KeyError, TypeError, ValueError, StopIteration, InvalidOperation, IndexError) as exc:
        if isinstance(exc, NavHistoryError):
            raise
        raise NavHistoryError('Invalid or unavailable history') from None


def replay_nav(rows, initial, contribution, frequency='monthly'):
    if frequency not in ('monthly', 'annual'):
        raise NavHistoryError('Invalid contribution frequency')
    with localcontext(Context(prec=34, rounding=ROUND_HALF_EVEN)):
        initial, contribution = Decimal(str(initial)), Decimal(str(contribution))
        value = contributed = initial
        first = Decimal(rows[0]['nav'])
        timeline = [{'period': 0, 'date': rows[0]['date'], 'nav': rows[0]['nav'], 'valueBeforeContribution': 0,
                     'contribution': float(initial), 'contributed': float(initial), 'value': float(initial),
                     'profit': 0, 'instrumentReturnPercent': 0, 'periodReturn': None}]
        previous = first
        for i, row in enumerate(rows[1:], 1):
            current = Decimal(row['nav'])
            before = value * current / previous
            deposit = contribution if frequency == 'monthly' or i % 12 == 0 else Decimal(0)
            value = before + deposit
            contributed += deposit
            timeline.append({'period': i, 'date': row['date'], 'nav': row['nav'], 'valueBeforeContribution': float(before),
                             'contribution': float(deposit), 'contributed': float(contributed), 'value': float(value),
                             'profit': float(value - contributed), 'instrumentReturnPercent': float((current / first - 1) * 100),
                             'periodReturn': float(current / previous - 1)})
            previous = current
        return {'kind': 'real_monthly_nav', 'contributionTiming': 'month_end_after_return', 'contributionFrequency': frequency, 'timeline': timeline,
                'points': [p['value'] for p in timeline], 'value': float(value), 'contributed': float(contributed),
                'profit': float(value - contributed), 'simpleReturnPercent': float((value-contributed)/contributed*100) if contributed else None}
