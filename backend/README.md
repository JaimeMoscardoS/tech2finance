# Backend local de Tech2Finance

## Qué es

API de demostración con FastAPI para el catálogo de práctica, las simulaciones, el análisis de caídas y el tutor contextual. Usa los datos locales de `shared/demo-data.json` y el motor Python del repositorio. El tutor aplica las reglas TypeScript existentes mediante un proceso Node local: no es un modelo de lenguaje.

La demo no utiliza proveedores externos, claves, base de datos ni autenticación. No conecta cuentas ni realiza operaciones. Las series ficticias están identificadas como tales; la muestra anual publicada conserva su fuente y sus límites. La recuperación histórica no garantiza una recuperación futura y el usuario conserva la decisión.

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

## Rutas HTTP

Todas las peticiones y respuestas con cuerpo usan JSON. Los campos desconocidos se rechazan; no se aceptan precios, observaciones, resultados o fuentes proporcionados por el cliente.

| Ruta | Entrada | Respuesta |
| --- | --- | --- |
| `GET /api/health` | Sin cuerpo. | `status: "ok"`, `mode: "demo"`, `tutorProvider: "server_rules"`, `externalProviders: false`. |
| `GET /api/catalog` | Sin cuerpo. | `schemaVersion`, `banks`, `instruments` y `annualHistory`, con procedencia y disponibilidad de datos. |
| `POST /api/simulations` | `{ "instrumentId": "demo-mixed", "initial": 500, "recurringContribution": 50, "periods": 1 }` | Tipo de simulación, puntos y evolución temporal, valor, aportaciones, resultado, rentabilidad simple, instrumento, moneda, momento de aportación, fuentes y supuestos. |
| `POST /api/declines` | `{ "basis": "instrument", "language": "es", "instrumentId": "demo-mixed", "periods": 12 }`; para cartera, `{ "basis": "portfolio_demo", "language": "es" }`. | Informe de las observaciones del instrumento o de la cartera ficticia, episodios, fuentes y límites. Las causas son desconocidas y no hay comparables. |
| `POST /api/tutor` | `{ "message": "Explica el resultado", "context": { "page": "simulator", "level": "beginner", "language": "es", "simulation": { "instrumentId": "demo-mixed", "initial": 500, "recurringContribution": 50, "periods": 1 } } }`. | Texto, idioma, intención y fuentes; `mode: "api"` y `provider: "server_rules"` identifican el tutor por reglas del servidor. |

En simulación, `initial` y `recurringContribution` admiten números finitos entre 0 y 10⁹ EUR. Para datos ficticios, `periods` es un entero entre 1 y 120; la muestra anual admite exactamente cinco. Las aportaciones ficticias entran al inicio de cada mes; las anuales, al cierre de cada año, después de su rentabilidad.

En el tutor, el mensaje tiene entre 1 y 1500 caracteres y el historial opcional admite hasta ocho mensajes de 3000 caracteres. El contexto declara `page` (`home`, `explore`, `simulator`, `portfolio`), `level` (`beginner`, `intermediate`, `advanced`) y `language` (`es`, `en`); puede incluir `instrumentId`, una solicitud `simulation`, una solicitud `decline` y `decision` con objetivo, horizonte y necesidad de liquidez. El servidor recalcula los hechos de la simulación y de la caída; no acepta cifras ni fuentes suministradas como contexto. La simulación solo corresponde a la pantalla `simulator`, y las referencias a instrumento e idioma deben ser coherentes.

Los errores de aplicación siguen la forma `{ "error": { "code": "...", "message": "..." } }`. Entre ellos están `invalid_request` (400), `unknown_instrument` y `not_found` (404), `method_not_allowed` (405), `history_unavailable` (409), `validation_error` (422), `request_too_large` (413), `tutor_unavailable` (503) e `internal_error` (500). No se devuelve el texto original de la petición ni una traza. El cuerpo está limitado a 64 KiB. El puente del tutor admite hasta cuatro procesos simultáneos, cinco segundos por petición y 64 KiB de salida; si falla o está ocupado, devuelve 503.

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

La ejecución de integración local del 10 de noviembre de 2026 pasó 44 pruebas del backend, incluido el puente real a Node, con una advertencia de deprecación de Starlette sobre TestClient y HTTPX. Consulta los [contratos entre áreas](../docs/contratos.md) y el [contexto de integración](../docs/backend-contexto.md) para los acuerdos y límites del proyecto.
