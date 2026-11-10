# Experiencia: recuperación del catálogo

## Qué es

Pantalla de espera y recuperación para el catálogo del servidor de demo, con preferencias ES/EN y tema claro/oscuro accesibles antes de entrar. La demo local requiere una elección expresa; no sustituye silenciosamente un fallo del servidor. Un reintento carga de nuevo el catálogo y cambiar de modo cancela las solicitudes anteriores. Las operaciones invalidan su reintento cuando cambian sus entradas o contexto.

## Comprobación y límites

El recorrido automatizado se encuentra en `frontend/tests/recovery.spec.ts` y cubre error, carga demorada, preferencias, teclado, cambio de modo y respuestas tardías. Las capturas se generan en `frontend/test-results/` y se conservan para revisión local en `artifacts/recovery-review/`. El comportamiento con NVDA y macOS requiere pruebas manuales; las pruebas de navegador no acreditan su funcionamiento con lectores de pantalla.

- `npm test`: 23/23; también verificado por la dirección. `npm run build`: salida 0 con avisos de Rolldown sobre `use client`.
- `npx playwright test --workers=1`: 51/51. Tras reforzar la espera de los callbacks tardíos, `npx playwright test tests/recovery.spec.ts --workers=1`: 8/8. `git diff --check`: sin errores.
- La ejecución paralela anterior pasó 46/48: `frontend.spec.ts:88` no recuperó el foco del botón de menú después de Escape y `practice.spec.ts:107` agotó el tiempo durante un scroll/clic. La causa es desconocida; los dos casos pasaron en serie, pero no se certifica la estabilidad paralela.
- Revisión independiente, ronda 1: 8,5/10, sin hallazgos críticos ni altos. Se inspeccionaron capturas y el estado inglés oscuro a 320 px: sin desbordamiento, con botones de 48 px y foco visible.
- Mejora pendiente de baja gravedad: al pasar de local a servidor y fallar, o al volver a fallar tras reintentar, el foco puede quedar en `body`; se puede continuar mediante Tab. NVDA y macOS siguen pendientes de comprobación manual.
