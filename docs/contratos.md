# Contratos entre áreas

## Qué es

Acuerdos entre áreas y contrato de la API local de demostración. El motor Python histórico conserva su propio contrato y se expone en `POST /api/game/compare`.

Los nombres genéricos bilingües de presentación se mantienen aparte del catálogo verificado en `shared/fund-aliases.json`. La interfaz y el servidor resuelven los duplicados sobre el catálogo completo ordenando sus identificadores; los informes de caídas y el contexto del tutor usan el alias. El catálogo de API, la identidad de noticias, los archivos de datos y los CSV conservan la denominación oficial. El alias no representa una clasificación de riesgo ni de activos.

## Detección y noticias

`POST /api/decline-events` recibe exclusivamente `{decline: DeclineSpec}` y reconstruye el informe. Si `currentDrawdownPercent >= 5`, umbral educativo de demo sin significado de asesoramiento, responde `triggered` y un `eventId` estable derivado de la especificación y las observaciones; de otro modo responde `not_triggered`, identificador nulo y no consulta noticias. No registra transiciones persistentes ni escucha bancos: evalúa la instantánea histórica cuando la interfaz solicita una valoración.

La respuesta incluye `schemaVersion: "1.0"`, `thresholdPercent: 5`, `report` y `news`. Este contiene `status` (`ready`, `empty` o `unavailable`), `provider: ecb_archive`, `checkedAt` UTC, `periodStart`, `periodEnd`, `items` y `limitations`. Las fechas pueden ser nulas cuando no existe un periodo válido. Los elementos incluyen `id`, `title`, `url`, `publisher`, `publishedAt`, `excerpt` y `scope: market_context`. El periodo va del máximo observado abierto al último cierre, recortado a 366 días inclusive. Se examinan títulos del archivo oficial del BCE para la identidad del catálogo y comunicados macroeconómicos relevantes. Una coincidencia de título no acredita relación con el fondo. Los comunicados no prueban la causa de la caída ni la composición de la cartera.

El proveedor BCE funciona sin clave por defecto, también con el análisis local del servidor. `T2F_NEWS_PROVIDER=off` desactiva las noticias; para ejecución completamente sin red, seleccionar además `T2F_ANALYSIS_PROVIDER=demo`. La interfaz en modo local sin API no consulta el servidor. Se permiten como máximo dos archivos anuales y cuatro artículos, 512 KiB por página, sin redirecciones, con plazo de 12 segundos, concurrencia limitada y caché en memoria de hasta 64 periodos durante cinco minutos. Los fallos se indican como `unavailable`, sin contexto inventado; no se guardan datos personales. La búsqueda cubre exclusivamente el archivo de comunicados del BCE, no todas las noticias del fondo.

`POST /api/decline-explanations` añade el mismo objeto `news`; cuando existe contexto, registra las fuentes y envía títulos y extractos acotados al modelo como contenido externo no confiable, no como instrucciones. Las seis secciones y validaciones existentes se mantienen. El límite total de análisis es 55 segundos. La comprobación con proveedor simulado no demuestra la veracidad de las respuestas generadas.

## Datos CNMV y cálculo mensual (rama de trabajo)

El catálogo v2 distingue el anfitrión ficticio BancoT2F de las clases de fondos reales de entidades externas. La lista `demoStudyInstrumentIds` determina qué casos se muestran en la demo y no cambia su entidad ni su ISIN. Los valores liquidativos y su trazabilidad se conservan en `shared/nav-history.json`; el manifiesto fija por separado el hash canónico de catálogo e histórico y ambos archivos tienen una copia versionada. Los snapshots anteriores y el replay periódico anterior se conservan para reproducir los ejemplos antiguos.

La muestra comprende cierres mensuales observados desde diciembre de 2019 hasta diciembre de 2025, con fechas reales y sin interpolación. La inversión inicial se aplica al primer cierre elegido y cada aportación mensual se suma tras la variación del siguiente cierre. La frecuencia anual aplica la cantidad únicamente en los periodos 12, 24 y siguientes; si se simulan menos de doce meses no hay aportación periódica. Solo se admiten fechas de inicio disponibles y periodos dentro de la cobertura; no se repiten ciclos ni se extrapola. El valor liquidativo incorpora los gastos que ya afectan al fondo y no se descuentan de nuevo; no se modelan impuestos ni costes externos.

La elegibilidad requiere identidad ISIN, registro y clase, moneda EUR, cierres completos y ausencia de distribuciones registradas a la precisión publicada en los informes semestrales consultados de 2020 a 2025. Esto no garantiza la política futura. Los informes trimestrales no publicados no se rellenan. El [manual CNMV, campo 23](https://www.cnmv.es/cnmvdia/decetes/Manual_AnexosIIC.pdf) define la cobertura semestral; la [nota legal](https://www.cnmv.es/portal/Utilidades/NotaLegal) exige reutilización fiel y condiciones que deben revisarse para cada uso. La clase BBVA que registra distribuciones queda deshabilitada hasta modelarlas.

La [Ley 18/2022](https://www.boe.es/eli/es/l/2022/09/28/18) eliminó la obligatoriedad de los informes trimestrales y el [Real Decreto 816/2023](https://www.boe.es/eli/es/rd/2023/11/08/816) desarrolló ese cambio; la ausencia de un archivo trimestral no se interpreta como distribución cero. El [traspaso para el juego histórico](planning/historical-investment-game.md) describe el trabajo futuro, aún no implementado en su interfaz.

La API de comparación usa las mismas fechas de cierre y expone fecha programada, fecha de ejecución e índice de periodo. La aportación del cierre de venta se invierte antes de vender y las posteriores permanecen en efectivo. El evento verificado de la OMS solo aparece si su fecha está dentro del periodo observado; la coincidencia temporal no demuestra causalidad y `causesStatus` sigue siendo `unknown`.

El perfil tipado de BancoT2F se define en [`shared/bank-profile.ts`](../shared/bank-profile.ts) y los datos en `shared/demo-data.json:bankProfile`. Véanse [condiciones y versiones](banco-t2f.md). Las tarifas del perfil son informativas y se excluyen del cálculo; un coste anual `null` significa no definido.

En el contexto interno del tutor se usa `bank?: BankProfile` y `instrument.product?: BankProduct` anidado en el instrumento; no hay `product` superior. El cliente puede indicar `bankId` opcional, que el servidor resuelve (si se omite usa `demo`); los bancos conocidos distintos de `demo` no reciben perfil ni tarifas de BancoT2F y el instrumento debe pertenecer al banco indicado. Los desconocidos devuelven 400 `unknown_bank`; esta validación no es autorización. Los campos extra, incluidos `bank`, `bankProfile` y `product` inyectados, reciben 422.

- **1 → 2:** pantalla, nivel, parámetros del juego o pregunta; recibe resultados y errores.
- **5 → 3 y 2:** catálogo ficticio y series verificadas con fuente, fecha, licencia, moneda, frecuencia, ajustes y costes; las muestras ficticias deben indicarlo.
- **3 → 2:** evolución por fecha (en `/api/game/compare`, por número de mes y por fecha real de cierre), aportaciones, resultados, decisiones de juego, fuente y supuestos. Los cálculos son verificables y no los hace el LLM.
- **2 → 4:** pregunta, pantalla, nivel y contexto mínimo disponible; objetivo, plazo y noticias verificadas con URL, fecha y procedencia cuando existan.
- **4 → 2 → 1:** explicación textual y audio opcional, con fuentes y límites. Si no hay contexto o noticias suficientes, comunicarlo.
- **1–4 → 5:** funciones comprobadas, resultados y limitaciones para pruebas y presentación.

El juego histórico no es una previsión: documentar qué activo representa cada serie, aportaciones, comisiones y periodo. La pausa no impide decisiones ni garantiza recuperación. No atribuir causalidad a una noticia sin evidencia. Fijar estructuras, validación, unidades y errores antes de implementar.

## Conversación y voz propuesta

### Análisis detallado de caídas

`POST /api/decline-explanations` recibe `{decline: DeclineSpec, level: 'beginner'|'intermediate'|'advanced', decision?: Decision}`. El idioma procede de `decline.language`; se rechazan informes, cifras, fuentes y campos extra del cliente. El servidor calcula de nuevo el informe y utiliza el mismo constructor TypeScript que el modo local. La respuesta `DetailedDeclineAnalysis` incluye versión `1.0`, modo `demo` o `ai`, proveedor, modelo, idioma, resumen, seis secciones ordenadas (`observed`, `context`, `mechanism`, `portfolio`, `decision`, `uncertainty`) y fuentes con identificadores y URL. La coincidencia temporal no demuestra causalidad.

`POST /api/insights` (rama `mejoras-jurado`) recibe `{kind: 'agent'|'what'|'how', page: 'home'|'portfolio', level, language, facts}`; `facts` son cifras ya calculadas por el código del cliente (valor, aportado, resultado %, último mes, volatilidad, caída máxima, Sharpe, exposición a renta variable, riesgo medio, progreso al objetivo y avance lineal del plan, hasta 8 pesos por fondo), acotadas y sin campos extra. Responde `{mode: 'ai', provider: 'anthropic', model, language, summary, points[1..4]}` solo con `T2F_ANALYSIS_PROVIDER=anthropic` y clave configurada; si no, 503 `insight_unavailable` y el cliente usa su plantilla local. El texto del modelo pasa el filtro `unsafe_narrative` (sin cifras, URL, órdenes, recomendaciones ni promesas); las cifras visibles salen siempre del código.

El proveedor por defecto es `demo`, basado en reglas. Con `T2F_ANALYSIS_PROVIDER=anthropic` y `ANTHROPIC_API_KEY` en el entorno del servidor se usa Sonnet; `T2F_ANTHROPIC_MODEL` es opcional y por defecto vale `claude-sonnet-5-5`, identificador incluido en la [documentación oficial](https://platform.claude.com/docs/en/models/overview). Solo se aceptan identificadores `claude-sonnet-*`. El proveedor recibe el informe resumido, el contexto histórico curado, idioma, nivel, horizonte y necesidad de liquidez si existen; el objetivo libre no se envía. No se deben usar datos reales de clientes. Las cifras y las secciones de observaciones, decisión e incertidumbre quedan bajo control del código. El modelo genera explicaciones adicionales para contexto, mecanismos y cartera. Las comprobaciones de formato, referencias y texto reducen riesgos, pero no prueban la verdad ni sustituyen una revisión humana.

Se usa la API de mensajes con `output_config.format`, sin reintentos, con concurrencia limitada, plazo total de 35 segundos para el proveedor y lectura limitada a 64 KiB. El proceso local previo tiene un límite independiente de cinco segundos. Configuración incorrecta, error del proveedor o respuesta inválida devuelven 503 (`analysis_configuration_error`, `analysis_provider_error` o `analysis_unavailable`), sin sustitución silenciosa por demo. Los filtros textuales son heurísticos y pueden fallar ante formulaciones distintas, tanto al admitir contenido incorrecto como al rechazar respuestas válidas. La clave permanece en el servidor. `health.externalProviders` indica que está seleccionado BCE o Anthropic, y `newsProvider` refleja la configuración; no demuestran acceso ni validez de credenciales. La integración real con credenciales y las respuestas de Sonnet están pendientes de comprobación; las pruebas simuladas no demuestran una conexión real.

La pausa permite cargar un objetivo y horizonte ficticios en el contexto `decision`, sin responder automáticamente a `needsLiquidity`; sus valores editados se transmiten como contexto de la consulta. No se modifica el contrato HTTP ni se envían cifras calculadas desde el cliente. El perfil ficticio de Objetivos es independiente y permanece en el frontend.

En esta rama hay una alternativa local implementada: [`TutorProvider` y los tipos](../tutor-ia/src/types.ts) reciben pregunta limitada, historial acotado y contexto explícito, y devuelven texto por reglas, intención y fuentes. La interfaz conserva texto y contexto de cada respuesta; no invoca un modelo. La pausa usa `analyzeDecline` sobre observaciones del instrumento sin flujos o sobre la cartera ficticia. El informe incluye caída observada, episodios y fuentes; causas y comparables no están disponibles.

El informe puede añadir `historicalContext` con el evento público de la OMS fechado el 11 de marzo de 2020, solo si cae dentro de la serie observada. Su fuente es verificable y no demuestra la causa de la variación del fondo. El servidor rechaza hechos enviados por el cliente; `causesStatus` permanece `unknown`.

La voz opcional usa capacidades locales del dispositivo: lectura solo con voces marcadas como locales; dictado solo cuando el navegador confirma procesamiento local y modelo ya disponible. Si no están disponibles queda el texto. El micrófono de la barra solicita de inmediato el reconocimiento local y envía la pregunta final cuando termina; desde la pausa la escucha se inicia manualmente. En el chat escrito el dictado se revisa y no se envía automáticamente. No se descargan modelos desde la aplicación ni se llama a proveedores. Las claves de futuras integraciones quedarían en un servidor, nunca en el cliente.

La siguiente arquitectura sigue siendo una propuesta futura, no el modo local actual:

1. El usuario puede escribir una pregunta o grabarla con el micrófono. Si usa voz, ElevenLabs transcribe el audio a texto.
2. El backend envía la pregunta a la API de Claude junto con el contexto disponible y pertinente: nivel, pantalla, simulación o cartera ficticia, objetivo y horizonte, y noticias verificadas cuando existan.
3. Claude genera una explicación adaptada a ese contexto. Los datos y cálculos proceden de los componentes correspondientes; el modelo no debe inventar cifras ni atribuir causas sin evidencia.
4. La interfaz muestra la respuesta escrita. Si el usuario activa la voz, ElevenLabs convierte esa respuesta en audio para reproducirla.

La arquitectura anterior de conversación y voz mediante proveedores sigue siendo una propuesta. El adaptador de Sonnet implementado para el análisis detallado es independiente del chat; no se ha verificado con credenciales reales. ElevenLabs sigue pendiente. Las claves se conservan en el servidor y fuera de Git.

## Motor de análisis de caídas

- **5 → 3:** datos del fondo y de posibles comparables, serie temporal y fuentes o noticias verificables, con fechas, licencias y límites. El mismo fondo tiene prioridad cuando exista historial suficiente.
- **3 → 2:** informe calculado con periodo y magnitud de la caída, episodios previos y criterios de semejanza, evolución posterior y recuperación solo si se observa; incluir episodios sin recuperación observada, fuentes y datos faltantes.
- **2 → 4:** informe y contexto disponible del usuario —objetivo, horizonte y necesidad de liquidez si se ha proporcionado—, sin completar huecos por su cuenta.
- **4 → 1 a través de 2:** explicación adaptada que distinga hechos y posibles factores, muestre incertidumbre y no garantice recuperación ni presione a mantener. Si no hay datos o fuentes suficientes, debe decirlo.
- **1–4 → 5:** evidencia y casos para probar mismo fondo, comparable diferente identificado, ausencia de histórico y fuentes, episodio no recuperado, plazo largo y necesidad de liquidez.

En esta rama existe análisis cuantitativo básico local; los contratos de integración, comparables justificados y conexión a fuentes siguen pendientes.

## Contrato del motor Python, versión 1.0

El motor `simulador` (`compare`) se expone en `POST /api/game/compare` para los fondos con histórico elegible; la sección «¿Y si vendo?» del Simulador lo consume en la rama `feature/juego-pantalla` (ver [README del frontend](../frontend/README.md)); el frontend valida el esquema, la procedencia y la coherencia de los totales antes de mostrarlo. Las aportaciones sin comisiones comparten el momento de cierre de `/api/simulations`. La [referencia del simulador](../simulador/README.md) define el contrato del motor, cuyos importes se serializan como cadenas decimales y utilizan `Decimal` con 34 cifras. La comparación del juego admite costes explícitos y conserva el efectivo posterior a la venta; no implica órdenes reales.


## Catálogo local de práctica (rama de trabajo)

El catálogo se comparte en `shared/demo-data.json` y el frontend lo expone mediante `frontend/src/catalog.ts`: cada instrumento tiene `instrumentId`, `assetType` (fondo, ETF o acción), `assetClass` (mixta, variable, fija o desconocida), `bankId`, gestora, relación con la entidad (`own`, `third_party`, `fictional` o `unknown`), identificador y clase cuando se conocen, moneda, fuente, fecha de consulta y estado de datos. La relación identifica el vínculo con la gestora o entidad, no la propiedad de los activos. Los campos desconocidos son nulos. El catálogo de demo se carga desde ese archivo tanto en el servidor como en el modo local.

El tipo local vigente de los resultados y puntos temporales está en [`frontend/src/simulation-types.ts`](../frontend/src/simulation-types.ts); [backend-contexto](backend-contexto.md) resume su interpretación y las diferencias con el motor Python expuesto para la comparación del juego. El contrato HTTP de demostración se describe en [backend-contexto](backend-contexto.md).

Cinco clases de fondos reales tienen valores liquidativos CNMV observados. El instrumento BBVA con distribuciones no modeladas permanece como referencia deshabilitada. La muestra anual de CaixaBank descrita abajo se conserva como método y fuente independientes, no como serie diaria. No existe conexión bancaria.

### Muestra histórica anual de CaixaBank

`frontend/src/annual-history.ts` conserva cinco rentabilidades anuales publicadas, no precios ni valores liquidativos: 2021 −0,53 %, 2022 −0,67 %, 2023 +2,43 %, 2024 +2,97 % y 2025 +1,53 %. Fuente primaria: [ficha de CAIXABANK MONETARIO RENDIMIENTO, FI CLASE ESTÁNDAR](https://www.caixabankassetmanagement.com/es/fondos/caixabank-monetario-rendimiento-fi-clase-estandar), ISIN ES0138045002, EUR, consultada el 9 de noviembre de 2026. Las tasas son porcentajes redondeados publicados; no se ha verificado una licencia de redistribución ni autorización de uso comercial.

El frontend reconstruye una inversión ficticia aplicando cada tasa anual al saldo anterior y sumando después la aportación anual al cierre. Importe inicial y aportación anual admiten entre 0 y 10⁹ EUR cada uno. Hay cinco aportaciones, una por año; el total aportado es el inicial más cinco veces la aportación. Con aportación cero se conserva el cálculo anterior. Para 500 € iniciales y 100 € anuales se obtienen aproximadamente 1048,55 € de valor, 1000 € aportados y 48,55 € de diferencia.

Se muestran seis puntos: referencia al 31/12/2020 y cierres de 2021–2025. No se interpolan meses ni días ni se modelan impuestos o costes externos. Según la ficha, los gastos corrientes ya están deducidos de las rentabilidades; no se descuentan de nuevo. El resultado es aproximado por el redondeo de origen y no es un valor liquidativo, precio transaccionable ni predicción. Con 500 € iniciales y aportación cero se obtienen aproximadamente 529,02 € al cierre de 2025.

Este ejemplo es local y manual: no hay histórico diario, proveedor conectado ni datos en tiempo real. Antes de una integración o distribución hay que comprobar derechos y condiciones de la fuente y verificar los derechos de uso; el motor Python histórico independiente no consume esta muestra.

## API local de demostración

El contrato operativo, validaciones y errores están en [backend-contexto](backend-contexto.md). El cliente no envía al tutor resultados, fuentes ni saldos calculados; envía especificaciones y el servidor recalcula. `GET /api/catalog` devuelve `schemaVersion: "2.0"`, catálogo y `navHistory`. `POST /api/simulations` devuelve el resultado temporal y procedencia; `POST /api/game/compare` compara mantener/vender sobre NAV observados; `POST /api/declines` devuelve el informe y `POST /api/tutor` responde por reglas. No hay conexión bancaria ni datos reales de clientes.

La práctica guiada utiliza dos solicitudes de simulación independientes. La interfaz compara los resultados de aportaciones, plazo o activos bajo las condiciones indicadas en [contexto](contexto-proyecto.md#práctica-guiada-con-dinero-ficticio). Solo la especificación de la opción A o B seleccionada se transmite al tutor; el servidor vuelve a calcular sus hechos. Los resultados obsoletos se invalidan y un error no activa el modo local automáticamente. No se crea una nueva ruta ni una cartera a partir de la comparación.


### Contexto del fondo en Explorar

En esta rama, el cliente envía el identificador del fondo seleccionado al tutor por reglas en la pantalla `explore`. El servidor reconstruye identidad y fuentes desde el catálogo, sin aceptar cifras del cliente; no añade una simulación. Las vistas de detalle comparten esa selección y los mismos datos. Esta capacidad no conecta un LLM ni un proveedor de voz.


### Páginas del tutor (rama `mejora-ui`)

El contexto del tutor admite `home`, `explore`, `simulator`, `portfolio`, `learn` y `game` en el servidor (`backend/schemas.py` y `build_tutor_context`); el cliente envía la página tal cual, sin convertir `learn` a `home`. El tipo `Page` del cliente solo usa `learn`: la antigua página `game` se fusionó en `simulator`, pero el servidor sigue aceptándola. Comprobado con `test_tutor_accepts_learn_and_game_pages`.
