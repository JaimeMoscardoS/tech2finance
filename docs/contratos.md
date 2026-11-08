# Acuerdo de integración de Tech2Finance

## Qué es

Propuesta inicial de datos para coordinar las cinco áreas de una única aplicación bancaria simulada. No hay código, rutas ni tipos TypeScript implementados todavía. Backend coordina las decisiones y cualquier cambio con las áreas que producen o consumen los datos. Los ejemplos son ficticios y no son datos de mercado.

## Recorridos

1. **Simulación:** frontend envía configuración al backend; este la pasa al simulador y devuelve los resultados y supuestos al frontend. El usuario pregunta al tutor; backend le proporciona la pantalla, el nivel y el resultado disponible.
2. **Cartera existente:** backend facilita una cartera ficticia preparada por la persona 5 con apoyo del simulador. Frontend muestra su resumen y solicita al tutor una explicación contextual basada en ese contenido.
3. **Propuestas educativas opcionales:** el motor puede presentar una distribución hipotética o una alerta basada en reglas documentadas. No ejecuta compras o ventas, no cambia saldos y no implica una recomendación real.

La demo no se conecta a un banco ni utiliza dinero real. El nivel de conocimientos controla la explicación, no determina el perfil de riesgo. Los escenarios hipotéticos no predicen el futuro.

## Convenciones

Se usa `camelCase` en estos ejemplos para facilitar su traducción a TypeScript. El backend y los responsables de cada área concretarán tipos, rutas, validación, precisión numérica y persistencia antes de implementar. Importes en la moneda indicada, plazos en meses y tasas expresadas como porcentaje anual; las fórmulas deben documentar cómo convierten los periodos. No hay escenarios históricos reales en estos ejemplos.

## Solicitud de simulación: frontend → backend → simulador

```json
{
  "knowledgeLevel": "beginner",
  "initialAmount": 50,
  "monthlyContribution": 20,
  "currency": "EUR",
  "assetId": "fictional_etf",
  "durationMonths": 60,
  "scenarioIds": ["unfavourable", "central", "favourable"]
}
```

`knowledgeLevel` admite `beginner`, `intermediate` o `advanced`. Los activos y escenarios deben existir en el catálogo compartido. El motor financiero aplica las mismas reglas en los tres niveles. Backend rechaza entradas inválidas; el formato exacto de catálogo queda por acordar.

## Resultado de simulación: simulador → backend → frontend

```json
{
  "simulationId": "sim_example_001",
  "dataType": "hypothetical",
  "currency": "EUR",
  "initialAmount": 50,
  "monthlyContribution": 0,
  "durationMonths": 12,
  "totalContributions": 50,
  "scenarios": [
    {
      "id": "central",
      "label": "Central hipotético",
      "annualRatePercent": 4,
      "finalValue": 52,
      "profitLoss": 2,
      "totalReturnPercent": 4,
      "timeline": [{"month": 0, "value": 50}, {"month": 12, "value": 52}]
    }
  ],
  "assumptions": ["Crecimiento anual hipotético del 4 %", "Sin comisiones ni aportaciones mensuales"]
}
```

`totalContributions` incluye el importe inicial y todas las aportaciones efectivamente aplicadas; `profitLoss` es `finalValue - totalContributions`. `totalReturnPercent` expresa esa diferencia como porcentaje del capital total aportado cuando es mayor que cero; no es rentabilidad anualizada. El ejemplo utiliza un solo escenario para ser breve; la comparación requiere incluir los escenarios disponibles. El motor documentará periodicidad y momento de cada aportación y calculará la evolución; el modelo de lenguaje no calcula saldos.

## Cartera existente: datos → backend → frontend y tutor

```json
{
  "portfolioId": "portfolio_demo_001",
  "dataType": "fictional",
  "currency": "EUR",
  "periodLabel": "Último mes ficticio",
  "previousValue": 1000,
  "currentValue": 980,
  "periodChange": -20,
  "fees": 0,
  "holdings": [{"assetId": "fictional_fund", "name": "Fondo ficticio", "currentValue": 980}],
  "observedChanges": ["El valor de la cartera es 20 EUR inferior al valor anterior."],
  "source": "Cartera ficticia preparada para la demo"
}
```

El resumen deberá conservar procedencia y periodo, y no atribuir causas sin datos que las respalden. `periodChange` es la variación de valor entre los dos momentos, no una rentabilidad calculada; si hay aportaciones, retiradas o comisiones, deberán tratarse explícitamente antes de interpretar el resultado. La persona 5 coordina los datos con simulador y backend.

## Pregunta contextual: frontend → backend → tutor

Frontend envía pregunta, pantalla y referencia de simulación o cartera; el backend incorpora los datos que realmente tenga disponibles. Ejemplo del objeto que recibe el tutor:

```json
{
  "knowledgeLevel": "beginner",
  "screen": "portfolio",
  "question": "¿Por qué ha bajado mi cartera?",
  "context": {
    "kind": "portfolio",
    "portfolio": {
      "portfolioId": "portfolio_demo_001",
      "dataType": "fictional",
      "currency": "EUR",
      "periodLabel": "Último mes ficticio",
      "previousValue": 1000,
      "currentValue": 980,
      "periodChange": -20,
      "fees": 0,
      "holdings": [{"assetId": "fictional_fund", "name": "Fondo ficticio", "currentValue": 980}],
      "observedChanges": ["El valor de la cartera es 20 EUR inferior al valor anterior."],
      "source": "Cartera ficticia preparada para la demo"
    }
  }
}
```

Para una simulación, `context.kind` será `simulation` y `context.simulation` contendrá el resultado completo de simulación anterior. Si falta el contexto solicitado, backend devuelve un error; el tutor no inventa cifras ni causas. Los nombres y opciones exactas se traducirán a tipos compartidos de TypeScript.

## Respuesta del tutor: tutor → backend → frontend

```json
{
  "answer": "En esta cartera ficticia, el valor ha bajado 20 EUR. Con estos datos no puedo determinar la causa.",
  "audioUrl": null
}
```

`audioUrl` puede ser `null` si no hay voz; ElevenLabs es opcional. Las claves de Claude y ElevenLabs permanecen en el servidor. Las explicaciones distinguen hechos, hipótesis y datos ausentes.

## Errores y cambios

Como formato inicial se propone `{"error": {"code": "invalid_input", "message": "Descripción comprensible"}}`. Se deben contemplar entradas inválidas, contexto inexistente y servicio no disponible, sin exponer secretos. Cada responsable acuerda con backend y los consumidores cualquier cambio de contrato, actualiza ejemplos y avisa a la persona de pruebas y presentación.