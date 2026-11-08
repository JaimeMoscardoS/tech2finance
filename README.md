# Tech2Finance

## Qué es

Tech2Finance es la propuesta de un copiloto de inversión para integrarse en la aplicación de un banco. Adapta la información al nivel del cliente, permite explorar escenarios y explica tanto simulaciones como una cartera existente. El banco sería el cliente comercial y sus clientes utilizarían el producto. Es una propuesta B2B2C, aún sin validar comercialmente.

## Demo del hackathon

Se propone una aplicación bancaria simulada con dos recorridos: una persona que prueba una inversión ficticia y otra que consulta el resumen de una cartera ficticia. El núcleo es seleccionar nivel, explorar una simulación y hacer preguntas contextualizadas. El resumen de cartera es la siguiente prioridad; la voz, las propuestas educativas automáticas y otras mejoras se incorporarán si el núcleo funciona.

Hay tres niveles de explicación y una sola experiencia con la misma lógica de cálculo. El nivel de conocimientos no equivale al perfil de riesgo. Los escenarios muestran supuestos y posibles pérdidas; no predicen el futuro. La demo no conecta bancos, no opera con dinero real y no ejecuta ni simula compras o ventas: las propuestas automáticas son ilustraciones educativas que no modifican saldos.

Este repositorio contiene documentación de organización; todavía no hay una aplicación funcional. La integración bancaria, la supervisión profesional y las operaciones a través de una entidad autorizada son parte de la visión futura.

## Equipo y tecnología prevista

| Persona | Área | Responsabilidad |
| --- | --- | --- |
| 1 | [Frontend](frontend/) | Interfaz, niveles, gráficos y navegación. |
| 2 | [Backend e integración](backend/) | Contratos, rutas de servidor, conexión y despliegue. |
| 3 | [Simulador y motor](simulador/) | Cálculos verificables, escenarios y propuestas educativas ficticias. |
| 4 | [Tutor de IA](tutor-ia/) | Claude contextual y voz opcional con ElevenLabs. |
| 5 | [Producto, datos, pruebas y presentación](presentacion/) | Recorrido, [datos de demo](datos/), [pruebas](tests/), documentación y pitch. |

Se plantea una sola aplicación con Next.js, React, TypeScript y rutas de servidor de Next.js; Claude para el tutor, ElevenLabs opcional y Recharts para gráficos. Son elecciones de partida, todavía sin instalar ni implementar. Las carpetas actuales organizan responsabilidades y documentación: no son cinco aplicaciones. El equipo decidirá conjuntamente dónde situar el código dentro de la aplicación compartida.

Consultad el [acuerdo de integración](docs/contratos.md), el [reparto](docs/colaboracion.md), el [análisis estratégico](docs/analisis-estrategico.md) y el [documento original](docs/resumen-idea-original.docx). El análisis contiene recomendaciones e hipótesis, no resultados validados.

## Empezar a colaborar

1. El propietario invita a cada miembro desde GitHub: **Settings → Collaborators → Add people**. Cada persona acepta la invitación.
2. Clonar con `git clone https://github.com/JaimeMoscardoS/tech2finance.git` y entrar en la carpeta.
3. Antes de empezar, actualizar `main`: `git switch main` y `git pull`.
4. Crear una rama para cada tarea: `git switch -c feature/nombre-tarea`.
5. Guardar y subir los cambios: `git add .`, `git commit -m "Describe change"` y `git push -u origin feature/nombre-tarea`.
6. Abrir un pull request en GitHub, explicar el cambio y pedir revisión antes de integrarlo en `main`.

Cread una issue por tarea, asignad una persona y enlazadla desde el pull request. No subáis claves ni datos privados.