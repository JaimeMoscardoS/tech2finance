# Backend local de Tech2Finance

## Qué es

El perfil de la entidad ficticia y sus tarifas informativas se documenta en [BancoT2F](../docs/banco-t2f.md); la [batería de demo](../presentacion/demo-banco-t2f.md) debe verificarse sobre la integración final.

API de demostración con FastAPI para el catálogo de práctica, las simulaciones, el análisis de caídas y el tutor contextual. Usa los datos locales de `shared/demo-data.json` y el motor Python del repositorio. El tutor aplica las reglas TypeScript existentes mediante un proceso Node local: no es un modelo de lenguaje.

La demo no consulta proveedores externos en directo ni utiliza claves, base de datos o autenticación. No conecta cuentas ni realiza operaciones. Las series activas proceden de valores liquidativos CNMV descargados y versionados; la muestra anual publicada conserva su fuente y sus límites. La recuperación histórica no garantiza una recuperación futura y el usuario conserva la decisión.

## Requisitos y arranque

Se ha utilizado Python 3.14.4 y se necesita Node.js **22.12 o posterior** en `PATH` para ejecutar el tutor. La prueba local del puente se ha realizado con Node 25.9.0. Instala las dependencias fijadas en un entorno virtual, desde la raíz del repositorio:

```powershell
# Windows PowerShell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.\.venv\Scripts\python.exe -m uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

```sh
# Linux/macOS
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
.venv/bin/python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

El servidor se inicia en la interfaz local `127.0.0.1`; este comando no publica la demo en la red. Para la instalación y el funcionamiento del frontend, consulta su [README](../frontend/README.md). El modo backend y la alternativa local de la interfaz son elecciones explícitas; el fallo del servidor no cambia silenciosamente al modo local.

### Arranque conjunto de la demo

Con Python 3.14 y Node.js 22.12 o posterior instalados, prepara el entorno desde la raíz. En Windows PowerShell:

```powershell
py -3.14 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
npm --prefix frontend ci
npm run dev:full
```

En macOS/Linux:

```sh
python3.14 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
npm --prefix frontend ci
npm run dev:full
```

La interfaz abre en `http://127.0.0.1:5173` y el backend en `127.0.0.1:8000`. El mensaje «Listo» aparece tras validar `health` y `catalog` tanto directamente como mediante el proxy. Ctrl+C detiene ambos procesos iniciados. Si un puerto está ocupado, el comando falla sin reutilizar el servidor: detén el proceso correspondiente o elige otros puertos. Por ejemplo:

```powershell
$env:T2F_BACKEND_PORT="8092"; $env:T2F_FRONTEND_PORT="5192"; npm run dev:full
```

```sh
T2F_BACKEND_PORT=8092 T2F_FRONTEND_PORT=5192 npm run dev:full
```

`T2F_PYTHON` permite elegir la ruta completa a otro intérprete con las dependencias instaladas. Si falla un proceso, se detiene el otro; revisa los mensajes y vuelve a ejecutar el comando. `npm run dev:full -- --help` muestra los requisitos. Es un arranque local de demostración, no una preparación para producción.

## Rutas HTTP

Todas las peticiones y respuestas con cuerpo usan JSON. Los campos desconocidos se rechazan; no se aceptan precios, observaciones, resultados o fuentes proporcionados por el cliente.

| Ruta | Entrada | Respuesta |
| --- | --- | --- |
| `GET /api/health` | Sin cuerpo. | `status: "ok"`, `mode: "demo"`, `tutorProvider: "server_rules"`, `externalProviders: false`. |
| `GET /api/catalog` | Sin cuerpo. | `schemaVersion`, `banks`, `instruments` y `annualHistory`, con procedencia y disponibilidad de datos. |
| `POST /api/simulations` | `{ "instrumentId": "bbva-mi-inversion-bolsa-acumulacion", "initial": 500, "recurringContribution": 50, "periods": 1 }` | Resultado con fechas de NAV, aportaciones, fuentes y versiones de datos y cálculo. `startDate` opcional debe coincidir con un cierre observado. |
| `POST /api/game/compare` | `{ "instrumentId": "bbva-mi-inversion-bolsa-acumulacion", "initial": 500, "monthly": 50, "months": 12, "sellMonth": 6, "buyFeeRate": 0, "sellFeeRate": 0 }`. | Comparación educativa mantener/vender con fechas de programación y ejecución reales; el frontend aún no consume este endpoint. |
| `POST /api/declines` | `{ "basis": "instrument", "language": "es", "instrumentId": "bbva-mi-inversion-bolsa-acumulacion", "periods": 3 }`; para cartera, `{ "basis": "portfolio_demo", "language": "es" }`. | Caída observada, fuentes y límites; evento OMS solo dentro de su periodo, sin atribución causal. |
| `POST /api/tutor` | Pregunta y contexto de pantalla, con especificación opcional de simulación o caída. | Texto, idioma, intención y fuentes; `mode: "api"` y `provider: "server_rules"` identifican el tutor por reglas. |

En simulación, `initial` y `recurringContribution` admiten números finitos entre 0 y 10⁹ EUR. Los periodos mensuales se limitan a los cierres observados disponibles (máximo 72 desde la fecha inicial). Cada aportación se suma tras la variación del NAV en el cierre correspondiente. La muestra anual anterior se conserva aparte y no se interpola.

La fuente y la elegibilidad por informes semestrales se explican en [contratos](../docs/contratos.md#datos-cnmv-y-cálculo-mensual-rama-de-trabajo). La [Ley 18/2022](https://www.boe.es/eli/es/l/2022/09/28/18) eliminó la obligatoriedad trimestral, y el [Real Decreto 816/2023](https://www.boe.es/eli/es/rd/2023/11/08/816) desarrolló el cambio; no se imputan como cero los informes ausentes. El [traspaso del juego](../docs/planning/historical-investment-game.md) no representa una interfaz ya implementada.

En el tutor, el mensaje tiene entre 1 y 1500 caracteres y el historial opcional admite hasta ocho mensajes de 3000 caracteres. El contexto declara `page` (`home`, `explore`, `simulator`, `portfolio`), `level` (`beginner`, `intermediate`, `advanced`) y `language` (`es`, `en`); puede incluir `instrumentId`, una solicitud `simulation`, una solicitud `decline` y `decision` con objetivo, horizonte y necesidad de liquidez. En `explore` también reconstruye el fondo seleccionado a partir de `instrumentId`. El servidor recalcula los hechos de la simulación y de la caída; no acepta cifras ni fuentes suministradas como contexto. La simulación solo corresponde a la pantalla `simulator`, y las referencias a instrumento e idioma deben ser coherentes.

Los errores de aplicación siguen la forma `{ "error": { "code": "...", "message": "..." } }`. Entre ellos están `invalid_request` (400), `unknown_instrument` y `not_found` (404), `method_not_allowed` (405), `history_unavailable` (409), `validation_error`, `game_unavailable` e `invalid_game` (422), `request_too_large` (413), `tutor_unavailable` (503) e `internal_error` (500). No se devuelve el texto original de la petición ni una traza. El cuerpo está limitado a 64 KiB. El puente del tutor admite hasta cuatro procesos simultáneos, cinco segundos por petición y 64 KiB de salida; si falla o está ocupado, devuelve 503.

## Comprobación

Desde la raíz, con el entorno instalado y Node disponible:

```powershell
# Windows PowerShell
.\.venv\Scripts\python.exe -m pytest backend/tests -q
.\.venv\Scripts\python.exe -m pip check
```

```sh
# Linux/macOS
.venv/bin/python -m pytest backend/tests -q
.venv/bin/python -m pip check
```

Las cifras siguientes son anteriores a `POST /api/game/compare` y no se han actualizado (`test_api.py` no se ejecuta sin FastAPI instalado). La ejecución de integración local del 10 de noviembre de 2026 pasó 44 pruebas del backend, incluido el puente real a Node, con una advertencia de deprecación de Starlette sobre TestClient y HTTPX. Consulta los [contratos entre áreas](../docs/contratos.md) y el [contexto de integración](../docs/backend-contexto.md) para los acuerdos y límites del proyecto.
