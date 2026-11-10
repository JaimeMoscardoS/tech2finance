# BancoT2F: registro de ejecución

## Qué es

Registro de decisiones, comprobaciones y revisiones de la integración de BancoT2F.

- Base local: `6f56d5c2eb022dd0d1bed1c75e1729d5d13ab628`; rama base `integration/bank-demo-base`, pendiente de publicación.
- Baseline en esta base: frontend 39/39 y build correcto con avisos Rolldown; backend 54/54 con advertencia Starlette; simulador 21/21.
- Contrato y plan aprobados por coordinación antes de implementación. Revisión independiente y pruebas integradas pendientes.
- Revisiones: máximo cuatro rondas, mínimo 8/10 por revisor, sin críticos ni altos abiertos; no iniciar una quinta. Límite de seis agentes simultáneos; escritura Terra, revisión Sol en solo lectura.

## Responsables y estado

| Identidad | Función | Estado |
| --- | --- | --- |
| `root` | Coordinación y revisión Sol, solo lectura | Activo |
| `bank_data` | Datos, contrato y planificación, Terra high | Tarea 1 verificada; portabilidad de snapshot comprobada; documentación de planificación cedida |
| `bank_tutor` | API y tutor, tareas 2–3, Terra high | Implementado; verificación local integrada registrada; revisión independiente pendiente |
| `bank_frontend` | Interfaz y voz cliente, tarea 4, Terra high | Implementado; verificación local integrada registrada; revisión independiente pendiente |
| `bank_demo_docs` | Guion y documentación, Terra high | Guion y contexto escritos; matriz API, suite de navegador y ensayo de 24 preguntas en pantalla registrados |
| Dos revisores independientes | Sol, revisión de áreas distintas | Futuros; R1 pendiente |

## Prerrevisión semántica y rulings

| Par o comprobación | Regla de integración | Estado |
| --- | --- | --- |
| Datos → API | `BankProfile` es fuente verificada; `bankId` opcional por defecto `demo`, desconocido 400 y extras 422 | Contrato fijado; API en curso |
| API → tutor | Interno: `TutorContext.bank?: BankProfile` e `instrument.product?: BankProduct` anidado; sin `product` superior. Producto solo en `explore`/`simulator`; cliente solo `bankId` bancario opcional, servidor resuelve y rechaza `bank`, `bankProfile` y `product` inyectados con 422 | Verificado en pruebas locales; revisión independiente pendiente |
| Datos → UI/tutor | Tipos y seed coinciden; 75 bps = 0,75 % anual, orden 1 EUR informativa, `null` desconocido; comisiones excluidas | Seed verificado; consumidores en curso |
| Página → contexto | Banco en `home`, `explore`, `simulator`, `portfolio`; al omitir banco se usa `demo`; selección ajena no obtiene costes demo | Contrato fijado; prueba integrada pendiente |
| Voz → sesión | Historial de hasta ocho mensajes; reinicio vacía historial. **Ruling:** propiedad cliente de tarea 4, no tarea 3 | En curso por `bank_frontend` |
| Plan ↔ spec | Cinco tareas, mismas interfaces y límites; guion canónico de doce preguntas en `presentacion/demo-banco-t2f.md` | Las 24 respuestas ES/EN comprobadas por API y en pantalla; revisión independiente pendiente |
| Snapshot antiguo ↔ Git Windows/Linux | **Ruling:** identidad textual anclada a SHA-256 con CRLF normalizado a LF; preservar bytes exactos de la copia antes y después del replay | Comprobadas copias LF y CRLF; 13/13 pruebas de procedencia |

## Evidencia de datos

- Tarea 1 implementada en `986523d`: 11/11 pruebas de procedencia y 55/55 backend, con una advertencia Starlette; test inicial rojo por ausencia de `bankProfile`.
- Dataset `demo-2026-11-10.1`, SHA-256 canónico `70d234a224a2dc3f08d8e3f92cd4bfad3456ebb3cbcd9bb8db208940dafed0a4`; versión de cálculo `demo-calculations-1.0.0` sin cambios.
- El snapshot anterior conserva SHA-256 de bytes `c83dbcba95f30de7e7359b251b4aceeaf37865e1f2b51f6333660a299b0517f3`; replay anterior y golden incluidos en pruebas. Las pruebas integradas posteriores se recogen debajo.
- Prueba portable actualizada sin modificar el snapshot: ancla LF `bbe3f27302476aa080f30847a490658ce8323ae6c8ce04270f94736678a1f625`; 13/13 en `backend/tests/test_provenance.py`, advertencia Starlette. El SHA de bytes anterior corresponde a esta copia Windows con CRLF y puede variar por finales de línea.

## Integración local

Tras una primera ejecución con cuatro fallos y sus correcciones, la segunda ejecución completa pasó 55/55 en Chrome headless. También pasaron 81 pruebas backend/simulador, 46 del frontend y 112 casos del corpus del tutor. La [evidencia](evidence/banco-t2f/integracion-report.md) conserva los fallos iniciales y las limitaciones; no acredita hardware de voz ni aprobación de revisión. Las dos pruebas adicionales de ensayo recorrieron las 24 preguntas en pantalla, 12 por idioma.
