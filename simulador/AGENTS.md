# 3 — Simulador y motor

## Qué es

Juego histórico verificable, aportaciones, cálculos y escenarios hipotéticos con supuestos y pruebas.

## Instrucciones

Leer `../AGENTS.md`, `../docs/organizacion.md` y `../docs/contratos.md`. Coordinar las interfaces y archivos compartidos, preservar cambios de los demás y verificar lo que se entrega. Esta carpeta describe un área, no una aplicación independiente.

## Agentes

Ejecutor: `t2f-03-simulador-executor`. Revisor: `t2f-03-simulador-reviewer`. Planificador común: `t2f-planner`. Sonnet/Terra ejecutan; Opus/Sol planifican y revisan. El revisor no edita.

### Especialistas disponibles

- `t2f-03-cuantitativo`: Implementa cálculos reproducibles de aportaciones, evolución histórica y escenarios; documenta unidades, comisiones y supuestos.
- `t2f-03-revisor-matematico`: Comprueba resultados, unidades, periodicidad, aportaciones, datos, supuestos, pérdidas y pruebas sin declarar validación de mercado.
