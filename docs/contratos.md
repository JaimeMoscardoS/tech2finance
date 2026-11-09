# Contratos entre áreas

## Qué es

Acuerdos conceptuales para las áreas; el contrato local del motor Python se describe al final, sin API HTTP implementada. La persona 2 coordina los formatos definitivos con quienes producen y consumen los datos.

- **1 → 2:** pantalla, nivel, parámetros del juego o pregunta; recibe resultados y errores.
- **5 → 3 y 2:** catálogo ficticio y series verificadas con fuente, fecha, licencia, moneda, frecuencia, ajustes y costes; las muestras ficticias deben indicarlo.
- **3 → 2:** evolución por fecha, aportaciones, resultados, decisiones de juego, fuente y supuestos. Los cálculos son verificables y no los hace el LLM.
- **2 → 4:** pregunta, pantalla, nivel y contexto mínimo disponible; objetivo, plazo y noticias verificadas con URL, fecha y procedencia cuando existan.
- **4 → 2 → 1:** explicación textual y audio opcional, con fuentes y límites. Si no hay contexto o noticias suficientes, comunicarlo.
- **1–4 → 5:** funciones comprobadas, resultados y limitaciones para pruebas y presentación.

El juego histórico no es una previsión: documentar qué activo representa cada serie, aportaciones, comisiones y periodo. La pausa no impide decisiones ni garantiza recuperación. No atribuir causalidad a una noticia sin evidencia. Fijar estructuras, validación, unidades y errores antes de implementar.

## Conversación y voz propuesta

1. El usuario puede escribir una pregunta o grabarla con el micrófono. Si usa voz, ElevenLabs transcribe el audio a texto.
2. El backend envía la pregunta a la API de Claude junto con el contexto disponible y pertinente: nivel, pantalla, simulación o cartera ficticia, objetivo y horizonte, y noticias verificadas cuando existan.
3. Claude genera una explicación adaptada a ese contexto. Los datos y cálculos proceden de los componentes correspondientes; el modelo no debe inventar cifras ni atribuir causas sin evidencia.
4. La interfaz muestra la respuesta escrita. Si el usuario activa la voz, ElevenLabs convierte esa respuesta en audio para reproducirla.

Para el hackathon, implementar primero el chat de texto contextual, después la lectura de respuestas y, por último, la entrada por micrófono. Mantener la opción escrita y gestionar fallos de cada proveedor. Las claves de Claude y ElevenLabs se conservan en el servidor y fuera de Git. Esta arquitectura es una propuesta; las integraciones todavía no están implementadas ni verificadas.

## Motor de análisis de caídas

- **5 → 3:** datos del fondo y de posibles comparables, serie temporal y fuentes o noticias verificables, con fechas, licencias y límites. El mismo fondo tiene prioridad cuando exista historial suficiente.
- **3 → 2:** informe calculado con periodo y magnitud de la caída, episodios previos y criterios de semejanza, evolución posterior y recuperación solo si se observa; incluir episodios sin recuperación observada, fuentes y datos faltantes.
- **2 → 4:** informe y contexto disponible del usuario —objetivo, horizonte y necesidad de liquidez si se ha proporcionado—, sin completar huecos por su cuenta.
- **4 → 1 a través de 2:** explicación adaptada que distinga hechos y posibles factores, muestre incertidumbre y no garantice recuperación ni presione a mantener. Si no hay datos o fuentes suficientes, debe decirlo.
- **1–4 → 5:** evidencia y casos para probar mismo fondo, comparable diferente identificado, ausencia de histórico y fuentes, episodio no recuperado, plazo largo y necesidad de liquidez.

En esta rama existe análisis cuantitativo básico local; los contratos de integración, comparables justificados y conexión a fuentes siguen pendientes.

## Contrato del motor Python, versión 1.0

En esta rama se implementa el motor aislado `simulador`, no una API HTTP. La [referencia del simulador](../simulador/README.md) define los campos, validaciones y errores, ejemplos de CLI y firmas Python exactas: `load_series`, `parse_series`, `simulate`, `compare`, `drawdowns` y `scenarios`. Los números de salida son cadenas decimales. La persona 2 deberá acordar adaptaciones HTTP y validación de datos al integrarlo; no existen endpoints ni conexión al frontend por este cambio. Las fuentes y licencias son declaraciones sin verificación. Comparables y causas devuelven información insuficiente o desconocida.


## Catálogo local de práctica (rama de trabajo)

El frontend configura el catálogo en `frontend/src/catalog.ts`: cada instrumento tiene `instrumentId`, `assetType` (fondo, ETF o acción), `assetClass` (mixta, variable, fija o desconocida), `bankId`, gestora, relación con la entidad (`own`, `third_party`, `fictional` o `unknown`), identificador y clase cuando se conocen, moneda, fuente, fecha de consulta y estado de datos. La relación identifica el vínculo con la gestora o entidad, no la propiedad de los activos. Los campos desconocidos son nulos. El catálogo local es configuración de demo, no una API ni una carga desde archivo.

Tres fondos, un ETF y una acción ficticios usan secuencias inventadas diferentes que se repiten cada doce meses; no representan el historial de ningún producto ni una previsión. BBVA, Santander y CaixaBank tienen fichas de identidad enlazadas, consultadas el 9 de noviembre de 2026, pero no hay series históricas ni costes verificados: no se calcula ni se dibuja una evolución para ellos. La identidad de un producto no valida una serie ni sus licencias. Para datos reales faltan serie del mismo instrumento y clase, moneda, frecuencia, ajustes, comisiones, cobertura y derechos de uso verificados, y acordar el contrato HTTP y la integración con el motor Python. No existe carga ni conexión bancaria.
