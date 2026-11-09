# 2 — Backend e integración

## Qué es

Contratos, validación, API, orquestación, configuración y errores; coordinar la integración con las demás áreas.

## Instrucciones

Leer `../AGENTS.md`, `../docs/contexto-proyecto.md`, `../docs/organizacion.md` y `../docs/contratos.md`. Coordinar las interfaces y archivos compartidos, preservar cambios de los demás y verificar lo que se entrega. Esta carpeta describe un área, no una aplicación independiente.

## Agentes

Ejecutor: `t2f-02-backend-executor`. Revisor: `t2f-02-backend-reviewer`. Planificador común: `t2f-planner`. Sonnet/Terra ejecutan; Opus/Sol planifican y revisan. El revisor no edita.

### Especialistas disponibles

- `t2f-02-arquitectura`: Diseña arquitectura React y FastAPI propuesta, límites de módulos, contratos y despliegue mínimo; declara decisiones pendientes.
- `t2f-02-integracion`: Implementa endpoints y conexiones entre módulos conforme a contratos acordados, con validación, errores y límites de propiedad.
- `t2f-02-seguridad`: Revisa secretos, entradas, proveedores, dependencia, protección de datos y riesgos de aplicación con evidencia.
