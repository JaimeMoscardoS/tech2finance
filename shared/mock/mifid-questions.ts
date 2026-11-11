/**
 * PREGUNTAS DE PRÁCTICA DEL TEST MiFID (contenido educativo, no evaluación real).
 *
 * Son 27 preguntas DEMO de redacción propia con fines educativos (Básico 12, Intermedio 10, Avanzado 5; visibles 12, 22 y 27).
 * El array está ORDENADO por nivel (beginner, intermediate, advanced) y, dentro de cada nivel, primero conocimiento
 * (de lo más básico a lo más técnico) y luego preguntas personales (objetivo y horizonte, situación financiera,
 * tolerancia y capacidad, experiencia). Quien añada preguntas debe respetar ese orden (hay una prueba que lo comprueba). No proceden del test de ninguna entidad
 * y están pendientes de revisión de contenido por el equipo (ver el bloque final "PENDIENTE DE CONTRASTAR CON LA CNMV").
 *
 * Cómo ampliar este archivo sin tocar la interfaz: añade objetos al array `mifidQuestions`.
 * La UI (`frontend/src/views/learn/`) y la puntuación (`frontend/src/education-mifid.ts`) leen solo este formato.
 *
 * Formato de cada pregunta (`MifidQuestion`):
 *  - id: texto único y estable (prefijo `k-` en conocimiento y `p-` en personal, p. ej. "k-diversificacion").
 *  - kind: "knowledge" (conocimiento: hay UNA opción con `correct: true`; puntúa) o
 *          "personal" (situación personal, horizonte, tolerancia al riesgo: NO hay opción correcta,
 *          no lleva `correct` en ninguna opción y NO puntúa).
 *  - level (opcional): nivel mínimo de la interfaz desde el que se muestra ("beginner" | "intermediate" | "advanced").
 *          Si falta, se muestra en todos los niveles. Cambia la cantidad de preguntas, no el perfil de riesgo.
 *  - text: enunciado { es, en }.
 *  - options: 2 o más opciones { id (único dentro de la pregunta), text { es, en },
 *          correct? (solo en knowledge, exactamente una),
 *          implication { es, en }: qué implica elegirla (en knowledge, por qué es o no acertada;
 *          en personal, qué supone esa respuesta para el tipo de producto adecuado) }.
 *  - why: { es, en } por qué se hace esta pregunta en el test real.
 *  - explanation: { es, en } explicación general tras responder.
 *
 * `validateQuestions` (en education-mifid.ts) comprueba estas reglas y tiene pruebas.
 * Ninguna pregunta recomienda comprar o vender, ni promete rentabilidades, ni cita productos o entidades reales.
 */

export type MifidLevel = "beginner" | "intermediate" | "advanced";
export type Bilingual = { es: string; en: string };

export type MifidOption = {
  id: string;
  text: Bilingual;
  /** Solo en preguntas de conocimiento: marca la opción correcta. */
  correct?: boolean;
  implication: Bilingual;
};

export type MifidQuestion = {
  id: string;
  kind: "knowledge" | "personal";
  level?: MifidLevel;
  text: Bilingual;
  options: readonly MifidOption[];
  why: Bilingual;
  explanation: Bilingual;
};

export const MIFID_DISCLAIMER: Bilingual = {
  es: "Material educativo con preguntas de ejemplo (DEMO) de redacción propia. No es el test real de ninguna entidad, no evalúa tu conveniencia o idoneidad y no genera ninguna recomendación.",
  en: "Educational material with sample (DEMO) questions written for this project. It is not any institution's real test, does not assess your suitability or appropriateness and produces no recommendation.",
};

/** Aviso visible: las cifras y normas citadas en las preguntas aún no se han contrastado con fuentes oficiales (ver comentario final de este archivo). */
export const MIFID_VERIFICATION_NOTICE: Bilingual = {
  es: "Contenido pendiente de verificación con fuentes oficiales (CNMV, FGD): las cifras y normas citadas (por ejemplo, el límite de 100.000 euros del Fondo de Garantía de Depósitos) son orientativas.",
  en: "Content pending verification against official sources (CNMV, FGD): the figures and rules cited (for example, the 100,000 euro Deposit Guarantee Fund limit) are indicative.",
};

export const mifidQuestions: readonly MifidQuestion[] = [
  // NIVEL BÁSICO (beginner): conocimiento y después preguntas personales
  {
    id: "k-riesgo-rentabilidad",
    kind: "knowledge",
    level: "beginner",
    text: {
      es: "En general, ¿qué relación existe entre la rentabilidad que se espera de una inversión y su riesgo?",
      en: "In general, what is the relationship between the return expected from an investment and its risk?",
    },
    options: [
      {
        id: "a",
        text: { es: "Mayor rentabilidad esperada suele ir con mayor posibilidad de pérdidas.", en: "A higher expected return usually comes with a greater chance of losses." },
        correct: true,
        implication: { es: "Acertada: la compensación por asumir más incertidumbre es una rentabilidad esperada mayor, que no está garantizada.", en: "Correct: the compensation for taking more uncertainty is a higher expected return, which is not guaranteed." },
      },
      {
        id: "b",
        text: { es: "Mayor rentabilidad esperada implica siempre menor riesgo.", en: "A higher expected return always means lower risk." },
        implication: { es: "No es correcta: una promesa de mucha rentabilidad sin riesgo debe hacer sospechar.", en: "Not correct: a promise of high return without risk should raise suspicion." },
      },
      {
        id: "c",
        text: { es: "No hay ninguna relación entre ambas.", en: "There is no relationship between the two." },
        implication: { es: "No es correcta: precisamente esa relación es la base de cómo se valoran los productos.", en: "Not correct: that relationship is the basis of how products are priced." },
      },
    ],
    why: {
      es: "Comprobar que entiendes que la rentabilidad esperada no es gratuita ayuda a evitar productos que no encajan con lo que puedes asumir.",
      en: "Checking that you understand expected return is not free helps avoid products that do not fit what you can bear.",
    },
    explanation: {
      es: "Rentabilidad y riesgo suelen ir de la mano. Ningún producto con riesgo garantiza ganancias.",
      en: "Return and risk usually go together. No product with risk guarantees gains.",
    },
  },
  {
    id: "k-diversificacion",
    kind: "knowledge",
    level: "beginner",
    text: {
      es: "¿Qué ventaja principal tiene diversificar una cartera entre varios activos?",
      en: "What is the main advantage of diversifying a portfolio across several assets?",
    },
    options: [
      {
        id: "a",
        text: { es: "Reduce el impacto que tiene sobre el conjunto el mal comportamiento de un solo activo.", en: "It reduces the impact on the whole portfolio of a single asset performing badly." },
        correct: true,
        implication: { es: "Acertada: repartir el dinero evita depender de un único activo, aunque no elimina el riesgo de mercado general.", en: "Correct: spreading money avoids depending on a single asset, although it does not remove general market risk." },
      },
      {
        id: "b",
        text: { es: "Garantiza que la cartera nunca tendrá pérdidas.", en: "It guarantees the portfolio will never lose money." },
        implication: { es: "No es correcta: la diversificación reduce parte del riesgo, pero no lo elimina ni garantiza resultados.", en: "Not correct: diversification reduces part of the risk but neither removes it nor guarantees results." },
      },
      {
        id: "c",
        text: { es: "Asegura una rentabilidad mayor que la de cualquier activo individual.", en: "It ensures a higher return than any individual asset." },
        implication: { es: "No es correcta: la cartera diversificada puede rendir menos que su mejor activo; el objetivo es controlar el riesgo, no maximizar el resultado.", en: "Not correct: a diversified portfolio can earn less than its best asset; the aim is to manage risk, not to maximise the outcome." },
      },
    ],
    why: {
      es: "Se comprueba que no confundas concentrar el dinero en pocos activos con una estrategia prudente.",
      en: "It checks that you do not mistake concentrating money in few assets for a prudent strategy.",
    },
    explanation: {
      es: "La respuesta correcta es la primera: diversificar reparte el riesgo específico de cada activo. No protege frente a caídas generales del mercado ni asegura ganancias.",
      en: "The correct answer is the first one: diversifying spreads each asset's specific risk. It does not protect against general market falls nor ensure gains.",
    },
  },
  {
    id: "k-renta-fija-variable",
    kind: "knowledge",
    level: "beginner",
    text: {
      es: "¿Cuál es la diferencia básica entre renta fija y renta variable?",
      en: "What is the basic difference between fixed income and equities?",
    },
    options: [
      {
        id: "a",
        text: { es: "La renta fija no puede dar pérdidas y la variable siempre las da.", en: "Fixed income can never lose money and equities always do." },
        implication: { es: "No es correcta: la renta fija puede perder valor (impago del emisor, subida de tipos) y la variable puede ganar.", en: "Not correct: fixed income can lose value (issuer default, rising rates) and equities can gain." },
      },
      {
        id: "b",
        text: { es: "En la renta fija el emisor se compromete a devolver el capital e intereses en unas condiciones pactadas; en la variable no hay ese compromiso y el valor depende del mercado.", en: "In fixed income the issuer commits to repay capital and interest on agreed terms; in equities there is no such commitment and the value depends on the market." },
        correct: true,
        implication: { es: "Acertada: la renta fija define de antemano cobros y vencimiento, pero depende de que el emisor cumpla y su precio puede variar antes del vencimiento.", en: "Correct: fixed income sets payments and maturity in advance, but it depends on the issuer meeting them and its price can vary before maturity." },
      },
      {
        id: "c",
        text: { es: "Son lo mismo con distinto nombre.", en: "They are the same thing under different names." },
        implication: { es: "No es correcta: tienen derechos, riesgos y comportamientos distintos.", en: "Not correct: they carry different rights, risks and behaviours." },
      },
    ],
    why: {
      es: "Sirve para comprobar que distingues productos con cobros pactados de los que dependen de los resultados y del mercado.",
      en: "It checks that you tell products with agreed payments apart from those that depend on results and the market.",
    },
    explanation: {
      es: "La respuesta correcta es la segunda. «Fija» no significa «sin riesgo»: el emisor puede incumplir y el precio puede bajar antes del vencimiento.",
      en: "The correct answer is the second one. \"Fixed\" does not mean \"risk-free\": the issuer may default and the price can fall before maturity.",
    },
  },
  {
    id: "k-fgd",
    kind: "knowledge",
    level: "beginner",
    text: {
      es: "Las garantías de protección del dinero de los clientes tienen límites. ¿Qué cubren?",
      en: "The schemes that protect customers' money have limits. What do they cover?",
    },
    options: [
      {
        id: "a",
        text: { es: "Cualquier pérdida de valor de fondos de inversión o acciones.", en: "Any loss in value of investment funds or shares." },
        implication: { es: "No es correcta: invertir implica riesgo de mercado y ninguna garantía cubre las pérdidas por caída del mercado.", en: "Not correct: investing involves market risk and no guarantee covers losses caused by market falls." },
      },
      {
        id: "b",
        text: { es: "Todo el dinero que tengas en una entidad, sin límite de importe.", en: "All the money you hold at an institution, with no limit on the amount." },
        implication: { es: "No es correcta: existe un límite por titular y entidad.", en: "Not correct: there is a limit per holder and institution." },
      },
      {
        id: "c",
        text: { es: "Los depósitos, hasta 100.000 euros por titular y entidad; además, existe una cobertura separada (también hasta 100.000 euros) para valores e instrumentos financieros confiados a la entidad si esta no puede devolverlos, por ejemplo por insolvencia. Ninguna de las dos cubre las pérdidas por caída del mercado.", en: "Deposits, up to 100,000 euros per holder and institution; in addition, there is a separate coverage (also up to 100,000 euros) for securities and financial instruments entrusted to the institution if it cannot return them, for example through insolvency. Neither covers losses caused by market falls." },
        correct: true,
        implication: { es: "Acertada: las coberturas protegen frente a la imposibilidad de la entidad de devolver depósitos o valores, no frente a las oscilaciones de mercado de una inversión.", en: "Correct: the coverages protect against the institution being unable to return deposits or securities, not against the market swings of an investment." },
      },
    ],
    why: {
      es: "Evita que se confunda la protección de un depósito o de los valores custodiados con una garantía sobre el valor de las inversiones.",
      en: "It prevents confusing the protection of a deposit or of custodied securities with a guarantee on the value of investments.",
    },
    explanation: {
      es: "La respuesta correcta es la tercera. Ninguna garantía cubre las pérdidas por caída del mercado, y que un producto se contrate en un banco no significa que esté garantizado. Los límites y las condiciones concretas deben consultarse en la documentación oficial.",
      en: "The correct answer is the third one. No guarantee covers losses caused by market falls, and a product being sold at a bank does not mean it is guaranteed. Limits and specific conditions should be checked in the official documentation.",
    },
  },
  {
    id: "k-sri-escala",
    kind: "knowledge",
    level: "beginner",
    text: {
      es: "En el indicador de riesgo del documento de datos fundamentales, ¿qué significan los valores 1 y 7?",
      en: "In the risk indicator of the key information document, what do the values 1 and 7 mean?",
    },
    options: [
      {
        id: "a",
        text: { es: "1 es la clase de riesgo más baja y 7 la más alta.", en: "1 is the lowest risk class and 7 the highest." },
        correct: true,
        implication: { es: "Acertada: la escala va de 1 a 7 y a mayor número, mayor riesgo del producto.", en: "Correct: the scale runs from 1 to 7 and a higher number means higher product risk." },
      },
      {
        id: "b",
        text: { es: "1 es la más alta y 7 la más baja.", en: "1 is the highest and 7 the lowest." },
        implication: { es: "No es correcta: la escala está al revés.", en: "Not correct: the scale is the wrong way round." },
      },
      {
        id: "c",
        text: { es: "1 significa que el producto está garantizado y 7 que se pierde todo seguro.", en: "1 means the product is guaranteed and 7 that everything is surely lost." },
        implication: { es: "No es correcta: ni 1 es una garantía ni 7 implica pérdida segura; son clases de riesgo.", en: "Not correct: 1 is not a guarantee and 7 does not imply certain loss; they are risk classes." },
      },
    ],
    why: {
      es: "El indicador resume el riesgo de un producto de forma comparable, y se pregunta para saber si sabes interpretarlo.",
      en: "The indicator summarises a product's risk in a comparable way, and it is asked to see whether you can interpret it.",
    },
    explanation: {
      es: "La respuesta correcta es la primera. Es una guía para comparar productos, no una promesa ni un pronóstico.",
      en: "The correct answer is the first one. It is a guide for comparing products, not a promise or a forecast.",
    },
  },
  {
    id: "p-objetivo",
    kind: "personal",
    level: "beginner",
    text: {
      es: "¿Cuál es el objetivo principal de este dinero?",
      en: "What is the main goal of this money?",
    },
    options: [
      {
        id: "a",
        text: { es: "Conservarlo y mantener su valor con la menor oscilación posible.", en: "To keep it and preserve its value with as little fluctuation as possible." },
        implication: { es: "Un objetivo de conservación suele encajar con productos de baja oscilación, aceptando que su potencial de crecimiento es limitado.", en: "A preservation goal usually fits low-fluctuation products, accepting limited growth potential." },
      },
      {
        id: "b",
        text: { es: "Que crezca de forma moderada con algunas oscilaciones.", en: "To grow moderately with some fluctuation." },
        implication: { es: "Un crecimiento moderado puede combinar productos de distinto riesgo; exige aceptar que habrá períodos de caída.", en: "Moderate growth may combine products of different risk; it requires accepting periods of decline." },
      },
      {
        id: "c",
        text: { es: "Que crezca a largo plazo asumiendo oscilaciones importantes.", en: "To grow in the long run while accepting significant fluctuation." },
        implication: { es: "Un objetivo de crecimiento suele implicar productos con mayor oscilación; conviene que el plazo y tu situación lo permitan.", en: "A growth goal usually involves products with greater fluctuation; the term and your situation should allow it." },
      },
    ],
    why: {
      es: "El objetivo orienta qué tipo de producto puede ser coherente con lo que buscas.",
      en: "The goal guides which type of product can be consistent with what you are looking for.",
    },
    explanation: {
      es: "No hay una respuesta mejor: describe lo que de verdad quieres. Declarar un objetivo más ambicioso del real puede llevarte a productos que no encajan.",
      en: "There is no better answer: describe what you really want. Stating a goal more ambitious than the real one may lead to products that do not fit.",
    },
  },
  {
    id: "p-horizonte",
    kind: "personal",
    level: "beginner",
    text: {
      es: "¿Durante cuánto tiempo prevés mantener este dinero invertido antes de necesitarlo?",
      en: "For how long do you expect to keep this money invested before you need it?",
    },
    options: [
      {
        id: "a",
        text: { es: "Menos de 2 años", en: "Less than 2 years" },
        implication: { es: "Con un plazo corto, una caída temporal puede no dar tiempo a recuperarse; suelen encajar mejor productos de menor riesgo y alta liquidez.", en: "With a short term, a temporary fall may not have time to recover; lower-risk, highly liquid products usually fit better." },
      },
      {
        id: "b",
        text: { es: "Entre 2 y 5 años", en: "Between 2 and 5 years" },
        implication: { es: "Un plazo medio permite cierta oscilación; conviene revisar si las posibles caídas son compatibles con tu fecha objetivo.", en: "A medium term allows some fluctuation; check that possible falls fit your target date." },
      },
      {
        id: "c",
        text: { es: "Más de 5 años", en: "More than 5 years" },
        implication: { es: "Un plazo largo da más margen para absorber altibajos, aunque no garantiza resultados.", en: "A long term gives more room to absorb ups and downs, though it guarantees no results." },
      },
    ],
    why: {
      es: "El horizonte determina cuánta oscilación puede soportar tu inversión sin que tengas que vender en mal momento.",
      en: "The horizon determines how much fluctuation your investment can bear without being forced to sell at a bad time.",
    },
    explanation: {
      es: "No hay respuesta buena o mala: debe reflejar tu situación real. Responder con sinceridad evita que te muestren productos que no encajan contigo.",
      en: "There is no good or bad answer: it should reflect your real situation. Answering honestly avoids being shown products that do not fit you.",
    },
  },
  {
    id: "p-ingresos",
    kind: "personal",
    level: "beginner",
    text: {
      es: "¿Cómo describirías tus ingresos habituales?",
      en: "How would you describe your usual income?",
    },
    options: [
      {
        id: "a",
        text: { es: "Estables y previsibles (por ejemplo, un contrato indefinido).", en: "Stable and predictable (for example, a permanent contract)." },
        implication: { es: "Ingresos estables facilitan mantener la inversión durante caídas, sin necesidad de vender para cubrir gastos.", en: "Stable income makes it easier to keep the investment through falls, without selling to cover expenses." },
      },
      {
        id: "b",
        text: { es: "Variables, pero suficientes en general.", en: "Variable, but generally sufficient." },
        implication: { es: "Ingresos variables aconsejan reservar más liquidez para no tener que vender en mal momento.", en: "Variable income suggests keeping more liquidity so as not to sell at a bad moment." },
      },
      {
        id: "c",
        text: { es: "Irregulares o inciertos.", en: "Irregular or uncertain." },
        implication: { es: "Con ingresos inciertos suelen ser preferibles productos de más liquidez y menor oscilación.", en: "With uncertain income, more liquid and less volatile products are usually preferable." },
      },
    ],
    why: {
      es: "La estabilidad de ingresos condiciona cuánto riesgo puedes sostener en el tiempo.",
      en: "Income stability conditions how much risk you can sustain over time.",
    },
    explanation: {
      es: "No hay una respuesta buena: refleja tu situación tal como es. Un dato inexacto puede dar una evaluación que no se ajusta a tu realidad.",
      en: "There is no good answer: reflect your situation as it is. Inaccurate data can produce an assessment that does not match your reality.",
    },
  },
  {
    id: "p-colchon",
    kind: "personal",
    level: "beginner",
    text: {
      es: "¿Dispones de un fondo de emergencia aparte de este dinero?",
      en: "Do you have an emergency fund apart from this money?",
    },
    options: [
      {
        id: "a",
        text: { es: "No, este dinero es mi única reserva.", en: "No, this money is my only reserve." },
        implication: { es: "Si es tu única reserva, suelen ser más adecuados productos de alta liquidez y bajo riesgo.", en: "If it is your only reserve, highly liquid and low-risk products are usually more suitable." },
      },
      {
        id: "b",
        text: { es: "Sí, cubre unos 3 a 6 meses de gastos.", en: "Yes, it covers about 3 to 6 months of expenses." },
        implication: { es: "Un colchón así reduce la necesidad de vender ante imprevistos y permite mayor margen de oscilación.", en: "A cushion like this reduces the need to sell in emergencies and allows more room for fluctuation." },
      },
      {
        id: "c",
        text: { es: "Sí, cubre más de 6 meses de gastos.", en: "Yes, it covers more than 6 months of expenses." },
        implication: { es: "Un colchón amplio ofrece más margen para mantener la inversión en caídas prolongadas.", en: "A large cushion gives more room to keep the investment through prolonged falls." },
      },
    ],
    why: {
      es: "Tener reservas evita que un imprevisto te obligue a vender una inversión en un momento desfavorable.",
      en: "Having reserves prevents an emergency from forcing you to sell an investment at an unfavourable time.",
    },
    explanation: {
      es: "Responde con lo que realmente tienes. No hay una opción correcta, y declarar reservas que no existen puede llevarte a asumir más riesgo del adecuado.",
      en: "Answer with what you really have. There is no correct option, and declaring reserves that do not exist may lead you to take more risk than appropriate.",
    },
  },
  {
    id: "p-liquidez",
    kind: "personal",
    level: "beginner",
    text: {
      es: "¿Podrías necesitar este dinero de forma inesperada en los próximos meses?",
      en: "Could you need this money unexpectedly in the coming months?",
    },
    options: [
      {
        id: "a",
        text: { es: "Sí, es posible que lo necesite pronto.", en: "Yes, I may need it soon." },
        implication: { es: "Si puedes necesitarlo pronto, conviene priorizar productos que puedan venderse con rapidez y con poco riesgo de pérdida.", en: "If you may need it soon, prioritise products that can be sold quickly with little risk of loss." },
      },
      {
        id: "b",
        text: { es: "Es poco probable, pero no imposible.", en: "Unlikely, but not impossible." },
        implication: { es: "Cierta probabilidad de necesidad aconseja combinar una parte líquida con otra de más plazo.", en: "Some chance of need suggests combining a liquid part with a longer-term part." },
      },
      {
        id: "c",
        text: { es: "No, no lo necesitaré en mucho tiempo.", en: "No, I will not need it for a long time." },
        implication: { es: "Sin necesidad previsible de liquidez se pueden considerar productos con menor liquidez o más plazo, según lo demás.", en: "With no foreseeable liquidity need, less liquid or longer-term products may be considered, depending on the rest." },
      },
    ],
    why: {
      es: "La liquidez necesaria determina qué productos permiten recuperar el dinero sin pérdidas forzadas.",
      en: "The liquidity needed determines which products allow recovering the money without forced losses.",
    },
    explanation: {
      es: "Responder con sinceridad evita elegir productos de los que luego no podrías salir con facilidad. Aquí no hay respuesta preferible.",
      en: "Answering honestly avoids choosing products you could not easily exit later. There is no preferable answer here.",
    },
  },
  {
    id: "p-porcentaje-patrimonio",
    kind: "personal",
    level: "beginner",
    text: {
      es: "¿Qué parte de tu patrimonio total supondría esta inversión?",
      en: "What share of your total wealth would this investment represent?",
    },
    options: [
      {
        id: "a",
        text: { es: "Menos del 10 %.", en: "Less than 10%." },
        implication: { es: "Una parte pequeña del patrimonio reduce el impacto de una pérdida sobre tu situación global.", en: "A small part of wealth reduces the impact of a loss on your overall situation." },
      },
      {
        id: "b",
        text: { es: "Entre el 10 % y el 50 %.", en: "Between 10% and 50%." },
        implication: { es: "Una parte relevante exige comprobar que una caída no comprometería tus planes.", en: "A significant part requires checking that a fall would not compromise your plans." },
      },
      {
        id: "c",
        text: { es: "Más del 50 %.", en: "More than 50%." },
        implication: { es: "Una proporción muy alta concentra el riesgo y suele aconsejar productos más prudentes.", en: "A very high proportion concentrates risk and usually suggests more prudent products." },
      },
    ],
    why: {
      es: "Cuanto mayor es el peso de la inversión en tu patrimonio, más te afecta un resultado adverso.",
      en: "The larger the weight of the investment in your wealth, the more an adverse outcome affects you.",
    },
    explanation: {
      es: "No existe una respuesta correcta. Si dudas del porcentaje, es mejor estimarlo con realismo que redondearlo a favor de un perfil más arriesgado.",
      en: "There is no correct answer. If unsure about the percentage, it is better to estimate it realistically than to round it towards a riskier profile.",
    },
  },
  {
    id: "p-capacidad-perdida",
    kind: "personal",
    level: "beginner",
    text: {
      es: "¿Qué parte de esta inversión podrías perder sin que afecte a tu nivel de vida?",
      en: "What part of this investment could you lose without affecting your standard of living?",
    },
    options: [
      {
        id: "a",
        text: { es: "Ninguna: no puedo permitirme perder nada.", en: "None: I cannot afford to lose anything." },
        implication: { es: "Sin capacidad de pérdida, suelen ser más adecuados productos con riesgo muy bajo y capital estable.", en: "With no capacity for loss, very low-risk, stable-capital products are usually more suitable." },
      },
      {
        id: "b",
        text: { es: "Una parte pequeña, hasta una cuarta parte aproximadamente.", en: "A small part, up to about a quarter." },
        implication: { es: "Una capacidad limitada admite cierta oscilación, pero conviene que las posibles caídas queden dentro de ese margen.", en: "A limited capacity admits some fluctuation, but possible falls should stay within that margin." },
      },
      {
        id: "c",
        text: { es: "Una parte importante, más de la mitad.", en: "A large part, more than half." },
        implication: { es: "Una capacidad alta permite productos con más oscilación, siempre que no se necesite ese dinero a corto plazo.", en: "A high capacity allows products with more fluctuation, as long as the money is not needed in the short term." },
      },
    ],
    why: {
      es: "La capacidad de asumir pérdidas se evalúa de forma distinta a la actitud ante ellas; ambas deben ser coherentes.",
      en: "The capacity to bear losses is assessed differently from the attitude towards them; both should be consistent.",
    },
    explanation: {
      es: "Responde pensando en tus gastos y compromisos reales, no en lo que te gustaría poder asumir. Sobrestimarla puede llevarte a productos con más riesgo del que puedes sostener.",
      en: "Answer thinking about your actual expenses and commitments, not what you would like to be able to bear. Overestimating it may lead to products with more risk than you can sustain.",
    },
  },
  // NIVEL INTERMEDIO (intermediate)
  {
    id: "k-fondo-vs-accion",
    kind: "knowledge",
    level: "intermediate",
    text: {
      es: "¿Qué es un fondo de inversión frente a una acción?",
      en: "What is an investment fund compared with a share?",
    },
    options: [
      {
        id: "a",
        text: { es: "Un fondo es siempre una inversión sin riesgo gestionada por el banco.", en: "A fund is always a risk-free investment managed by the bank." },
        implication: { es: "No es correcta: el riesgo del fondo depende de lo que contiene; ninguno está exento por el mero hecho de ser fondo.", en: "Not correct: a fund's risk depends on what it holds; none is exempt simply for being a fund." },
      },
      {
        id: "b",
        text: { es: "Son exactamente lo mismo, solo cambia la comisión.", en: "They are exactly the same, only the fee differs." },
        implication: { es: "No es correcta: su estructura, riesgo y funcionamiento son distintos.", en: "Not correct: their structure, risk and operation differ." },
      },
      {
        id: "c",
        text: { es: "Un fondo reúne dinero de muchos partícipes y lo invierte en una cartera de activos; una acción es una pequeña parte del capital de una sola empresa.", en: "A fund pools money from many investors and invests it in a portfolio of assets; a share is a small part of the capital of a single company." },
        correct: true,
        implication: { es: "Acertada: el fondo ofrece una cartera ya diversificada con una gestora, y la acción depende de una sola empresa.", en: "Correct: the fund offers a ready-made diversified portfolio run by a manager, and the share depends on one company." },
      },
    ],
    why: {
      es: "Se comprueba que sabes qué compras exactamente y qué riesgo conlleva cada formato.",
      en: "It checks that you know exactly what you are buying and what risk each format carries.",
    },
    explanation: {
      es: "La respuesta correcta es la tercera. Un fondo suele diversificar, pero su riesgo concreto está en su política de inversión.",
      en: "The correct answer is the third one. A fund usually diversifies, but its specific risk lies in its investment policy.",
    },
  },
  {
    id: "k-comisiones-ter",
    kind: "knowledge",
    level: "intermediate",
    text: {
      es: "Un producto cobra una comisión anual pequeña, por ejemplo del 1,5 %. ¿Por qué importa a largo plazo?",
      en: "A product charges a small annual fee, for example 1.5%. Why does it matter in the long run?",
    },
    options: [
      {
        id: "a",
        text: { es: "No importa, porque un 1,5 % es demasiado pequeño para notarse.", en: "It does not matter, because 1.5% is too small to notice." },
        implication: { es: "No es correcta: durante muchos años esa diferencia puede suponer una parte importante del resultado.", en: "Not correct: over many years that gap can be a significant part of the result." },
      },
      {
        id: "b",
        text: { es: "Solo importa si el producto da pérdidas.", en: "It only matters if the product loses money." },
        implication: { es: "No es correcta: los costes se pagan tanto si hay ganancias como si hay pérdidas.", en: "Not correct: costs are paid whether there are gains or losses." },
      },
      {
        id: "c",
        text: { es: "Se cobra cada año y, acumulada, reduce de forma notable el resultado final, incluso si parece pequeña.", en: "It is charged every year and, accumulated, noticeably reduces the final outcome, even if it seems small." },
        correct: true,
        implication: { es: "Acertada: al repetirse y restar sobre un capital que podría crecer, el efecto compuesto de los costes es relevante.", en: "Correct: because it repeats and subtracts from capital that could grow, the compounding effect of costs is significant." },
      },
    ],
    why: {
      es: "Los costes y gastos deben conocerse antes de contratar, y a menudo se subestiman.",
      en: "Costs and charges must be known before contracting, and they are often underestimated.",
    },
    explanation: {
      es: "La respuesta correcta es la tercera. Revisa siempre los gastos corrientes anuales (como el TER) y compáralos entre productos similares.",
      en: "The correct answer is the third one. Always review ongoing annual charges (such as the TER) and compare them across similar products.",
    },
  },
  {
    id: "k-sri-no-sin-riesgo",
    kind: "knowledge",
    level: "intermediate",
    text: {
      es: "Un producto aparece con un indicador de riesgo de 1 sobre 7. ¿Qué significa?",
      en: "A product shows a risk indicator of 1 out of 7. What does it mean?",
    },
    options: [
      {
        id: "a",
        text: { es: "Que está garantizado y no puedes perder dinero.", en: "That it is guaranteed and you cannot lose money." },
        implication: { es: "No es correcta: el indicador no equivale a una garantía.", en: "Not correct: the indicator is not a guarantee." },
      },
      {
        id: "b",
        text: { es: "Que es el producto más rentable.", en: "That it is the most profitable product." },
        implication: { es: "No es correcta: el indicador mide riesgo, no rentabilidad.", en: "Not correct: the indicator measures risk, not return." },
      },
      {
        id: "c",
        text: { es: "Que pertenece a la clase de menor riesgo, pero no que carezca de riesgo.", en: "That it belongs to the lowest risk class, but not that it has no risk." },
        correct: true,
        implication: { es: "Acertada: un 1 indica riesgo bajo según la metodología, no ausencia de riesgo ni garantía de capital.", en: "Correct: a 1 indicates low risk under the methodology, not absence of risk or a capital guarantee." },
      },
    ],
    why: {
      es: "Se verifica que sabes leer el indicador sin darle un significado que no tiene.",
      en: "It verifies that you read the indicator without giving it a meaning it does not have.",
    },
    explanation: {
      es: "La respuesta correcta es la tercera. Incluso la clase 1 puede perder valor, por ejemplo por inflación o por el emisor.",
      en: "The correct answer is the third one. Even class 1 can lose value, for instance through inflation or the issuer.",
    },
  },
  {
    id: "k-riesgo-divisa",
    kind: "knowledge",
    level: "intermediate",
    text: {
      es: "Inviertes desde la zona euro en un activo que cotiza en otra moneda. ¿Qué riesgo adicional asumes?",
      en: "You invest from the euro area in an asset that trades in another currency. What additional risk do you take?",
    },
    options: [
      {
        id: "a",
        text: { es: "Ninguno, porque el cambio siempre se compensa solo.", en: "None, because the exchange rate always balances out by itself." },
        implication: { es: "No es correcta: no existe esa compensación automática.", en: "Not correct: there is no such automatic offset." },
      },
      {
        id: "b",
        text: { es: "El riesgo de divisa: si esa moneda se deprecia frente al euro, tu resultado en euros puede empeorar.", en: "Currency risk: if that currency weakens against the euro, your result in euros may worsen." },
        correct: true,
        implication: { es: "Acertada: el tipo de cambio puede mejorar o empeorar el resultado aunque el activo no cambie de precio.", en: "Correct: the exchange rate can improve or worsen the result even if the asset's price does not change." },
      },
      {
        id: "c",
        text: { es: "Solo el de inflación en la zona euro.", en: "Only inflation in the euro area." },
        implication: { es: "No es correcta: la inflación es otro factor distinto del de divisa.", en: "Not correct: inflation is a different factor from currency." },
      },
    ],
    why: {
      es: "El riesgo de divisa suele pasar desapercibido y puede alterar el resultado de la inversión.",
      en: "Currency risk often goes unnoticed and can alter an investment's result.",
    },
    explanation: {
      es: "La respuesta correcta es la segunda. Algunos productos cubren la divisa y otros no; conviene comprobarlo en su documentación.",
      en: "The correct answer is the second one. Some products hedge the currency and others do not; check their documentation.",
    },
  },
  {
    id: "k-tipos-interes-bonos",
    kind: "knowledge",
    level: "intermediate",
    text: {
      es: "Si los tipos de interés de mercado suben, ¿qué suele ocurrir con el precio de un bono ya emitido con un cupón fijo menor?",
      en: "If market interest rates rise, what usually happens to the price of an already issued bond with a lower fixed coupon?",
    },
    options: [
      {
        id: "a",
        text: { es: "Su precio sube siempre.", en: "Its price always rises." },
        implication: { es: "No es correcta: ocurre lo contrario cuando suben los tipos.", en: "Not correct: the opposite happens when rates rise." },
      },
      {
        id: "b",
        text: { es: "Su precio tiende a bajar.", en: "Its price tends to fall." },
        correct: true,
        implication: { es: "Acertada: los bonos nuevos ofrecen más interés, así que el antiguo pierde atractivo y su precio baja.", en: "Correct: new bonds pay more interest, so the older one becomes less attractive and its price falls." },
      },
      {
        id: "c",
        text: { es: "No cambia, porque el cupón es fijo.", en: "It does not change, because the coupon is fixed." },
        implication: { es: "No es correcta: el cupón es fijo, pero el precio de mercado sí varía.", en: "Not correct: the coupon is fixed, but the market price does vary." },
      },
    ],
    why: {
      es: "Mide si entiendes que la renta fija también tiene riesgo de precio antes del vencimiento.",
      en: "It measures whether you understand that fixed income also carries price risk before maturity.",
    },
    explanation: {
      es: "La respuesta correcta es la segunda: precios y tipos se mueven en sentido contrario, y con más intensidad cuanto mayor es el plazo.",
      en: "The correct answer is the second one: prices and rates move in opposite directions, more strongly the longer the term.",
    },
  },
  {
    id: "k-etf-vs-fondo",
    kind: "knowledge",
    level: "intermediate",
    text: {
      es: "¿Qué diferencia hay entre un ETF y un fondo de inversión tradicional?",
      en: "What is the difference between an ETF and a traditional investment fund?",
    },
    options: [
      {
        id: "a",
        text: { es: "Un ETF es un fondo que cotiza en bolsa y se compra y vende durante la sesión a precio de mercado (con costes de intermediación y horquilla); un fondo tradicional se suscribe y reembolsa a su valor liquidativo, calculado una vez al día. Muchos ETF replican un índice con costes corrientes bajos, pero no todos.", en: "An ETF is a fund that trades on an exchange and is bought and sold during the session at market price (with brokerage costs and bid-ask spread); a traditional fund is subscribed and redeemed at its net asset value, calculated once a day. Many ETFs track an index with low ongoing costs, but not all of them." },
        correct: true,
        implication: { es: "Acertada: describe la diferencia de funcionamiento (cotización frente a valor liquidativo) sin afirmar que uno sea mejor que otro.", en: "Correct: it describes the difference in operation (market listing versus net asset value) without claiming that one is better than the other." },
      },
      {
        id: "b",
        text: { es: "Un ETF está garantizado y no tiene riesgo de mercado.", en: "An ETF is guaranteed and has no market risk." },
        implication: { es: "No es correcta: el valor de un ETF sube y baja con los activos que contiene y no hay garantía de capital.", en: "Not correct: an ETF's value rises and falls with the assets it holds and there is no capital guarantee." },
      },
      {
        id: "c",
        text: { es: "Un ETF no tiene ningún coste.", en: "An ETF has no costs at all." },
        implication: { es: "No es correcta: tiene gastos corrientes y, al operar en bolsa, costes de intermediación y diferencia entre precio de compra y de venta.", en: "Not correct: it has ongoing charges and, as it trades on an exchange, brokerage costs and a gap between buying and selling prices." },
      },
    ],
    why: {
      es: "Se comprueba que entiendes cómo se contrata cada formato y qué costes y riesgos lleva, sin asumir que uno sea mejor.",
      en: "It checks that you understand how each format is traded and which costs and risks it carries, without assuming one is better.",
    },
    explanation: {
      es: "La respuesta correcta es la primera. Ambos son vehículos de inversión colectiva cuyo riesgo depende de lo que contienen; cambian la forma de comprarlos y venderlos, y los costes. Compara siempre su documentación.",
      en: "The correct answer is the first one. Both are collective investment vehicles whose risk depends on what they hold; what changes is how they are bought and sold, and the costs. Always compare their documentation.",
    },
  },
  {
    id: "p-deudas",
    kind: "personal",
    level: "intermediate",
    text: {
      es: "¿Qué carga suponen tus deudas y compromisos financieros (hipoteca, préstamos) sobre tus ingresos mensuales?",
      en: "How heavy are your debts and financial commitments (mortgage, loans) relative to your monthly income?",
    },
    options: [
      {
        id: "a",
        text: { es: "Ninguna o muy baja.", en: "None or very low." },
        implication: { es: "Con poca carga financiera hay más margen para asumir cierta oscilación en tus inversiones.", en: "With little financial burden there is more room to accept some fluctuation in your investments." },
      },
      {
        id: "b",
        text: { es: "Moderada: una parte relevante, pero manejable.", en: "Moderate: a relevant part, but manageable." },
        implication: { es: "Con una carga moderada conviene dejar margen de seguridad por si cambian tus ingresos.", en: "With a moderate burden, leave a safety margin in case your income changes." },
      },
      {
        id: "c",
        text: { es: "Alta: me condiciona mucho cada mes.", en: "High: it constrains me heavily each month." },
        implication: { es: "Con una carga alta suelen ser más adecuados productos con poca oscilación y liquidez elevada.", en: "With a high burden, products with little fluctuation and high liquidity are usually more suitable." },
      },
    ],
    why: {
      es: "Las deudas reducen tu margen para soportar pérdidas o inmovilizar dinero.",
      en: "Debts reduce your room to bear losses or tie up money.",
    },
    explanation: {
      es: "Contesta con exactitud: no es una prueba que se apruebe. Minimizar tus compromisos puede dar un resultado que no se ajusta a lo que puedes sostener.",
      en: "Answer accurately: it is not a test to pass. Understating your commitments may give a result that does not fit what you can sustain.",
    },
  },
  {
    id: "p-tolerancia",
    kind: "personal",
    level: "intermediate",
    text: {
      es: "Si tu inversión bajara un 20 % en unos meses, ¿cómo te sentirías y qué harías probablemente?",
      en: "If your investment fell 20% in a few months, how would you feel and what would you probably do?",
    },
    options: [
      {
        id: "a",
        text: { es: "No lo soportaría: querría salir para no perder más.", en: "I could not bear it: I would want out to avoid losing more." },
        implication: { es: "Indica baja tolerancia a las pérdidas; suelen encajar productos con menos oscilación. Vender es siempre una decisión tuya.", en: "Indicates low loss tolerance; products with less fluctuation usually fit. Selling is always your decision." },
      },
      {
        id: "b",
        text: { es: "Me preocuparía, pero esperaría y revisaría mi objetivo.", en: "I would worry, but I would wait and review my goal." },
        implication: { es: "Indica tolerancia moderada: aceptas oscilaciones si sigues viendo coherente tu objetivo y plazo.", en: "Indicates moderate tolerance: you accept swings if your goal and term still make sense." },
      },
      {
        id: "c",
        text: { es: "Lo vería como parte normal de invertir y no cambiaría nada.", en: "I would see it as a normal part of investing and change nothing." },
        implication: { es: "Indica alta tolerancia declarada; conviene comprobar que además tu situación financiera permite asumir esa pérdida.", en: "Indicates high stated tolerance; also check that your finances can actually absorb that loss." },
      },
    ],
    why: {
      es: "Mide tu capacidad y actitud ante las pérdidas para no asignarte productos cuya oscilación no podrías sostener.",
      en: "It gauges your capacity and attitude to losses so you are not matched with products whose swings you could not sustain.",
    },
    explanation: {
      es: "Tampoco hay respuesta correcta: cada opción describe un perfil distinto y todas son legítimas. Lo importante es la sinceridad; esta práctica no puntúa tu respuesta.",
      en: "There is no correct answer either: each option describes a different profile and all are legitimate. Honesty is what matters; this practice does not score your answer.",
    },
  },
  {
    id: "p-experiencia-frecuencia",
    kind: "personal",
    level: "intermediate",
    text: {
      es: "¿Con qué frecuencia has operado con productos de inversión en los últimos años?",
      en: "How often have you traded investment products in recent years?",
    },
    options: [
      {
        id: "a",
        text: { es: "Nunca o casi nunca.", en: "Never or almost never." },
        implication: { es: "Sin experiencia previa, suelen ser más adecuados productos sencillos y bien explicados.", en: "Without previous experience, simple, well-explained products are usually more suitable." },
      },
      {
        id: "b",
        text: { es: "De vez en cuando, unas pocas veces al año.", en: "Now and then, a few times a year." },
        implication: { es: "Una experiencia ocasional permite productos de complejidad moderada con la información adecuada.", en: "Occasional experience allows products of moderate complexity with the right information." },
      },
      {
        id: "c",
        text: { es: "Con frecuencia, varias veces al mes.", en: "Frequently, several times a month." },
        implication: { es: "Una experiencia habitual puede permitir más variedad, siempre que comprendas cada producto.", en: "Regular experience may allow more variety, as long as you understand each product." },
      },
    ],
    why: {
      es: "La experiencia previa indica con qué productos estás familiarizado, y se mide para valorar su conveniencia.",
      en: "Previous experience shows which products you are familiar with, and is measured to assess appropriateness.",
    },
    explanation: {
      es: "Responde con sinceridad: no hay una opción mejor. Exagerar la experiencia puede abrirte la puerta a productos que no entiendas del todo.",
      en: "Answer sincerely: no option is better. Exaggerating experience may open the door to products you do not fully understand.",
    },
  },
  {
    id: "p-formacion",
    kind: "personal",
    level: "intermediate",
    text: {
      es: "¿Tienes formación o experiencia profesional relacionada con las finanzas o la inversión?",
      en: "Do you have training or professional experience related to finance or investment?",
    },
    options: [
      {
        id: "a",
        text: { es: "No, ninguna.", en: "No, none." },
        implication: { es: "Sin formación específica conviene apoyarse en productos y explicaciones sencillas.", en: "Without specific training it is best to rely on simple products and explanations." },
      },
      {
        id: "b",
        text: { es: "Algo, por estudios o por mi cuenta.", en: "Some, through studies or on my own." },
        implication: { es: "Un conocimiento básico permite entender productos habituales, aunque no los más complejos.", en: "Basic knowledge allows understanding common products, though not the most complex ones." },
      },
      {
        id: "c",
        text: { es: "Sí, estudios o trabajo en el sector financiero.", en: "Yes, studies or work in the financial sector." },
        implication: { es: "Una formación específica puede permitir considerar productos más complejos, si coincide con tu capacidad y objetivos.", en: "Specific training may allow more complex products to be considered, if it matches your capacity and goals." },
      },
    ],
    why: {
      es: "Se tiene en cuenta tu bagaje para ajustar el nivel de explicación y los productos que se te muestran.",
      en: "Your background is taken into account to adjust the level of explanation and the products shown to you.",
    },
    explanation: {
      es: "Piénsalo como un punto de partida y no como una nota. Indicar más formación de la que tienes no te protege; solo recorta explicaciones que podrías necesitar.",
      en: "Think of it as a starting point, not a grade. Stating more training than you have does not protect you; it only cuts explanations you may need.",
    },
  },
  // NIVEL AVANZADO (advanced)
  {
    id: "k-sri-componentes",
    kind: "knowledge",
    level: "advanced",
    text: {
      es: "¿Qué aspectos combina el indicador de riesgo y dónde se encuentra?",
      en: "What aspects does the risk indicator combine and where is it found?",
    },
    options: [
      {
        id: "a",
        text: { es: "Solo mide el riesgo de que el producto no se pueda vender.", en: "It only measures the risk that the product cannot be sold." },
        implication: { es: "No es correcta: la liquidez se trata aparte en el documento.", en: "Not correct: liquidity is dealt with separately in the document." },
      },
      {
        id: "b",
        text: { es: "Se calcula libremente por cada vendedor y no figura en ningún documento oficial.", en: "It is freely calculated by each seller and appears in no official document." },
        implication: { es: "No es correcta: sigue una metodología normalizada y se incluye en el documento.", en: "Not correct: it follows a standardised methodology and is included in the document." },
      },
      {
        id: "c",
        text: { es: "Combina el riesgo de mercado y el de crédito, y figura en el documento de datos fundamentales del producto.", en: "It combines market risk and credit risk, and appears in the product's key information document." },
        correct: true,
        implication: { es: "Acertada: refleja la posible variación de valor y la posibilidad de que el emisor no pague, en un documento estandarizado.", en: "Correct: it reflects the potential change in value and the chance that the issuer does not pay, in a standardised document." },
      },
    ],
    why: {
      es: "Interpretar el documento de datos fundamentales es parte de decidir con información.",
      en: "Interpreting the key information document is part of deciding with information.",
    },
    explanation: {
      es: "La respuesta correcta es la tercera. Léelo antes de contratar y revisa también el plazo recomendado y los costes.",
      en: "The correct answer is the third one. Read it before contracting and also check the recommended holding period and costs.",
    },
  },
  {
    id: "k-apalancamiento",
    kind: "knowledge",
    level: "advanced",
    text: {
      es: "¿Qué implica operar con apalancamiento?",
      en: "What does trading with leverage imply?",
    },
    options: [
      {
        id: "a",
        text: { es: "Que solo se amplifican las ganancias.", en: "That only gains are magnified." },
        implication: { es: "No es correcta: las pérdidas también se amplifican.", en: "Not correct: losses are magnified too." },
      },
      {
        id: "b",
        text: { es: "Que se controla una posición mayor que el capital aportado, lo que amplifica tanto las ganancias como las pérdidas, que pueden superar lo invertido.", en: "That you control a position larger than the capital contributed, which magnifies both gains and losses, and losses can exceed what was invested." },
        correct: true,
        implication: { es: "Acertada: el efecto multiplicador funciona en ambos sentidos y exige vigilar márgenes.", en: "Correct: the multiplier works both ways and requires monitoring margins." },
      },
      {
        id: "c",
        text: { es: "Que el riesgo disminuye porque se utiliza dinero prestado.", en: "That risk decreases because borrowed money is used." },
        implication: { es: "No es correcta: usar financiación aumenta el riesgo, no lo reduce.", en: "Not correct: using financing increases risk, it does not reduce it." },
      },
    ],
    why: {
      es: "Los productos apalancados o derivados se consideran complejos, y se pregunta si entiendes cómo funcionan.",
      en: "Leveraged or derivative products are considered complex, and it is asked whether you understand how they work.",
    },
    explanation: {
      es: "La respuesta correcta es la segunda. Por su complejidad, este tipo de productos exige conocimientos y capacidad de asumir pérdidas elevadas.",
      en: "The correct answer is the second one. Due to their complexity, these products require knowledge and the capacity to bear large losses.",
    },
  },
  {
    id: "k-liquidez-complejos",
    kind: "knowledge",
    level: "advanced",
    text: {
      es: "¿Qué debes tener en cuenta sobre la liquidez y los productos complejos antes de contratar?",
      en: "What should you consider about liquidity and complex products before contracting?",
    },
    options: [
      {
        id: "a",
        text: { es: "Que cualquier producto puede venderse siempre al precio de compra.", en: "That any product can always be sold at its purchase price." },
        implication: { es: "No es correcta: la venta depende de que haya compradores y el precio puede ser menor que el de compra.", en: "Not correct: selling depends on there being buyers and the price may be lower than the purchase price." },
      },
      {
        id: "b",
        text: { es: "Que un producto con poca liquidez puede no venderse cuando lo necesitas o solo con descuento o penalización, y que los productos complejos (por ejemplo, derivados o productos estructurados, de estructura difícil de entender o valorar) exigen comprobar que entiendes sus riesgos antes de contratarlos; la entidad debe evaluar la conveniencia y advertir si no lo son.", en: "That a product with little liquidity may not be sold when you need it, or only at a discount or with a penalty, and that complex products (for example, derivatives or structured products, with structures that are hard to understand or value) require checking that you understand their risks before contracting; the institution must assess appropriateness and warn if they are not appropriate." },
        correct: true,
        implication: { es: "Acertada: la liquidez limita cuándo y a qué precio puedes salir, y la complejidad exige comprender los riesgos; la advertencia de conveniencia no sustituye tu propia comprobación.", en: "Correct: liquidity limits when and at what price you can exit, and complexity requires understanding the risks; the appropriateness warning does not replace your own check." },
      },
      {
        id: "c",
        text: { es: "Que complejo significa más rentable.", en: "That complex means more profitable." },
        implication: { es: "No es correcta: la complejidad no implica mayor rentabilidad; suele implicar más dificultad para valorar los riesgos y costes.", en: "Not correct: complexity does not imply higher returns; it usually means more difficulty in assessing risks and costs." },
      },
    ],
    why: {
      es: "Se comprueba que sabes que no todo producto puede venderse al instante y que los productos complejos requieren una comprobación especial de conveniencia.",
      en: "It checks that you know not every product can be sold instantly and that complex products require a special appropriateness check.",
    },
    explanation: {
      es: "La respuesta correcta es la segunda. Antes de contratar, revisa cuánto tardarías en recuperar el dinero y a qué coste, y no contrates lo que no entiendas aunque no haya advertencia.",
      en: "The correct answer is the second one. Before contracting, check how long it would take to recover your money and at what cost, and do not contract what you do not understand even if no warning appears.",
    },
  },
  {
    id: "p-experiencia-productos",
    kind: "personal",
    level: "advanced",
    text: {
      es: "¿Con qué tipos de producto has operado alguna vez?",
      en: "Which types of product have you ever traded?",
    },
    options: [
      {
        id: "a",
        text: { es: "Solo depósitos o cuentas, sin productos de inversión.", en: "Only deposits or accounts, no investment products." },
        implication: { es: "Sin experiencia en inversión, suelen encajar productos sencillos y de riesgo bajo.", en: "With no investment experience, simple low-risk products usually fit." },
      },
      {
        id: "b",
        text: { es: "Fondos de inversión, renta fija o acciones cotizadas.", en: "Investment funds, fixed income or listed shares." },
        implication: { es: "Esa experiencia es con productos de riesgo y complejidad intermedios, que exigen entender sus costes y riesgos.", en: "This experience is with products of intermediate risk and complexity, which require understanding their costs and risks." },
      },
      {
        id: "c",
        text: { es: "Derivados u otros productos complejos.", en: "Derivatives or other complex products." },
        implication: { es: "Haber operado con productos complejos solo cuenta si comprendes bien sus riesgos; por eso conviene describir con exactitud lo que has hecho.", en: "Having traded complex products only counts if you clearly understand their risks, so describe exactly what you have done." },
      },
    ],
    why: {
      es: "La experiencia con cada tipo de producto se valora por separado, porque saber de uno no implica entender otro.",
      en: "Experience with each product type is assessed separately, because knowing one does not mean understanding another.",
    },
    explanation: {
      es: "No hay respuesta preferible: describe lo que has hecho. Declarar productos que no conoces puede llevar a que se te presenten otros que no entiendes.",
      en: "There is no preferable answer: describe what you have done. Declaring products you do not know may lead to being offered others you do not understand.",
    },
  },
  {
    id: "p-volumen",
    kind: "personal",
    level: "advanced",
    text: {
      es: "¿Qué volumen medio has movido en tus operaciones de inversión anteriores?",
      en: "What average amount did you move in your previous investment transactions?",
    },
    options: [
      {
        id: "a",
        text: { es: "Pequeño: operaciones puntuales de pocos cientos de euros.", en: "Small: occasional transactions of a few hundred euros." },
        implication: { es: "Volúmenes pequeños indican poca exposición previa; suelen encajar importes moderados y productos sencillos.", en: "Small volumes indicate little previous exposure; moderate amounts and simple products usually fit." },
      },
      {
        id: "b",
        text: { es: "Medio: varios miles de euros por operación.", en: "Medium: several thousand euros per transaction." },
        implication: { es: "Volúmenes medios muestran familiaridad con importes relevantes, aunque no con cualquier producto.", en: "Medium volumes show familiarity with relevant amounts, though not with every product." },
      },
      {
        id: "c",
        text: { es: "Alto: decenas de miles de euros o más.", en: "High: tens of thousands of euros or more." },
        implication: { es: "Volúmenes altos indican experiencia con importes elevados; no sustituyen la comprensión de cada producto.", en: "High volumes indicate experience with large amounts; they do not replace understanding each product." },
      },
    ],
    why: {
      es: "El importe habitual forma parte del historial de experiencia que se contrasta con los productos ofrecidos.",
      en: "The usual amount is part of the experience record that is compared with the products offered.",
    },
    explanation: {
      es: "Contesta con datos reales: no hay buena o mala respuesta. Un volumen inflado puede conducir a productos que no corresponden a tu experiencia verdadera.",
      en: "Answer with real data: there is no good or bad answer. An inflated volume may lead to products that do not match your true experience.",
    },
  },
];

/*
 * PENDIENTE DE CONTRASTAR CON LA CNMV
 *
 * Estas preguntas son material educativo DEMO de redacción propia. Antes de usarlas fuera de la demo, el equipo de
 * contenido debe verificar con fuentes oficiales (CNMV, guías del inversor, normativa MiFID II / PRIIPs, Fondo de
 * Garantía de Depósitos) las afirmaciones siguientes:
 *  - Indicador resumido de riesgo (SRI, escala 1-7): definición, cálculo, que combina riesgo de mercado y de crédito,
 *    que la clase 1 no significa «sin riesgo» y su ubicación en el documento de datos fundamentales (KID) de los PRIIPs.
 *  - Fondo de Garantía de Depósitos: límite de 100.000 euros por titular y entidad, tipos de producto cubiertos
 *    y exclusión de las pérdidas de valor de fondos y acciones. Cobertura separada de valores e instrumentos
 *    financieros confiados a la entidad (hasta 100.000 euros): si la entidad es una empresa de servicios de inversión
 *    y no una entidad de crédito, la cobertura corresponde a otro fondo (FOGAIN); contrastar condiciones y supuestos.
 *  - ETF frente a fondo tradicional: funcionamiento (cotización en bolsa frente a valor liquidativo diario), costes
 *    (gastos corrientes, intermediación, horquilla) y réplica de índices (no todos los ETF replican un índice).
 *  - Liquidez y productos complejos: qué se considera complejo (derivados, productos estructurados), advertencias de
 *    conveniencia que debe hacer la entidad y limitaciones para vender sin descuento o penalización.
 *  - Clasificación de productos complejos y no complejos (apalancamiento, derivados) y su tratamiento en MiFID II.
 *  - Diferencia entre test de conveniencia (conocimientos y experiencia) y de idoneidad (objetivos, situación financiera
 *    y tolerancia al riesgo), y qué datos recoge cada uno.
 *  - Las afirmaciones sobre tipos de interés y precio de los bonos, riesgo de divisa, comisiones, gastos corrientes
 *    (TER) y su efecto compuesto, y la distinción entre fondo y acción.
 *  - Cualquier cifra o umbral usado en las opciones (3 a 6 meses de gastos, porcentajes de patrimonio, volúmenes de
 *    operaciones, el 1,5 % de comisión del ejemplo y los plazos de 2 y 5 años) es ilustrativo y no procede de una norma.
 */
