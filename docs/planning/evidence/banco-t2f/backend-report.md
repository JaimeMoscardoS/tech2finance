# Backend y tutor de BancoT2F: comprobaciones

## Qué es

Evidencia del contexto bancario de la API y del tutor por reglas en la rama de trabajo. El perfil es sintético; las comisiones son informativas y el simulador no las descuenta.

## Comprobaciones realizadas

- `python -B -m pytest backend/tests -q`: 60 pruebas superadas. Advertencia deprecada de Starlette/httpx, sin fallo.
- `node --experimental-strip-types --test tutor-ia/tests/*.test.ts`: 27 pruebas superadas, incluidas las copias temporales LF y CRLF del corpus.
- `node --experimental-strip-types tutor-ia/evals/run.ts --check`, desde la raíz y con ruta relativa desde `frontend`: 112 casos, cero fallos en cada ejecución.
- `npx tsc --noEmit` desde `frontend`: sin errores.

Se comprobó la respuesta HTTP por el puente real, incluida la comisión anual de 75 puntos básicos (0,75 %), su exclusión del resultado y la pregunta de seguimiento. También se comprueban identificadores desconocidos, campos adicionales rechazados, producto externo sin comisiones del banco ficticio, histórico ausente y conservación de la consulta anual de 2022.

Las pruebas de banco del tutor fallaron inicialmente al no existir las respuestas y después pasaron. El recorrido completo de interfaz y la revisión independiente corresponden a la integración y no se afirman aquí.

## Correcciones de preintegración

La prueba nueva reprodujo primero un fallo en la pregunta de comisión de mantenimiento; tras la corrección pasa en español e inglés, tanto en inicio como con un producto seleccionado. También se verificaron el FAQ de productos de otras entidades, el rechazo de `BancoFantasma`, `Banco Fantasma` y `ExampleBankOther`, la identificación del instrumento seleccionado solo en exploración o simulación, y las condiciones de moneda y mínimos. El reconocimiento de nombres usa patrones locales acotados y no constituye reconocimiento universal de entidades.

Se reprodujo después la confusión de «How much did I contribute?» con costes y la atribución de condiciones a `OtherBank` y `BankOther`. Tras la corrección pasan las pruebas específicas, incluida la petición real al puente HTTP con la muestra anual de CaixaBank y 1.000 EUR aportados.
