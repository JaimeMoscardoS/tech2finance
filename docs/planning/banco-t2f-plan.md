# BancoT2F Implementation Plan

## Qué es

Plan para integrar contexto de una entidad ficticia sin modificar los cálculos financieros.

**Goal:** Explicar BancoT2F y sus condiciones con información consistente en la aplicación y el tutor.

**Architecture:** Un perfil tipado y datos sintéticos versionados alimentan el backend, la interfaz y el tutor. Las capas consumidoras no inventan condiciones ni reasignan productos de otras entidades.

**Tech Stack:** TypeScript, React, JSON, Python, FastAPI y pruebas Node/pytest.

**Spec:** `docs/planning/banco-t2f-spec.md`.

## Global Constraints

- Perfil `demo`, clasificación `synthetic_demo`, versión `bank-demo-2026-11-10.1`; muestra `demo-2026-11-10.1`; cálculo `demo-calculations-1.0.0`.
- Comisiones ficticias informativas excluidas del cálculo; cero mínimos, sin dinero ni operaciones reales.
- Mantener series, entidades externas, snapshot anterior y contratos existentes; no publicar ni integrar en main hasta revisión.
- Terra escribe; Sol revisa en solo lectura. Máximo cuatro rondas, nota mínima 8/10 y sin hallazgos altos o críticos; sin quinta ronda. Máximo seis agentes simultáneos.

## Review Focus

- IDs ajenos o desconocidos: backend rechaza desconocidos y no atribuye productos externos al banco demo.
- Valores omitidos y campos adicionales: default `demo`, extras 422.
- Comisión anual no definida: `null` permanece desconocida, nunca cero.
- Cambios de dataset y replay: detectar alteraciones, conservar versión y snapshot anterior.
- Contexto de voz y página: ocho mensajes por sesión, producto solo si seleccionado en exploración o simulación.

## Tareas

- [ ] **1. Datos y procedencia.** Archivos `shared/bank-profile.ts`, `shared/demo-data.json`, `shared/data-manifest.json`, `shared/snapshots/demo-2026-11-10.1/demo-data.json`, `backend/domain/provenance.py`, `backend/tests/test_provenance.py`, `datos/registro-fuentes.json`. Produce `BankProfile` y snapshot canónico; prueba integridad, replay anterior y cálculos golden.
- [ ] **2. API.** Archivos de esquema, dominio, rutas y pruebas de backend. Consume `BankProfile`; expone `bankId` opcional y perfil; verifica default, 400 y 422, aislamiento y ausencia de producto ajeno.
- [ ] **3. Tutor.** Archivos de tutor y pruebas. Consume perfil y producto seleccionado únicamente en exploración/simulación; verifica respuestas, omisiones y aislamiento, historial de voz de ocho mensajes por sesión.
- [ ] **4. Interfaz.** Archivos frontend y pruebas. Consume perfil devuelto por API en todas las páginas; muestra condiciones, comisiones y su exclusión del cálculo; verifica idiomas, navegación y casos desconocidos.
- [ ] **5. Integración y documentación.** Actualiza contexto, contratos y guion con diez preguntas, respuestas esperadas, fuentes y pasos previos. Ejecuta pruebas relevantes y recorrido de demo, revisa interfaces y evidencia, documenta limitaciones y prepara PR apilado sobre `integration/bank-demo-base`.
