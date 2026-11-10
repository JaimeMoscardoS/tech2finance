# BancoT2F: integración local, 10 de noviembre de 2026

## Qué es

Registro de la comprobación en Windows de la rama de trabajo, usando la API propia en 8097 y frontend en 5177. No acredita despliegue, funcionamiento de hardware de voz ni ejecución en Linux o Node 24. La demo anterior en 5175/8095 no se ha detenido. Las comprobaciones locales indicadas pasaron tras corregir los cuatro fallos iniciales; la revisión independiente sigue pendiente.

| Comprobación | Resultado observado |
| --- | --- |
| `pytest backend/tests simulador/tests -q` | 81 pasadas, 17 subtests; una advertencia Starlette sobre TestClient/httpx. |
| `pip check` | Sin dependencias rotas. |
| `python -m backend.verify_data` | Dataset `demo-2026-11-10.1`, SHA-256 canónico `70d234a224a2dc3f08d8e3f92cd4bfad3456ebb3cbcd9bb8db208940dafed0a4`; cálculo `demo-calculations-1.0.0`. |
| `npm test` en frontend | 46/46. |
| `npm run build` en frontend | Correcto; avisos Rolldown sobre directivas `use client`. |
| `npm run test:launcher` | 12/12. |
| `node --experimental-strip-types tutor-ia/evals/run.ts --check` | 112 casos, 0 fallos. |
| `npx playwright test --config playwright.bank.config.ts --workers=1` | 55/55 tras correcciones; la primera ejecución produjo los cuatro fallos descritos abajo. Chrome headless, configuración temporal sin servidor propio. |
| [Matriz API ES/EN](api-matrix.json) | 24 respuestas HTTP 200 revisadas frente a las expectativas del guion, sin acreditar el recorrido visual. Simulación y caídas incluidas en el archivo. |
| `npx playwright test --config playwright.bank.config.ts tests/bank-rehearsal.spec.ts --workers=1` | 2/2 pruebas; 12 preguntas por idioma ensayadas en interfaz real con servidor y comprobaciones de respuesta y contexto: [ES](gui-rehearsal-es.json), [EN](gui-rehearsal-en.json). La primera ejecución detectó una expectativa de formato decimal incorrecta en la propia prueba inglesa; corregida a punto decimal y repetidas ambas pruebas. |

La API calculó 892,63889790075 EUR, pérdida −107,36110209925 EUR y −10,736110209925 % para Equilibrio y seis meses. Para cartera devolvió 1.093 EUR, caída máxima 2,7027027 % y caída actual 1,5315315 %. Son datos ficticios, redondeados en el guion; comisiones de BancoT2F no descontadas.

## Fallos observados en la primera ejecución

1. `bank-demo.spec.ts:29`: espera el control `Duración`, cuyo nombre accesible observado es `Tiempo de práctica`. [Contexto](bank-demo-bank-identity-pr-b83c1-low-the-selected-instrument.md).
2. `frontend.spec.ts:334`: tras cambiar idioma no conserva la respuesta anterior en el chat escrito como espera la prueba. [Contexto](frontend-local-tutor-groun-bb698--and-excludes-dirty-results.md).
3. `frontend.spec.ts:424`: tras cambiar idioma no encuentra `Listen` para leer la respuesta guardada. [Contexto](frontend-saved-Spanish-ans-0da55-ictation-follows-English-UI.md).
4. `server.spec.ts:23`: «How much did I contribute?» devuelve indisponibilidad para banco o producto en lugar del importe esperado. [Contexto](server-real-server-calcula-2a880-ecline-and-contextual-tutor.md).

La segunda ejecución completa pasó las cuatro pruebas y las otras 51. Los contextos anteriores se conservan como evidencia de la primera ejecución; la revisión independiente sigue pendiente.

## Capturas

Tomadas después de la ejecución de Playwright: [banco en escritorio](screenshots/desktop-banco.png), [costes de Equilibrio](screenshots/desktop-equilibrio.png) y [banco en móvil 320 px, inglés y tema oscuro](screenshots/mobile-bank-dark.png). Se observó anchura de documento igual a la ventana, 320 px, en esa vista móvil. Estas capturas no comprueban todas las interacciones ni dispositivos físicos.
