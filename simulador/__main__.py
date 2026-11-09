"""JSON command line entry point."""
import argparse
import json
import sys
from . import InputError, load_series, simulate, compare, scenarios, drawdowns
from .series import read_json

class Parser(argparse.ArgumentParser):
    def error(self, message):
        raise InputError(message)

def main():
    try:
        parser = Parser(prog='python -m simulador')
        parser.add_argument('command', choices=('simulate', 'compare', 'scenarios', 'drawdowns'))
        parser.add_argument('--series')
        parser.add_argument('--metadata')
        parser.add_argument('--request')
        args = parser.parse_args()
        request = {}
        if args.request:
            request = read_json(args.request)
        if args.command == 'scenarios':
            result = scenarios(request)
        else:
            if not args.series:
                raise InputError('--series is required')
            series = load_series(args.series, args.metadata)
            if args.command == 'simulate':
                result = simulate(series, request)
            elif args.command == 'compare':
                result = compare(series, request)
            else:
                if not isinstance(request, dict):
                    raise InputError('request must be an object')
                result = drawdowns(series, request.get('threshold', '0'))
        print(json.dumps(result, ensure_ascii=True, allow_nan=False))
        return 0
    except (InputError, OSError, UnicodeError, json.JSONDecodeError) as exc:
        print(json.dumps({'schema_version': '1.0', 'error': {'code': 'invalid_input', 'message': str(exc)}}, ensure_ascii=True), file=sys.stderr)
        return 2

if __name__ == '__main__':
    sys.exit(main())
