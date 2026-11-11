"""Collect selected CNMV classes, retaining only compact extracts outside the repo.

Usage: python tools/collect_cnmv.py C:/path/to/private-cache
Each month is independently resumable and records the downloaded archive hash.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date
from decimal import Decimal, InvalidOperation
from hashlib import sha256
from html import unescape
from io import BytesIO
import json
from pathlib import Path
import re
import sys
import time
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET
from zipfile import ZipFile

ISINS = ('ES0138045002', 'ES0112793007', 'ES0125269003', 'ES0146133006', 'ES0118857004')
IDENTITY = {
    'ES0138045002': ('2680', '1', {'CAIXABANK MONETARIO RENDIMIENTO, FI'}),
    'ES0112793007': ('441', '1', {'SPB RF AHORRO, FI', 'SANTANDER RF AHORRO, FI'}),
    'ES0125269003': ('4458', '0', {'BBVA MI INVERSION BOLSA ACUMULACION, FI'}),
    'ES0146133006': ('208', '1', {'SANTANDER RENTA FIJA, FI'}),
    'ES0118857004': ('5032', '0', {'BBVA ESTRATEGIA 0-50, FI'}),
}
MONTHS = ('Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre')
INDEX = 'https://www.cnmv.es/portal/publicaciones/descarga-informacion-individual.aspx?ejercicio='


def fetch(url):
    for attempt in range(4):
        try:
            with urlopen(Request(url, headers={'User-Agent': 'Tech2Finance educational research/1.0'}), timeout=120) as response:
                return response.read()
        except Exception:
            if attempt == 3:
                raise
            time.sleep(2 ** attempt)


def urls(year):
    page = fetch(INDEX + str(year)).decode('cp1252', 'replace')
    found = {}
    for link, month in re.findall(r'href="([^"]+)"\s+title="(' + '|'.join(MONTHS) + r')"', page, re.I):
        found[MONTHS.index(month.capitalize()) + 1] = unescape(link)
    return found


def xml(archive, prefix, required=True):
    matches = [item for item in archive.namelist() if Path(item).name.upper().startswith(prefix) and item.lower().endswith('.xml')]
    if not matches and not required:
        return None
    if len(matches) != 1:
        raise ValueError(f'{prefix}: expected one XML, found {matches}')
    return ET.fromstring(archive.read(matches[0]))


def classes(root):
    selected = {}
    for entity in root.findall('Entidad'):
        for item in entity.findall('.//Clase'):
            isin = item.findtext('ISIN')
            if isin in ISINS:
                if isin in selected:
                    raise ValueError(f'duplicate ISIN {isin}')
                selected[isin] = (entity, item)
    return selected


def collect(year, month, url, root):
    key = f'{year}{month:02d}'
    path = root / f'{key}.json'
    zip_path = root / f'{key}.zip'
    if zip_path.exists():
        data = zip_path.read_bytes()
    else:
        data = fetch(url)
        zip_path.write_bytes(data)
    if path.exists():
        cached = json.loads(path.read_text(encoding='utf-8'))
        if cached['sourceUrl'] != url or cached['archiveSha256'] != sha256(data).hexdigest():
            raise ValueError(f'cached archive identity mismatch: {key}')
        if all('className' in entry for entry in cached['classes'].values()):
            return key, cached
    result = {'period': key, 'sourceUrl': url, 'archiveSha256': sha256(data).hexdigest(), 'classes': {}}
    with ZipFile(BytesIO(data)) as archive:
        mens = xml(archive, 'FONDMENS')
        registro = xml(archive, 'FONDREGISTRO')
        if mens.findtext('FechaDatos') != key or registro.findtext('FechaDatos') != key:
            raise ValueError(f'period mismatch {key}')
        names = {(e.findtext('Tipo'), e.findtext('NumeroRegistro')): e.findtext('Denominacion') for e in registro.findall('Entidad')}
        registry_classes = classes(registro)
        for isin, (entity, item) in classes(mens).items():
            observations = []
            for child in item.findall('./VLDiario/*'):
                match = re.fullmatch(r'VL_Dia(\d+)', child.tag, re.I)
                if not match or not child.text or not child.text.strip():
                    continue
                try:
                    day = date(year, month, int(match.group(1))).isoformat()
                    value = Decimal(child.text.strip())
                    if value.is_finite() and value > 0:
                        observations.append({'date': day, 'nav': child.text.strip()})
                except (ValueError, InvalidOperation):
                    continue
            observations.sort(key=lambda x: x['date'])
            reg = (entity.findtext('Tipo'), entity.findtext('NumeroRegistro'))
            reg_entity, reg_class = registry_classes.get(isin, (None, None))
            if reg_entity is None or (reg_entity.findtext('NumeroRegistro'), reg_class.findtext('NumeroClase')) != (reg[1], item.findtext('NumeroClase')):
                raise ValueError(f'monthly/registry class mismatch: {key} {isin}')
            result['classes'][isin] = {'registry': reg[1], 'classNumber': item.findtext('NumeroClase'),
                                       'className': reg_class.findtext('DenominacionClase'),
                                       'name': names.get(reg), 'observations': observations}
        if month % 3 == 0:
            result['quarterly'] = {}
            quarterly = xml(archive, 'FONDTRIM', required=False)
            if quarterly is not None:
                if quarterly.findtext('FechaDatos') != key:
                    raise ValueError(f'quarter period mismatch {key}')
                for isin, (entity, item) in classes(quarterly).items():
                    result['quarterly'][isin] = {'registry': entity.findtext('NumeroRegistro'), 'classNumber': item.findtext('NumeroClase'),
                                                 'currency': item.findtext('CodigoDivisa') or entity.findtext('CodigoDivisaIIC'),
                                                 'grossDistribution': item.findtext('Beneficio_Dividendo_Bruto')}
    path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return key, result


def main():
    root = Path(sys.argv[1]).resolve()
    root.mkdir(parents=True, exist_ok=True)
    tasks = []
    for year in range(2019, 2026):
        found = urls(year)
        for month in ([12] if year == 2019 else range(1, 13)):
            if month not in found:
                raise ValueError(f'CNMV index missing {year}-{month:02d}')
            tasks.append((year, month, found[month], root))
    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [pool.submit(collect, *task) for task in tasks]
        for future in as_completed(futures):
            key, result = future.result()
            print(key, 'classes', len(result['classes']), 'quarterly', len(result.get('quarterly', {})), flush=True)


if __name__ == '__main__':
    main()
