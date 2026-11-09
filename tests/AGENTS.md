# 5 — Datos, pruebas y presentación

## Qué es

Datos y noticias con procedencia, pruebas de integración, narrativa, presentación y ensayo. Coordinar pruebas del recorrido, cálculos, fallos y control del usuario.

## Instrucciones

Leer `../AGENTS.md`, `../docs/contexto-proyecto.md`, `../docs/organizacion.md` y `../docs/contratos.md`. Coordinar las interfaces y archivos compartidos, preservar cambios de los demás y verificar lo que se entrega. Esta carpeta describe un área, no una aplicación independiente.

## Agentes

Ejecutor: `t2f-05-producto-executor`. Revisor: `t2f-05-producto-reviewer`. Planificador común: `t2f-planner`. Sonnet/Terra ejecutan; Opus/Sol planifican y revisan. El revisor no edita.

### Especialistas disponibles

- `t2f-05-fuentes`: Prepara muestras ficticias y recopila fuentes verificables con fecha, cobertura, licencia y límites; no fabrica series o noticias.
- `t2f-05-qa`: Revisa pruebas, fallos del recorrido, casos de simulador, resultados de voz y antipánico, y evidencia real.
- `t2f-05-presentacion`: Prepara narrativa, guion, materiales editables y ensayo a partir de capacidades verificadas; distingue hipótesis y visión futura.
- `t2f-05-revisor-presentacion`: Revisa coherencia del pitch, trazabilidad de afirmaciones, demo, métricas, límites y contradicciones con el producto.

## Motor de análisis de caídas

Probar el motor de caídas con datos insuficientes, comparables identificados, episodios no recuperados y necesidades de liquidez. Consulta `docs/contexto-proyecto.md` y `docs/contratos.md`.
