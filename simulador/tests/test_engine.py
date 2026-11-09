import copy
import json
import tempfile
import unittest
from decimal import Decimal, Inexact, ROUND_DOWN, localcontext
from pathlib import Path
from simulador import InputError, parse_series, load_series, simulate, compare, drawdowns, scenarios

FIX = Path(__file__).resolve().parents[1] / 'fixtures' / 'synthetic-series.json'

def data(values):
    with FIX.open(encoding='utf-8-sig') as f:
        x = json.load(f)
    x['observations'] = [{'date': d, 'value': v} for d, v in values]
    return x

def req(start='2020-01-01', end='2020-03-01', initial='1000', monthly='100', **kw):
    return dict(start=start, end=end, initial=initial, monthly=monthly, buy_fee_rate='0', sell_fee_rate='0', **kw)

class HistoricalTests(unittest.TestCase):
    def test_manual_cashflows(self):
        s = parse_series(data([('2020-01-01', '100'), ('2020-02-01', '80'), ('2020-03-01', '100')]))
        result = simulate(s, req(monthly='100', end='2020-02-29'))
        self.assertEqual(Decimal(result['units']), Decimal('11.25'))
        result = simulate(s, req(monthly='0'))
        self.assertEqual(Decimal(result['value']), 1000)
        # A contribution only at February: stop monthly schedule with non-monthly start/end via separate trace.
        r = simulate(s, req(monthly='100'))
        self.assertEqual(Decimal(r['value']), 1225)
        self.assertEqual(Decimal(r['contributed']), 1200)
        self.assertEqual(Decimal(r['profit']), 25)
        self.assertEqual(Decimal(r['simple_return']), Decimal('0.02083333333333333333333333333333333'))
        self.assertEqual(r['unit_type'], 'synthetic')

    def test_single_deposit_manual_oracle(self):
        s = parse_series(data([('2020-01-31', '100'), ('2020-02-29', '80'), ('2020-03-30', '100')]))
        r = simulate(s, req(start='2020-01-31', end='2020-03-30'))
        self.assertEqual(Decimal(r['units']), Decimal('11.25'))
        self.assertEqual(Decimal(r['value']), Decimal('1125'))
        self.assertEqual(Decimal(r['contributed']), Decimal('1100'))
        self.assertEqual(Decimal(r['profit']), Decimal('25'))
        self.assertEqual(Decimal(r['simple_return']), Decimal('0.02272727272727272727272727272727273'))
    def test_fees(self):
        s = parse_series(data([('2020-01-01', '100'), ('2020-02-01', '110')]))
        r = req(end='2020-02-01', monthly='0', sell_date='2020-02-01')
        r.update(buy_fee_rate='0.02', sell_fee_rate='0.01')
        result = compare(s, r)['sell']
        self.assertEqual(Decimal(result['cash']), Decimal('1067.22'))
        self.assertEqual(Decimal(result['fees']), Decimal('30.78'))

    def test_sale_or_hold_can_win(self):
        for final, winner in [('120', 'hold'), ('60', 'sell')]:
            s = parse_series(data([('2020-01-01', '100'), ('2020-02-01', '80'), ('2020-03-01', final)]))
            result = compare(s, req(sell_date='2020-02-01'))
            self.assertGreater(Decimal(result[winner]['value']), Decimal(result['sell' if winner == 'hold' else 'hold']['value']))
            self.assertEqual(result['hold']['contributed'], result['sell']['contributed'])
            self.assertEqual(Decimal(result['sell']['cash']), Decimal('1000'))

    def test_delayed_multiple_contributions_and_final_gap(self):
        s = parse_series(data([('2020-01-01', '100'), ('2020-04-02', '100'), ('2020-05-01', '100')]))
        r = simulate(s, req(end='2020-04-02'))
        buys = r['timeline'][-1]['operations']
        self.assertEqual(len(buys), 3)
        self.assertEqual(Decimal(r['contributed']), 1300)
        with self.assertRaises(InputError):
            simulate(s, req(end='2020-04-01'))
        self.assertTrue(r['gaps'])

    def test_weekend_and_no_coverage(self):
        s = parse_series(data([('2020-01-31','100'), ('2020-02-28','100'), ('2020-03-02','100'), ('2020-03-31','100')]))
        r = simulate(s, req(start='2020-01-31', end='2020-03-31'))
        self.assertEqual(r['timeline'][2]['operations'][0]['scheduled_date'], '2020-02-29')
        self.assertEqual(Decimal(r['contributed']), 1200)
        with self.assertRaises(InputError):
            simulate(s, req(start='2019-12-31', end='2020-03-31'))

    def test_bad_series_values_and_dates(self):
        for value in (True, None, 'NaN', 'Infinity', '-Infinity', '0', '-1'):
            with self.subTest(value=value), self.assertRaises(InputError):
                parse_series(data([('2020-01-01', value), ('2020-02-01', '100')]))
        for dates in [(('2020-01-01','1'),('2020-01-01','2')), (('2020-02-01','1'),('2020-01-01','2'))]:
            with self.assertRaises(InputError): parse_series(data(dates))
        for bad in (True, 'NaN', 'Infinity', None, [], -1):
            with self.subTest(bad=bad), self.assertRaises(InputError):
                simulate(load_series(FIX), req(initial=bad))

    def test_extreme_exponents_and_metadata_are_rejected(self):
        s = load_series(FIX)
        for value in ('1e-1000000', '1e-999999999999999999', '1' * 129, '1.123456789012345678901'):
            with self.subTest(value=value[:20]), self.assertRaises(InputError):
                simulate(s, req(initial=value))
        x = data([('2020-01-01', '100'), ('2020-02-01', '80')])
        x['metadata']['max_gap_days'] = Decimal(35)
        result = simulate(parse_series(x), req(end='2020-02-01'))
        json.dumps(result, allow_nan=False)
        self.assertEqual(result['provenance']['max_gap_days'], 35)
        for value in (float('nan'), object()):
            x['metadata']['extra'] = value
            with self.assertRaises(InputError): parse_series(x)

    def test_decimal_context_independence(self):
        s = load_series(FIX)
        request = req()
        expected = simulate(s, request)
        expected_drawdowns = drawdowns(s)
        scenario_request = {'initial':'1000', 'monthly':'100', 'months':12, 'annual_rates':{'unfavorable':'-0.1', 'central':'0', 'favorable':'0.1'}}
        expected_scenarios = scenarios(scenario_request)
        with localcontext() as ctx:
            ctx.rounding = ROUND_DOWN
            ctx.traps[Inexact] = True
            self.assertEqual(simulate(s, request), expected)
            self.assertEqual(drawdowns(s), expected_drawdowns)
            self.assertEqual(scenarios(scenario_request), expected_scenarios)

    def test_csv_metadata(self):
        x = data([('2020-01-01','100'), ('2020-02-01','80')])
        with tempfile.TemporaryDirectory() as t:
            p = Path(t)
            (p/'meta.json').write_text(json.dumps(x['metadata']), encoding='utf-8')
            (p/'data.csv').write_text('date,value\n2020-01-01,100\n2020-02-01,80\n', encoding='utf-8')
            self.assertEqual(len(load_series(p/'data.csv', p/'meta.json').observations), 2)
            with self.assertRaises(InputError): load_series(p/'data.csv')

class AnalysisTests(unittest.TestCase):
    def test_drawdown_recovered_and_open(self):
        r = drawdowns(load_series(FIX), '0.05')
        self.assertEqual([x['status'] for x in r['episodes']], ['recovered', 'open'])
        self.assertEqual([Decimal(x['depth']) for x in r['episodes']], [Decimal('.2'), Decimal('.1')])
        self.assertEqual(r['episodes'][0]['recovery_date'], '2020-03-01')
        self.assertIsNone(r['episodes'][1]['recovery_date'])
        self.assertEqual(r['comparison']['status'], 'insufficient_evidence')

    def test_scenarios_zero_and_loss(self):
        r = scenarios({'initial':'1000', 'monthly':'100', 'months':12, 'annual_rates':{'unfavorable':'-0.19', 'central':'0', 'favorable':'0.1'}})
        self.assertEqual(Decimal(r['results']['central']['value']), 2200)
        self.assertLess(Decimal(r['results']['unfavorable']['value']), 2200)
        r = scenarios({'initial':'1000', 'monthly':'0', 'months':12, 'annual_rates':{'unfavorable':'-0.19', 'central':'0', 'favorable':'0.1'}})
        self.assertAlmostEqual(float(r['results']['unfavorable']['value']), 810, places=10)
        for bad in (True, 'NaN', 'Infinity', '-1'):
            with self.assertRaises(InputError): scenarios({'initial':'1', 'monthly':'0', 'months':12, 'annual_rates':{'unfavorable':bad, 'central':'0', 'favorable':'0.1'}})

class ReliabilityTests(unittest.TestCase):
    def test_results_are_independent(self):
        x = data([('2020-01-01','100'), ('2020-03-01','80')])
        x['metadata']['extra'] = {'nested': ['original']}
        series = parse_series(x)
        result = compare(series, req(sell_date='2020-03-01'))
        result['hold']['provenance']['extra']['nested'][0] = 'changed'
        result['hold']['gaps'][0]['days'] = 0
        self.assertEqual(result['sell']['provenance']['extra']['nested'][0], 'original')
        self.assertNotEqual(result['sell']['gaps'][0]['days'], 0)
        d = drawdowns(series)
        d['provenance']['extra']['nested'][0] = 'changed'
        d['gaps'][0]['days'] = 0
        self.assertEqual(series.metadata['extra']['nested'][0], 'original')
        self.assertNotEqual(series.gaps[0]['days'], 0)

    def test_calendar_final_year(self):
        series = parse_series(data([('9999-10-31','100'), ('9999-11-30','100'), ('9999-12-31','100')]))
        for monthly, expected in [('0', 1000), ('10', 1020)]:
            result = simulate(series, req(start='9999-10-31', end='9999-12-31', monthly=monthly))
            self.assertEqual(Decimal(result['contributed']), expected)
        missing = parse_series(data([('9999-10-31','100'), ('9999-11-30','100'), ('9999-12-30','100')]))
        with self.assertRaises(InputError):
            simulate(missing, req(start='9999-10-31', end='9999-12-31', monthly='10'))
        sparse = parse_series(data([('9999-10-29','100'), ('9999-11-29','100'), ('9999-12-31','100')]))
        with self.assertRaises(InputError):
            simulate(sparse, req(start='9999-10-29', end='9999-12-30', monthly='10'))

    def test_drawdown_threshold_exact_and_extremes(self):
        series = parse_series(data([('2020-01-01','100'), ('2020-02-01','80'), ('2020-03-01','100'), ('2020-04-01','90')]))
        for threshold, count in [('0.199999',1), ('0.2',1), ('0.200001',0), ('0.15',1)]:
            self.assertEqual(len(drawdowns(series, threshold)['episodes']), count)
        near_total = parse_series(data([('2020-01-01','1e20'), ('2020-02-01','1e-20')]))
        self.assertEqual(drawdowns(near_total, '1')['episodes'], [])
        small = parse_series(data([('2020-01-01','1.0000000000000000001'), ('2020-02-01','1.0000000000000000000')]))
        self.assertGreater(Decimal(drawdowns(small)['episodes'][0]['depth']), 0)
        tiny = parse_series(data([('2020-01-01','100000000000000000000'), ('2020-02-01','99999999999999999999.99999999999999999999')]))
        self.assertGreater(Decimal(drawdowns(tiny)['episodes'][0]['depth']), 0)

    def test_scenario_independent_oracles(self):
        rates = {'unfavorable':'0.1', 'central':'0.1', 'favorable':'0.1'}
        r = scenarios({'initial':'1000', 'monthly':'0', 'months':12, 'annual_rates':rates})
        self.assertAlmostEqual(float(r['results']['central']['value']), 1100, places=9)
        rates = dict.fromkeys(rates, '-0.717570463519')
        r = scenarios({'initial':'1000', 'monthly':'100', 'months':1, 'annual_rates':rates})
        self.assertAlmostEqual(float(r['results']['central']['value']), 1000, places=8)

    def test_loader_rejects_large_integer_and_depth(self):
        with tempfile.TemporaryDirectory() as t:
            path = Path(t)/'bad.json'
            for value in ['9'*5000, '['*2000+'0'+']'*2000]:
                path.write_text(value, encoding='utf-8')
                with self.assertRaises(InputError): load_series(path)

if __name__ == '__main__': unittest.main()
