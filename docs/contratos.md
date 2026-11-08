# Acuerdo de integración de Tech2Finance

## Qué es

Este documento fija una primera propuesta compartida para que las cinco personas puedan trabajar en paralelo. Son contratos de la demo, todavía sin implementar. El backend coordina los cambios de formato con las áreas afectadas antes de modificar este documento.

## Recorrido mínimo

1. La interfaz recoge el nivel del usuario y la configuración de una simulación.
2. El backend envía esa solicitud al simulador.
3. El simulador devuelve la cartera, las operaciones y una explicación estructurada; el backend entrega el resultado a la interfaz.
4. La interfaz envía una pregunta y el identificador de la simulación al backend. Este pasa al tutor el resultado de esa simulación y el nivel de explicación.
5. El tutor devuelve una respuesta textual; el backend la entrega a la interfaz.

No se hacen operaciones reales. Cada resultado y escenario debe indicar si es ficticio, hipotético o histórico; los resultados históricos no son predicciones.

## Formatos comunes

Los ejemplos siguientes ilustran la estructura, no son valores de mercado. Los nombres de campos en inglés se usarán de forma consistente en los componentes. Cantidades y precios se expresan en la moneda indicada; los cambios de precio de un escenario se interpretan según las reglas documentadas por el simulador. Las tecnologías, transporte, precisión numérica y persistencia quedan por decidir antes de implementar.

### Solicitud de simulación — interfaz → backend → simulador

```json
{
  "experience_level": "beginner",
  "mode": "supervised",
  "initial_amount": 50,
  "currency": "EUR",
  "scenario_id": "example_scenario",
  "asset_ids": ["example_asset"],
  "period_months": 12
}
```

`experience_level`: `beginner`, `intermediate` o `advanced`; solo cambia la complejidad de la explicación, no determina el riesgo. `mode`: `supervised` o `automatic`, ambos ficticios. `scenario_id` y `asset_ids` deben existir en el catálogo que el backend pone a disposición de la interfaz. Si faltan datos o un identificador es inválido, el backend informa del error y no inicia la simulación.

### Resultado — simulador → backend → interfaz

```json
{
  "simulation_id": "sim_example_001",
  "scenario": {"id": "example_scenario", "type": "hypothetical", "label": "Ejemplo hipotético", "source": "Datos de ejemplo"},
  "currency": "EUR",
  "initial_amount": 50,
  "final_value": 48,
  "profit_loss": -2,
  "holdings": [{"asset_id": "example_asset", "name": "Activo de ejemplo", "value": 48}],
  "operations": [{"asset_id": "example_asset", "action": "buy", "amount": 50, "status": "simulated"}],
  "risk_limits": [{"description": "Límite de ejemplo", "status": "within_limit"}],
  "explanation": "Resultado ficticio de ejemplo."
}
```

`profit_loss` es `final_value` menos `initial_amount`. `scenario.type` es `fictional`, `hypothetical` o `historical`; `source` identifica la procedencia. Las operaciones son siempre simuladas; `status` del límite será `within_limit` o `exceeded`. El simulador explica cómo calcula los valores y qué límites son aplicables; estos ejemplos no acreditan que exista un control financiero real.

En modo supervisado, el flujo completo de propuesta, aprobación y ejecución ficticia queda pendiente de diseñar; la interfaz no debe presentar una operación como aprobada sin una acción explícita. En modo automático, las decisiones ficticias quedan sujetas a los límites que se implementen. Hasta disponer de ambos flujos, mostrar claramente que se trata de una demostración o de una funcionalidad pendiente.

### Solicitud al tutor — interfaz → backend → tutor

La interfaz envía la pregunta y el identificador. El backend busca el resultado de esa simulación y completa el contexto para el tutor:

```json
{
  "simulation_id": "sim_example_001",
  "experience_level": "beginner",
  "question": "¿Por qué ha bajado mi cartera?",
  "simulation_result": {"simulation_id": "sim_example_001", "scenario": {"id": "example_scenario", "type": "hypothetical", "label": "Ejemplo hipotético", "source": "Datos de ejemplo"}, "currency": "EUR", "initial_amount": 50, "final_value": 48, "profit_loss": -2, "holdings": [{"asset_id": "example_asset", "name": "Activo de ejemplo", "value": 48}], "operations": [{"asset_id": "example_asset", "action": "buy", "amount": 50, "status": "simulated"}], "risk_limits": [{"description": "Límite de ejemplo", "status": "within_limit"}], "explanation": "Resultado ficticio de ejemplo."}
}
```

`simulation_result` utiliza el mismo formato completo de la sección anterior. Si no se encuentra la simulación, se devuelve un error; no se inventa contexto.

### Respuesta del tutor — tutor → backend → interfaz

```json
{
  "simulation_id": "sim_example_001",
  "answer": "En este escenario hipotético, la cartera terminó en 48 EUR frente a los 50 EUR iniciales.",
  "audio_url": null
}
```

`audio_url` es opcional y puede ser `null` si no hay voz. El tutor usa únicamente los datos disponibles para cifras y resultados; si desconoce una causa concreta, lo dice. La respuesta debe conservar la etiqueta del escenario.

## Catálogo y errores

El área de datos y simulador entrega al backend un catálogo que incluya, como mínimo, identificadores y nombres de activos; identificadores, nombres, tipo y fuente de escenarios; y periodos admitidos. El backend lo hace disponible a la interfaz. El formato exacto del catálogo y los códigos HTTP quedan pendientes de acordar.

Como formato común inicial de error se propone `{"error": {"code": "invalid_input", "message": "Descripción comprensible"}}`. No incluir secretos ni datos personales en errores. Cada integración debe poder indicar entradas inválidas, simulación no encontrada y servicio no disponible.

## Cambio de acuerdos

El responsable que necesite cambiar un campo lo comunica al backend y a los consumidores afectados, actualiza los ejemplos en este archivo y vincula el cambio en su pull request. La persona de pruebas comprueba el recorrido y la persona de presentación ajusta el guion si cambia lo que se puede demostrar.