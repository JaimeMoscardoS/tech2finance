from backend.domain import get_catalog
from backend.domain.fund_names import display_name

def test_duplicate_aliases_are_stable_in_both_languages_and_catalog_order():
    instruments = get_catalog()['instruments']
    for instrument_id, es, en in (
        ('bbva-mi-inversion-bolsa', 'Fondo bolsa 1', 'Equity fund 1'),
        ('bbva-mi-inversion-bolsa-acumulacion', 'Fondo bolsa 2', 'Equity fund 2'),
    ):
        instrument = next(item for item in instruments if item['instrumentId'] == instrument_id)
        for catalog in (instruments, list(reversed(instruments))):
            assert display_name(instrument, 'es', catalog) == es
            assert display_name(instrument, 'en', catalog) == en
