# Local Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar la demo con un backend HTTP local comprobable y sin servicios externos.

**Architecture:** FastAPI valida peticiones y delega cálculos a dominio Python; el tutor TypeScript existente se ejecuta mediante un proceso local limitado. El frontend elige explícitamente backend o alternativa local.

**Tech Stack:** Python 3.14, FastAPI, Node 22.12+, React/Vite, pytest.

**Spec:** `docs/superpowers/specs/2026-11-10-local-backend.md`.

## Global Constraints

Sin API externas, claves, base de datos, cuentas ni operaciones reales. Preservar datos y supuestos; no aceptar resultados calculados por el cliente. No hacer commits sin coordinación.

## Review Focus

- Importes no finitos, negativos o excesivos y periodos incompatibles: pruebas de validación HTTP y dominio.
- Instrumentos sin histórico o desconocidos: pruebas de errores diferenciados.
- Inyección de resultados o fuentes: campos extra rechazados.
- Proceso Node ausente, bloqueado o con salida inválida: respuesta 503 y límite de concurrencia.
- Petición obsoleta y fallo de backend: pruebas de interfaz y cambio explícito a modo local.

## Task 1: Dominio y datos compartidos — backend domain worker

**Files:** `backend/domain/`, `backend/tests/test_domain*`, `simulador/periodic.py`, `shared/demo-data.json`, `tutor-ia/server-bridge.ts`.

**Interfaces:** `get_catalog()`, `run_simulation(spec)`, `analyze_decline(spec)`, `build_tutor_context(context)` devuelven diccionarios. El puente Node recibe petición JSON en stdin y devuelve respuesta JSON en stdout.

- [x] Añadir pruebas de datos, límites, orden de aportaciones, fuentes y ausencia de histórico.
- [x] Implementar funciones y el puente sobre el tutor existente.
- [x] Ejecutar pruebas de dominio y comprobar su salida.

## Task 2: Contrato HTTP y aislamiento — backend server worker

**Files:** `backend/schemas.py`, `backend/app.py`, `backend/tutor_bridge.py`, `backend/requirements.txt`, `backend/tests/test_api.py`.

**Interfaces:** cinco rutas descritas en la especificación; errores `{error:{code,message}}` y sin revelar datos privados.

- [x] Probar rutas, validación estricta, mensajes de error y fallos del puente.
- [x] Implementar rutas y proceso fijo con timeout, salida y concurrencia limitadas.
- [x] Ejecutar `python -m pytest backend/tests` y `python -m pip check` en `.venv`.

## Task 3: Conexión de interfaz — frontend worker

**Files:** `frontend/src/` y pruebas de interfaz; documentación de uso por responsable coordinado.

- [x] Probar selección explícita de modo, fallo, resultados obsoletos y accesibilidad.
- [x] Conectar catálogo, simulación, caídas y tutor sin eliminar el modo local.
- [x] Ejecutar tests, build y recorrido de navegador según disponibilidad.

## Task 4: Integración y revisión — coordinador

- [x] Actualizar contratos y documentación de ejecución con versiones, límites y resultados verificados.
- [x] Ejecutar suites pertinentes y un recorrido conjunto; revisar seguridad y cálculo según las instrucciones del repositorio.

## Task 5: Paleta nocturna — responsable frontend de tema

**Files:** estilos temáticos dedicados, en coordinación antes de tocar estilos o componentes compartidos.

- [x] Aplicar la paleta nocturna de forma coherente sin alterar la legibilidad ni el tema claro.
- [x] Comprobar contrastes y estados de interacción en las vistas afectadas.

## Task 6: Composición antipánico — responsable frontend de pausa

**Files:** componente y estilos propios de la pausa; coordinar cambios compartidos con el responsable de tema.

- [x] Ajustar la distribución preservando información, decisión del usuario y accesibilidad.
- [x] Verificar teclado, foco, lectura y adaptación a tamaños de pantalla afectados.

## Task 7: Acceso directo a voz — responsable frontend de voz

**Files:** componente de voz y sus pruebas; coordinar el punto de entrada compartido con el responsable de integración.

- [x] Abrir y cerrar la voz directamente sin abrir el chat y devolver el foco al disparador.
- [x] Confirmar que abrir el panel no inicia micrófono ni reproducción y que el micrófono no se reinicia tras un turno; distinguir el procesamiento directo de voz del dictado revisable del chat.
- [x] Completar la última indicación hacia el chat cuando el dictado no esté disponible y ejecutar su prueba dirigida.
- [x] Probar capacidades locales disponibles y no disponibles, alternativa textual y fallos, distinguiendo simulaciones de pruebas reales de audio.

## Evidencia de revisión del 10 de noviembre de 2026

Tres agentes distintos implementaron la paleta nocturna, la pausa y la voz. En la comprobación coordinada pasaron 44 pruebas de backend, 21 pruebas Python anteriores, 16 pruebas unitarias de frontend y 31 pruebas Playwright; también pasó la compilación de producción. Después de esa suite pasó una prueba dirigida para la corrección de texto de voz. El build mostró avisos heredados de `use client` en CountUp/Motion; la suite backend mostró un aviso de deprecación TestClient/HTTPX.

Las revisiones registraron cálculo 8,7/10 (R2), seguridad 9,1/10 (R1) y accesibilidad 9,0/10 (R2), sin hallazgos críticos o altos pendientes en sus alcances revisados. La revisión R2 de accesibilidad comprobó también la indicación de voz en español e inglés. Las pruebas de voz simuladas no acreditan audio audible, micrófono real ni conformidad WCAG completa.
