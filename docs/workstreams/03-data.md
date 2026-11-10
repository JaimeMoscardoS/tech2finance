# Datos y reproducibilidad — 03

## Qué es

Base local de procedencia para el catálogo y el cálculo periódico de la demo del servidor. El área 03 lidera esta base; backend 02 es consumidor. No es una integración de feeds ni una unificación lista para producción.

## Implementado

`shared/data-manifest.json` identifica el conjunto completo `demo-2026-11-09.1`, el cálculo del servidor `demo-calculations-1.0.0` y su SHA-256. `canonical-json-v1` serializa el documento JSON completo con `json.dumps(data, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False).encode('utf-8')`. Se rechazan claves duplicadas y números no finitos. El servidor carga exactamente el documento verificado contra manifiesto, hash y copia retenida; ante diferencias falla al iniciar. Catálogo y simulación añaden `provenance`; caídas y contexto del tutor no cambian.

Comprobación local desde la raíz:

```sh
python -m backend.verify_data
```

La instantánea `shared/snapshots/demo-2026-11-09.1/demo-data.json` es inmutable por política. Para cambiar contenido, crear versión y ruta nuevas, conservar las anteriores y actualizar código y manifiesto deliberadamente. Para reproducir esta versión, leer esa instantánea y pasar sus tasas y fechas a `simulador.periodic.replay(initial, contribution, rates, dates, kind)` con la versión de código correspondiente; las entradas y resultados independientes de ejemplo están en `simulador/fixtures/golden-periodic-v1.json` y `backend/tests/test_provenance.py`. La versión identifica las reglas y código actuales del servidor; no empaqueta ni archiva el algoritmo. No identifica el cálculo TypeScript local, que sigue sin versión. El motor histórico anterior permanece aislado.

## Pendiente

B04: el registro interno de derechos no constituye aprobación de usos ni verifica permisos comerciales o de redistribución. B05: las pruebas de aportaciones, contextos decimales y caídas cubren casos adicionales; no constituyen certificación financiera independiente completa. B06: esta base permite reproducir la muestra retenida con su código; faltan gobierno de versiones y evidencia de integración para una fuente externa. No se incorporan datos personales, infraestructura ni feeds de pago.
