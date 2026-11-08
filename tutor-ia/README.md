# Tutor de IA

## Qué es

Área responsable de explicar al usuario los datos de la simulación. Trabaja principalmente en `tutor-ia/`.

## Trabajo

- Responder con lenguaje adaptado al nivel solicitado y conservar la etiqueta del escenario.
- Usar las cifras y resultados facilitados por el simulador a través del backend. Si no hay información para explicar una causa, reconocerlo.
- Preparar primero la respuesta de texto; la voz es opcional y dependerá del tiempo y de los medios disponibles.

## Intercambio con otros componentes

- Recibe del backend la pregunta, el nivel, el identificador y el resultado completo de la simulación.
- Devuelve al backend una respuesta textual y, si existe, una referencia al audio, según [los contratos comunes](../docs/contratos.md).
- Coordina cambios de contexto con backend y simulador. No realiza cálculos de cartera ni operaciones.