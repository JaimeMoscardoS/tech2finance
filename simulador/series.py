"""Validation and provenance for imported value series."""
from __future__ import annotations
import csv
import json
from dataclasses import dataclass
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

class InputError(ValueError):
    """A user-facing validation failure."""

def number(value: Any, name: str, minimum: Decimal | None = None, maximum: Decimal | None = None) -> Decimal:
    if isinstance(value, bool) or not isinstance(value, (int, float, str, Decimal)):
        raise InputError(f"{name} must be a finite number")
    if isinstance(value, str) and len(value) > 128:
        raise InputError(f'{name} has too many characters')
    try:
        result = Decimal(str(value))
    except (InvalidOperation, ValueError):
        raise InputError(f"{name} must be a finite number") from None
    if not result.is_finite() or (minimum is not None and result < minimum) or (maximum is not None and result > maximum):
        raise InputError(f"{name} is outside the allowed range")
    parts = result.as_tuple()
    if len(parts.digits) > 40 or not -20 <= parts.exponent <= 20:
        raise InputError(f'{name} exceeds numeric precision or exponent limits')
    return result

def day(value: Any, name: str) -> date:
    if not isinstance(value, str):
        raise InputError(f"{name} must be an ISO date")
    try:
        result = date.fromisoformat(value)
        if result.isoformat() != value:
            raise ValueError
        return result
    except ValueError:
        raise InputError(f"{name} must be an ISO date YYYY-MM-DD") from None

@dataclass(frozen=True)
class Observation:
    date: date
    value: Decimal

@dataclass(frozen=True)
class Series:
    metadata: dict[str, Any]
    observations: tuple[Observation, ...]
    gaps: tuple[dict[str, Any], ...]

def parse_series(data: Any) -> Series:
    if not isinstance(data, dict) or data.get('schema_version') != '1.0':
        raise InputError('series schema_version must be 1.0')
    meta = data.get('metadata')
    if not isinstance(meta, dict):
        raise InputError('metadata must be an object')
    for field in ('instrument_id', 'instrument_name', 'instrument_class', 'currency', 'value_type', 'source', 'license', 'license_date', 'frequency', 'embedded_costs', 'distribution_policy', 'data_kind'):
        if not isinstance(meta.get(field), str) or not meta[field].strip():
            raise InputError(f'metadata.{field} must be a nonempty string')
    if len(meta['currency']) != 3 or not meta['currency'].isascii() or not meta['currency'].isupper() or not meta['currency'].isalpha():
        raise InputError('metadata.currency must be a three-letter uppercase code')
    if meta['value_type'] not in ('nav', 'adjusted', 'price_only'):
        raise InputError('metadata.value_type must be nav, adjusted or price_only')
    if meta['data_kind'] not in ('synthetic', 'real'):
        raise InputError('metadata.data_kind must be synthetic or real')
    day(meta['license_date'], 'metadata.license_date')
    gap_limit = number(meta.get('max_gap_days'), 'metadata.max_gap_days', Decimal(1), Decimal(3660))
    if gap_limit != int(gap_limit):
        raise InputError('metadata.max_gap_days must be an integer')
    meta = dict(meta)
    meta['max_gap_days'] = int(gap_limit)
    try:
        meta = json.loads(json.dumps(meta, allow_nan=False))
    except (TypeError, ValueError, OverflowError, RecursionError):
        raise InputError('metadata must contain JSON-serializable finite values') from None
    rows = data.get('observations')
    if not isinstance(rows, list) or len(rows) < 2:
        raise InputError('at least two observations are required')
    obs = []
    gaps = []
    for row in rows:
        if not isinstance(row, dict):
            raise InputError('observation must be an object')
        d = day(row.get('date'), 'observation.date')
        v = number(row.get('value'), 'observation.value', Decimal('1e-20'), Decimal('1e20'))
        if obs:
            delta = (d - obs[-1].date).days
            if delta <= 0:
                raise InputError('observations must be strictly ordered without duplicate dates')
            if delta > gap_limit:
                gaps.append({'from': obs[-1].date.isoformat(), 'to': d.isoformat(), 'days': delta})
        obs.append(Observation(d, v))
    return Series(meta, tuple(obs), tuple(gaps))

def read_json(path: str | Path) -> Any:
    try:
        with open(path, encoding='utf-8-sig') as f:
            return json.load(f)
    except (OSError, UnicodeError, ValueError, RecursionError) as exc:
        raise InputError(f'cannot read JSON: {exc}') from None

def load_series(path: str | Path, metadata_path: str | Path | None = None) -> Series:
    try:
        path = Path(path)
        if path.suffix.lower() == '.csv':
            if metadata_path is None:
                raise InputError('CSV requires a separate metadata JSON file')
            metadata = read_json(metadata_path)
            with path.open(encoding='utf-8-sig', newline='') as f:
                rows = list(csv.DictReader(f))
            return parse_series({'schema_version': '1.0', 'metadata': metadata, 'observations': rows})
        if metadata_path is not None:
            raise InputError('metadata file is only accepted with CSV')
        return parse_series(read_json(path))
    except (OSError, UnicodeError, json.JSONDecodeError, csv.Error) as exc:
        raise InputError(f'cannot read series: {exc}') from None
