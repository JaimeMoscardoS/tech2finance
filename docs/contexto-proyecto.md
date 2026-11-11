# Tech2Finance: contexto completo del proyecto

## Qué es

En la rama de trabajo, **BancoT2F** es la entidad ficticia anfitriona de la experiencia y Tech2Finance su tutor. Las condiciones del anfitrión, los costes de productos no disponibles y los límites se detallan en [BancoT2F](banco-t2f.md); el [guion de demo](../presentacion/demo-banco-t2f.md) recoge el recorrido histórico propuesto.

Tech2Finance es una propuesta de asistente para la sección de inversión de la aplicación de un banco. Su propósito es ayudar al cliente a entender lo que ve, aprender cómo se comportan las inversiones y explorar decisiones con dinero ficticio antes de comprometer dinero real.

En esta rama, los fondos se presentan con nombres genéricos bilingües; los duplicados se numeran por identificador sobre el catálogo completo. La denominación oficial permanece en los detalles y en las fuentes, y sigue identificando las noticias y los datos originales.

El banco sería el cliente comercial que incorporaría la tecnología a su propia experiencia; sus clientes serían los usuarios finales. Para el hackathon se propone una aplicación que imite esa sección bancaria: no hay un banco conectado ni un acuerdo comercial confirmado. El valor para la entidad —por ejemplo, mejorar la comprensión y reducir fricciones— es una hipótesis que habría que validar.

## El problema que intenta resolver

Una persona puede tener ahorros y querer conocer sus opciones, pero encontrarse con términos, gráficos y riesgos que no entiende. Otra puede tener ya una cartera y no saber cómo interpretar una caída. La propuesta parte de que explicar la información en un lenguaje adaptado y permitir practicar puede ayudar a estas personas a tomar decisiones más informadas. Esto es una hipótesis de producto, no un resultado demostrado.

El proyecto no debe dar a entender que invertir siempre es adecuado ni que una caída vaya a recuperarse. Las necesidades de liquidez, el plazo y el riesgo importan, y el usuario conserva la decisión.

## A quién va dirigido

- **Usuario final:** cliente bancario que quiere aprender, explorar fondos o comprender una cartera. Puede tener pocos conocimientos o buscar información más detallada.
- **Cliente potencial:** banco o entidad financiera interesada en integrar una experiencia de acompañamiento en su aplicación.
- **Equipo y jurado:** personas que deben poder recorrer y entender una demo sin conectar cuentas ni efectuar transacciones.

La idea puede ser útil para distintos perfiles de edad, pero no se ha demostrado todavía qué segmento la necesita más ni que un banco la compraría.

## La experiencia del usuario

### Recorrido de caída para la demo

En esta rama, el caso de caída usa BBVA MI INVERSION BOLSA ACUMULACION, FI, con valores liquidativos CNMV desde el cierre de diciembre de 2019 hasta el de marzo de 2020 e inversión virtual inicial de 1.000 €, sin aportaciones. La reconstrucción arroja aproximadamente 744,62 € y una caída del 25,54 % desde el máximo observado. La declaración pública de la OMS del 11 de marzo aparece solo si el periodo la incluye; su coincidencia no acredita la causa de la variación ni garantiza recuperación. El servidor reconstruye los hechos a partir de la especificación y rechaza cifras enviadas por el cliente. No hay proveedor de noticias en directo; el adaptador opcional de análisis con Sonnet está pendiente de prueba real.

Para la demo, los controles y acciones del guion deben funcionar de principio a fin; ante un fallo deben mostrar un error y permitir recuperación o reintento. La voz es opcional. El asistente utiliza los mismos hechos observados y distingue el evento público de una causa no verificada. Las comprobaciones específicas de caída no prueban por sí solas todos los controles de la aplicación.

1. **Entrar y elegir nivel.** El usuario abre la sección ficticia de inversión y escoge básico, intermedio o avanzado. Puede cambiarlo cuando quiera.
2. **Explorar y preguntar.** Ve información de productos de ejemplo y pregunta al tutor qué significa un concepto o un dato de la pantalla. El tutor responde por texto y, si está disponible, por voz.
3. **Practicar.** Introduce una cantidad y una aportación periódica ficticias. En la máquina del tiempo recorre un periodo histórico para observar subidas y caídas y comparar decisiones de juego. Debe quedar claro qué serie representa el gráfico y cuáles son los supuestos.
4. **Comprender una caída.** En una cartera de ejemplo, el usuario puede encontrar una bajada y activar una pausa informativa. El asistente muestra el contexto disponible, recuerda el objetivo y el plazo si se conocen y pregunta si necesita liquidez. El usuario decide qué hacer.
5. **Continuar.** La demo puede ilustrar cómo sería pasar a la contratación del banco, pero no envía órdenes ni realiza operaciones. Una integración real correspondería a un proyecto futuro con la entidad.

En esta rama, el inicio presenta accesos a fondos, práctica guiada y cartera ficticia con colores diferenciados; el asistente sigue disponible desde la navegación y la barra superior. En Explorar, una entidad de demo filtra los fondos disponibles y los tres niveles muestran conceptos, comparación o detalle técnico sobre la misma selección. Cada nivel tiene una paleta propia en temas claro y oscuro, sin relación con el riesgo. En las gráficas de líneas, verde, rojo y gris muestran subida, bajada o ausencia de cambio respecto al punto anterior de la serie elegida; el capital incluye aportaciones. En las barras anuales indican el signo de la rentabilidad de cada año. Las cifras de riesgo y costes no disponibles no se inventan; la serie anual publicada solo se muestra para el fondo correspondiente. El asistente por reglas recibe el fondo seleccionado también desde esta pantalla. El selector de detalle es independiente de la conexión de demo, que se puede cambiar explícitamente. Las preguntas sobre situación y objetivos pueden formar parte de la experiencia, pero no equivalen por sí solas a una evaluación de idoneidad válida.

## Tres niveles, una misma información de fondo

El selector de detalle de la cabecera despliega los tres niveles mediante una transición interactiva; admite teclado y movimiento reducido. La selección afecta al nivel global de la sesión y no cambia el perfil de riesgo.

La cabecera ofrece «Hablar con IA» para iniciar el dictado con una barra no modal; escribir y ver la respuesta son acciones opcionales. La voz depende de las capacidades locales del navegador.

| Nivel | Experiencia prevista |
| --- | --- |
| Básico (id interno `beginner`) | Pocos elementos a la vez, palabras sencillas, explicaciones de conceptos, riesgos y costes en términos comprensibles. |
| Intermedio | Mayor detalle sobre distribución, evolución, costes y comparación de alternativas. |
| Avanzado | Más información técnica y parámetros cuando existan datos fiables y métricas implementadas. |

Rediseño del dashboard en la rama `mejora-ui` (detalle en [diseno-dashboard.md](diseno-dashboard.md)): la fase 2 añade componentes base, una cartera ficticia DEMO en `shared/mock/` con métricas calculadas por código probado (coste y serie con la misma base, volatilidad y Sharpe solo con 12 o más meses, escenario de sensibilidad que cuenta la renta variable del fondo mixto, rentabilidades DEMO netas de gastos y sin tipo de cambio), el nivel recordado en `localStorage` y la página temporal `/componentes` (sin enlace en la navegación). Aún no está integrado en `main` y los paneles reales del dashboard no cambian hasta la fase 3.

Estado real del rediseño (11-11-2026): implementado en la rama `mejora-ui` (commits 613189a y 3213a38 más cambios sin commit), **sin integrar en `main`**. Incluye Inicio, Mi cartera, Educación (Test MiFID de práctica, 27 preguntas con aviso de contenido pendiente de verificación), una única sección Simulador (producto del catálogo y escenarios ilustrativos DEMO, ordenados por nivel), panel del agente y pausa por nivel, con correcciones de la revisión de accesibilidad (foco, gráficos sin paradas de tabulación, errores asociados, 320 px). La ruta temporal `/componentes` y el CSS antiguo sin uso se retiraron. El servidor ya acepta las páginas de tutor `learn` y `game` (rama `backend-learn-game`) y el cliente deja de convertir `learn` a `home`. No probado con lector de pantalla ni teclado reales.

Integración con `main` (11-11-2026, fusionada en la rama `mejora-ui`; pendiente del pull request a `main`): Inicio, «Mi cartera», el panel del agente, la pausa y el tutor usan una sola cartera construida con los valores liquidativos reales de la CNMV (valor, rentabilidad, volatilidad, caída máxima y Sharpe calculados por código). Solo las participaciones son DEMO; riesgo, TER, clase y región se muestran como «No disponible» porque no constan en los datos publicados, y los agregados que dependen de ellos como «Sin dato». La referencia es la media simple de los fondos, no un índice. La pausa de cartera analiza esa misma serie: con servidor (`portfolio_cnmv`) incluye el análisis detallado de caídas; sin servidor, el análisis local. No bloquea ni presiona la venta. El selector de nivel es el de `main` con etiquetas Básico/Intermedio/Avanzado, y el Simulador único combina los escenarios ilustrativos DEMO por nivel con el recorrido guiado de 3 pasos de `main` (paso 3: «¿Y si vendo?»; sin servidor muestra aviso). Los fondos reales se muestran con nombres genéricos y el contexto del BCE acompaña a la serie de estudio («Probar una caída»). Detalle en [diseno-dashboard.md](diseno-dashboard.md).

Cambian la presentación y la profundidad de la explicación. Los tres niveles comparten la misma base de datos y de cálculo; seleccionar principiante o avanzado no define la tolerancia al riesgo.

## Máquina del tiempo: aprender jugando

La propuesta es permitir que el usuario elija una cantidad inicial y, si se implementa, una aportación periódica. Después observa cómo habría evolucionado una inversión de ejemplo durante un periodo histórico determinado y puede comparar distintas decisiones dentro del juego.

Para que el resultado sea comprensible, el simulador debe identificar el activo o índice representado, el periodo, la fuente, la moneda y los supuestos relevantes: aportaciones, frecuencia, comisiones y tratamiento de los datos. Una serie de un índice no debe presentarse como la rentabilidad de un fondo diferente.

Si se comparan «mantener» y «vender», debe explicarse qué ocurre con el dinero después de cada decisión; los resultados dependen de esas reglas, del periodo y de los costes. Una comparación histórica es educativa y no demuestra qué decisión será mejor para una persona en el futuro. Las muestras ficticias de desarrollo deben identificarse como tales y no presentarse como datos históricos.

Pueden añadirse escenarios futuros si hay tiempo y el equipo define un modelo verificable. Serán hipótesis con posibles pérdidas, no predicciones ni promesas. No se extrapolarán automáticamente los tres meses anteriores como si predijeran los siguientes.

La [propuesta técnica del simulador histórico](simulador-historico.md) describe el motor, las fuentes candidatas y los permisos pendientes; la referencia del módulo precisa la implementación local.

### Práctica guiada con dinero ficticio

**Qué es:** una experiencia de tres experimentos guiados con capital ficticio, accesible desde inicio y el simulador. Permite editar los valores, comparar dos resultados calculados y comprobar una idea sin puntuar en función del beneficio.

En aportaciones se contrasta el mismo instrumento y plazo con y sin flujo periódico; la aportación de B debe ser positiva para que exista una diferencia. En horizonte se comparan plazos de una misma serie mensual observada sin aportaciones. En activos se comparan dos series compatibles bajo los mismos importes y plazo; esto no demuestra diversificación. El capital inicial puede ser cero, como también la aportación en activos. El asistente recibe la opción A o B seleccionada, no una cartera inventada a partir de ambas. El modo servidor utiliza las rutas de simulación existentes y el local sus funciones equivalentes; no hay cambio automático de modo ante errores.

Cada resultado presenta su procedencia y condiciones. Estas comparaciones no usan dinero real, no son recomendaciones ni predicen o garantizan resultados. La evolución de un juego completo con decisiones de compra y venta sigue siendo una propuesta, no una funcionalidad de esta práctica.

## Pausa antes de vender

En esta rama de trabajo se prepara un análisis detallado de seis apartados al abrir la pausa. El modo local lo genera por reglas y se identifica como demostración. En modo servidor el proveedor puede generar una explicación con IA si está configurado; solo se identifica como IA cuando la respuesta confirma el proveedor y modelo. Un error se muestra y permite reintentar, manteniendo los datos observados visibles. Editar el contexto no envía solicitudes: se actualiza mediante un botón explícito. El uso real del proveedor requiere configuración y verificación independiente; no se da por conectado por el mero diseño de la interfaz. El contexto ficticio opcional es editable y la necesidad de liquidez comienza sin indicar. Los históricos CNMV conservan su procedencia real.

Esta función busca dar contexto cuando el usuario ve una caída o inicia una venta dentro de la demo. Puede mostrar cuánto ha cambiado la cartera ficticia, qué objetivo y horizonte se habían indicado, y la información disponible para entender el movimiento. También puede preguntar si el usuario necesita el dinero pronto.

El asistente no debe bloquear la decisión ni presionar al usuario para conservar la inversión. Puede mostrar episodios pasados cuando existan datos comparables, explicando sus límites; la recuperación de un caso histórico no garantiza una recuperación futura. Si el usuario necesita liquidez o cambian sus circunstancias, esas necesidades deben poder considerarse sin que el sistema imponga una respuesta.

## Motor de análisis de caídas y comparación histórica

El equipo propone un motor que ayude a entender una caída y a ponerla en perspectiva, especialmente cuando el usuario ha indicado un objetivo a largo plazo. Su función es aportar información verificable para decidir con calma, sin asegurar que no haya motivos de preocupación ni que sea conveniente mantener la inversión.

### Cómo funcionaría

1. Identificar el fondo o posición afectada, el periodo y la magnitud de la caída. Obtener la serie y los datos del producto desde fuentes identificadas; en la demo se utilizarán datos ficticios etiquetados o históricos verificables.
2. Buscar episodios anteriores en el **mismo fondo** cuando exista suficiente historial. Si no lo hay, buscar fondos o índices comparables solo cuando se pueda justificar la semejanza por sus activos, estrategia, moneda y periodo. Indicar que son instrumentos diferentes y que sus resultados pueden no coincidir.
3. Comparar los episodios mediante reglas documentadas: fechas, magnitud y duración de la caída, evolución posterior disponible y, si se observa en el periodo de datos, tiempo hasta recuperar el nivel anterior. Mostrar también episodios que no se hayan recuperado dentro del periodo observado y explicar cuándo no hay datos suficientes. Evitar seleccionar únicamente ejemplos favorables.
4. Recopilar documentos y noticias verificables del periodo y del producto que aporten contexto. Diferenciar hechos acreditados de posibles factores; una coincidencia temporal no prueba la causa de la caída. Si no se puede explicar el porqué con evidencia, comunicarlo.
5. Entregar al tutor un informe estructurado con datos, episodios, fuentes, fechas, criterios de comparación y límites. Claude adapta la explicación al nivel del usuario y puede recordar el objetivo y el horizonte si están disponibles. El motor y los cálculos, no el modelo de lenguaje, determinan las cifras.
6. Mostrar el resultado en texto y, si está disponible, por voz: qué ha ocurrido, qué se sabe y qué no, ejemplos comparables con sus límites y preguntas útiles sobre plazo y necesidad de liquidez. El usuario conserva la decisión de vender, mantener o consultar a un profesional.

Un horizonte largo puede ayudar a contextualizar la volatilidad y disponer de más tiempo para afrontar fluctuaciones, pero no garantiza ganancias ni recuperación y no elimina el riesgo de pérdidas. El motor no debe presentar una inversión concreta como segura o aconsejar mantenerla solo porque anteriormente se recuperó.

### Reparto y estado

La persona 5 identifica y verifica fuentes y licencias; la 3 define las reglas de comparación y realiza los cálculos; la 2 conecta datos y resultados; la 4 prepara la explicación y la voz; y la 1 presenta los resultados y sus limitaciones. Cada responsable participa en las pruebas de su componente y la persona 5 coordina las pruebas del flujo completo.

En esta rama la pausa muestra un análisis de las observaciones del instrumento seleccionado o de la cartera virtual, con episodios y recuperación solo cuando se observa. Consulta comunicados del BCE del periodo para aportar contexto macroeconómico; no dispone de comparables ni atribuye una causa real. El evento público de la OMS se muestra únicamente cuando cae dentro del periodo observado. El motor Python histórico no se usa en la pausa; si faltan datos suficientes, la interfaz lo indica.

Si el instrumento externo seleccionado no tiene histórico, el tutor explica por qué no puede simularse incluso cuando la entidad configurada no dispone de perfil BancoT2F. No incorpora las condiciones ni tarifas de BancoT2F a esa respuesta.
## Noticias y explicación de movimientos

La demo consulta el archivo oficial de comunicados del BCE y conserva título, enlace, fecha y extracto de los resultados del periodo. El BCE proporciona contexto macroeconómico, no una búsqueda exhaustiva de noticias particulares del fondo. Los detalles y límites se documentan en [detección y noticias](contratos.md#detección-y-noticias).

Una noticia que coincide con una caída no demuestra por sí misma que la haya causado. El tutor debe separar el cambio observado, los hechos respaldados por fuentes y las posibles interpretaciones. Si no hay información suficiente o las noticias no están disponibles, debe decirlo en vez de inventar una explicación.

## Conversación y voz

En esta rama el tutor funciona por defecto mediante reglas y contexto explícito; opcionalmente (`T2F_TUTOR_PROVIDER=anthropic` con clave en el servidor) Claude redacta la respuesta a partir de los hechos verificados y de la respuesta por reglas, con respaldo visible a reglas ante cualquier fallo (rama `feature/tutor-claude`, comprobado solo con proveedor simulado, no probado con clave real, ni en `main` ni desplegado; detalles en [contratos](contratos.md#tutor-del-chat-con-claude-opcional)). La lectura de voz utiliza voces locales del dispositivo cuando están disponibles; el dictado solo se habilita con procesamiento local y modelo instalado. El micrófono de la barra abre el panel y solicita el reconocimiento local de inmediato; el dictado final se procesa al terminar, sin reactivar el micrófono tras la respuesta. Desde la pausa el inicio es manual. En el chat escrito el dictado se revisa antes de enviarse. La parte de voz con proveedor sigue siendo futura:

La arquitectura propuesta es:

1. El usuario escribe o habla. Si se habilita el micrófono, ElevenLabs transcribe el audio.
2. El backend prepara la pregunta y el contexto pertinente: pantalla, nivel y datos disponibles de la simulación o cartera ficticia; también objetivo, plazo y noticias verificadas si existen.
3. La API de Claude genera una respuesta adaptada al nivel. Los datos y cálculos provienen de los componentes del proyecto, no de cifras inventadas por el modelo.
4. La interfaz presenta el texto y, si se habilita, ElevenLabs lo convierte en audio.

Primero se propone completar el chat escrito con contexto, después la lectura en voz y finalmente la entrada hablada. La experiencia escrita debe seguir disponible si el proveedor de voz falla. Las claves permanecen en el servidor. El modelo conversacional usado por el producto es distinto de los agentes de desarrollo configurados para el equipo.

## Demo y visión futura

Para el hackathon se busca un recorrido completo y comprobable con una interfaz bancaria simulada, capital virtual y cinco series históricas CNMV verificables. El núcleo es explorar, practicar y pedir una explicación; la pausa con una cartera de ejemplo representa la segunda parte de la historia. La voz es opcional y el evento público de la OMS aporta contexto temporal sin demostrar causalidad.

Una versión futura podría integrarse con una entidad, mostrar información autorizada y conectarse a sus procesos de contratación o gestión. Eso requeriría acuerdos, revisiones y controles específicos; no se considera construido por preparar esta demo.

## Organización y estado

**Recomendación no aprobada:** la [investigación de viabilidad empresarial](investigacion/2026-11-10-viabilidad/informe.md) propone contrastar primero un piloto educativo con datos ficticios, y documenta las condiciones adicionales que requerirían datos personales o un servicio bancario.

El trabajo se divide entre [cinco áreas](organizacion.md): interfaz, backend, simulador, IA y voz, y datos/pruebas/presentación. Los [contratos](contratos.md) describen qué información deberían intercambiar y la [guía de agentes](agentes.md) identifica los asistentes de desarrollo. En sesiones Codex, el principal solo coordina y verifica; toda escritura se delega a Terra high, conforme a la [política de agentes](agentes.md).

En `main` existe una primera demo React/TypeScript con catálogo y cartera ficticios, simulador ilustrativo, asistente de respuestas predefinidas y pausa ante una caída. La demo incluye tres niveles con distinta información, español/inglés y temas claro/oscuro. El frontend inicial y las vistas adaptativas se integraron mediante los pull requests #1 y #2. La [guía para backend](backend-contexto.md) recoge las decisiones y los puntos de conexión pendientes.

La demo usa capital virtual y cinco históricos mensuales CNMV. El backend expone la comparación «mantener o vender» en `/api/game/compare` sobre esos cierres; en `main` el Simulador incluye la sección «¿Y si vendo en el mes X?» que consume ese endpoint (comparación simple, no el juego por turnos). En la rama `feature/simulador-guiado` (no en `main`) el Simulador es un recorrido guiado de tres pasos (elegir fondo, cuánto y durante cuánto con pregunta previa y recálculo en vivo, y «¿Y si vendo en el mes X?» como paso 3). CaixaBank solo queda excluido de esa comparación, que solo funciona con el servidor de la demo; los cálculos y contratos no cambian. Detalles y comprobaciones en `frontend/README.md`. La muestra anual publicada anterior se conserva aparte. La API FastAPI es local; el análisis tiene un adaptador opcional para Sonnet pendiente de prueba real. El detector de caídas consulta por defecto comunicados históricos del BCE como contexto macroeconómico; no demuestra causalidad ni conecta datos bancarios. ElevenLabs sigue pendiente. La conversación de origen incluía un documento generado por Claude que aparecía oculto en la copia compartida: no se ha podido contrastar su contenido.


## Catálogo local de práctica (rama de trabajo)

La rama de trabajo incorpora cinco históricos mensuales CNMV y conserva aparte la reconstrucción de cinco rentabilidades anuales publicadas de CaixaBank. Los detalles y límites constan en [contratos](contratos.md#datos-cnmv-y-cálculo-mensual-rama-de-trabajo).

La elegibilidad se basa en informes semestrales que cubren 2020–2025, sin distribuciones registradas a la precisión publicada. La [Ley 18/2022](https://www.boe.es/eli/es/l/2022/09/28/18) eliminó la obligatoriedad de informes trimestrales y el [Real Decreto 816/2023](https://www.boe.es/eli/es/rd/2023/11/08/816) desarrolló ese cambio. Los informes no publicados no se imputan como cero. El [traspaso del juego](planning/historical-investment-game.md) documenta el trabajo pendiente.

## Integración local de demostración

En esta rama, el frontend utiliza por defecto la API FastAPI local de catálogo, simulación, caídas y tutor por reglas. Ofrece demo local explícita ante fallo y comparte los ejemplos mediante `shared/demo-data.json`. Por defecto el chat se ejecuta mediante Node local sin LLM ni servicios externos; con `T2F_TUTOR_PROVIDER=anthropic` puede redactarlo Claude (el servidor envía a Anthropic la pregunta, el historial y el contexto, sin el objetivo libre de la pausa), y el análisis detallado incorpora aparte un adaptador opcional para Sonnet; ambos pendientes de prueba real. Véase [backend-contexto](backend-contexto.md) para contrato, ejecución y límites. Esta integración no implica despliegue ni conexión bancaria.


Plan de trabajo y puertas de decisión: [preparación de Tech2Finance](planning/plan.md).

## Líneas de ejecución integradas

Las cinco líneas de ejecución se integraron en `main` el 2026-11-10: Experiencia 01 (recuperación del catálogo y cancelación al cambiar de modo, [PR 15](https://github.com/JaimeMoscardoS/tech2finance/pull/15)), Plataforma 02 (lanzador local con proxy y CI, [PR 18](https://github.com/JaimeMoscardoS/tech2finance/pull/18)), Datos 03 (procedencia en el catálogo y la simulación del servidor, con derechos aún desconocidos y cálculo TypeScript local sin versionar, [PR 14](https://github.com/JaimeMoscardoS/tech2finance/pull/14)), Tutor 04 (reglas limitadas de alcance y batería sintética, [PR 16](https://github.com/JaimeMoscardoS/tech2finance/pull/16)) y Producto 05 (plan y evidencia de integración local, [PR 17](https://github.com/JaimeMoscardoS/tech2finance/pull/17)). La [ejecución CI de push](https://github.com/JaimeMoscardoS/tech2finance/actions/runs/42859720668) en `main` tras la última integración (commit `0bde0d1`) terminó correctamente. El [registro de ejecución](planning/manifest.json) identifica versiones y evidencia conocidas, y la [integración local aislada](planning/integracion-local.md) documenta la prueba previa. Estar integrado en `main` no implica despliegue, conexión bancaria ni derechos de datos resueltos. El [PR 19](https://github.com/JaimeMoscardoS/tech2finance/pull/19) (reorganización de la navegación) sigue abierto y no está integrado.

En la rama de interfaz, Explorar ofrece guía inicial, comparación y panel técnico sobre los fondos de la entidad configurada o la lista de estudio. Los valores de riesgo, costes y plazo no verificados se muestran como desconocidos. Los documentos legales no están incorporados y las fuentes de datos no se presentan como documentación precontractual.


La entidad visible se fija mediante `VITE_BANK_ID` al iniciar o compilar (por defecto `demo`); el filtrado es de interfaz y no sustituye la autorización del servidor. La guía de objetivos usa plantillas locales editables según objetivo y preferencia de fluctuación, con condiciones explícitas de liquidez, reserva y deuda; no es una evaluación de idoneidad y sus respuestas no se envían al tutor. La comparación avanzada permite seleccionar hasta tres series compatibles por frecuencia, periodo y procedencia en gráficos separados con escala común. El simulador ofrece ayuda destacada junto al resultado válido.

La interfaz usa nombres como «Mi cartera», «Explorar fondos» y «Simular inversión». La cabecera identifica el modo demo sin dinero real; las fuentes, limitaciones y costes siguen visibles donde aportan contexto.
