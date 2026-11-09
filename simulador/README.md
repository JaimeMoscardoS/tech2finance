# Simulador y motor

## Qué es

Biblioteca educativa Python 3.11+ sin dependencias externas y CLI JSON para reproducir series importadas, comparar dos decisiones virtuales, calcular escenarios hipotéticos y describir caídas observadas. La muestra incluida es **ficticia**, no un histórico real. No hay servidor ni conexión al frontend.

## Ejecución

Desde la raíz, con Python disponible en PATH:

```sh
python -m simulador simulate --series simulador/fixtures/synthetic-series.json --request simulador/fixtures/historical-request.json
python -m simulador compare --series simulador/fixtures/synthetic-series.json --request simulador/fixtures/historical-request.json
python -m simulador drawdowns --series simulador/fixtures/synthetic-series.json
python -m simulador scenarios --request simulador/fixtures/scenario-request.json
python -m unittest discover -s simulador/tests -v
```

En Windows, se puede sustituir `python` por la ruta del ejecutable. Éxito: JSON en stdout y código 0; error de entrada: JSON `{"schema_version":"1.0","error":{"code":"invalid_input","message":"..."}}` en stderr y código 2. La salida JSON usa escapes ASCII para funcionar con la codificación de consola de Windows.

## API Python

```python
from simulador import load_series, parse_series, simulate, compare, drawdowns, scenarios, InputError
series = load_series("simulador/fixtures/synthetic-series.json")
result = simulate(series, {"start":"2020-01-01", "end":"2020-03-01", "initial":"1000", "monthly":"100", "buy_fee_rate":"0", "sell_fee_rate":"0"})
```

`load_series(path, metadata_path=None) -> Series` lee JSON o CSV; CSV requiere `metadata_path` con un objeto JSON de metadatos. `parse_series(obj) -> Series` valida el objeto JSON ya cargado. `simulate(series, request) -> dict`, `compare(series, request) -> dict`, `drawdowns(series, threshold="0") -> dict` y `scenarios(request) -> dict` devuelven datos serializables; levantan `InputError` ante entradas inválidas. Sin acceso a red. `Series` es el tipo retornado por el cargador, no un contrato de construcción manual.

## Contratos versión 1.0

El JSON de serie contiene `schema_version: "1.0"`, `metadata` y `observations`, una lista ordenada de objetos `{"date":"YYYY-MM-DD","value":"100"}`. Se requieren al menos dos fechas únicas y crecientes, valores positivos finitos entre 1e-20 y 1e20 inclusive. Campos de `metadata`, todos obligatorios:

| Campo | Tipo y significado |
| --- | --- |
| `instrument_id`, `instrument_name`, `instrument_class` | Cadenas no vacías; identifican exactamente la clase de instrumento declarada. |
| `currency` | Tres letras ASCII mayúsculas, moneda de todas las observaciones y cantidades. Sin conversión. |
| `value_type` | `nav` para valor liquidativo declarado; `adjusted` o `price_only` para unidades sintéticas. |
| `source`, `license`, `license_date` | Cadenas no vacías y fecha ISO de licencia o consulta declarada; el motor no verifica permisos ni procedencia. |
| `frequency` | Descripción libre de frecuencia esperada. |
| `max_gap_days` | Entero de 1 a 3660; umbral declarado por quien aporta la serie, no validación de calendario de mercado. |
| `embedded_costs` | Descripción no vacía de costes ya incluidos o desconocidos. |
| `distribution_policy` | Descripción no vacía de distribución, acumulación o ajuste y cualquier incertidumbre. |
| `data_kind` | `synthetic` o `real`, declaración no verificada. |

Para CSV, encabezados `date,value`, mismas reglas de datos, y fichero JSON separado que contiene directamente el objeto `metadata`. Se devuelven en `gaps` todos los intervalos entre observaciones mayores que `max_gap_days`, incluso fuera del periodo solicitado. El umbral es una alerta documental, no prueba de que los intervalos menores estén completos ni impedimento de cálculo. No se rellenan ni interpolan observaciones: una operación puede quedar diferida sobre un hueco señalado. El consumidor debe decidir si acepta el hueco y la frecuencia declarada.

### Histórico y juego

Solicitud JSON `{"start":"2020-01-01","end":"2020-04-01","initial":"1000","monthly":"100","buy_fee_rate":"0","sell_fee_rate":"0"}`; para `compare` añadir `sell_date`. Fechas ISO incluidas en el rango de observaciones; cantidades finitas de 0 a 1e15, al menos una positiva. Tasas decimales fraccionarias entre 0 y 0.999999 inclusive. No se aceptan booleanos como números. Cadenas decimales recomendadas para evitar conversiones binarias. Cada número admite hasta 40 cifras significativas, exponente decimal interno entre -20 y 20 y, si es cadena, hasta 128 caracteres; los valores fuera de estos límites se rechazan. Los metadatos adicionales deben ser JSON serializable sin valores no finitos.

La aportación inicial se programa en `start`; las mensuales en el mismo día de cada mes posterior, o el último día si ese mes es más corto, hasta `end` inclusive. Cada aportación se compra al primer valor observado en o después de su fecha programada, dentro del periodo. Varias aportaciones pueden ejecutarse el mismo día y ninguna desaparece. Si no existe observación posterior dentro del periodo, se rechaza toda la simulación. Solo se valora en observaciones del periodo, al último valor disponible hasta `end`; este puede preceder a `end`. La cobertura declarada debe extenderse hasta `end`. No se usa un valor posterior para valorar antes de su fecha.

La comisión de compra es `importe × buy_fee_rate`, descontada del desembolso antes de calcular unidades; la de venta es `valor bruto × sell_fee_rate`. Son costes explícitos adicionales de transacción: no introducir de nuevo costes ya incorporados en la serie. No se aplica ningún coste interno automáticamente. Las unidades pueden ser fraccionarias; `nav` produce `fractional_virtual_nav`, y `adjusted` y `price_only` producen `synthetic`. Las series ajustadas no describen operaciones reales ni prueban por sí solas que se reinvirtieran dividendos. No se inventan dividendos, distribuciones, impuestos, interés del efectivo ni inflación.

La venta se ejecuta en la primera observación en o después de `sell_date`. En esa observación se procesan primero todas las aportaciones pendientes y luego se vende; las posteriores se acumulan en efectivo sin rendimiento. Ambos resultados reciben idénticas aportaciones. Son reglas del juego, no órdenes reales ni recomendaciones.

Salida histórica: `schema_version`, `currency`, `unit_type`, `contributed`, `cash`, `units`, `fees`, `value`, `profit`, `simple_return`, `timeline`, `provenance`, `gaps`, `assumptions`. Cada punto de `timeline` incluye fecha, precio, saldos, aportado, comisiones, valor y operaciones con fecha programada, importe bruto y comisión. `profit = value - contributed`; `simple_return = profit / contributed`, o `null` si aún no hay aportación. No es rentabilidad ponderada por tiempo ni TIR. `compare` contiene `hold`, `sell` y supuestos.

Todos los valores numéricos de salida se serializan como cadenas decimales. Cálculos con `Decimal`, precisión 34 dígitos significativos y redondeo mitad al par, con contexto explícito independiente del llamante; no se redondea a céntimos en cada operación. La presentación puede redondear solo al mostrar. Los cálculos no incluyen redondeos ni restricciones de contratación reales.

### Escenarios

Solicitud: `{"initial":"1000","monthly":"100","months":12,"annual_rates":{"unfavorable":"-0.1","central":"0","favorable":"0.1"}}`. `months` entero 1–1200; cantidades con los mismos límites que el histórico; tasas efectivas anuales entre -0.999999 y 1, ordenadas de desfavorable a favorable. Cada mes se multiplica el saldo por `(1+tasa)^(1/12)` y luego se añade la aportación. La salida `results` contiene tasa, valor, aportado y beneficio para cada escenario. Son hipótesis deterministas que pueden perder dinero, no previsiones; sin costes, impuestos ni inflación.

### Caídas

`drawdowns(series, threshold)` o CLI con `--request` que contenga `{"threshold":"0.05"}`. Umbral entre 0 y 1 inclusive, medido como fracción de caída. Sobre la serie, sin flujos: cada máximo observado inicia un episodio si después cae; se registra su mínimo observado y la primera observación que iguala o supera el máximo, o un episodio abierto al final. Igualdad renueva el máximo. Se muestran episodios de magnitud igual o superior al umbral, fechas, valores, magnitud, días hasta mínimo, días observados, recuperación y duración cuando se observa. No se conocen extremos ni recuperación entre observaciones. `comparison.status` es siempre `insufficient_evidence`: aún no se admiten comparables; `causes.status` es `unknown` sin fuentes inventadas. La procedencia y huecos van en la salida. Una recuperación observada no garantiza otra futura.
