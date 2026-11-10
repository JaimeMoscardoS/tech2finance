# BancoT2F Implementation Plan

## Qué es

Plan ejecutable para añadir contexto coherente de un banco ficticio a la demostración educativa.

**Goal:** Mostrar y explicar BancoT2F, servicios, condiciones y comisiones sin alterar cálculos.

**Architecture:** `shared/demo-data.json` contiene el perfil sintético tipado en `shared/bank-profile.ts`. El backend verifica el dataset y construye el contexto del tutor desde datos propios; la interfaz utiliza el perfil compartido en modos local y servidor. Las comisiones son informativas, nunca entradas de cálculo.

**Tech Stack:** TypeScript, React, JSON, Node, Python, FastAPI, pytest y Playwright.

**Spec:** `docs/planning/banco-t2f-spec.md`; decisiones y estado en `docs/planning/banco-t2f-ledger.md`.

## Global Constraints

- Perfil `demo`, clasificación `synthetic_demo`, versión `bank-demo-2026-11-10.1`; dataset `demo-2026-11-10.1`; cálculo `demo-calculations-1.0.0`.
- Mínimos y mantenimiento ficticios cero; sin cliente, saldo, cuenta, orden ni conexión real. Comisiones informativas excluidas del cálculo; `null` significa dato no definido.
- Mantener IDs, series, procedencia, nombres y condiciones de entidades reales y bytes del snapshot antiguo; no atribuir productos ajenos a BancoT2F.
- Pruebas integradas usan puertos nuevos 5177/8097, sin alterar servicios existentes. No publicar hasta revisión de coordinación ni hacer merge a main.
- Base local `integration/bank-demo-base` en `6f56d5c`; PR apilado contra esa base. Terra high escribe; Sol revisa en solo lectura; máximo seis agentes simultáneos.
- Máximo cuatro rondas de revisión, mínimo 8/10 por revisor y ningún hallazgo crítico o alto abierto; no iniciar quinta ronda.

## Review Focus

1. ID desconocido frente al omitido: 400 frente a `demo` por defecto; campos adicionales y perfil inyectado reciben 422 (tarea 2).
2. Productos externos: no heredan comisiones demo ni su identidad; anual `null` nunca se convierte en cero (tareas 2–4).
3. 75 bps equivale a 0,75 % anual, pero no reduce resultados; orden fija de 1 EUR es informativa (tareas 1, 3 y 4).
4. Alteración de dataset o snapshot nuevo produce fallo; replay anterior y cálculo golden permanecen idénticos (tarea 1).
5. Perfil en cuatro páginas, producto solo en exploración/simulación; voz conserva máximo ocho mensajes y reinicia con sesión (tareas 3–4).

## Datos acordados

| Instrumento | Gasto anual informativo | Orden fija informativa |
| --- | ---: | ---: |
| `demo-fixed` | 40 bps (0,40 %) | 0 EUR |
| `demo-mixed` | 75 bps (0,75 %) | 0 EUR |
| `demo-equity` | 110 bps (1,10 %) | 0 EUR |
| `demo-etf` | 20 bps (0,20 %) | 1 EUR |
| `demo-stock` | `null` (no definido) | 1 EUR |

Entrada, salida y custodia: 0 bps. Mínimos inicial y recurrente: 0 EUR. Las órdenes fijas de 1 EUR son ficticias e informativas, no se ejecutan ni se descuentan.

## Tarea 1: datos y procedencia — `bank_data`

**Estado:** implementada y verificada en `986523d`; no repetir baseline por rutina.

**Archivos:** `shared/bank-profile.ts`, `shared/demo-data.json`, `shared/data-manifest.json`, `shared/snapshots/demo-2026-11-10.1/demo-data.json`, `backend/domain/provenance.py`, `backend/tests/test_provenance.py`, `datos/registro-fuentes.json`.

**Consume:** contrato aprobado. **Produce:** `BankProfile`, `BankProduct`, `ProductFees`, `LocalizedText` y `bankProfile` en dataset verificado.

- [x] Red observado: `test_bank_demo_profile_version_and_fees` falló con `KeyError: bankProfile` antes de añadir el perfil.
- [x] Seed con cinco IDs y gastos de la tabla, `treatment='illustrative_excluded'`, `demo-stock` anual `null`; aviso bilingüe y condiciones sin dinero real.
- [x] `test_integrity_detects_drift` comprueba alteración de datos vivos, snapshot nuevo y manifiesto; replay antiguo y golden comprueban cálculo intacto.
- [x] Desde raíz del repositorio, `python -m pytest backend/tests/test_provenance.py -q`: 11/11; `python -m pytest backend/tests -q`: 55/55, una advertencia Starlette. `python -m backend.verify_data` confirma SHA `70d234a224a2dc3f08d8e3f92cd4bfad3456ebb3cbcd9bb8db208940dafed0a4`.

## Tarea 2: API y reconstrucción de contexto — `bank_tutor`

**Estado:** implementada y comprobada en la integración local; revisión independiente R1 pendiente. Las casillas «Red» registran verificaciones propuestas y no afirman por sí mismas un fallo inicial observado.

**Archivos:** `backend/schemas.py`, `backend/app.py`, `backend/domain/__init__.py`, `backend/tests/test_api.py` y pruebas backend relacionadas. No editar el seed ni el verificador.

**Consume:** `BankProfile` verificado; contexto de petición con `bankId` opcional. **Produce:** perfil en catálogo y contexto interno enriquecido desde servidor. El contrato interno es `TutorContext.bank?: BankProfile` e `instrument.product?: BankProduct` anidado; no existe `product` al nivel superior. El cliente solo puede identificar el banco mediante `bankId`; no puede suministrar perfil ni producto. Rutas: `GET /api/catalog` y `POST /api/tutor`.

- [x] Aceptaci?n `unknownBank`: `context.bankId='unknown'` devuelve 400; omitido o `demo` selecciona el perfil demo. Campos extra, incluidos `bank`, `bankProfile` y `product` inyectados, devuelven 422.
- [x] Aceptaci?n `catalogProfile`: catálogo expone `demo-mixed` anual 75 bps y tratamiento `illustrative_excluded`; modificar una respuesta no cambia la siguiente.
- [x] Aceptaci?n `bankForFourPages`: `home`, `explore`, `simulator`, `portfolio` aportan banco; producto seleccionado únicamente en `explore`/`simulator`, y un instrumento externo no recibe comisiones demo.
- [x] Implementado: `bankId` opcional con default `demo` en el esquema actual; resolver perfil desde dataset y conservar control estricto de extras. Mantener firmas y respuestas existentes salvo ampliación acordada.
- [ ] Desde raíz: `python -m pytest backend/tests -q`; comprobar tests anteriores y regresiones con Python del entorno del proyecto.

## Tarea 3: tutor local y servidor — `bank_tutor`

**Estado:** implementada; evaluación local final 112/112 casos. Revisión independiente R1 pendiente.

**Archivos:** `tutor-ia/src/types.ts`, `tutor-ia/src/local-tutor.ts`, pruebas y evaluación en `tutor-ia/tests` y `tutor-ia/evals`; el mismo responsable de tarea 2 coordina el puente backend existente.

**Consume:** `TutorContext.bank?: BankProfile` y `instrument.product?: BankProduct` autorizados por tarea 2. **Produce:** `TutorProvider.reply(request)` con respuestas fundamentadas en perfil, idioma y página, sin ejecutar operaciones ni inventar costes. El reconocimiento usa plantillas limitadas; comprobar las frases exactas, sin presumir comprensión general.

- [x] Aceptaci?n `bankIdentity`: identidad y servicios desde perfil en cuatro páginas y ambos idiomas; sin perfil se abstiene de inventar información bancaria.
- [x] Aceptaci?n `feeAnswers`: `demo-mixed` responde 0,75 % anual informativo y dice que no se descuenta; ETF dice 1 EUR por orden informativa; acción no presenta `null` como 0 %.
- [x] Aceptaci?n `externalFeesNone`: producto externo no recibe costes de BancoT2F; sin selección o fuera de exploración/simulación no se usa producto anterior. Conservar protecciones existentes.
- [x] Implementado: sobre `TutorContext` y `createLocalTutorProvider()` existentes; alinear contexto interno y tests entre modos. La voz de cliente pertenece a tarea 4.
- [ ] Desde raíz: `node --experimental-strip-types --test tutor-ia/tests/*.test.ts` y `node --experimental-strip-types tutor-ia/evals/run.ts --check`; informar fallos.

## Tarea 4: interfaz y voz — `bank_frontend`

**Estado:** implementada; frontend 46/46, compilación correcta y suite de navegador 55/55 tras correcciones. Ensayo adicional de dos pruebas con doce preguntas por idioma, 2/2. Voz con simulación, sin certificar hardware. Revisión independiente R1 pendiente.

**Archivos:** `frontend/src/App.tsx`, `frontend/src/server-api.ts`, `frontend/src/VoiceAssistantPanel.tsx`, componentes/estilos y pruebas de `frontend/src` y `frontend/tests` correspondientes. No editar contratos compartidos ni backend.

**Consume:** `BankProfile` del dataset local o catálogo servidor, `TutorProvider` y contexto de tarea 3. **Produce:** perfil visible y contextual en cuatro páginas; historial de voz limitado a sesión.

- [x] Aceptaci?n `bankForFourPages`: perfil disponible en `home`, `explore`, `simulator` y `portfolio`, modo local y servidor; idioma actualiza información y distingue productos externos.
- [x] Aceptaci?n `feesExcluded`: mostrar 75 bps como 0,75 % anual, orden ETF/acción 1 EUR informativa, `null` como no definido y aviso de exclusión; resultados no cambian.
- [x] Aceptaci?n `serverForgedProfile`: enviar `bankId` opcional al proveedor de servidor sin enviar perfil como hecho de cliente; producto solo en exploración/simulación.
- [x] Aceptaci?n `voiceEightReset`: voz conserva como máximo ocho mensajes previos de la sesión; al reiniciar sesión, historial enviado vacío; cambio de contexto no arrastra hechos anteriores.
- [x] Implementado: en `serverTutorProvider(...)`, `App` y `VoiceAssistantPanel` existentes con pruebas y accesibilidad. No iniciar servicios antiguos ni proveedores externos.
- [x] Ejecutado desde `frontend`: `npm test` y `npm run build`; integración con configuración de coordinación en 5177/8097, sin iniciar hasta coordinación.

## Tarea 5: documentación, integración y revisión — `bank_demo_docs` + coordinación

**Archivos:** `docs/contexto-proyecto.md`, `docs/contratos.md`, README afectados, `docs/banco-t2f.md`, [`presentacion/demo-banco-t2f.md`](../../presentacion/demo-banco-t2f.md) y ledger. No modificar código de tareas 1–4.

**Consume:** comportamiento efectivamente integrado y fuente `bankProfile`. **Produce:** guion canónico de doce preguntas en dos idiomas, respuesta esperada, fuente y pasos previos; documentación de contratos y evidencia.

- [x] Guion y contexto redactados; doce preguntas por idioma comprobadas por API y en navegador. No atribuir resultados históricos a BancoT2F.
- [x] Actualizar documentación distinguiendo implementación, demo y limitaciones; guion único en `presentacion/demo-banco-t2f.md`.
- [x] Ejecutar backend y evaluación del tutor, unitarias/build frontend y recorrido Playwright en 5177/8097; comandos, resultados y fallos iniciales registrados en [evidencia](evidence/banco-t2f/integracion-report.md).
- [ ] Coordinación ejecuta revisión independiente R1 con evidencia de pares de interfaces; hasta tres rondas adicionales solo si se corrige. Preparar PR apilado tras gates; no merge a main.
