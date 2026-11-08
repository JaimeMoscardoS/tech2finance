# Tech2Finance

## Qué es

Propuesta para el Hackathon de Finanzas UC3M: una plataforma integrable en aplicaciones bancarias que ayuda a aprender sobre inversiones, experimentar con una cartera ficticia y comprender decisiones simuladas. El documento original está en [docs](docs/resumen-idea-original.docx).

## Alcance de la demo

- Configuración inicial y tres niveles de explicación: principiante, intermedio y avanzado.
- Cartera ficticia y simulación de inversiones con escenarios identificados.
- Tutor conversacional, con voz si el equipo dispone de tiempo y medios.
- Decisiones simuladas en modo supervisado o automático, con explicación y límites de riesgo.
- Sin operaciones reales ni conexión a dinero real. La integración bancaria es una visión futura.

El documento original describe el alcance deseado; el equipo debe priorizar qué llega a estar operativo en el hackathon. Este repositorio es una estructura inicial y aún no contiene una aplicación funcional.

## Carpetas y reparto sugerido

| Carpeta | Responsabilidad sugerida |
| --- | --- |
| [frontend](frontend/) | Pantallas, niveles de experiencia e integración de la interfaz. |
| [backend](backend/) | API y coordinación de servicios y datos ficticios. |
| [simulador](simulador/) | Cartera ficticia, escenarios, resultados y límites simulados. |
| [tutor-ia](tutor-ia/) | Conversación, explicaciones contextualizadas y posible voz. |
| [datos](datos/) | Fuentes, muestras y documentación de procedencia. |
| [tests](tests/) | Pruebas que comprueben los recorridos entre componentes. |
| [docs](docs/) | Idea original, acuerdos, decisiones y coordinación. |
| [presentacion](presentacion/) | Guion, materiales y demostración para el hackathon. |

Las responsabilidades son una propuesta: una persona puede asumir varias y varias pueden colaborar en una. Acordad las interfaces y tecnologías antes de implementar.

## Empezar a colaborar

1. El propietario invita a cada miembro desde GitHub: **Settings → Collaborators → Add people**. Cada persona acepta la invitación.
2. Clonar con `git clone <URL-del-repositorio>` y entrar en la carpeta.
3. Antes de empezar, actualizar `main`: `git switch main` y `git pull`.
4. Crear una rama para cada tarea: `git switch -c feature/nombre-tarea`.
5. Guardar y subir los cambios: `git add .`, `git commit -m "Describe change"` y `git push -u origin feature/nombre-tarea`.
6. Abrir un pull request en GitHub, explicar el cambio y pedir revisión antes de integrarlo en `main`.

Para repartir trabajo, cread una issue por tarea, asignad una persona responsable y enlazadla desde el pull request. Más detalle en [colaboración](docs/colaboracion.md).