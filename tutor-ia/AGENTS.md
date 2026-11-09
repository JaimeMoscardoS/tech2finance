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

Claude genera las explicaciones mediante su API desde el backend. ElevenLabs se propone para transcribir voz a texto y convertir las respuestas en audio. El usuario también puede escribir y leer. Priorizar texto contextual, después lectura en voz y finalmente entrada por micrófono; mantener alternativa si falla la voz. No exponer claves. Consultar los detalles y límites en `docs/contratos.md`. Las integraciones están pendientes de implementar y probar.

## Motor de análisis de caídas

Explicar el informe de caídas, el horizonte y los límites sin inventar causas ni garantizar recuperación o aconsejar mantener por defecto. Consulta `docs/contexto-proyecto.md` y `docs/contratos.md`.
