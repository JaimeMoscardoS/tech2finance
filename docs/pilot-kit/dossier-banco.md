# Dossier para entidad: inventario y mapa de datos

## Qué es

Inventario preliminar de la demo local en la base `42d5233`; no es una certificación ni evidencia de contrato, despliegue o seguridad. Fuente de investigación: [PR 13](https://github.com/JaimeMoscardoS/tech2finance/pull/13).

## Artefactos y estado

| Artefacto | Evidencia actual | Pendiente |
| --- | --- | --- |
| Arquitectura y rutas | `backend/app.py`, `backend/README.md`: API local FastAPI y tutor Node por reglas. | Diagrama del despliegue real y aceptación de entidad. |
| Catálogo y muestras | `shared/demo-data.json`: ejemplos ficticios, cinco rendimientos anuales CaixaBank, BBVA y Santander sin histórico. | Derechos por fuente y uso desconocidos; preservar fondos sin histórico como no disponibles. Publicación no equivale a licencia. |
| Cálculo | `simulador/periodic.py` usado por API; motor histórico independiente aislado. | Fixtures independientes, versiones reproducibles y revisión financiera. |
| Seguridad y operación | Límites locales y validación descritos en `backend/app.py` y `backend/schemas.py`. | Hosting, registros, acceso, secretos, respuesta a incidentes, restauración y pruebas acordadas; no se presume ausencia de logs de ejecución. |
| Soporte, salida, derechos | No existe acuerdo acreditado. | Responsable, alcance, SLA medido si se ofrece, condiciones de salida, revisión y contrato. |
| Tutor y voz | Reglas locales y capacidades locales de navegador. | Si se propone RAG o proveedor externo: fuentes autorizadas, soporte, contratos y evaluación; no existe proveedor RAG acreditado. |

## Mapa preliminar de datos de la demo

| Flujo | Campos observados | Destino actual / incertidumbre |
| --- | --- | --- |
| Preferencias | `t2f-language`, `t2f-theme`, `t2f-data-mode` | `localStorage` del navegador; validar eliminación y plazo en entorno real. |
| Simulación | `instrumentId`, `initial`, `recurringContribution`, `periods` | Petición a API local o cálculo local según modo; importes ficticios previstos, texto y entorno deben verificarse. |
| Caída | `basis`, `language`, `instrumentId`, `periods` | API local; datos de ejemplo, sin causas ni comparables. |
| Tutor | `message`, `history` (hasta 8: `role`, `text`, `intent`), contexto `page`, `level`, `language`, `instrumentId`, `simulation`, `decline`, `decision` (`goal`, `horizonYears`, `needsLiquidity`). | `AssistantPanel.tsx` mantiene historial en estado y lo envía a `/api/tutor`; `VoiceAssistantPanel.tsx` envía historial vacío. Texto libre y objetivo pueden contener datos personales. `backend/schemas.py` define límites. |
| Voz | Texto y audio tratado por capacidades locales cuando disponibles. | Reconocimiento local sujeto a navegador y modelo; no presumir privacidad o retención de todos los dispositivos sin verificación. |
| Reclutamiento, entrevista y seguimiento | Contacto, respuestas, IDs seudónimos, observaciones y seguimiento posibles. | Aún no diseñados ni aprobados: definir responsables, base jurídica, proveedores, transferencias, conservación y eliminación antes de recopilar. |

El backend se describe como demo sin estado y sin base de datos en `backend/README.md`; esto no acredita ausencia de registros del servidor, proxy, navegador o futuro proveedor. PII y datos sintéticos no son categorías mutuamente excluyentes. Cada proveedor y flujo precisa contrato de datos, roles, base, subencargados, residencia/transferencias y decisión humana sobre EIPD y DPO. DPA firmado cuando proceda y medidas acordadas son pendientes externos; no declarar cumplimiento hasta comprobarlos.

## Plantilla de decisión y parada

- Decisión / alcance / alternativas:
- Responsable nominal: UNASSIGNED; fecha: pendiente.
- Evidencia verificable y versión:
- Riesgo, condición externa y responsable de resolverla:
- Condición de parada y acción de salida:
- Resultado: pendiente / seguir / cambiar / parar; aprobación y fecha:
