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

En esta rama se implementa el motor aislado `simulador`, no una API HTTP. La [referencia del simulador](../simulador/README.md) define los campos, validaciones y errores, ejemplos de CLI y firmas Python exactas: `load_series`, `parse_series`, `simulate`, `compare`, `drawdowns` y `scenarios`. Los importes, tasas y valores se serializan como cadenas decimales; las duraciones y `max_gap_days` son enteros JSON. Histórico y escenarios usan `Decimal` con 34 cifras; el filtro de caídas compara fracciones exactas y muestra la profundidad con 120 cifras. La persona 2 deberá acordar adaptaciones HTTP y validación de datos al integrarlo; no existen endpoints ni conexión al frontend por este cambio. Las fuentes y licencias son declaraciones sin verificación. Comparables y causas devuelven información insuficiente o desconocida.


## Catálogo local de práctica (rama de trabajo)

El frontend configura el catálogo en `frontend/src/catalog.ts`: cada instrumento tiene `instrumentId`, `assetType` (fondo, ETF o acción), `assetClass` (mixta, variable, fija o desconocida), `bankId`, gestora, relación con la entidad (`own`, `third_party`, `fictional` o `unknown`), identificador y clase cuando se conocen, moneda, fuente, fecha de consulta y estado de datos. La relación identifica el vínculo con la gestora o entidad, no la propiedad de los activos. Los campos desconocidos son nulos. El catálogo local es configuración de demo, no una API ni una carga desde archivo.

El tipo local vigente de los resultados y puntos temporales está en [`frontend/src/simulation-types.ts`](../frontend/src/simulation-types.ts); [backend-contexto](backend-contexto.md) resume su interpretación y las diferencias con el motor Python aislado. No existe todavía un contrato HTTP implementado.

Tres fondos, un ETF y una acción ficticios usan secuencias inventadas diferentes que se repiten cada doce meses; no representan el historial de ningún producto ni una previsión. Las fichas de BBVA y Santander siguen sin histórico disponible. CaixaBank incorpora la muestra anual descrita abajo. No existe carga, API ni conexión bancaria.

### Muestra histórica anual de CaixaBank

`frontend/src/annual-history.ts` conserva cinco rentabilidades anuales publicadas, no precios ni valores liquidativos: 2021 −0,53 %, 2022 −0,67 %, 2023 +2,43 %, 2024 +2,97 % y 2025 +1,53 %. Fuente primaria: [ficha de CAIXABANK MONETARIO RENDIMIENTO, FI CLASE ESTÁNDAR](https://www.caixabankassetmanagement.com/es/fondos/caixabank-monetario-rendimiento-fi-clase-estandar), ISIN ES0138045002, EUR, consultada el 9 de noviembre de 2026. Las tasas son porcentajes redondeados publicados; no se ha verificado una licencia de redistribución ni autorización de uso comercial.

El frontend reconstruye una inversión ficticia aplicando cada tasa anual al saldo anterior y sumando después la aportación anual al cierre. Importe inicial y aportación anual admiten entre 0 y 10⁹ EUR cada uno. Hay cinco aportaciones, una por año; el total aportado es el inicial más cinco veces la aportación. Con aportación cero se conserva el cálculo anterior. Para 500 € iniciales y 100 € anuales se obtienen aproximadamente 1048,55 € de valor, 1000 € aportados y 48,55 € de diferencia.

Se muestran seis puntos: referencia al 31/12/2020 y cierres de 2021–2025. No se interpolan meses ni días ni se modelan impuestos o costes externos. Según la ficha, los gastos corrientes ya están deducidos de las rentabilidades; no se descuentan de nuevo. El resultado es aproximado por el redondeo de origen y no es un valor liquidativo, precio transaccionable ni predicción. Con 500 € iniciales y aportación cero se obtienen aproximadamente 529,02 € al cierre de 2025.

Este ejemplo es local y manual: no hay histórico diario, proveedor conectado ni datos en tiempo real. Antes de una integración o distribución hay que comprobar derechos y condiciones de la fuente y acordar con backend y simulador el contrato HTTP, formato y tratamiento de datos; el motor Python no consume esta muestra.
