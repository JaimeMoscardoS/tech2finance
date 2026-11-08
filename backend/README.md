# Backend e integración

## Qué es

Área responsable de conectar interfaz, simulador y tutor. Trabaja principalmente en `backend/` y coordina los acuerdos de integración.

## Trabajo

- Facilitar a la interfaz el catálogo de activos y escenarios.
- Validar solicitudes, llamar al simulador y devolver su resultado.
- Recuperar el resultado de una simulación y enviarlo al tutor junto con la pregunta y el nivel; devolver su respuesta a la interfaz.
- Gestionar errores y mantener los identificadores de simulación disponibles durante el recorrido. El mecanismo de almacenamiento queda por decidir.

## Intercambio con otros componentes

- Recibe configuración y preguntas del frontend; recibe el catálogo y los resultados del simulador y la respuesta del tutor.
- Envía solicitudes al simulador y contexto completo al tutor, sin calcular cifras ni inventar resultados.
- Coordina [los contratos comunes](../docs/contratos.md) y consulta a las áreas afectadas antes de cambiarlos. La tecnología y las rutas concretas de API se deciden en equipo.