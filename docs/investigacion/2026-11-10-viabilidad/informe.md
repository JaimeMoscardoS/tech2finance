# Viabilidad empresarial de Tech2Finance

> Investigación y recomendaciones de trabajo; no decisiones aprobadas. Corte: 10 de noviembre de 2026.

## Índice

1. [Qué es y veredicto](#qué-es-y-veredicto)
2. [Estado actual y brecha](#estado-actual-y-brecha)
3. [Mercado, alternativas y propuesta de valor](#mercado-alternativas-y-propuesta-de-valor)
4. [Diseño de aprendizaje y límites de conducta](#diseño-de-aprendizaje-y-límites-de-conducta)
5. [Cuatro etapas y condiciones de paso](#cuatro-etapas-y-condiciones-de-paso)
6. [Organización y responsabilidades](#organización-y-responsabilidades)
7. [Ciclo empresarial completo](#ciclo-empresarial-completo)
8. [Tecnología, datos y operación](#tecnología-datos-y-operación)
9. [Marco jurídico y contractual](#marco-jurídico-y-contractual)
10. [Modelo económico y oferta](#modelo-económico-y-oferta)
11. [Plan de 30, 60 y 90 días](#plan-de-30-60-y-90-días)
12. [Backlog prioritario](#backlog-prioritario)
13. [Fuentes, límites e incertidumbres](#fuentes-límites-e-incertidumbres)

## Qué es y veredicto

Tech2Finance es un prototipo educativo para la sección de inversión de un banco: presenta productos y carteras de ejemplo, permite practicar con capital ficticio y ofrece explicaciones y una pausa informativa. El banco es el comprador propuesto y sus clientes serían usuarios. No consta un banco conectado, contrato, clientes de pago ni efecto educativo medido. La propuesta y sus límites se describen en [contexto del proyecto](../../contexto-proyecto.md).

**Veredicto:** existe una demo útil para investigar, pero no evidencia de un servicio bancario listo para vender e implantar a escala. La recomendación es probar primero un laboratorio educativo patrocinado por un banco para adultos, con datos ficticios, contenido aprobado y fuera del recorrido de contratación. Es una hipótesis de entrada, no un mercado validado. Las cinco áreas actuales son responsabilidades de desarrollo; no constituyen por sí mismas una organización con ventas, formación, servicio, seguridad y cumplimiento cubiertos.

El objetivo inicial debe ser demostrar que una persona entiende mejor riesgo, pérdida, costes y límites de un ejemplo, sin dirigirla a mantener una inversión. Si durante la exploración una página y una calculadora resultan suficientemente útiles para el problema observado y tienen menor coste o menos dificultades de uso, valorar una oferta más sencilla. Esta señal no demuestra equivalencia de aprendizaje. No hay base para prometer menos ventas por pánico, menos retiradas, mayor AUM, menor coste de atención o resultados de inversión. Una compra depende además de presupuesto, derechos, contratación y capacidad de prestar el servicio. Las notas de revisiones anteriores no certifican preparación para producción.


## Estado actual y brecha

**Observado en código y documentación:** el frontend presenta catálogo y cartera ficticios, simulaciones y tres experimentos de práctica; el usuario compara aportaciones, horizontes o activos y el tutor recibe únicamente el ejemplo elegido. Es una comparación de estrategias, no un ensayo A/B de eficacia educativa. Las rutas locales de catálogo, simulación, caídas y tutor se sirven mediante FastAPI; el tutor usa reglas y un puente Node, no Claude. La voz depende de capacidades locales y soporte del dispositivo. Véanse [práctica](../../../frontend/src/PracticeLab.tsx), [API](../../../backend/app.py), [tutor](../../../tutor-ia/src/local-tutor.ts) y [contexto](../../contexto-proyecto.md).

El cálculo periódico Python se usa en la API; el motor histórico independiente permanece aislado. Hay una reconstrucción de cinco rentabilidades anuales publicadas de una clase de CaixaBank; otras series son ficticias y BBVA/Santander carecen de histórico conectado. La [ficha de la gestora](https://www.caixabankassetmanagement.com/es/fondos/caixabank-monetario-rendimiento-fi-clase-estandar) publica la información de la clase; verla no acredita derechos de redistribución o explotación comercial. Faltan datos diarios, licencias acreditadas y pruebas independientes de todos los casos financieros.

La pausa calcula episodios sobre datos disponibles; no busca noticias, no atribuye causas y no busca fondos comparables. No hay integración bancaria, cuentas reales, órdenes, proveedores externos de IA o voz ni contratación acreditada. El puente local arranca Node por petición y limita concurrencia por proceso: es una decisión de demo, no una garantía de capacidad global. Las pruebas previas citadas por el repositorio no sustituyen una prueba de carga o seguridad en producción.

La preparación debe evaluarse por alcance: una demo necesita ser honesta y reproducible; un piloto alojado necesita control operativo proporcionado; datos personales requieren medidas y acuerdos adicionales; un servicio bancario requiere requisitos del contrato y controles de la entidad. No hace falta imponer SSO, Kubernetes o una arquitectura multicliente completa para una sesión educativa sintética.


## Mercado, alternativas y propuesta de valor

La necesidad general de educación financiera es plausible, pero no prueba que un banco compre este producto. La [Encuesta de Competencias Financieras de 2021, publicada en 2023](https://www.bde.es/f/webbe/SES/AnalisisEconomico/Competencis_Financieras/EncuestaCompetencias_2021.pdf), recoge respuestas correctas del 65 % en inflación, 41 % en interés compuesto y 52 % en diversificación. Son datos de aquella encuesta, no una medición de demanda actual. Un [metaanálisis de educación financiera](https://www.nber.org/system/files/working_papers/w27057/w27057.pdf) encuentra efectos medios positivos en intervenciones estudiadas; no valida este tutor ni su pausa.

| Alternativa | Qué ofrece según su fuente | Implicación |
| --- | --- | --- |
| [BBVA Aprende a invertir](https://www.bbva.com/es/es/salud-financiera/bbva-lanza-una-nueva-funcionalidad-para-que-los-clientes-en-espana-aprendan-a-invertir/) | Anuncio de 2023: contenidos y simulación de aportaciones y plazos en la app española. | Educación más simulación no es una novedad defendible; disponibilidad actual sin verificar. |
| [Personetics Engage](https://personetics.com/cognitive-banking-platform/engage-suite/) | Plataforma B2B bancaria de información y experiencias personalizadas. | Compite por presupuesto digital; no se ha demostrado que sea el mismo laboratorio de inversión. |
| [Bippit](https://bippit.com/faq) | Educación y acompañamiento financiero para empleados, mercado británico. | Sustituto si se cambia el comprador a RR. HH.; sus condiciones no equivalen a autorización española. |
| [Finanzas para Todos](https://www.finanzasparatodos.es/) | Recursos y herramientas públicas de educación financiera. | Alternativa gratuita y posible referencia curricular; acceso no autoriza copiar contenido comercialmente. |
| [eToro cuenta virtual](https://www.etoro.com/trading/demo-account/) | Práctica con cartera virtual en plataforma de inversión. | Sustituto para practicar; no se ha probado que sea un producto educativo neutral o B2B para bancos. |

Estas capacidades son afirmaciones de sus titulares, no pruebas independientes de resultados. La alternativa interna del banco puede ser contenido aprobado, calculadora, CMS y formación existente. La ventaja potencial debe medirse en comprensión incremental, actualización del contenido, trazabilidad, accesibilidad y esfuerzo de implantación. Niveles, un prompt y una demo son replicables; no existe una barrera competitiva demostrada.

**ICP recomendado, sujeto a contraste:** responsable de educación o salud financiera de un banco con programa activo, presupuesto identificable y acceso a una cohorte adulta. Producto digital, cumplimiento y compras deben participar desde el principio. Como vía alternativa se puede investigar formación de empleados, pero tiene otro comprador y no valida automáticamente la visión de clientes bancarios. La integración en la sección de inversión permanece como visión posterior, condicionada a un propietario del canal, contenido y evaluación de datos e integración.


## Diseño de aprendizaje y límites de conducta

El producto debe empezar por una competencia observable: distinguir aportaciones de rendimiento, reconocer una pérdida posible, explicar los límites de un histórico y entender cómo cambia un ejemplo con el plazo. La pregunta binaria actual no demuestra aprendizaje duradero. El [marco UE/OCDE para adultos](https://finance.ec.europa.eu/system/files/2022-01/220111-financial-competence-framework-adults_en.pdf) puede orientar objetivos; no valida automáticamente el cuestionario de Tech2Finance.

Propuesta exploratoria: diez sesiones observadas con adultos para localizar fallos; después, aproximadamente 30 participantes asignados a experiencia interactiva o material estático con información equivalente. Medir antes, inmediatamente después y a los 14 días con casos equivalentes. Registrar comprensión, localización de ayuda, necesidades de accesibilidad, abandono y calibración de confianza. Criterios iniciales propuestos: al menos 8 de 10 participantes localizan ayuda y completan una comparación sin intervención; ningún caso observado debe terminar creyendo que la recuperación está garantizada o que el sistema recomienda mantener. Cero casos observados no demuestra riesgo poblacional cero; esos tamaños no acreditan eficacia general ni potencia estadística.

La «pausa para comprender» debe dejar libre la salida y permitir expresar necesidad de liquidez, pérdida no recuperada o cambio de objetivo. Su métrica no debe ser ventas evitadas. Hay que detener cualquier versión que presione a mantener; preguntar por un objetivo no convierte automáticamente una explicación en asesoramiento, pero usar circunstancias personales para aconsejar un instrumento o mantenerlo puede cambiar el perímetro. No inferir emociones desde voz ni diagnosticar pánico. La guía de [ESMA sobre asesoramiento](https://www.esma.europa.eu/sites/default/files/2023-07/ESMA35-43-3861_Supervisory_briefing_on_understanding_the_definition_of_advice_under_MiFID_II.pdf) incluye recomendaciones implícitas y explica por qué un aviso aislado no basta.


## Cuatro etapas y condiciones de paso

| Etapa | Alcance | Evidencia mínima para avanzar | No demuestra |
| --- | --- | --- | --- |
| Demo | Local, ejemplos ficticios y tasas públicas limitadas, sin clientes reales. | Flujo reproducible, límites visibles y datos identificados. | Demanda, seguridad de servicio ni impacto educativo. |
| Piloto sintético | Cohorte adulta y datos ficticios; puede ser alojado y patrocinado. | Sponsor, consentimiento e información adecuados al diseño, contenido revisado, soporte, medición, derechos y contrato cuando procedan. | Preparación para cuentas o carteras reales. |
| Piloto con datos personales | Datos y finalidad definidos, acceso restringido y proveedores autorizados. | Roles, base jurídica, acuerdos, transferencias, retención, controles, borrado y evaluación de impacto si procede; pruebas de aislamiento y respuesta a incidentes. | Aptitud para asesorar ni operación bancaria completa. |
| Servicio para banco | Canal, población, datos y responsabilidad contractual acordados. | Aceptación de entidad, operación demostrada, continuidad, seguridad, derechos y salida, más requisitos de conducta y accesibilidad aplicables. | Licencia automática o certificación general. |

La clasificación depende del uso real. Una encuesta, un correo o un registro identificable ya pueden implicar datos personales aunque la cartera sea ficticia. No se debe llamar «sin datos personales» a un piloto sin revisar todos sus flujos. Un banco puede exigir controles contractuales incluso en un piloto sintético; el alcance se negocia y documenta.


## Organización y responsabilidades

La empresa necesita una función comercial y de dirección, pedagogía y contenido, ingeniería, datos y calidad, y operación con apoyo legal y de seguridad. No se propone contratar cinco departamentos completos: se asignan funciones a las cinco personas existentes y se reserva capacidad real. Una persona debe asumir dirección comercial; si ya desarrolla, hay que retirar trabajo equivalente o el plan no es creíble. Finanzas, pedagogía, asesoramiento jurídico, seguridad y accesibilidad pueden cubrirse con especialistas externos por entregables, sin presumir que ya están contratados.

| Trabajo | Responsable ejecutor R | Responsable final A | Consultados |
| --- | --- | --- | --- |
| Descubrimiento, presupuesto y contrato | Fundador comercial, entre las cinco personas | Responsable de producto | Banco, jurídico |
| Experiencia y accesibilidad | Persona 1, interfaz | Producto | Persona 5, especialista accesibilidad |
| API, entrega, operación y costes | Persona 2, backend | Responsable de servicio | Seguridad y arquitectura del banco |
| Cálculo y supuestos | Persona 3, motor | Responsable técnico | Revisor financiero independiente |
| Tutor, voz y evaluación de respuestas | Persona 4, IA | Responsable técnico | Contenido, cumplimiento |
| Fuentes, pruebas y dossier | Persona 5, datos y calidad | Producto | Jurídico, experto financiero |

A es una sola persona por decisión, aunque una persona acumule funciones. Producto y responsable técnico deben nombrarse; esta tabla propone responsabilidades, no afirma nombramientos. Contenido pedagógico necesita revisión de un experto financiero y separación de incentivos comerciales. Ningún integrante debe aprobar individualmente sus propios cálculos o textos críticos. Un asesor externo debe tener alcance, disponibilidad, precio y entregable escrito; sin ello es una dependencia abierta.


## Ciclo empresarial completo

1. **Descubrimiento.** Identificar problema, alternativa actual, comprador económico, sponsor, participantes y presupuesto. Registrar rechazos y evidencias; una reunión o un premio no es una oportunidad cualificada.
2. **Alcance y salvaguardas.** Definir población adulta, tareas, contenido, datos y exclusiones. El banco y Tech2Finance nombran responsables; un especialista revisa el perímetro y los conflictos. Si la propuesta depende de retener una inversión, parar y rediseñar.
3. **Derechos, privacidad y seguridad.** Inventariar fuentes, clases, licencias, proveedores, ubicaciones, flujos y responsabilidad. No introducir datos reales para acelerar una demo. Acordar condiciones y controles proporcionados a la etapa antes de recogerlos.
4. **Experimento educativo.** Congelar una versión, comparador y rúbrica; obtener las autorizaciones adecuadas, observar, registrar fallos y analizar resultados sin confundir correlación con mejora causal. Documentar qué se aprende y qué queda indeterminado.
5. **Piloto contratado.** Fijar alcance, responsables, tiempos estimados, precio negociado, criterios de aceptación, soporte, propiedad intelectual previa, tratamiento de datos, incidentes y salida. Un piloto pagado no implica contrato de producción.
6. **Implantación y aceptación.** Integrar solo lo pactado; probar entornos, contenido, accesibilidad, límites de capacidad, seguridad y recuperación. El banco acepta formalmente contra evidencias y puede rechazar cambios.
7. **Operación.** Responsable de servicio recibe incidencias, prioriza, comunica, monitoriza, controla cambios y revisa contenido/proveedores. Definir horarios y tiempos comprometidos reales; no prometer disponibilidad 24/7 sin capacidad demostrada.
8. **Renovar o salir.** Revisar adopción útil, comprensión, quejas, costes y obligaciones. Definir exportación o devolución de datos, borrado verificable, continuidad de licencias y fecha de cierre.

El comité de compra probable incluye patrocinador de negocio, dueño de presupuesto, producto digital o inversión, cumplimiento, privacidad, seguridad y arquitectura, compras, jurídico, accesibilidad y operaciones. Debe comprobarse en cada cuenta. [Santander UK](https://www.santander.co.uk/about-santander/partnering-with-fintechs) describe su propio proceso, con revisión y posible prueba; no representa a todos los bancos españoles ni fija duración. [CaixaBank Payments & Consumer](https://www.caixabankpc.com/es/colabora-con-nosotros) describe colaboración y pilotos; participar no garantiza compra.

**Recomendación administrativa previa a la firma:** precisar qué persona o entidad puede contratar, firmar y facturar; la titularidad del código y las cesiones o licencias de las aportaciones de los cinco miembros y componentes de terceros; y el tratamiento contable y fiscal aplicable. Revisar seguros según contrato y exposición. Estas comprobaciones no presuponen una forma societaria concreta ni que se hayan formalizado los derechos.


## Tecnología, datos y operación

Primero decidir si reglas aprobadas bastan frente a un modelo generativo, mediante la misma batería de preguntas y criterios de fidelidad, coste y utilidad. Si se integra un LLM, registrar versiones de modelo, instrucciones, corpus y cálculo; obtener cifras de herramientas deterministas; validar citas y permitir abstención. Ensayar información insuficiente, liquidez, pérdidas, fuentes contradictorias, documentos manipulados, importes, idiomas y niveles. Un enlace citado por el modelo no garantiza que la respuesta sea verdadera. La [guía NIST sobre IA generativa](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf) trata riesgos de confabulación y evaluación durante el ciclo de vida.

Datos: inventariar fuente, ISIN y clase, moneda, fecha de valoración y publicación, precio o valor liquidativo, rentabilidad total, distribuciones, costes incluidos, calendario, correcciones y derechos por uso. Un índice no es la historia de un fondo distinto. Una serie anual no permite reconstruir caídas intranuales. El beneficio dividido por el capital aportado no es automáticamente TIR, TAE ni rentabilidad ponderada en el tiempo. Cada resultado necesita versión del conjunto de datos, reglas, supuestos y fecha para poder repetirse. Los proveedores [FE fundinfo](https://www.fefundinfo.com/products/institutions/data-feeds) y [Morningstar](https://assets.contentstack.io/v3/assets/blt0b299fb5208b8900/blta45a7f424ad3c6e2/625f5239fea57c4dece5544b/Morningstar_Managed_Investment_Data_One_Pager.pdf) describen feeds; cobertura, licencia, precio y SLA para este caso no están verificados.

Priorizar un motor autoritativo con pruebas financieras independientes, ingestión controlada, cuarentena de datos defectuosos y no inventar valores ante fallos. Para alojar un piloto, acordar despliegue reproducible, secretos, copias y restauración probada, registros minimizados, alertas y un objetivo de servicio medido. La identidad, autorización por recurso, aislamiento entre usuarios y revocación son necesarios según el diseño al incorporar cuentas y datos reales; no se resuelven confiando en un identificador del navegador. El banco decide su integración y requisitos; no construir varios SDK o infraestructura compleja antes de tener una necesidad contractual.

Voz en nube exige comprobar idioma, edición del texto, permisos, cancelación, alternativa escrita y tratamiento de audio. La [documentación de residencia de ElevenLabs](https://elevenlabs.io/docs/overview/administration/data-residency) vincula opciones regionales a condiciones empresariales: no se debe prometer residencia UE o retención cero por defecto. La capacidad local puede ser útil pero depende de navegador, dispositivo y modelo instalado. Noticias causales, predicciones, comparables automáticos, órdenes y catálogo universal quedan fuera del primer piloto.

**Seguridad por etapa.** Antes de exponer el servicio, delimitar acceso, cifrado de transporte, límites de consumo, monitorización y una persona que responda a incidencias. Antes de datos reales, probar permisos por usuario y recurso, aislamiento entre clientes en almacenamiento, cachés, conversación y soporte, y revocación. Un despliegue dedicado puede ser una opción para un primer banco. Antes de conectar modelos o recuperación, separar instrucciones de documentos no fiables, limitar herramientas y salidas de red, comprobar cifras y citas contra fuentes autorizadas y preparar un corte de proveedor. Registrar versiones y eventos necesarios para investigar sin conservar conversaciones o audio íntegros por defecto. Un fallo de acceso cruzado, una fuga de datos o hechos financieros sin respaldo debe detener el lanzamiento.

El expediente de proveedor para un piloto debe reunir arquitectura y flujos reales, fuentes y derechos, condiciones de soporte, responsables de seguridad y cambios, pruebas de la versión y procedimiento de salida. Para datos reales se añaden acuerdos de tratamiento, evidencia de accesos, borrado y restauración, pruebas independientes acordadas y objetivos de servicio pactados. ISO 27001 o SOC 2 pueden ser requisitos de una compra concreta; no son condición legal universal por hacer una demo. Mantener dependencias fijadas, revisar vulnerabilidades y preparar una reversión son medidas operativas propuestas, no pruebas de que el despliegue exista.


## Marco jurídico y contractual

La educación financiera no requiere automáticamente licencia de asesoramiento, pero una recomendación personal sobre un instrumento concreto, incluso mantenerlo, puede constituir asesoramiento. Hay que definir quién presta la actividad, límites funcionales y supervisión; la licencia del banco no cubre sin más cualquier actividad autónoma del proveedor. El análisis depende de hechos, pantallas y mensajes. [Ley 6/2023](https://www.boe.es/buscar/act.php?id=BOE-A-2023-7053&lang=es&p=20261007&tn=1) y [Reglamento Delegado 2017/565](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A32017R0565) establecen obligaciones relevantes de conducta, información y, cuando proceda, idoneidad. Los niveles de explicación no sustituyen la evaluación de idoneidad o conveniencia que corresponda al servicio. Véanse también los artículos 54–56 del [Reglamento Delegado 2017/565](https://boe.es/buscar/doc.php?id=DOUE-L-2017-80560&lang=es).

Con datos personales, acordar roles reales, finalidades, base, información, minimización, contratos con encargados, subencargados, transferencias, seguridad y plazos de conservación. Una evaluación de impacto es obligatoria cuando se cumplan sus condiciones, no por utilizar IA. Audio identificable es dato personal; no es automáticamente dato biométrico de categoría especial. El permiso del micrófono no constituye por sí mismo una base jurídica de tratamiento; el consentimiento no es la única base posible. La designación de delegado de protección de datos se determina según los supuestos del artículo 37 del RGPD, no por usar IA sin más. Véase [RGPD](https://www.boe.es/buscar/doc.php?id=DOUE-L-2016-80807).

Si el banco contrata un servicio TIC, DORA contempla condiciones contractuales y responsabilidades; las exigencias adicionales dependen, entre otras cosas, de si la función apoyada es crítica o importante. El proveedor no se convierte automáticamente en entidad financiera ni en proveedor crítico designado. Véase [DORA, artículos 28–31](https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX%3A32022R2554).

El tutor educativo no es automáticamente IA de alto riesgo. Hay que clasificar el sistema y sus roles según función y despliegue; no se puede resolver solo porque use o no un LLM. El [Reglamento de IA](https://www.boe.es/buscar/doc.php?id=DOUE-L-2024-81079), modificado por el [Reglamento 2026/1744](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=OJ%3AL_202601744), mantiene la aplicación del artículo 50 desde el 2 de agosto de 2026, con obligaciones de transparencia según la función y las condiciones previstas; el calendario de alto riesgo se modificó para el anexo III al 2 de diciembre de 2027 y para el anexo I al 2 de agosto de 2028, con condiciones transitorias específicas. La transición del artículo 111.4 modificado alcanza exclusivamente al marcado del artículo 50.2 de sistemas comercializados antes del 2 de agosto de 2026, hasta el 2 de diciembre de 2026; no aplaza el aviso de interacción con IA del artículo 50.1. No presentar esas fechas como una exención general. La revisión jurídica debe comprobar la versión aplicable al lanzamiento.

Los servicios bancarios para consumidores están incluidos en el ámbito de la [Ley 11/2023](https://www.boe.es/buscar/doc.php?id=BOE-A-2023-11022) bajo sus condiciones; un proveedor educativo independiente necesita análisis propio. La subcontratación no exime sin más al banco. Probar teclado, lector de pantalla, errores, gráficos y alternativas a voz, no solo un escáner. La [propiedad intelectual](https://www.boe.es/buscar/act.php?id=BOE-A-1996-8930) y contratos de fuente se revisan por uso: dato público no equivale a autorización de redistribución, pero tampoco prueba por sí solo una infracción. No se ha constatado una infracción ni un cumplimiento integral. Acceso a cartera de inversión tampoco equivale automáticamente a prestar un servicio de iniciación o información de cuentas de pago.


## Modelo económico y oferta

Una oferta inicial puede ser un piloto pagado de alcance cerrado, con integración separada y, tras validación, suscripción con volumen definido y bolsa de voz. Es una estructura propuesta: no hay precio bancario validado, ingresos, ACV, CAC, LTV ni tamaño de mercado demostrado. El precio debe cubrir contenido y derechos, implantación, alojamiento, atención, revisión, seguridad y margen; no puede deducirse solo del coste de tokens. Definir por contrato la unidad de usuario activo y el tratamiento de excesos. No cobrar por evitar retiradas.

El modelo reproducible [inputs-costes.json](inputs-costes.json) y [modelo_costes.py](modelo_costes.py) usa escenarios mensuales inventados. Fórmula: usuarios × consultas por usuario × [(tokens entrada × 3 + tokens salida × 15)/1.000.000 + proporción de voz × (caracteres × 0,04/1.000 + minutos ASR × tarifa/hora/60)]. Referencias públicas: [Claude Sonnet 4.6](https://platform.claude.com/docs/en/about-claude/pricing) a 3 USD por millón de tokens de entrada y 15 de salida; [ElevenLabs API](https://elevenlabs.io/pricing/api) Flash/Turbo a 0,04 USD por mil caracteres y Scribe a 0,22 USD/h batch o 0,39 USD/h en directo. Son referencias, no selección definitiva ni cotización contractual. Tarifas y condiciones pueden cambiar.

| Escenario | Usuarios | Consultas/usuario | Voz | Batch USD/mes | Directo USD/mes |
| --- | ---: | ---: | ---: | ---: | ---: |
| A | 100 | 10 | 10 % | 21,18 | 21,33 |
| B | 1.000 | 20 | 25 % | 903,75 | 914,38 |
| C | 10.000 | 40 | 50 % | 41.933,33 | 42.500,00 |

En C la síntesis de voz pesa mucho; imponer límites y medir consumo antes de ofrecer voz ilimitada. Las cifras son consumo hipotético variable, sin impuestos; no incluyen licencias de datos, contenido, alojamiento, reintentos, soporte humano, integración, seguridad, cambio de divisa ni condiciones empresariales UE. Estos costes son desconocidos, no cero. Los planes con cuota y consumo incluido se modelan por separado: no sumar dos veces ese mismo consumo como pago por uso. Una respuesta no equivale a una llamada evitada. Para estimar ahorro habría que medir adopción, resolución segura, contactos realmente sustituidos, tiempo y coste. El margen es ingreso menos coste de entrega dividido por ingreso; la integración necesita su propia cuenta.

**Sensibilidad de modelo:** Sonnet 5.5 figura en la misma fuente a 2 USD por millón de tokens de entrada y 10 de salida. Con el mismo número supuesto de tokens, A/B/C serían 16,18 / 753,75 / 37.533,33 USD con ASR batch y 16,33 / 764,38 / 38.100,00 USD con ASR en directo. Mantener los mismos tokens sirve para aislar el precio, pero no garantiza representar el mismo texto entre tokenizadores; es una comparación hipotética, no una elección de modelo.


## Plan de 30, 60 y 90 días

Los plazos son ventanas de planificación, no compromisos ni una promesa de compra bancaria. Las tareas solo avanzan si hay capacidad y evidencias; una contratación o licencia externa puede tardar más.

**Días 1–30: problema y riesgo.** Designar producto, comercial y servicio; hacer una ficha honesta y un mapa de alternativas. Proponer al menos cinco conversaciones con compradores y diez pruebas observadas con adultos; no son entrevistas ya realizadas. Revisar derechos del ejemplo y perímetro de la pausa. Puerta: problema repetido, responsable identificable, acceso a participantes y ausencia de presión a mantener. Si nadie reconoce un problema con dueño, detener integración y reconsiderar ICP.

**Días 31–60: una oferta y un experimento.** Aprobar un módulo, sus fuentes y rúbrica, y contrastarlo con material equivalente. Preparar presupuesto, soporte, condiciones de piloto y mapa de datos; corregir errores observados. Puerta: contenido revisado, derechos adecuados, aceptación definida antes de probar y capacidad de ejecución. Si la alternativa sencilla resulta útil en las tareas observadas y exige menos coste o asistencia, considerar simplificar antes de añadir IA o voz; la muestra exploratoria no prueba equivalencia. Demostrar equivalencia requeriría un margen previamente acordado, diseño apropiado y potencia suficiente.

**Días 61–90: señal y decisión.** Ejecutar la comparación exploratoria solo si hay patrocinio y recursos; documentar comprensión inmediata y diferida, fallos, coste y acceso. Solicitar una decisión comercial basada en alcance y presupuesto. Puerta para siguiente etapa: señal educativa útil sin fallos críticos, comprador con vía presupuestaria, revisión legal y derechos, y plan operativo viable. Si cualquier requisito falta, seguir investigando o parar; no presentar la ventana de 90 días como plazo garantizado de producción.


## Backlog prioritario

| ID | Entregable y responsable | Evidencia y aceptación | Dependencia y parada |
| --- | --- | --- | --- |
| B01 | Producto: nombrar dirección, comercial y servicio. | Personas y horas semanales acordadas. | Parar compromisos si no existe capacidad. |
| B02 | Comercial: entrevistas a compradores. | Problema, alternativa, presupuesto y criterios registrados; sin inventar interés. | Acceso a responsables; sin dueño, revisar ICP. |
| B03 | Producto + pedagogía: prueba de aprendizaje. | Rúbrica y comparador congelados antes; resultados y errores publicados internamente. | Participantes y contenido; parar ante inducción a mantener. |
| B04 | Datos + jurídico: registro de derechos. | Fuente, clase, usos, autorización o fundamento por escrito. | Proveedor; excluir fuente si no se resuelve. |
| B05 | Motor + revisor financiero: cálculo autoritativo. | Fixtures independientes, supuestos y casos límite revisados. | Especificación y datos; no usar cifras no reconciliadas. |
| B06 | Backend: versionar datasets y cálculos. | Un resultado antiguo se reproduce con sus versiones. | B04–B05; parar si no hay procedencia. |
| B07 | IA + cumplimiento: evaluar reglas frente a LLM. | Batería versionada, cifras verificadas, abstenciones y costes comparados. | B03/B05; no incorporar LLM si empeora fidelidad. |
| B08 | Interfaz + especialista: accesibilidad del flujo. | Pruebas teclado y lector, errores corregidos y evidencia. | Prototipo estable; bloquear piloto ante barreras críticas. |
| B09 | Producto + abogado financiero: perímetro y conducta. | Pantallas y respuestas revisadas, prestador y exclusiones identificados. | Alcance preciso; detener recomendaciones personales no autorizadas. |
| B10 | Servicio + seguridad: operación sintética. | Despliegue, registros minimizados, alertas y restauración ensayados. | Diseño de hosting; no ofrecer SLA sin medir. |
| B11 | Privacidad + seguridad: mapa de datos y proveedores. | Roles, base, subencargados, retención y decisión EIPD documentados. | Flujo real; no introducir PII antes de cerrar condiciones. |
| B12 | Comercial + jurídico: propuesta y contrato de piloto. | Alcance, criterios, pagos, soporte, IP, incidentes y salida negociables. | B02–B04/B09; no prometer producción. |
| B13 | Finanzas + servicio: costes y caja. | Modelo con hipótesis, presupuesto y sensibilidad revisados. | Cotizaciones y volumen; no fijar margen con costes desconocidos. |
| B14 | Producto + banco: decisión seguir/cambiar/parar. | Registro de evidencia, fallos y responsable que decide. | B03 y comprador; no afirmar eficacia con muestra exploratoria. |


## Fuentes, límites e incertidumbres

Corte y fecha de consulta: **10 de noviembre de 2026**. Los enlaces cercanos a cada afirmación identifican fuentes primarias o estudios; páginas comerciales y documentación dinámica pueden cambiar y sus afirmaciones describen ofertas, no resultados propios. La revisión de código se refiere a la base de trabajo de esta investigación; los ficheros enlazados permiten verificar cada comportamiento. No se realizaron entrevistas, pruebas de penetración, cotizaciones ni experimentos educativos para este informe.

| Fuente | Fecha | Qué respalda | Límite |
| --- | --- | --- | --- |
| [Contexto del proyecto](../../contexto-proyecto.md), [API](../../../backend/app.py), [motor periódico](../../../simulador/periodic.py) | Base de repositorio consultada 10-11-2026 | Alcance de demo, rutas y cálculo local: backend/app.py:55–58 y 99–123; simulador/periodic.py:5–31; frontend/src/PracticeLab.tsx:35–80; tutor-ia/src/local-tutor.ts:16–101. | Lectura de código no prueba despliegue ni carga. |
| [BBVA anuncio](https://www.bbva.com/es/es/salud-financiera/bbva-lanza-una-nueva-funcionalidad-para-que-los-clientes-en-espana-aprendan-a-invertir/) | 13-02-2023 | Contenido y simulación anunciados. | Disponibilidad actual sin comprobar. |
| [Banco de España ECF](https://www.bde.es/f/webbe/SES/AnalisisEconomico/Competencis_Financieras/EncuestaCompetencias_2021.pdf) | Encuesta 2021; publicación 2023 | Indicadores de conocimientos de la muestra. | No mide compra ni eficacia del producto. |
| [ESMA asesoramiento](https://www.esma.europa.eu/sites/default/files/2023-07/ESMA35-43-3861_Supervisory_briefing_on_understanding_the_definition_of_advice_under_MiFID_II.pdf) | 11-07-2023 | Definición y ejemplos de recomendaciones personales. | Clasificación requiere hechos concretos. |
| [AI Act modificación](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=OJ%3AL_202601744) | 24-07-2026 | Cambio de calendario y reglas transitorias. | Aplicación depende del sistema y versión. |
| [Claude](https://platform.claude.com/docs/en/about-claude/pricing), [ElevenLabs](https://elevenlabs.io/pricing/api) | Consulta 10-11-2026 | Tarifas públicas para escenarios hipotéticos. | No cotización de empresa ni coste total. |

**Preguntas abiertas y responsables:** comercial debe comprobar comprador, precio y presupuesto; producto y pedagogo, aprendizaje incremental; datos y jurídico, licencia de cada fuente y derivados; responsable técnico, capacidad, restauración y aislamiento; privacidad y banco, roles, transferencias y necesidad de EIPD; jurídico financiero, perímetro real de cada mensaje; dirección, capacidad de soporte y caja. No se asigna cero a ningún coste o riesgo desconocido. Las recomendaciones de este informe requieren decisión explícita del equipo y, cuando corresponda, revisión profesional y aceptación del banco.

**Método y alcance de la investigación:** se han contrastado cinco perspectivas empresariales —producto y mercado, tecnología y datos, seguridad y operación, regulación, y negocio y finanzas—, además de su integración. Son perspectivas de investigación, distintas de las cinco áreas de desarrollo y de las cinco personas del repositorio; no se afirma que existan cinco departamentos contratados. No se ha contactado a bancos ni usuarios, realizado entrevistas o conseguido licencias durante este trabajo.

**Revisión del informe:** una revisión independiente de calidad documental cerró con 8,7/10 tras corregir los enlaces del índice y la interpretación de la muestra exploratoria; la revisión legal dirigida cerró con 9,0/10 tras incorporar sus precisiones. Estas notas valoran únicamente la investigación revisada, no la preparación de la plataforma ni una certificación legal. Se comprobaron la generación reproducible, los datos estructurados, los enlaces locales y el modelo aritmético; no se ejecutaron pruebas de aplicación para este cambio documental.
