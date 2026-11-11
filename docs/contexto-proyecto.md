# Tech2Finance: contexto completo del proyecto

## Qué es

Tech2Finance es una propuesta de asistente para la sección de inversión de la aplicación de un banco. Su propósito es ayudar al cliente a entender lo que ve, aprender cómo se comportan las inversiones y explorar decisiones con dinero ficticio antes de comprometer dinero real.

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

1. **Entrar y elegir nivel.** El usuario abre la sección ficticia de inversión y escoge principiante, intermedio o avanzado. Puede cambiarlo cuando quiera.
2. **Explorar y preguntar.** Ve información de productos de ejemplo y pregunta al tutor qué significa un concepto o un dato de la pantalla. El tutor responde por texto y, si está disponible, por voz.
3. **Practicar.** Introduce una cantidad y una aportación periódica ficticias. En la máquina del tiempo recorre un periodo histórico para observar subidas y caídas y comparar decisiones de juego. Debe quedar claro qué serie representa el gráfico y cuáles son los supuestos.
4. **Comprender una caída.** En una cartera de ejemplo, el usuario puede encontrar una bajada y activar una pausa informativa. El asistente muestra el contexto disponible, recuerda el objetivo y el plazo si se conocen y pregunta si necesita liquidez. El usuario decide qué hacer.
5. **Continuar.** La demo puede ilustrar cómo sería pasar a la contratación del banco, pero no envía órdenes ni realiza operaciones. Una integración real correspondería a un proyecto futuro con la entidad.

En esta rama, el inicio presenta accesos a fondos, práctica guiada y cartera ficticia con colores diferenciados; el asistente sigue disponible desde la navegación y la barra superior. En Explorar, una entidad de demo filtra los fondos disponibles y los tres niveles muestran conceptos, comparación o detalle técnico sobre la misma selección. Cada nivel tiene una paleta propia en temas claro y oscuro, sin relación con el riesgo. En las gráficas de líneas, verde, rojo y gris muestran subida, bajada o ausencia de cambio respecto al punto anterior de la serie elegida; el capital incluye aportaciones. En las barras anuales indican el signo de la rentabilidad de cada año. Las cifras de riesgo y costes no disponibles no se inventan; la serie anual publicada solo se muestra para el fondo correspondiente. El asistente por reglas recibe el fondo seleccionado también desde esta pantalla. El selector de detalle es independiente de la conexión de demo, que se puede cambiar explícitamente. Las preguntas sobre situación y objetivos pueden formar parte de la experiencia, pero no equivalen por sí solas a una evaluación de idoneidad válida.

## Tres niveles, una misma información de fondo

| Nivel | Experiencia prevista |
| --- | --- |
| Principiante | Pocos elementos a la vez, palabras sencillas, explicaciones de conceptos, riesgos y costes en términos comprensibles. |
| Intermedio | Mayor detalle sobre distribución, evolución, costes y comparación de alternativas. |
| Avanzado | Más información técnica y parámetros cuando existan datos fiables y métricas implementadas. |

Cambian la presentación y la profundidad de la explicación. Los tres niveles comparten la misma base de datos y de cálculo; seleccionar principiante o avanzado no define la tolerancia al riesgo.

## Máquina del tiempo: aprender jugando

La propuesta es permitir que el usuario elija una cantidad inicial y, si se implementa, una aportación periódica. Después observa cómo habría evolucionado una inversión de ejemplo durante un periodo histórico determinado y puede comparar distintas decisiones dentro del juego.

Para que el resultado sea comprensible, el simulador debe identificar el activo o índice representado, el periodo, la fuente, la moneda y los supuestos relevantes: aportaciones, frecuencia, comisiones y tratamiento de los datos. Una serie de un índice no debe presentarse como la rentabilidad de un fondo diferente.

Si se comparan «mantener» y «vender», debe explicarse qué ocurre con el dinero después de cada decisión; los resultados dependen de esas reglas, del periodo y de los costes. Una comparación histórica es educativa y no demuestra qué decisión será mejor para una persona en el futuro. Las muestras ficticias de desarrollo deben identificarse como tales y no presentarse como datos históricos.

Pueden añadirse escenarios futuros si hay tiempo y el equipo define un modelo verificable. Serán hipótesis con posibles pérdidas, no predicciones ni promesas. No se extrapolarán automáticamente los tres meses anteriores como si predijeran los siguientes.

La [propuesta técnica del simulador histórico](simulador-historico.md) describe el motor, las fuentes candidatas y los permisos pendientes; la referencia del módulo precisa la implementación local.

### Práctica guiada con dinero ficticio

**Qué es:** una experiencia de tres experimentos guiados con capital ficticio, accesible desde inicio y el simulador. Permite editar los valores, comparar dos resultados calculados y comprobar una idea sin puntuar en función del beneficio.

En aportaciones se contrasta el mismo instrumento y plazo con y sin flujo periódico; la aportación de B debe ser positiva para que exista una diferencia, y el ejemplo anual mantiene sus cinco cierres publicados. En horizonte se comparan plazos de una misma serie mensual ficticia sin aportaciones. En activos se comparan dos series mensuales ficticias bajo los mismos importes y plazo; esto no demuestra diversificación. El capital inicial puede ser cero, como también la aportación en activos. El asistente recibe la opción A o B seleccionada, no una cartera inventada a partir de ambas. El modo servidor utiliza las rutas de simulación existentes y el local sus funciones equivalentes; no hay cambio automático de modo ante errores.

Cada resultado presenta su procedencia y condiciones. Estas comparaciones no usan dinero real, no son recomendaciones ni predicen o garantizan resultados. La evolución de un juego completo con decisiones de compra y venta sigue siendo una propuesta, no una funcionalidad de esta práctica.

## Pausa antes de vender

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

En esta rama la pausa muestra un análisis local de las observaciones del instrumento seleccionado o de la cartera ficticia, con episodios y recuperación solo cuando se observa. No atribuye causas y no busca noticias ni comparables. El motor Python permanece aislado; si faltan datos suficientes, la interfaz lo indica.
## Noticias y explicación de movimientos

La intención del equipo es poder contrastar las explicaciones con noticias reales y actuales de fuentes fiables. Para ello habría que conectar una fuente, conservar título, enlace y fechas relevantes y comprobar que la información corresponde a la cartera y al periodo. Esa conexión todavía no existe ni se ha elegido un proveedor.

Una noticia que coincide con una caída no demuestra por sí misma que la haya causado. El tutor debe separar el cambio observado, los hechos respaldados por fuentes y las posibles interpretaciones. Si no hay información suficiente o las noticias no están disponibles, debe decirlo en vez de inventar una explicación.

## Conversación y voz

En esta rama el tutor funciona mediante reglas locales y contexto explícito, no un LLM. La lectura de voz utiliza voces locales del dispositivo cuando están disponibles; el dictado solo se habilita con procesamiento local y modelo instalado. El micrófono de la barra abre el panel y solicita el reconocimiento local de inmediato; el dictado final se procesa al terminar, sin reactivar el micrófono tras la respuesta. Desde la pausa el inicio es manual. En el chat escrito el dictado se revisa antes de enviarse. La arquitectura siguiente es futura:

La arquitectura propuesta es:

1. El usuario escribe o habla. Si se habilita el micrófono, ElevenLabs transcribe el audio.
2. El backend prepara la pregunta y el contexto pertinente: pantalla, nivel y datos disponibles de la simulación o cartera ficticia; también objetivo, plazo y noticias verificadas si existen.
3. La API de Claude genera una respuesta adaptada al nivel. Los datos y cálculos provienen de los componentes del proyecto, no de cifras inventadas por el modelo.
4. La interfaz presenta el texto y, si se habilita, ElevenLabs lo convierte en audio.

Primero se propone completar el chat escrito con contexto, después la lectura en voz y finalmente la entrada hablada. La experiencia escrita debe seguir disponible si el proveedor de voz falla. Las claves permanecen en el servidor. El modelo conversacional usado por el producto es distinto de los agentes de desarrollo configurados para el equipo.

## Demo y visión futura

Para el hackathon se busca un recorrido completo y comprobable con una interfaz bancaria simulada, datos ficticios claramente identificados y, si se consiguen, series históricas verificables. El núcleo propuesto es explorar, practicar y pedir una explicación; la pausa con una cartera de ejemplo representa la segunda parte de la historia. Voz, noticias y otras ampliaciones dependen de su integración y del tiempo disponible.

Una versión futura podría integrarse con una entidad, mostrar información autorizada y conectarse a sus procesos de contratación o gestión. Eso requeriría acuerdos, revisiones y controles específicos; no se considera construido por preparar esta demo.

## Organización y estado

**Recomendación no aprobada:** la [investigación de viabilidad empresarial](investigacion/2026-11-10-viabilidad/informe.md) propone contrastar primero un piloto educativo con datos ficticios, y documenta las condiciones adicionales que requerirían datos personales o un servicio bancario.

El trabajo se divide entre [cinco áreas](organizacion.md): interfaz, backend, simulador, IA y voz, y datos/pruebas/presentación. Los [contratos](contratos.md) describen qué información deberían intercambiar y la [guía de agentes](agentes.md) identifica los asistentes de desarrollo. En sesiones Codex, el principal solo coordina y verifica; toda escritura se delega a Terra high, conforme a la [política de agentes](agentes.md).

En `main` existe una primera demo React/TypeScript con catálogo y cartera ficticios, simulador ilustrativo, asistente de respuestas predefinidas y pausa ante una caída. La demo incluye tres niveles con distinta información, español/inglés y temas claro/oscuro. El frontend inicial y las vistas adaptativas se integraron mediante los pull requests #1 y #2. La [guía para backend](backend-contexto.md) recoge las decisiones y los puntos de conexión pendientes.

La demo usa capital ficticio y, en esta rama, incluye una reconstrucción a partir de rentabilidades anuales publicadas de un fondo. El motor Python aislado de reproducción, escenarios y análisis básico de caídas no está conectado a la demo ni consume esa muestra. En esta rama existe una API FastAPI local; las conexiones a Claude, ElevenLabs y noticias siguen pendientes. La conversación de origen incluía un documento generado por Claude que aparecía oculto en la copia compartida: no se ha podido contrastar su contenido.


## Catálogo local de práctica (rama de trabajo)

La rama de trabajo incorpora ejemplos ficticios y una reconstrucción de cinco rentabilidades anuales publicadas de CaixaBank con aportaciones anuales al cierre; las fichas de BBVA y Santander no tienen histórico conectado. Los detalles y límites constan en [contratos](contratos.md#catálogo-local-de-práctica-rama-de-trabajo).

## Integración local de demostración

En esta rama, el frontend utiliza por defecto la API FastAPI local de catálogo, simulación, caídas y tutor por reglas. Ofrece demo local explícita ante fallo y comparte los ejemplos mediante `shared/demo-data.json`. El tutor se ejecuta mediante Node local; no usa LLM ni servicios externos. Véase [backend-contexto](backend-contexto.md) para contrato, ejecución y límites. Esta integración no implica despliegue ni conexión bancaria.


Plan de trabajo y puertas de decisión: [preparación de Tech2Finance](planning/plan.md).

## Líneas aún no integradas

Las siguientes decisiones pertenecen a ramas separadas de la base `42d5233`; no describen funcionalidad integrada en `main`. Experiencia 01 incorpora recuperación del catálogo y cancelación al cambiar de modo. Plataforma 02 incorpora un lanzador local con proxy y CI en el [PR 18](https://github.com/JaimeMoscardoS/tech2finance/pull/18), abierto; su [ejecución CI de push](https://github.com/JaimeMoscardoS/tech2finance/actions/runs/42850404022) terminó correctamente. Datos 03 añade procedencia al catálogo y simulación del servidor, con derechos aún desconocidos y cálculo TypeScript local sin versionar. Tutor 04 añade reglas limitadas de alcance y una batería sintética; su [PR 16](https://github.com/JaimeMoscardoS/tech2finance/pull/16) está abierto. El [registro de ejecución](planning/manifest.json) identifica versiones y evidencia conocidas. La coordinación aceptó la [integración local aislada](planning/integracion-local.md); ni esa prueba ni la CI de la rama 02 acreditan integración en `main`.


En la rama de interfaz, Explorar ofrece guía inicial, comparación de hasta tres fondos de la entidad configurada y panel técnico con exportación de las observaciones disponibles. Los valores de riesgo, coste y plazo añadidos a los tres fondos ficticios son supuestos educativos; no afectan al simulador. Para el fondo anual identificado se muestran rentabilidades compuestas acumuladas y anualizadas de 1, 3 y 5 años solo con una serie anual válida y suficiente, a partir de cifras publicadas redondeadas. Los documentos legales no están incorporados y no se presenta la ficha oficial como documento precontractual.


La entidad visible se fija mediante `VITE_BANK_ID` al iniciar o compilar (por defecto `demo`); el filtrado es de interfaz y no sustituye la autorización del servidor. La guía de objetivos usa plantillas locales editables según objetivo y preferencia de fluctuación, con condiciones explícitas de liquidez, reserva y deuda; no es una evaluación de idoneidad y sus respuestas no se envían al tutor. La comparación avanzada permite seleccionar hasta tres series compatibles por frecuencia, periodo y procedencia en gráficos separados con escala común. El simulador ofrece ayuda destacada junto al resultado válido.
