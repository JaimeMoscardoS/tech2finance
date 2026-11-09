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
