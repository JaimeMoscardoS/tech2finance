/**
 * PREGUNTAS DE PRÁCTICA DEL TEST MiFID (contenido educativo, no evaluación real).
 *
 * Cómo rellenar este archivo sin tocar la interfaz: añade objetos al array `mifidQuestions`.
 * La UI (`frontend/src/views/learn/`) y la puntuación (`frontend/src/education-mifid.ts`) leen solo este formato.
 *
 * Formato de cada pregunta (`MifidQuestion`):
 *  - id: texto único y estable (p. ej. "k-diversificacion").
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
 * Las tres preguntas de abajo son EJEMPLOS DEMO redactados para la demo; no proceden de ningún test real
 * de ninguna entidad. Deben ser revisadas por el equipo de contenido antes de ampliarlas.
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
  es: "Práctica educativa con preguntas de ejemplo (DEMO). No es el test real, no evalúa tu conveniencia o idoneidad y no genera ninguna recomendación.",
  en: "Educational practice with sample (DEMO) questions. It is not the real test, does not assess your suitability or appropriateness and produces no recommendation.",
};

export const mifidQuestions: readonly MifidQuestion[] = [
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
];
