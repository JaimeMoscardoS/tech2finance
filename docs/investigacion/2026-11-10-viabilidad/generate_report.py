"""Genera el informe y el apéndice trazable desde JSON, sin dependencias externas."""
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent


def lookup(obj, key, categories):
    if key in obj:
        return obj[key]
    for category in categories:
        value = obj.get(category)
        if isinstance(value, dict) and key in value:
            return value[key]
    for value in obj.values():
        if isinstance(value, dict):
            found = lookup(value, key, [])
            if found is not None:
                return found
    return None


def format_value(value):
    if isinstance(value, dict):
        return '; '.join(f'{k}: {format_value(v)}' for k, v in value.items())
    if isinstance(value, list):
        return '<br>'.join(format_value(v) for v in value)
    return str(value).replace('|', '\\|').replace('\n', '<br>')


def main():
    fields = json.loads((HERE / 'fields.yaml').read_text(encoding='utf-8'))
    document = json.loads((HERE / 'contenido.json').read_text(encoding='utf-8'))
    sections = [{'title': x[0], 'body': x[1]} if isinstance(x, list) else x for x in document['sections']]
    out = ['# Viabilidad empresarial de Tech2Finance', '', '> Investigación y recomendaciones de trabajo; no decisiones aprobadas. Corte: 10 de noviembre de 2026.', '', '## Índice', '']
    for i, section in enumerate(sections, 1):
        slug = re.sub(r'[^\w -]', '', section['title'].lower()).replace(' ', '-')
        out.append(f"{i}. [{section['title']}](#{slug})")
    for section in sections:
        out.extend(['', '## ' + section['title'], '', section['body'].strip(), ''])
    (HERE / 'informe.md').write_text('\n'.join(out), encoding='utf-8')
    appendix = ['# Resultados estructurados de investigación', '', 'Los campos inciertos se presentan como preguntas de validación, no como hechos.', '']
    known = {f['name'] for category in fields['categories'] for f in category['fields']}
    for path in sorted((HERE / 'results').glob('*.json')):
        obj = json.loads(path.read_text(encoding='utf-8'))
        appendix.extend(['## ' + obj['name'], ''])
        uncertain = obj.get('uncertain', [])
        for category in fields['categories']:
            lines = []
            for field in category['fields']:
                value = lookup(obj, field['name'], [category['name'], category.get('label', '')])
                if value is None or value == '' or field['name'] in uncertain or '[uncertain]' in str(value):
                    continue
                lines.append(f"- **{field['label']}:** {format_value(value)}")
            if lines:
                appendix.extend(['### ' + category['label'], '', *lines, ''])
        extras = {k: v for k, v in obj.items() if k not in known | {'name', 'uncertain'} and k not in {c['name'] for c in fields['categories']}}
        if extras:
            appendix.extend(['### Otros datos', '', *[f'- **{k}:** {format_value(v)}' for k, v in extras.items()], ''])
        if uncertain:
            appendix.extend(['### Pendiente de validar', '', *[f'- {format_value(x)}' for x in uncertain], ''])
    (HERE / 'apendice-resultados.md').write_text('\n'.join(appendix), encoding='utf-8')


if __name__ == '__main__':
    main()
