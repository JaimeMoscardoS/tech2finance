import type { Level } from "./types/level.ts";
import type { MifidQuestion } from "../../shared/mock/mifid-questions.ts";

/** Respuestas del usuario: id de pregunta -> id de opción. */
export type MifidAnswers = Readonly<Record<string, string>>;

const RANK: Record<Level, number> = { beginner: 0, intermediate: 1, advanced: 2 };

/** Preguntas visibles en un nivel: las sin nivel y las cuyo nivel mínimo es menor o igual al actual. */
export function questionsForLevel(questions: readonly MifidQuestion[], level: Level): MifidQuestion[] {
  return questions.filter((q) => !q.level || RANK[q.level] <= RANK[level]);
}

/** true/false en conocimiento; null en personales (no hay respuesta correcta) o si no existe la opción. */
export function isCorrect(q: MifidQuestion, optionId: string | undefined): boolean | null {
  if (q.kind !== "knowledge" || optionId === undefined) return null;
  const opt = q.options.find((o) => o.id === optionId);
  return opt ? opt.correct === true : null;
}

export type MifidScore = {
  /** Preguntas de conocimiento visibles (las únicas que puntúan). */
  scorable: number;
  answeredScorable: number;
  correct: number;
  /** Preguntas personales visibles y respondidas (no puntúan). */
  personalAnswered: number;
  totalQuestions: number;
  answered: number;
  complete: boolean;
  /** Porcentaje de aciertos sobre las preguntas de conocimiento; null si no hay ninguna. */
  percent: number | null;
};

export function scoreAnswers(questions: readonly MifidQuestion[], answers: MifidAnswers): MifidScore {
  let scorable = 0, answeredScorable = 0, correct = 0, personalAnswered = 0, answered = 0;
  for (const q of questions) {
    const given = answers[q.id];
    const valid = given !== undefined && q.options.some((o) => o.id === given);
    if (valid) answered++;
    if (q.kind === "knowledge") {
      scorable++;
      if (valid) { answeredScorable++; if (isCorrect(q, given)) correct++; }
    } else if (valid) personalAnswered++;
  }
  return {
    scorable, answeredScorable, correct, personalAnswered, totalQuestions: questions.length, answered,
    complete: questions.length > 0 && answered === questions.length,
    percent: scorable === 0 ? null : (correct / scorable) * 100,
  };
}

/** Errores de formato de los datos (vacío = válido). Detecta fallos al rellenar mifid-questions.ts. */
export function validateQuestions(questions: readonly MifidQuestion[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const q of questions) {
    if (ids.has(q.id)) errors.push(`${q.id}: id duplicado`);
    ids.add(q.id);
    if (q.options.length < 2) errors.push(`${q.id}: necesita al menos 2 opciones`);
    if (new Set(q.options.map((o) => o.id)).size !== q.options.length) errors.push(`${q.id}: ids de opción duplicados`);
    const correct = q.options.filter((o) => o.correct).length;
    if (q.kind === "knowledge" && correct !== 1) errors.push(`${q.id}: una pregunta de conocimiento necesita exactamente una opción correcta`);
    if (q.kind === "personal" && correct !== 0) errors.push(`${q.id}: una pregunta personal no puede tener opción correcta`);
    for (const t of [q.text, q.why, q.explanation, ...q.options.flatMap((o) => [o.text, o.implication])]) {
      if (!t.es.trim() || !t.en.trim()) errors.push(`${q.id}: texto vacío en es o en`);
    }
  }
  return errors;
}
