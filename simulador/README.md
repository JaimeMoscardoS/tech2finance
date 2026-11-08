# Simulador

## Qué es

Área responsable de calcular y explicar la evolución de una cartera ficticia. Trabaja principalmente en `simulador/` y coordina las muestras y fuentes con `datos/`.

## Trabajo

- Definir escenarios identificados y documentar sus supuestos, periodos, fuentes y reglas de cálculo.
- Calcular el valor final, la diferencia respecto al importe inicial y las posiciones y operaciones simuladas.
- Devolver explicaciones estructuradas y el estado de los límites que efectivamente se hayan implementado.
- Documentar qué partes de los modos supervisado y automático están disponibles; ninguna opera con dinero real.

## Intercambio con otros componentes

- Recibe del backend la configuración descrita en [los contratos comunes](../docs/contratos.md).
- Entrega al backend el resultado de simulación con cartera, operaciones, límites y explicación; también facilita el catálogo de activos y escenarios.
- Utiliza datos de `datos/` identificados como ficticios, hipotéticos o históricos. Coordina los cambios de estructura con backend y tutor.