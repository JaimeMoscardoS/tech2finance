# Frontend

## Qué es

Área responsable de las pantallas y del recorrido del usuario. Trabaja principalmente en `frontend/`.

## Trabajo

- Mostrar configuración, cartera ficticia, resultados y conversación con el tutor.
- Adaptar el detalle del lenguaje a principiante, intermedio o avanzado, sin confundir nivel de conocimientos con perfil de riesgo.
- Identificar claramente escenarios y operaciones simuladas, y mostrar errores y funcionalidades pendientes.

## Intercambio con otros componentes

- Recibe del backend el catálogo de activos y escenarios, el resultado de simulación y la respuesta del tutor.
- Envía al backend la solicitud de simulación y, después, la pregunta junto con el identificador de la simulación.
- Implementa estos intercambios siguiendo [los contratos comunes](../docs/contratos.md). Puede usar datos de ejemplo locales mientras el backend no esté listo, indicando que son ficticios.
- Acordar cambios de campos con la persona de backend; no modificar el cálculo del simulador ni generar respuestas por su cuenta.