"""Public API for the educational simulator."""
from .series import InputError, Series, load_series, parse_series
from .engine import simulate, compare
from .analysis import scenarios, drawdowns

__all__ = ['InputError', 'Series', 'load_series', 'parse_series', 'simulate', 'compare', 'scenarios', 'drawdowns']
