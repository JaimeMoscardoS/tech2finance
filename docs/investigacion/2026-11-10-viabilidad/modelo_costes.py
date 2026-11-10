"""Calcula consumo mensual hipotético de proveedores; sin dependencias externas."""
import json
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

HERE = Path(__file__).resolve().parent
D = lambda value: Decimal(str(value))


def calculate(scenario, prices, asr_key):
    s, p = scenario, prices
    text = (D(s['input_tokens']) * D(p['input_per_million_tokens']) + D(s['output_tokens']) * D(p['output_per_million_tokens'])) / D(1000000)
    voice = D(s['voice_share']) * (D(s['tts_characters']) * D(p['tts_per_thousand_characters']) / D(1000) + D(s['asr_minutes']) * D(p[asr_key]) / D(60))
    return D(s['users']) * D(s['questions_per_user']) * (text + voice)


def money(value):
    return value.quantize(D('0.01'), rounding=ROUND_HALF_UP)


def main():
    data = json.loads((HERE / 'inputs-costes.json').read_text(encoding='utf-8'))
    expected = {'A': ('21.18', '21.33'), 'B': ('903.75', '914.38'), 'C': ('41933.33', '42500.00')}
    print('| Escenario | ASR batch USD/mes | ASR en directo USD/mes |')
    print('| --- | ---: | ---: |')
    for scenario in data['scenarios']:
        batch = money(calculate(scenario, data['prices_usd'], 'asr_batch_per_hour'))
        realtime = money(calculate(scenario, data['prices_usd'], 'asr_realtime_per_hour'))
        assert (str(batch), str(realtime)) == expected[scenario['name']], scenario['name']
        print(f"| {scenario['name']} | {batch:,.2f} | {realtime:,.2f} |")
    alternative = dict(data['prices_usd'], **data['alternative_model_prices_usd'])
    expected_alternative = {'A': ('16.18', '16.33'), 'B': ('753.75', '764.38'), 'C': ('37533.33', '38100.00')}
    print('\nSensibilidad Sonnet 5.5: mismos tokens supuestos, no necesariamente el mismo texto.')
    for scenario in data['scenarios']:
        batch = money(calculate(scenario, alternative, 'asr_batch_per_hour'))
        realtime = money(calculate(scenario, alternative, 'asr_realtime_per_hour'))
        assert (str(batch), str(realtime)) == expected_alternative[scenario['name']]
        print(f"{scenario['name']}: batch {batch:,.2f} USD; directo {realtime:,.2f} USD")


if __name__ == '__main__':
    main()
