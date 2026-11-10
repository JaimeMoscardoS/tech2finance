"""Deterministic replay of the demo's periodic cash flows."""
from decimal import Context, Decimal, ROUND_HALF_EVEN, localcontext


def replay(initial, contribution, rates, dates, kind):
    with localcontext(Context(prec=34, rounding=ROUND_HALF_EVEN)):
        initial, contribution = Decimal(str(initial)), Decimal(str(contribution))
        value = contributed = initial
        factor = Decimal(1)
        timeline = [{"period": 0, "date": dates[0], "valueBeforeContribution": 0,
                     "contribution": float(initial), "contributed": float(initial),
                     "value": float(initial), "profit": 0, "instrumentReturnPercent": 0,
                     "periodReturn": None}]
        for i, raw_rate in enumerate(rates):
            rate = Decimal(str(raw_rate))
            if kind == "fictional_monthly":
                before = value
                value = (value + contribution) * (1 + rate)
            else:
                before = value * (1 + rate)
                value = before + contribution
            contributed += contribution
            factor *= 1 + rate
            timeline.append({"period": i + 1, "date": dates[i + 1],
                "valueBeforeContribution": float(before), "contribution": float(contribution),
                "contributed": float(contributed), "value": float(value),
                "profit": float(value - contributed), "instrumentReturnPercent": float((factor - 1) * 100),
                "periodReturn": float(rate)})
        return {"kind": kind, "points": [p["value"] for p in timeline], "timeline": timeline,
                "value": float(value), "contributed": float(contributed), "profit": float(value - contributed),
                "simpleReturnPercent": float((value - contributed) / contributed * 100) if contributed else None}
