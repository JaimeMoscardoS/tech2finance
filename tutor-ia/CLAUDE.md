# 4 — IA, voz y antipánico

## Qué es

Tutor contextual, voz y pausa antipánico basados en información contrastada y fuentes.

## Instrucciones

Leer `../AGENTS.md`, `../docs/contexto-proyecto.md`, `../docs/organizacion.md` y `../docs/contratos.md`. Coordinar las interfaces y archivos compartidos, preservar cambios de los demás y verificar lo que se entrega. Esta carpeta describe un área, no una aplicación independiente.

## Agentes

Ejecutor: `t2f-04-tutor-executor`. Revisor: `t2f-04-tutor-reviewer`. Planificador común: `t2f-planner`. Sonnet/Terra ejecutan; Opus/Sol planifican y revisan. El revisor no edita.

### Especialistas disponibles

- `t2f-04-conversacion`: Implementa conversación contextual en el servidor con Claude, separación entre hechos y explicaciones, manejo de fallos y claves privadas.
- `t2f-04-voz`: Integra voz opcional con proveedor, control de reproducción, permisos y alternativa textual; nunca exponer claves.
- `t2f-04-revisor-fundamentos`: Busca cifras inventadas, promesas, causalidad sin respaldo, citas incorrectas y señales que presionen a no vender.

## Flujo de conversación

La implementación actual es un tutor local basado en reglas, sin modelo ni llamadas a servicios, que explica los datos válidos recibidos. La voz local del navegador pertenece a la interfaz y queda fuera de este núcleo. Claude y ElevenLabs son integraciones futuras pendientes: cualquier proveedor y sus credenciales deben gestionarse en el servidor, sin exponer claves; conservar siempre la alternativa textual. Consultar los detalles y límites en `docs/contratos.md`.

## Motor de análisis de caídas

Explicar el informe de caídas, el horizonte y los límites sin inventar causas ni garantizar recuperación o aconsejar mantener por defecto. Consulta `docs/contexto-proyecto.md` y `docs/contratos.md`.
