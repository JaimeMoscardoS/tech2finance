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

El orden exacto de pantallas y el alcance final de cada paso se decidirán al diseñar y probar la demo. Las preguntas sobre situación y objetivos pueden formar parte de la experiencia, pero no equivalen por sí solas a una evaluación de idoneidad válida.

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

Este motor es una funcionalidad **propuesta**, aún sin implementar. Para el hackathon puede demostrarse primero con un conjunto pequeño de episodios preparados y verificados; la búsqueda automática de noticias y comparables dependerá de las fuentes, licencias y tiempo disponibles. Si no hay datos suficientes, la interfaz debe mostrarlo.
## Noticias y explicación de movimientos

La intención del equipo es poder contrastar las explicaciones con noticias reales y actuales de fuentes fiables. Para ello habría que conectar una fuente, conservar título, enlace y fechas relevantes y comprobar que la información corresponde a la cartera y al periodo. Esa conexión todavía no existe ni se ha elegido un proveedor.

Una noticia que coincide con una caída no demuestra por sí misma que la haya causado. El tutor debe separar el cambio observado, los hechos respaldados por fuentes y las posibles interpretaciones. Si no hay información suficiente o las noticias no están disponibles, debe decirlo en vez de inventar una explicación.

## Conversación y voz

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

El trabajo se divide entre [cinco áreas](organizacion.md): interfaz, backend, simulador, IA y voz, y datos/pruebas/presentación. Los [contratos](contratos.md) describen qué información deberían intercambiar y la [guía de agentes](agentes.md) identifica los asistentes de desarrollo.

En la rama de frontend existe una primera demo React/TypeScript con catálogo y cartera ficticios, simulador ilustrativo, asistente de respuestas predefinidas y pausa ante una caída. En la rama de vistas adaptativas se añaden tres niveles con distinta información, español/inglés y temas claro/oscuro. Estos cambios están en pull requests pendientes de integración, no forman parte todavía de `main`.

El simulador usa valores ficticios: la máquina del tiempo histórica, el backend, el motor de análisis de caídas y las conexiones a Claude, ElevenLabs y noticias aún no están implementados. Python/FastAPI, Claude y ElevenLabs son la dirección propuesta para las piezas pendientes; sus detalles deben acordarse. La conversación de origen incluía un documento generado por Claude que aparecía oculto en la copia compartida: no se ha podido contrastar su contenido.