# Contexto de integración para backend

## Qué es

Punto de entrada para la persona 2 y sus agentes. Resume el estado del frontend integrado y las decisiones que afectan al backend, para coordinar el trabajo sin dar por existentes las API o servicios todavía pendientes. La referencia general es [contexto del proyecto](contexto-proyecto.md); los intercambios propuestos están en [contratos](contratos.md).

## Estado comprobado del frontend

El frontend es una aplicación React/TypeScript con Vite en `frontend/`. Incluye inicio, catálogo de ejemplo, simulador, cartera ficticia y asistente de muestra. Ofrece vistas de principiante, intermedio y avanzado, español/inglés y temas claro/oscuro. Los niveles cambian la cantidad de información, no el riesgo ni el cálculo. El idioma y el tema se guardan en el navegador mediante `localStorage`.

Todavía **no llama a una API de backend**. Los fondos y la cartera se muestran con datos ficticios; el asistente devuelve respuestas predefinidas, no utiliza Claude; y la voz, las noticias y el análisis histórico de caídas no están conectados. El frontend identifica estas limitaciones en la interfaz.

La simulación actual se ejecuta localmente en `frontend/src/demo.ts`. Recibe importe inicial, aportación mensual y número de meses; utiliza una secuencia de variaciones ficticias repetida cada 12 meses, aplica la aportación al inicio de cada mes y no incluye comisiones. Devuelve valores de evolución, valor final y capital aportado. Es una ayuda visual provisional: no representa el comportamiento histórico de un fondo ni una predicción. No debe trasladarse al backend como modelo financiero validado.

## Decisiones de producto que debe respetar

- El producto se plantea como copiloto integrable en una aplicación bancaria. La demo no conecta cuentas, no custodia dinero y no envía órdenes reales.
- Los tres niveles expresan conocimientos y presentación, no perfil de riesgo. El usuario puede cambiar de nivel sin que cambie por sí mismo su inversión.
- La máquina del tiempo y el motor de caídas necesitan datos con procedencia verificable. Deben distinguir episodios del mismo fondo de instrumentos comparables y comunicar si no existe información suficiente.
- La pausa ante una caída recuerda objetivo y horizonte si están disponibles y contempla la necesidad de liquidez. No bloquea decisiones, no garantiza recuperación y no atribuye causas sin evidencia.
- Claude se propone para explicar el contexto; el motor y sus reglas verificables producen los cálculos. ElevenLabs se propone para transcribir y reproducir voz, con funcionamiento por texto si la voz no está disponible. Las integraciones aún no existen.

## Qué coordinar antes de implementar

1. Con **frontend (1)**: definir contratos reales para catálogo, simulación, cartera, análisis de caídas y chat; cómo indicar carga, errores y fuentes, y cómo pasar idioma, nivel y pantalla. No asumir que los componentes actuales ya consumen esos endpoints.
2. Con **simulador (3)** y **datos (5)**: definir identificadores, monedas, fechas, aportaciones, costes, procedencia de series, criterios de comparación y formato de resultados. Distinguir muestras ficticias, datos históricos y escenarios hipotéticos.
3. Con **tutor y voz (4)**: definir el contexto mínimo permitido, fuentes, respuesta en texto y fallos de proveedores. Mantener las claves en el servidor y fuera de Git; no registrar ni enviar datos personales reales en la demo.
4. Con **pruebas (5)**: preparar casos de datos insuficientes, ausencia de noticias, errores de proveedor, pérdidas y episodios sin recuperación observada. El usuario siempre conserva la decisión.

Python/FastAPI es la dirección propuesta para backend, pero no hay aún servicio, endpoints ni esquemas acordados. La [propuesta de simulador histórico](simulador-historico.md) detalla las fuentes candidatas y el motor previsto. La persona 2 coordina las interfaces con los responsables de cada área; no tiene que resolver sola los problemas de integración. Antes de implementar, acordad contratos concretos en [contratos](contratos.md) y actualizad este documento cuando cambie el estado.

## Cómo verificar el estado

Consultar los PR y `main` en GitHub para saber qué cambios se han integrado. Para el frontend local, seguir [su README](../frontend/README.md); no asumir que el backend existe por poder abrir la demo. Registrar en el pull request las pruebas realizadas y distinguir lo implementado, lo comprobado y lo pendiente.