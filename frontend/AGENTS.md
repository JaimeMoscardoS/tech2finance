# 1 — Interfaz y experiencia

## Qué es

Pantallas del banco simulado, niveles, catálogo, juego histórico, gráficos y pausa accesible.

## Instrucciones

Leer `../AGENTS.md`, `../docs/contexto-proyecto.md`, `../docs/organizacion.md` y `../docs/contratos.md`. Coordinar las interfaces y archivos compartidos, preservar cambios de los demás y verificar lo que se entrega. Esta carpeta describe un área, no una aplicación independiente.

## Agentes

Ejecutor: `t2f-01-frontend-executor`. Revisor: `t2f-01-frontend-reviewer`. Planificador común: `t2f-planner`. Sonnet/Terra ejecutan; Opus/Sol planifican y revisan. El revisor no edita.

### Especialistas disponibles

- `t2f-01-diseno`: Diseña experiencias bancarias sencillas, pantallas y jerarquía visual para tres niveles, juego y pausa, con criterios claros y sin implementar.
- `t2f-01-accesibilidad`: Revisa navegación por teclado, contraste, lector de pantalla, estados y experiencia de voz con evidencia real.
- `ui-designer` (solo Claude): Rediseña e implementa páginas, paneles y componentes aplicando `frontend-design`; compila y verifica el resultado visual.

## Motor de análisis de caídas

Presentar la caída, los antecedentes comparables, fuentes y límites con claridad; no transmitir seguridad ni ocultar datos ausentes. Consulta `docs/contexto-proyecto.md` y `docs/contratos.md`.
