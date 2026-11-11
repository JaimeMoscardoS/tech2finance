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

Acordar primero `docs/contratos.md`. La persona 5 prepara muestras ficticias mientras se verifican fuentes reales. Trabajar en ramas separadas y revisar cambios compartidos. La demo usa React/TypeScript y una API local Python/FastAPI para catálogo, simulación periódica, caídas y tutor por reglas mediante Node. El motor histórico expone la comparación del juego mediante `POST /api/game/compare`, que el frontend aún no consume; Claude y ElevenLabs siguen como propuestas no conectadas. La propuesta anterior de Next.js permanece en el historial.


## Líneas de ejecución y funciones de empresa

Las cinco ramas parten de `main` en `42d523316872d469ec9bcdb8ba25b436408b37cc`; son líneas de trabajo, no personas nuevas ni reasignaciones del cuadro anterior. Su estado y tareas están en el [plan](planning/plan.md) y el [manifiesto](planning/manifest.json).

| Línea / rama | Enfoque | Coordinación humana existente |
| --- | --- | --- |
| `director/01-experience` | Experiencia y accesibilidad | Persona 1 |
| `director/02-platform` | Plataforma, operación y privacidad | Persona 2 |
| `director/03-data` | Datos, derechos y motor | Personas 3 y 5 según responsabilidad |
| `director/04-tutor` | Tutor y conducta | Persona 4, producto y jurídico |
| `director/05-product` | Producto, estudio y oferta | Persona 5 y funciones por asignar; no cambia su responsabilidad original |

### RACI propuesto, sin nombramientos

Todas las personas nominales y horas semanales: **UNASSIGNED**; no se ha acordado capacidad. R ejecuta, A responde por la decisión, C se consulta e I se informa. La función puede recaer en una de las cinco personas al acordarse; asesoría jurídica y CISO fraccionales se consultan cuando proceda y no se presumen contratados.

| Actividad | R | A | C | I |
| --- | --- | --- | --- | --- |
| Comprador, presupuesto y contrato | Comercial UNASSIGNED | Producto UNASSIGNED | Banco y asesoría jurídica | Equipo |
| Experiencia y accesibilidad | Persona 1 (función; titular UNASSIGNED) | Producto UNASSIGNED | Persona 5 y especialista | Equipo |
| API y operación | Persona 2 (función; titular UNASSIGNED) | Servicio UNASSIGNED | CISO fraccional y banco | Equipo |
| Cálculo y supuestos | Persona 3 (función; titular UNASSIGNED) | Responsable técnico UNASSIGNED | Revisor financiero y persona 5 | Equipo |
| Tutor, voz y conducta | Persona 4 (función; titular UNASSIGNED) | Producto UNASSIGNED | Jurídico financiero | Equipo |
| Fuentes, pruebas y presentación | Persona 5 (función; titular UNASSIGNED) | Producto UNASSIGNED | Personas 1–4, pedagogía | Equipo |
| Privacidad y proveedores | Privacidad UNASSIGNED | Servicio UNASSIGNED | Jurídico, CISO fraccional, banco | Equipo |

No existe compromiso de entrevistas, POC ni contratación. Al asignar dirección comercial, retirar trabajo equivalente o registrar capacidad adicional real.
