"""Presentation aliases; official catalog identities remain unchanged."""
from pathlib import Path
import json
import unicodedata

_ALIASES = json.loads((Path(__file__).resolve().parents[2] / 'shared' / 'fund-aliases.json').read_text(encoding='utf-8'))

def _key(value):
    return ''.join(c for c in unicodedata.normalize('NFKC', value).lower() if c.isalnum())

def display_name(instrument, language, catalog):
    base = _ALIASES.get(instrument['instrumentId'])
    if base is None:
        return instrument['name'][language]
    peers = sorted(other['instrumentId'] for other in catalog
                   if (candidate := _ALIASES.get(other['instrumentId']))
                   and any(_key(candidate[lang]) == _key(base[lang]) for lang in ('es', 'en')))
    suffix = f" {peers.index(instrument['instrumentId']) + 1}" if len(peers) > 1 else ''
    return base[language] + suffix
