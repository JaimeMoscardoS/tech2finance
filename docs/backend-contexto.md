# Contexto de integración para backend

## Qué es

La rama integra una API local FastAPI de demostración y el frontend React/TypeScript. Por defecto el frontend solicita catálogo y cálculos al servidor; un fallo se muestra y permite reintento o selección explícita de demo local. No existe autenticación, base de datos, conexión bancaria, despliegue ni proveedor externo. El tutor usa reglas mediante un proceso Node local, no un LLM.

## Contrato y funcionamiento

`GET /api/health` informa del modo; `GET /api/catalog` entrega versión, bancos, instrumentos e histórico anual. `POST /api/simulations` recibe `instrumentId`, `initial`, `recurringContribution`, `periods`. Los importes son 0 a 10⁹ EUR, la serie ficticia admite 1–120 meses y la anual cinco años. El resultado distingue aportación mensual al inicio y anual al cierre.

`POST /api/declines` acepta base `instrument` con identificador, periodos e idioma, o `portfolio_demo` con idioma. La caída del instrumento usa su rendimiento sin aportaciones. `POST /api/tutor` recibe pregunta, historial acotado y pantalla, nivel, idioma, parámetros opcionales de simulación y caída y decisión opcional. El servidor reconstruye hechos y fuentes: el cliente no aporta saldos ni resultados. El tutor devuelve `mode: api` y `provider: server_rules`; requiere Node >= 22.12 con soporte de `--experimental-strip-types`.

Los errores se devuelven como `{error:{code,message}}`; hay 404 para instrumento desconocido, 409 para histórico ausente, 422 para validación y 503 si falla el tutor. El cliente aplica límite de 10 segundos, cancelación y validación de respuesta. `shared/demo-data.json` es la fuente común para modo local y servidor. Las muestras ficticias no son predicciones, y la fuente publicada anual conserva sus restricciones de licencia y redondeo en [contratos](contratos.md).

## Ejecución y estado

Seguir [frontend/README](../frontend/README.md) para instalar y arrancar ambos procesos y las pruebas. La rama implementa la integración local; su estado de pruebas y revisión se documenta en el PR. El motor histórico Python independiente no recibe estas peticiones. No se han integrado noticias, comparables, Claude, ElevenLabs ni datos en tiempo real.
