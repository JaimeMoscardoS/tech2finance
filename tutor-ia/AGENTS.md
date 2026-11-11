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

El núcleo local aplica reglas a datos reconstruidos por el servidor. El endpoint puede añadir una explicación de Claude y rechaza errores del proveedor sin fallback silencioso; el puente anterior se conserva para compatibilidad. El dictado local o mediante ElevenLabs se selecciona según la configuración. Las claves permanecen en el servidor y se mantiene la alternativa de texto. Los contratos, límites y pruebas pendientes están en `docs/contratos.md`.

## Motor de análisis de caídas

Explicar el informe de caídas, el horizonte y los límites sin inventar causas ni garantizar recuperación o aconsejar mantener por defecto. Consulta `docs/contexto-proyecto.md` y `docs/contratos.md`.
