import json
import subprocess
import sys
import tempfile
from pathlib import Path
import unittest

class CLITests(unittest.TestCase):
    def run_cli(self, *args):
        return subprocess.run([sys.executable, '-m', 'simulador', *args], capture_output=True, text=True, encoding='utf-8')
    def test_valid_cli(self):
        p = self.run_cli('simulate', '--series', 'simulador/fixtures/synthetic-series.json', '--request', 'simulador/fixtures/historical-request.json')
        self.assertEqual(p.returncode, 0, p.stderr)
        self.assertEqual(json.loads(p.stdout)['schema_version'], '1.0')
    def test_invalid_metadata_json_has_structured_error(self):
        x = json.loads(Path('simulador/fixtures/synthetic-series.json').read_text(encoding='utf-8'))
        x['metadata']['extra'] = float('nan')
        with tempfile.TemporaryDirectory() as t:
            path = Path(t) / 'invalid.json'
            path.write_text(json.dumps(x), encoding='utf-8')
            p = self.run_cli('drawdowns', '--series', str(path))
        self.assertEqual(p.returncode, 2)
        self.assertEqual(json.loads(p.stderr)['error']['code'], 'invalid_input')
        self.assertNotIn('Traceback', p.stderr)

    def test_invalid_cli(self):
        p = self.run_cli('simulate', '--series', 'missing.json')
        self.assertNotEqual(p.returncode, 0)
        self.assertEqual(json.loads(p.stderr)['error']['code'], 'invalid_input')
        self.assertNotIn('Traceback', p.stderr)

    def test_oversized_and_deep_json_are_structured_errors(self):
        with tempfile.TemporaryDirectory() as t:
            path = Path(t) / 'bad.json'
            for contents in ('9' * 5000, '[' * 2000 + '0' + ']' * 2000):
                path.write_text(contents, encoding='utf-8')
                for args in [('scenarios', '--request', str(path)), ('drawdowns', '--series', str(path))]:
                    result = self.run_cli(*args)
                    self.assertEqual(result.returncode, 2)
                    self.assertEqual(json.loads(result.stderr)['error']['code'], 'invalid_input')
                    self.assertNotIn('Traceback', result.stderr)
