# BancoT2F: registro de ejecución

## Qué es

Registro de decisiones, comprobaciones y revisiones de la integración de BancoT2F.

- Base `integration/bank-demo-base`: `6f56d5c2eb022dd0d1bed1c75e1729d5d13ab628`, publicada en remoto y verificada en ese mismo hash. [CI de la base](https://github.com/JaimeMoscardoS/tech2finance/actions/runs/42873962065) completada correctamente para ese hash; no prueba los cambios de BancoT2F.
- Baseline en esta base: frontend 39/39 y build correcto con avisos Rolldown; backend 54/54 con advertencia Starlette; simulador 21/21.
- Contrato y plan aprobados por coordinación antes de implementación. R2 del núcleo e interfaz superadas y pruebas locales finales ejecutadas; publicación de la rama y CI de la funcionalidad pendientes.
- Revisiones: máximo cuatro rondas, mínimo 8/10 por revisor, sin críticos ni altos abiertos; no iniciar una quinta. Límite de seis agentes simultáneos; escritura Terra, revisión Sol en solo lectura.

## Responsables y estado

| Identidad | Función | Estado |
| --- | --- | --- |
| `root` | Coordinación, solo lectura | Activo |
| `bank_data` | Datos, contrato y planificación, Terra high | Tarea 1 verificada; portabilidad de snapshot comprobada; documentación de planificación cedida |
| `bank_tutor` | API y tutor, tareas 2–3, Terra high | Implementado, verificado localmente y revisión R2 superada |
| `bank_frontend` | Interfaz y voz cliente, tarea 4, Terra high | Implementado, verificado localmente y revisión R2 superada |
| `bank_demo_docs` | Guion y documentación, Terra high | Guion y contexto escritos; matriz API, suite de navegador y ensayo de 24 preguntas en pantalla registrados |
| `/root/bank_core_review` | Revisión independiente del núcleo, Sol high | R2 superada |
| `/root/bank_ui_review` | Revisión independiente de interfaz, Sol high | R2 superada |

## Prerrevisión semántica y rulings

| Par o comprobación | Regla de integración | Estado |
| --- | --- | --- |
| Datos → API | `BankProfile` es fuente verificada; `bankId` opcional por defecto `demo`, desconocido 400 y extras 422 | Implementado, verificado localmente y revisión R2 superada |
| API → tutor | Interno: `TutorContext.bank?: BankProfile` e `instrument.product?: BankProduct` anidado; sin `product` superior. Producto solo en `explore`/`simulator`; cliente solo `bankId` bancario opcional, servidor resuelve y rechaza `bank`, `bankProfile` y `product` inyectados con 422 | Verificado localmente y revisión R2 superada |
| Datos → UI/tutor | Tipos y seed coinciden; 75 bps = 0,75 % anual, orden 1 EUR informativa, `null` desconocido; comisiones excluidas | Implementado, verificado localmente y revisión R2 superada |
| Página → contexto | Banco en `home`, `explore`, `simulator`, `portfolio`; al omitir banco se usa `demo`; selección ajena no obtiene costes demo | Implementado, verificado localmente y revisión R2 superada |
| Voz → sesión | Historial de hasta ocho mensajes; reinicio vacía historial. **Ruling:** propiedad cliente de tarea 4, no tarea 3 | Pruebas con voz simulada superadas; hardware sin comprobar |
| Plan ↔ spec | Cinco tareas, mismas interfaces y límites; guion canónico de doce preguntas en `presentacion/demo-banco-t2f.md` | Las 24 respuestas ES/EN comprobadas por API y en pantalla; QA local completo |
| Snapshot antiguo ↔ Git Windows/Linux | **Ruling:** identidad textual anclada a SHA-256 con CRLF normalizado a LF; preservar bytes exactos de la copia antes y después del replay | Comprobadas copias LF y CRLF; 13/13 pruebas de procedencia |

## Evidencia de datos

- Tarea 1 implementada en `986523d`: 11/11 pruebas de procedencia y 55/55 backend, con una advertencia Starlette; test inicial rojo por ausencia de `bankProfile`.
- Dataset `demo-2026-11-10.1`, SHA-256 canónico `70d234a224a2dc3f08d8e3f92cd4bfad3456ebb3cbcd9bb8db208940dafed0a4`; versión de cálculo `demo-calculations-1.0.0` sin cambios.
- El snapshot anterior conserva SHA-256 de bytes `c83dbcba95f30de7e7359b251b4aceeaf37865e1f2b51f6333660a299b0517f3`; replay anterior y golden incluidos en pruebas. Las pruebas integradas posteriores se recogen debajo.
- Prueba portable actualizada sin modificar el snapshot: ancla LF `bbe3f27302476aa080f30847a490658ce8323ae6c8ce04270f94736678a1f625`; 13/13 en `backend/tests/test_provenance.py`, advertencia Starlette. El SHA de bytes anterior corresponde a esta copia Windows con CRLF y puede variar por finales de línea.

## Integración local

En la instantánea `2aeb6a0`, tras una primera ejecución con cuatro fallos y sus correcciones, la segunda ejecución completa pasó 55/55 en Chrome headless. También pasaron 81 pruebas backend/simulador, 46 del frontend y 112 casos del corpus del tutor. La [evidencia](evidence/banco-t2f/integracion-report.md) conserva los fallos iniciales y las limitaciones. Las dos pruebas adicionales de ensayo recorrieron las 24 preguntas en pantalla, 12 por idioma. No se atribuyen automáticamente esos resultados al código posterior; los gates finales deben repetirse tras la corrección de interfaz.

En `05bdc69d63ec2682a13e0e7a580909661927a77c` se repitieron la suite completa de navegador (**61/61**, incluyendo ambos ensayos), frontend/tutor (**48/48** y build), API (**35/35**) y corpus (**116/116**); las 24 respuestas de la matriz API también se revisaron de nuevo. Se conservaron como evidencia anterior las pruebas de componentes sin cambios que no se repitieron. Los detalles y advertencias constan en el [informe](evidence/banco-t2f/integracion-report.md).

## Revisiones independientes y límites

- Núcleo R1: **7,5/10**, dos hallazgos medios sobre tarifas de producto ajeno nombrado y definición general de comisiones; corregidos y reexaminados. Núcleo R2: **8,8/10**, superada sobre `29ac1df`; 18 comprobaciones HTTP y corpus 116/116, sin hallazgos nuevos comunicados. Paquete revisado: `bank-review/core-r2.patch`.
- Interfaz R1: **7,8/10**, un hallazgo medio relativo a selección de instrumento no visible en Explorar. Interfaz R2: **8,8/10**, superada sobre `05bdc69`; el revisor comprobó BBVA y CaixaBank en modos local y servidor, Horizonte y voz simulada, y los contextos de inicio, cartera y reentrada a Explorar. Sin críticos ni altos abiertos. Las notas no sustituyen las pruebas ni la decisión de integración.
- Limitación menor diferida: la FAQ visible indica que no se emplea dinero real, pero algunas formulaciones literales sobre ello no activan todavía la respuesta correspondiente del tutor. Sus reglas reconocen plantillas limitadas; no presentar cobertura conversacional general como verificada.
- La voz física, lectores de pantalla como NVDA y la CI de la rama completa de BancoT2F siguen pendientes. Las pruebas de voz descritas usan simulaciones; la CI de la base cubre únicamente la base anterior.
