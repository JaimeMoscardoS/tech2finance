# Integración local: resultado inicial

## Qué es

Ejecución local del 10-11-2026 sobre la worktree aislada `06-integration`, rama `verification/directors-20261110`, commit `cba2d989492315f4d1682d1b8f8e5bf43e46028d`. Incluye 01 `9bdc71d7f35f543162d81a32e4a50b5017659a1f`, 02 `558365a669c20296591637c59bcebd1716b22610`, 03 `a4c122b2662e854e63f691e3e2a6e78c9fd7d814`, 04 `83249efb413645fe3a24a7c1e775f0e86b04ed4d` y 05 `a747df61cb69a8a8d77e67a82cd4c17dfc77a4b8`. Son merges locales, no integración en `main`.

## Resultado: bloqueado por una regresión

El navegador en serie terminó **50/51**, con un fallo en `frontend/tests/frontend.spec.ts:330`: ante «¿Cuál fue la rentabilidad de 2022?», la tabla mostraba `-0,67 %` pero el tutor respondió que el instrumento o rentabilidad futura no estaban disponibles. El guard de nombres del tutor captura `2022` después de «rentabilidad de» y llega a la abstención antes de consultar la tasa anual. Responsable de corrección: línea 04. Se preserva la [salida de Playwright](e2e.log); no se ha repetido la suite completa ni corregido código en la worktree de integración. La puerta de integración no está superada.

| Comprobación | Resultado observado | Evidencia |
| --- | --- | --- |
| `npm run test:launcher` | 12/12 | [launcher](launcher.log) |
| `npm test` en frontend | 34/34, incluidas las pruebas del tutor | [frontend](frontend-unit.log) |
| `npm run build` en frontend | Salida 0; avisos Rolldown repetidos acotados en la captura | [build](frontend-build.log) |
| `python -m pytest backend/tests -q` | 54/54; una advertencia de Starlette | [backend](backend.log) |
| `python -m unittest discover -s simulador/tests -v` | 21/21 | [simulador](legacy.log) |
| `python -m pip check` | Sin dependencias rotas | [pip](pip-check.log) |
| `node --experimental-strip-types --test tutor-ia/tests/*.test.ts` | 16/16 pruebas del tutor | [tutor](tutor-unit.log) |
| `node --experimental-strip-types tutor-ia/evals/run.ts --check` | 94 casos, 0 fallos | [evaluación](tutor-check.log) |
| `python -m backend.verify_data` | Procedencia comprobada | [datos](provenance.log) |
| `npx playwright test --config=playwright.integration.config.ts --workers=1` | 50/51 | [navegador](e2e.log) |

El frontend de integración usó la configuración temporal sin `webServer`, base `127.0.0.1:5175` y Chrome headless. El lanzador propio usó backend `8095` y el Python del `.venv` original. Por el proxy de 5175, catálogo y simulación devolvieron `datasetVersion=demo-2026-11-09.1`, `calculationVersion=demo-calculations-1.0.0` y SHA-256 `8a0f06c8b95182bde24f9834763c3b39c194e7500b40ac83662c9b7e7f08fb45`; el tutor se abstuvo ante una consulta sobre Tesla mañana. Esta comprobación no sustituye el caso anual que falló.

Al finalizar se detuvo el lanzador propio: no había procesos escuchando en 8095 o 5175 y los servicios originales de 8000 y 5173 respondían HTTP 200, igual que antes. La captura de dos rutas de la advertencia de backend perdió caracteres al decodificar la salida de consola; se omitieron esas líneas sin reconstruirlas, conservando la advertencia y el resultado. Un error de codificación en el recopilador después del primer test y una ruta mal transmitida antes de arrancar backend se corrigieron sin repetir suites que ya habían pasado.

La CI remota, Linux nativo, los derechos de datos, la revisión jurídica y el aprendizaje con participantes permanecen pendientes. Este resultado no prueba disponibilidad de producción ni revisión financiera independiente.
