# Agentes del equipo

## Qué es

Agentes de desarrollo del repositorio, independientes de la IA que usará la aplicación. Cada área tiene ejecutor y revisor y existe un planificador compartido.

| Área | Ejecutor | Revisor |
| --- | --- | --- |
| 1 | `t2f-01-frontend-executor` | `t2f-01-frontend-reviewer` |
| 2 | `t2f-02-backend-executor` | `t2f-02-backend-reviewer` |
| 3 | `t2f-03-simulador-executor` | `t2f-03-simulador-reviewer` |
| 4 | `t2f-04-tutor-executor` | `t2f-04-tutor-reviewer` |
| 5 | `t2f-05-producto-executor` | `t2f-05-producto-reviewer` |

Planificador: `t2f-planner`. En Claude Code el ejecutor usa Sonnet y planificación/revisión Opus. En Codex el ejecutor usa `gpt-6.1-terra` y planificación/revisión `gpt-6.1-sol`. Los modelos dependen del acceso de cada persona: si no están disponibles, comunicarlo.

Configuraciones de proyecto en `.claude/agents/` y `.codex/agents/`; Codex utiliza `.codex/config.toml`. Abrir la raíz del proyecto y confiar en la configuración si la herramienta lo solicita; puede hacer falta iniciar otra sesión. Pedir por nombre, con tarea y archivos concretos. Ejemplo: «Usa `t2f-03-simulador-executor` para esta tarea y después `t2f-03-simulador-reviewer` para revisar el diff». El revisor informa y no edita; una persona o el agente principal verifica el resultado.

## Especialistas por responsabilidad

### 1

- `t2f-01-diseno`: Diseña experiencias bancarias sencillas, pantallas y jerarquía visual para tres niveles, juego y pausa, con criterios claros y sin implementar.
- `t2f-01-accesibilidad`: Revisa navegación por teclado, contraste, lector de pantalla, estados y experiencia de voz con evidencia real.

### 2

- `t2f-02-arquitectura`: Diseña arquitectura React y FastAPI propuesta, límites de módulos, contratos y despliegue mínimo; declara decisiones pendientes.
- `t2f-02-integracion`: Implementa endpoints y conexiones entre módulos conforme a contratos acordados, con validación, errores y límites de propiedad.
- `t2f-02-seguridad`: Revisa secretos, entradas, proveedores, dependencia, protección de datos y riesgos de aplicación con evidencia.

### 3

- `t2f-03-cuantitativo`: Implementa cálculos reproducibles de aportaciones, evolución histórica y escenarios; documenta unidades, comisiones y supuestos.
- `t2f-03-revisor-matematico`: Comprueba resultados, unidades, periodicidad, aportaciones, datos, supuestos, pérdidas y pruebas sin declarar validación de mercado.

### 4

- `t2f-04-conversacion`: Implementa conversación contextual en el servidor con Claude, separación entre hechos y explicaciones, manejo de fallos y claves privadas.
- `t2f-04-voz`: Integra voz opcional con proveedor, control de reproducción, permisos y alternativa textual; nunca exponer claves.
- `t2f-04-revisor-fundamentos`: Busca cifras inventadas, promesas, causalidad sin respaldo, citas incorrectas y señales que presionen a no vender.

### 5

- `t2f-05-fuentes`: Prepara muestras ficticias y recopila fuentes verificables con fecha, cobertura, licencia y límites; no fabrica series o noticias.
- `t2f-05-qa`: Revisa pruebas, fallos del recorrido, casos de simulador, resultados de voz y antipánico, y evidencia real.
- `t2f-05-presentacion`: Prepara narrativa, guion, materiales editables y ensayo a partir de capacidades verificadas; distingue hipótesis y visión futura.
- `t2f-05-revisor-presentacion`: Revisa coherencia del pitch, trazabilidad de afirmaciones, demo, métricas, límites y contradicciones con el producto.
