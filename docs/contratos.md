# Contratos entre áreas

## Qué es

Acuerdos entre áreas y contrato de la API local de demostración. El motor Python histórico conserva su propio contrato y se expone en `POST /api/game/compare`.

El perfil tipado de BancoT2F se define en [`shared/bank-profile.ts`](../shared/bank-profile.ts) y los datos en `shared/demo-data.json:bankProfile`. Véanse [condiciones y versiones](banco-t2f.md). Las tarifas del perfil son informativas y se excluyen del cálculo; un coste anual `null` significa no definido.

En el contexto interno del tutor se usa `bank?: BankProfile` y `instrument.product?: BankProduct` anidado en el instrumento; no hay `product` superior. El cliente puede indicar `bankId` opcional, que el servidor resuelve; los campos extra, incluidos `bank`, `bankProfile` y `product` inyectados, reciben 422.

- **1 → 2:** pantalla, nivel, parámetros del juego o pregunta; recibe resultados y errores.
- **5 → 3 y 2:** catálogo ficticio y series verificadas con fuente, fecha, licencia, moneda, frecuencia, ajustes y costes; las muestras ficticias deben indicarlo.
- **3 → 2:** evolución por fecha (en `/api/game/compare`, por número de mes sintético), aportaciones, resultados, decisiones de juego, fuente y supuestos. Los cálculos son verificables y no los hace el LLM.
- **2 → 4:** pregunta, pantalla, nivel y contexto mínimo disponible; objetivo, plazo y noticias verificadas con URL, fecha y procedencia cuando existan.
- **4 → 2 → 1:** explicación textual y audio opcional, con fuentes y límites. Si no hay contexto o noticias suficientes, comunicarlo.
- **1–4 → 5:** funciones comprobadas, resultados y limitaciones para pruebas y presentación.

El juego histórico no es una previsión: documentar qué activo representa cada serie, aportaciones, comisiones y periodo. La pausa no impide decisiones ni garantiza recuperación. No atribuir causalidad a una noticia sin evidencia. Fijar estructuras, validación, unidades y errores antes de implementar.

## Conversación y voz propuesta

En esta rama hay una alternativa local implementada: [`TutorProvider` y los tipos](../tutor-ia/src/types.ts) reciben pregunta limitada, historial acotado y contexto explícito, y devuelven texto por reglas, intención y fuentes. La interfaz conserva texto y contexto de cada respuesta; no invoca un modelo. La pausa usa `analyzeDecline` sobre observaciones del instrumento sin flujos o sobre la cartera ficticia. El informe incluye caída observada, episodios y fuentes; causas y comparables no están disponibles.

Para `demo-mixed` y seis meses, el informe añade `demoContext` desde `shared/decline-demo.json`: versión, identificador, duración, `sourceKind: synthetic_demo`, explicación bilingüe y noticias por número de mes. Es un guion ficticio, sin fuentes ni fechas reales, y no modifica los cálculos; `causesStatus` sigue siendo `unknown`. El servidor lo resuelve internamente y rechaza campos de hechos enviados por el cliente. Otros instrumentos, periodos y cartera no reciben el guion.

La voz opcional usa capacidades locales del dispositivo: lectura solo con voces marcadas como locales; dictado solo cuando el navegador confirma procesamiento local y modelo ya disponible. Si no están disponibles queda el texto. El micrófono de la barra solicita de inmediato el reconocimiento local y envía la pregunta final cuando termina; desde la pausa la escucha se inicia manualmente. En el chat escrito el dictado se revisa y no se envía automáticamente. No se descargan modelos desde la aplicación ni se llama a proveedores. Las claves de futuras integraciones quedarían en un servidor, nunca en el cliente.

La siguiente arquitectura sigue siendo una propuesta futura, no el modo local actual:

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

El motor `simulador` (`compare`) está expuesto en `POST /api/game/compare` solo para instrumentos ficticios; el frontend aún no lo consume. `/api/simulations` sigue usando `replay`, con otro momento de aportación, y los resultados no coinciden entre ambos. La [referencia del simulador](../simulador/README.md) define los campos, validaciones y errores, ejemplos de CLI y firmas Python exactas: `load_series`, `parse_series`, `simulate`, `compare`, `drawdowns` y `scenarios`. Los importes, tasas y valores se serializan como cadenas decimales; las duraciones y `max_gap_days` son enteros JSON. Histórico y escenarios usan `Decimal` con 34 cifras; el filtro de caídas compara fracciones exactas y muestra la profundidad con 120 cifras. Las demás rutas de la API usan cálculos propios. Las fuentes y licencias son declaraciones sin verificación. Comparables y causas devuelven información insuficiente o desconocida.


## Catálogo local de práctica (rama de trabajo)

El catálogo se comparte en `shared/demo-data.json` y el frontend lo expone mediante `frontend/src/catalog.ts`: cada instrumento tiene `instrumentId`, `assetType` (fondo, ETF o acción), `assetClass` (mixta, variable, fija o desconocida), `bankId`, gestora, relación con la entidad (`own`, `third_party`, `fictional` o `unknown`), identificador y clase cuando se conocen, moneda, fuente, fecha de consulta y estado de datos. La relación identifica el vínculo con la gestora o entidad, no la propiedad de los activos. Los campos desconocidos son nulos. El catálogo de demo se carga desde ese archivo tanto en el servidor como en el modo local.

El tipo local vigente de los resultados y puntos temporales está en [`frontend/src/simulation-types.ts`](../frontend/src/simulation-types.ts); [backend-contexto](backend-contexto.md) resume su interpretación y las diferencias con el motor Python expuesto para la comparación del juego. El contrato HTTP de demostración se describe en [backend-contexto](backend-contexto.md).

Tres fondos, un ETF y una acción ficticios usan secuencias inventadas diferentes que se repiten cada doce meses; no representan el historial de ningún producto ni una previsión. Las fichas de BBVA y Santander siguen sin histórico disponible. CaixaBank incorpora la muestra anual descrita abajo. No existe conexión bancaria.

### Muestra histórica anual de CaixaBank

`frontend/src/annual-history.ts` conserva cinco rentabilidades anuales publicadas, no precios ni valores liquidativos: 2021 −0,53 %, 2022 −0,67 %, 2023 +2,43 %, 2024 +2,97 % y 2025 +1,53 %. Fuente primaria: [ficha de CAIXABANK MONETARIO RENDIMIENTO, FI CLASE ESTÁNDAR](https://www.caixabankassetmanagement.com/es/fondos/caixabank-monetario-rendimiento-fi-clase-estandar), ISIN ES0138045002, EUR, consultada el 9 de noviembre de 2026. Las tasas son porcentajes redondeados publicados; no se ha verificado una licencia de redistribución ni autorización de uso comercial.

El frontend reconstruye una inversión ficticia aplicando cada tasa anual al saldo anterior y sumando después la aportación anual al cierre. Importe inicial y aportación anual admiten entre 0 y 10⁹ EUR cada uno. Hay cinco aportaciones, una por año; el total aportado es el inicial más cinco veces la aportación. Con aportación cero se conserva el cálculo anterior. Para 500 € iniciales y 100 € anuales se obtienen aproximadamente 1048,55 € de valor, 1000 € aportados y 48,55 € de diferencia.

Se muestran seis puntos: referencia al 31/12/2020 y cierres de 2021–2025. No se interpolan meses ni días ni se modelan impuestos o costes externos. Según la ficha, los gastos corrientes ya están deducidos de las rentabilidades; no se descuentan de nuevo. El resultado es aproximado por el redondeo de origen y no es un valor liquidativo, precio transaccionable ni predicción. Con 500 € iniciales y aportación cero se obtienen aproximadamente 529,02 € al cierre de 2025.

Este ejemplo es local y manual: no hay histórico diario, proveedor conectado ni datos en tiempo real. Antes de una integración o distribución hay que comprobar derechos y condiciones de la fuente y verificar los derechos de uso; el motor Python histórico independiente no consume esta muestra.

## API local de demostración

El contrato operativo, validaciones y errores están en [backend-contexto](backend-contexto.md). El cliente no envía al tutor resultados, fuentes ni saldos calculados; envía especificaciones y el servidor recalcula. `GET /api/catalog` devuelve `schemaVersion: "1.0"`, `banks`, `instruments` y `annualHistory`. `POST /api/simulations` devuelve el resultado temporal, identificador, moneda, momento de aportación, fuentes y supuestos; `POST /api/game/compare` devuelve la comparación educativa mantener/vender solo para instrumentos ficticios (campos en [backend-contexto](backend-contexto.md)); `POST /api/declines` devuelve el informe y `POST /api/tutor` devuelve `TutorReply` por reglas del servidor. No hay integración con proveedores externos ni datos reales de clientes.

La práctica guiada utiliza dos solicitudes de simulación independientes. La interfaz compara los resultados de aportaciones, plazo o activos bajo las condiciones indicadas en [contexto](contexto-proyecto.md#práctica-guiada-con-dinero-ficticio). Solo la especificación de la opción A o B seleccionada se transmite al tutor; el servidor vuelve a calcular sus hechos. Los resultados obsoletos se invalidan y un error no activa el modo local automáticamente. No se crea una nueva ruta ni una cartera a partir de la comparación.
