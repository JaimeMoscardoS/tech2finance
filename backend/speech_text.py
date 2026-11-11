"""Pronunciation-only expansion of bounded financial figures and ISO dates."""
import re
from datetime import date
from decimal import Decimal, InvalidOperation

_ES_UNITS = ('cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve')
_ES_TENS = ('', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa')
_ES_HUNDREDS = ('', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos')
_EN_UNITS = ('zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen')
_EN_TENS = ('', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety')
_MONTHS = {
 'es': ('enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'),
 'en': ('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'),
}


def _number(n: int, language: str) -> str:
    if n < 0:
        return ('menos ' if language == 'es' else 'minus ') + _number(-n, language)
    if language == 'es':
        if n < 30: return _ES_UNITS[n]
        if n < 100: return _ES_TENS[n // 10] + (' y ' + _ES_UNITS[n % 10] if n % 10 else '')
        if n == 100: return 'cien'
        if n < 1000: return _ES_HUNDREDS[n // 100] + (' ' + _number(n % 100, language) if n % 100 else '')
        if n < 1_000_000:
            count, rest = divmod(n, 1000)
            return ('mil' if count == 1 else _apocope(_number(count, language)) + ' mil') + (' ' + _number(rest, language) if rest else '')
        count, rest = divmod(n, 1_000_000)
        return ('un millón' if count == 1 else _apocope(_number(count, language)) + ' millones') + (' ' + _number(rest, language) if rest else '')
    if n < 20: return _EN_UNITS[n]
    if n < 100: return _EN_TENS[n // 10] + (' ' + _EN_UNITS[n % 10] if n % 10 else '')
    if n < 1000: return _EN_UNITS[n // 100] + ' hundred' + (' ' + _number(n % 100, language) if n % 100 else '')
    if n < 1_000_000:
        count, rest = divmod(n, 1000)
        return _number(count, language) + ' thousand' + (' ' + _number(rest, language) if rest else '')
    count, rest = divmod(n, 1_000_000)
    return _number(count, language) + ' million' + (' ' + _number(rest, language) if rest else '')


def _apocope(value: str) -> str:
    if value.endswith('veintiuno'): return value[:-9] + 'veintiún'
    if value.endswith('uno'): return value[:-3] + 'un'
    return value


def _parse(raw: str, language: str) -> Decimal | None:
    text = raw.replace('\u00a0', '').replace('\u202f', '').replace(' ', '')
    if ',' in text and '.' in text:
        decimal = ',' if text.rfind(',') > text.rfind('.') else '.'
        text = text.replace('.' if decimal == ',' else ',', '').replace(decimal, '.')
    elif ',' in text or '.' in text:
        separator = ',' if ',' in text else '.'
        chunks = text.lstrip('-').split(separator)
        grouping = len(chunks) > 1 and all(len(chunk) == 3 for chunk in chunks[1:]) and (len(chunks) > 2 or separator == ('.' if language == 'es' else ','))
        text = text.replace(separator, '' if grouping else '.')
    try:
        value = Decimal(text)
        return value if value.is_finite() and abs(value) <= 1_000_000_000 else None
    except InvalidOperation:
        return None


def normalize_speech(text: str, language: str) -> str:
    def calendar(match):
        try: value = date.fromisoformat(match.group())
        except ValueError: return match.group()
        if language == 'es': return f'{_number(value.day, language)} de {_MONTHS[language][value.month - 1]} de {_number(value.year, language)}'
        return f'{_MONTHS[language][value.month - 1]} {_number(value.day, language)}, {_number(value.year, language)}'

    def money(match):
        raw = match.group('number')
        value = _parse(raw, language)
        if value is None or value.as_tuple().exponent < -2: return match.group()
        cents_total = int(abs(value) * 100)
        euros, cents = divmod(cents_total, 100)
        number = _number(euros, language)
        if language == 'es': number = _apocope(number)
        prefix = ('menos ' if language == 'es' else 'minus ') if value < 0 else ''
        unit = ('de euros' if language == 'es' and euros >= 1_000_000 and euros % 1_000_000 == 0 else ('euro' if euros == 1 else 'euros'))
        if not cents: return f'{prefix}{number} {unit}'
        cents_number = _number(cents, language)
        if language == 'es': cents_number = _apocope(cents_number)
        cents_unit = ('céntimo' if cents == 1 else 'céntimos') if language == 'es' else ('cent' if cents == 1 else 'cents')
        return f'{prefix}{number} {unit} ' + ('con ' if language == 'es' else 'and ') + f'{cents_number} {cents_unit}'

    def percent(match):
        raw = match.group('number')
        value = _parse(raw, language)
        if value is None: return match.group()
        plain = format(abs(value), 'f')
        integer, _, fractional = plain.partition('.')
        result = _number(int(integer), language)
        if fractional: result += (' coma ' if language == 'es' else ' point ') + ' '.join(_number(int(c), language) for c in fractional)
        return (('menos ' if language == 'es' else 'minus ') if value < 0 else '') + result + (' por ciento' if language == 'es' else ' percent')

    number = r'-?(?:\d{1,3}(?:[ \u00a0\u202f]\d{3})+|\d+)(?:[.,]\d+)*'
    text = re.sub(r'(?<![\w\d])\d{4}-\d{2}-\d{2}(?![\w\d])', calendar, text)
    text = re.sub(rf'(?:\bEUR\b|€)\s*(?P<number>{number})(?![\w\d]|[.,]\d)', money, text, flags=re.IGNORECASE)
    text = re.sub(rf'(?<![\w\d.,])(?P<number>{number})\s*(?:EUR\b|€)', money, text, flags=re.IGNORECASE)
    text = re.sub(rf'(?<![\w\d.,])(?P<number>{number})\s*%', percent, text)
    return re.sub(r'\bEUR\b', 'euros', text, flags=re.IGNORECASE)
