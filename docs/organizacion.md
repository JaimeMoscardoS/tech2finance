# Organización de Tech2Finance

## Qué es

Reparto inicial del equipo para una única aplicación. La conversación disponible describe el producto; el plan producido al final por Claude era un artefacto oculto, así que sus detalles no están verificados.

| Número | Área | Carpetas | Entregable inicial |
| --- | --- | --- | --- |
| 1 | Interfaz y experiencia | `frontend/` | Niveles, catálogo, juego y pausa con datos de ejemplo. |
| 2 | Backend e integración | `backend/`, contratos en `docs/` | API y conexión entre componentes; coordina interfaces. |
| 3 | Simulador y motor | `simulador/` | Cálculos, aportaciones, simulación histórica y escenarios. |
| 4 | IA, voz y antipánico | `tutor-ia/` | Tutor contextual, voz y explicación de la pausa. |
| 5 | Datos, pruebas y presentación | `datos/`, `tests/`, `presentacion/` | Fuentes, pruebas, historia de demo y presentación. |

Cada responsable ayuda a integrar su módulo; la persona 2 no asume todos los problemas. Los números aparecen en las carpetas existentes sin renombrarlas.

## Recorrido

1. Explorar un catálogo ficticio en uno de tres niveles.
2. Practicar con una máquina del tiempo, aportaciones y datos históricos verificables. Comparar opciones con costes y supuestos visibles.
3. Preguntar al tutor sobre los resultados.
4. Mostrar una cartera ficticia en caída y una pausa informativa antes de una venta simulada. Se recuerda objetivo y horizonte; siempre decide el usuario.
5. Presentar una posible transición al banco sin transmitir órdenes ni dinero.

El motor de análisis de caídas buscará antecedentes del mismo fondo o comparables justificados y aportará contexto con fuentes. Las tareas y sus límites están en [contexto del proyecto](contexto-proyecto.md#motor-de-análisis-de-caídas-y-comparación-histórica).

La conversación de perfil y el filtrado de opciones son propuestas futuras sujetas a la entidad y revisión especializada; no se debe presentar la demo como evaluación regulatoria válida. Las noticias y la voz son deseables, con alternativa ante fallos; no prometer causas ni acceso a noticias que no se haya implementado.

## Trabajo conjunto y tecnología

Acordar primero `docs/contratos.md`. La persona 5 prepara muestras ficticias mientras se verifican fuentes reales. Trabajar en ramas separadas y revisar cambios compartidos. El frontend React/TypeScript existe en main; Python/FastAPI, Claude y ElevenLabs siguen como propuesta para las áreas pendientes. La propuesta anterior de Next.js permanece en el historial. En esta rama el motor Python está aislado y no está conectado a la demo.
