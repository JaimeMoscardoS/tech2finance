"""Integrity checks for the frozen demo dataset; no network access."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / 'shared'
DATASET_VERSION = 'demo-2026-11-10.1'
CALCULATION_VERSION = 'demo-calculations-1.0.0'
DATASET_SHA256 = '70d234a224a2dc3f08d8e3f92cd4bfad3456ebb3cbcd9bb8db208940dafed0a4'
CANONICAL_DESCRIPTION = "json.dumps(data, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False).encode('utf-8'); complete parsed document, duplicate keys and nonfinite numbers rejected"


def _pairs(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('duplicate JSON key')
        result[key] = value
    return result


def _invalid_constant(_value):
    raise ValueError('nonfinite JSON number')


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'), object_pairs_hook=_pairs,
                      parse_constant=_invalid_constant)


def canonical_bytes(data):
    return json.dumps(data, sort_keys=True, separators=(',', ':'), ensure_ascii=False,
                      allow_nan=False).encode('utf-8')


def load_verified_dataset(root=ROOT):
    """Return the verified live document and its immutable version identity."""
    manifest = read_json(root / 'data-manifest.json')
    expected = {'datasetVersion': DATASET_VERSION, 'calculationVersion': CALCULATION_VERSION,
                'datasetSha256': DATASET_SHA256}
    manifest_expected = {**expected, 'canonicalization': 'canonical-json-v1',
                         'canonicalizationDescription': CANONICAL_DESCRIPTION}
    if manifest != manifest_expected:
        raise ValueError('dataset manifest mismatch')
    live = read_json(root / 'demo-data.json')
    snapshot = read_json(root / 'snapshots' / DATASET_VERSION / 'demo-data.json')
    live_bytes, snapshot_bytes = canonical_bytes(live), canonical_bytes(snapshot)
    if live_bytes != snapshot_bytes or hashlib.sha256(snapshot_bytes).hexdigest() != DATASET_SHA256:
        raise ValueError('dataset integrity mismatch')
    return live, expected
