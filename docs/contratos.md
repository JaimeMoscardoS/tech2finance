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

El proveedor por defecto es `demo`, basado en reglas. Con `T2F_ANALYSIS_PROVIDER=anthropic` y `ANTHROPIC_API_KEY` en el entorno del servidor se usa Sonnet; `T2F_ANTHROPIC_MODEL` es opcional y por defecto vale `claude-sonnet-5-5`, identificador incluido en la [documentación oficial](https://platform.claude.com/docs/en/models/overview). Solo se aceptan identificadores `claude-sonnet-*`. El proveedor recibe el informe resumido, el contexto histórico curado, idioma, nivel, horizonte y necesidad de liquidez si existen; el objetivo libre no se envía. No se deben usar datos reales de clientes. Las cifras y las secciones de observaciones, decisión e incertidumbre quedan bajo control del código. El modelo genera explicaciones adicionales para contexto, mecanismos y cartera. Las comprobaciones de formato, referencias y texto reducen riesgos, pero no prueban la verdad ni sustituyen una revisión humana.

Se usa la API de mensajes con `output_config.format`, sin reintentos, con concurrencia limitada, plazo total de 35 segundos para el proveedor y lectura limitada a 64 KiB. El proceso local previo tiene un límite independiente de cinco segundos. Configuración incorrecta, error del proveedor o respuesta inválida devuelven 503 (`analysis_configuration_error`, `analysis_provider_error` o `analysis_unavailable`), sin sustitución silenciosa por demo. Los filtros textuales son heurísticos y pueden fallar ante formulaciones distintas, tanto al admitir contenido incorrecto como al rechazar respuestas válidas. La clave permanece en el servidor. `health.externalProviders` indica que está seleccionado BCE o Anthropic, y `newsProvider` refleja la configuración; no demuestran acceso ni validez de credenciales. La integración real con credenciales y las respuestas de Sonnet están pendientes de comprobación; las pruebas simuladas no demuestran una conexión real.

La pausa permite cargar un objetivo y horizonte ficticios en el contexto `decision`, sin responder automáticamente a `needsLiquidity`; sus valores editados se transmiten como contexto de la consulta. No se modifica el contrato HTTP ni se envían cifras calculadas desde el cliente. El perfil ficticio de Objetivos es independiente y permanece en el frontend.

En esta rama hay una alternativa local implementada: [`TutorProvider` y los tipos](../tutor-ia/src/types.ts) reciben pregunta limitada, historial acotado y contexto explícito, y devuelven texto por reglas, intención y fuentes. La interfaz conserva texto y contexto de cada respuesta; el tutor por reglas no invoca un modelo (ver el tutor con Claude opcional más abajo). La pausa usa `analyzeDecline` sobre observaciones del instrumento sin flujos o sobre la cartera ficticia. El informe incluye caída observada, episodios y fuentes; causas y comparables no están disponibles.

El informe puede añadir `historicalContext` con el evento público de la OMS fechado el 11 de marzo de 2020, solo si cae dentro de la serie observada. Su fuente es verificable y no demuestra la causa de la variación del fondo. El servidor rechaza hechos enviados por el cliente; `causesStatus` permanece `unknown`.

La voz opcional usa capacidades locales del dispositivo: lectura solo con voces marcadas como locales; dictado solo cuando el navegador confirma procesamiento local y modelo ya disponible. Si no están disponibles queda el texto. El micrófono de la barra solicita de inmediato el reconocimiento local y envía la pregunta final cuando termina; desde la pausa la escucha se inicia manualmente. En el chat escrito el dictado se revisa y no se envía automáticamente. No se descargan modelos desde la aplicación ni se llama a proveedores. Las claves de futuras integraciones quedarían en un servidor, nunca en el cliente.

### Tutor del chat con Claude opcional

Estado: implementado en la rama `feature/tutor-claude`; comprobado solo con un proveedor simulado (`httpx.MockTransport`); no probado con una clave real, no integrado en `main` ni desplegado. `POST /api/tutor` mantiene su contrato. Por defecto (`T2F_TUTOR_PROVIDER` ausente o distinto de `anthropic`) responde el tutor por reglas, `provider: "server_rules"`. Con `T2F_TUTOR_PROVIDER=anthropic`, `ANTHROPIC_API_KEY` y, opcionalmente, `T2F_ANTHROPIC_MODEL` (por defecto `claude-sonnet-5-5`, solo `claude-sonnet-*`) en el entorno del servidor, el servidor calcula primero la respuesta por reglas y pide a Claude que la redacte, sin herramientas ni `thinking` explícito, con esfuerzo bajo. `GET /api/health` informa `tutorProvider` (`server_rules` o `anthropic`) y marca `externalProviders`; indica configuración, no disponibilidad ni validez de la clave.

- **Hechos y explicación:** Claude recibe en un único mensaje de usuario JSON con `facts` (idioma, nivel, el contexto construido por el servidor, la respuesta por reglas y las etiquetas de fuentes registradas) y, aparte como datos no fiables, la pregunta y el historial (solo rol y texto). El objetivo libre de la pausa (`decision.goal`) se EXCLUYE: del contexto solo se envían horizonte y liquidez, igual que en el análisis de caídas, y en la respuesta por reglas enviada su texto literal se sustituye por un marcador sin cifras, de modo que ni se envía ni amplía las cifras permitidas. La interfaz etiqueta la respuesta como redactada con IA (Claude) con cifras contrastadas con datos del servidor; no se afirma que el texto esté verificado. Intención, idioma y fuentes de la respuesta final proceden siempre de las reglas; Claude no aporta fuentes.
- **Pregunta enviada a Anthropic:** a diferencia del análisis de caídas, que no envía texto libre del usuario, aquí la pregunta, el historial reciente y el contexto del servidor SÍ se envían a Anthropic (no el objetivo libre de la pausa). No introducir datos personales ni reales.
- **Respaldo visible:** sin clave, con modelo inválido, error de red o HTTP, plazo superado, respuesta demasiado grande o inválida, o texto rechazado, el servidor devuelve la respuesta por reglas y `provider: "server_rules"`; con éxito `provider: "anthropic"`. La interfaz muestra por mensaje quién respondió. La clave nunca sale del servidor ni aparece en respuestas o registros.
- **Regla de cifras y filtros:** solo se admiten cifras (en dígitos, con `%` opcional) que aparezcan en `facts`, comparadas en forma canónica (coma o punto decimal); cualquier otra, los números escritos con letras, URL, marcado, recomendaciones de comprar, vender o mantener, garantías o previsiones de recuperación y causas o composición del fondo se rechazan. Además `stop_reason` debe ser `end_turn`, con un único bloque de texto de 1 a 2000 caracteres; el contenido de `thinking` nunca se devuelve. Los filtros son heurísticos y pueden admitir texto incorrecto o rechazar texto válido; no prueban la verdad.
- **Alcance de la respuesta:** el tutor explica conceptos financieros generales (por ejemplo qué es un bono) con sus palabras y sin cifras; los datos concretos de fondos, banco, simulación o pantalla solo proceden de `facts`; responde solo a lo preguntado y no vuelca el contexto. El servidor redondea a 2 decimales los números decimales del contexto antes de enviarlos y el filtro de cifras compara con esas cifras redondeadas. Estos ajustes se comprobaron con proveedor simulado; la conexión real fue confirmada manualmente por el usuario, sin pruebas automatizadas con clave real.
- **Límites:** plazo de 8 segundos para Claude (más hasta 5 s de las reglas), lectura de 64 KiB, sin reintentos, concurrencia máxima de 4 solicitudes que cubre reglas y Claude (una quinta recibe 503 `tutor_unavailable`). El cliente espera hasta 25 s.

La siguiente arquitectura sigue siendo una propuesta futura para voz y proveedores restantes:

1. El usuario puede escribir una pregunta o grabarla con el micrófono. Si usa voz, ElevenLabs transcribe el audio a texto.
2. El backend envía la pregunta a la API de Claude junto con el contexto disponible y pertinente: nivel, pantalla, simulación o cartera ficticia, objetivo y horizonte, y noticias verificadas cuando existan.
3. Claude genera una explicación adaptada a ese contexto. Los datos y cálculos proceden de los componentes correspondientes; el modelo no debe inventar cifras ni atribuir causas sin evidencia.
4. La interfaz muestra la respuesta escrita. Si el usuario activa la voz, ElevenLabs convierte esa respuesta en audio para reproducirla.

La arquitectura anterior de conversación y voz mediante proveedores sigue siendo una propuesta. El adaptador de Sonnet del análisis detallado y el tutor del chat con Claude opcional son integraciones independientes; ninguna se ha verificado con credenciales reales. La síntesis de voz con ElevenLabs está implementada solo en la rama `feature/voz-elevenlabs` (ver más abajo); la transcripción sigue pendiente. Las claves se conservan en el servidor y fuera de Git.

### Voz del servidor (ElevenLabs, opcional)

`POST /api/tts` recibe `{text}` (1 a 1500 caracteres, no solo espacios) y devuelve `audio/mpeg` con `Cache-Control: no-store`. Solo está activo con `T2F_VOICE_PROVIDER=elevenlabs` y `ELEVENLABS_API_KEY` en el servidor; en otro caso responde 503 `tts_disabled`. Errores 503 genéricos: `tts_configuration_error` (falta la clave o voz/modelo inválidos) y `tts_provider_error` (fallo, redirección, tipo no audio, audio vacío o superior a 4 MiB, plazo de 20 s). `GET /api/health` añade `voiceProvider`. El frontend (`frontend/src/voice/server-voice.ts`) consulta health una vez y, si la voz no está activa, el texto supera 1500 caracteres o la síntesis falla, usa la voz local del navegador; el dictado no cambia.

La guardia de origen solo acepta `http://localhost:5173` y `http://127.0.0.1:5173`; si el frontend se lanza con otro `T2F_FRONTEND_PORT`, `/api/tts` responde 403 y el botón usa la voz del navegador.

Estado: implementado en la rama `feature/voz-elevenlabs`; probado solo con ElevenLabs simulado (`httpx.MockTransport`) y con pruebas unitarias del frontend; no probado con clave real, no integrado en `main` ni desplegado. Limitaciones: el endpoint lee cualquier texto de hasta 1500 caracteres; exige `Content-Type: application/json` y rechaza con 403 `forbidden_origin` las peticiones de otros orígenes web (protege frente a páginas abiertas en el navegador, no frente a clientes locales sin `Origin`, como curl u otros procesos de la máquina, que se aceptan); no hay límite de frecuencia ni cupo, solo 2 peticiones simultáneas y 1500 caracteres, y consume créditos de la cuenta de ElevenLabs; con la voz activa, el texto leído se envía a ElevenLabs.

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
