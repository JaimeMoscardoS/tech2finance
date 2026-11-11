import { CheckCircle2, CircleHelp, RotateCcw, XCircle } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { mifidQuestions, MIFID_DISCLAIMER, MIFID_VERIFICATION_NOTICE, type MifidQuestion } from "../../../../shared/mock/mifid-questions.ts";
import { DemoBadge, Section, StatusChip } from "../../components/dashboard/index.ts";
import type { Lang } from "../../components/dashboard/copy.ts";
import { isCorrect, questionsForLevel, scoreAnswers, type MifidAnswers } from "../../education-mifid.ts";
import type { Level } from "../../types/level.ts";
import "./learn.css";

const tx = {
  es: {
    title: "Test MiFID (práctica)", intro: "Practica el tipo de preguntas que te harían antes de contratar un producto de inversión.",
    question: (i: number, n: number) => `Pregunta ${i} de ${n}`, knowledge: "Conocimiento", personal: "Situación personal",
    check: "Comprobar respuesta", next: "Siguiente", finish: "Ver resultado", restart: "Repetir práctica", why: "¿Por qué se pregunta?",
    correct: "Correcta", incorrect: "Incorrecta", right: "Respuesta correcta", yours: "Tu respuesta",
    personalNote: "No hay respuesta correcta. Responde con sinceridad: lo que importa es que refleje tu situación. Esto es lo que implica cada opción:",
    explanation: "Explicación", chooseFirst: "Elige una opción para poder comprobarla.",
    result: "Resultado de la práctica", score: (c: number, t: number) => `${c} de ${t} preguntas de conocimiento acertadas`,
    noScore: "Esta práctica solo tiene preguntas personales, que no puntúan.", personalDone: (n: number) => `${n} pregunta(s) personal(es) respondida(s): no puntúan, solo informan de qué implica cada respuesta.`,
    scoreNote: "La puntuación es solo orientativa y educativa; no mide tu perfil ni genera ninguna recomendación.",
    empty: "No hay preguntas disponibles para este nivel.", sample: "Preguntas de ejemplo",
  },
  en: {
    title: "MiFID test (practice)", intro: "Practise the kind of questions you would be asked before taking out an investment product.",
    question: (i: number, n: number) => `Question ${i} of ${n}`, knowledge: "Knowledge", personal: "Personal situation",
    check: "Check answer", next: "Next", finish: "See result", restart: "Practise again", why: "Why is this asked?",
    correct: "Correct", incorrect: "Incorrect", right: "Correct answer", yours: "Your answer",
    personalNote: "There is no correct answer. Answer honestly: what matters is that it reflects your situation. This is what each option implies:",
    explanation: "Explanation", chooseFirst: "Pick an option to be able to check it.",
    result: "Practice result", score: (c: number, t: number) => `${c} of ${t} knowledge questions answered correctly`,
    noScore: "This practice only has personal questions, which are not scored.", personalDone: (n: number) => `${n} personal question(s) answered: they are not scored, they only show what each answer implies.`,
    scoreNote: "The score is indicative and educational only; it does not measure your profile or produce any recommendation.",
    empty: "No questions available for this level.", sample: "Sample questions",
  },
} as const;

export default function MifidPractice({ language, level }: { language: Lang; level: Level }) {
  const t = tx[language];
  const questions = useMemo(() => questionsForLevel(mifidQuestions, level), [level]);
  const [answers, setAnswers] = useState<MifidAnswers>({});
  const [checked, setChecked] = useState<Readonly<Record<string, boolean>>>({});
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const uid = useId();
  const resultRef = useRef<HTMLHeadingElement>(null);
  const legendRef = useRef<HTMLLegendElement>(null);
  // El botón pulsado desaparece o cambia de pregunta: el foco pasa a la leyenda de la nueva pregunta o al encabezado del resultado,
  // para que teclado y lector de pantalla no pierdan la posición. Solo se pide tras una acción del usuario (no al montar).
  const [focusRequest, setFocusRequest] = useState(0);
  useEffect(() => {
    if (focusRequest === 0) return;
    (done ? resultRef.current : legendRef.current)?.focus();
  }, [focusRequest, done]);

  const reset = () => { setAnswers({}); setChecked({}); setIndex(0); setDone(false); setFocusRequest((n) => n + 1); };
  const advance = (last: boolean) => { if (last) setDone(true); else setIndex(index + 1); setFocusRequest((n) => n + 1); };
  const header = (
    <>
      <p className="edu-disclaimer" role="note">{MIFID_DISCLAIMER[language]}</p>
      <p className="edu-disclaimer" role="note">{MIFID_VERIFICATION_NOTICE[language]}</p>
    </>
  );

  if (!questions.length) {
    return <Section title={t.title} description={t.intro} demo language={language}><p className="dash-state">{t.empty}</p></Section>;
  }

  if (done) {
    const score = scoreAnswers(questions, answers);
    return (
      <Section title={t.title} demo language={language}>
        {header}
        <div className="dash-card edu-result">
          <h3 className="edu-result__title" ref={resultRef} tabIndex={-1}>{t.result}</h3>
          {score.percent == null ? <p>{t.noScore}</p> : (
            <>
              <p className="edu-result__score">{t.score(score.correct, score.scorable)}</p>
              <p className="edu-result__pct">{Math.round(score.percent)} %</p>
            </>
          )}
          {score.personalAnswered > 0 && <p>{t.personalDone(score.personalAnswered)}</p>}
          <p className="edu-note">{t.scoreNote}</p>
          <button type="button" className="edu-btn" onClick={reset}><RotateCcw size={16} aria-hidden="true" /> {t.restart}</button>
        </div>
      </Section>
    );
  }

  const q: MifidQuestion = questions[index];
  const given = answers[q.id];
  const isChecked = !!checked[q.id];
  const verdict = isCorrect(q, given);
  const last = index === questions.length - 1;
  const groupName = `${uid}-${q.id}`;

  return (
    <Section title={t.title} description={t.intro} demo language={language}>
      {header}
      <article className="dash-card edu-quiz" aria-labelledby={`${groupName}-q`}>
        <div className="edu-quiz__meta">
          <StatusChip tone="info" icon={false}>{t.question(index + 1, questions.length)}</StatusChip>
          <StatusChip tone={q.kind === "knowledge" ? "neutral" : "warning"} icon={false}>{q.kind === "knowledge" ? t.knowledge : t.personal}</StatusChip>
          <DemoBadge language={language} label={t.sample} />
        </div>
        <fieldset className="edu-quiz__fieldset">
          <legend id={`${groupName}-q`} ref={legendRef} tabIndex={-1}>{q.text[language]}</legend>
          {q.options.map((o) => {
            const selected = given === o.id;
            const showRight = isChecked && q.kind === "knowledge" && o.correct;
            const showWrong = isChecked && q.kind === "knowledge" && selected && !o.correct;
            return (
              <label key={o.id} className={`edu-opt${selected ? " is-selected" : ""}${showRight ? " is-right" : ""}${showWrong ? " is-wrong" : ""}`}>
                <input type="radio" name={groupName} value={o.id} checked={selected} disabled={isChecked} onChange={() => setAnswers({ ...answers, [q.id]: o.id })} />
                <span className="edu-opt__text">
                  {o.text[language]}
                  {showRight && <strong className="edu-opt__tag"><CheckCircle2 size={14} aria-hidden="true" /> {t.right}</strong>}
                  {showWrong && <strong className="edu-opt__tag edu-opt__tag--bad"><XCircle size={14} aria-hidden="true" /> {t.yours}</strong>}
                  {isChecked && q.kind === "personal" && <small className="edu-opt__impl">{o.implication[language]}</small>}
                  {isChecked && q.kind === "knowledge" && (selected || o.correct) && <small className="edu-opt__impl">{o.implication[language]}</small>}
                </span>
              </label>
            );
          })}
        </fieldset>
        <details className="edu-why">
          <summary><CircleHelp size={16} aria-hidden="true" /> {t.why}</summary>
          <p>{q.why[language]}</p>
        </details>
        <div aria-live="polite" className="edu-feedback">
          {isChecked && (
            <>
              {q.kind === "knowledge" && verdict != null && (
                <StatusChip tone={verdict ? "positive" : "negative"}>{verdict ? t.correct : t.incorrect}</StatusChip>
              )}
              {q.kind === "personal" && <p><strong>{t.personalNote}</strong></p>}
              <p><strong>{t.explanation}:</strong> {q.explanation[language]}</p>
            </>
          )}
        </div>
        <div className="edu-actions">
          {!isChecked
            ? <button type="button" className="edu-btn" disabled={!given} onClick={() => setChecked({ ...checked, [q.id]: true })}>{t.check}</button>
            : <button type="button" className="edu-btn" onClick={() => advance(last)}>{last ? t.finish : t.next}</button>}
          {!isChecked && !given && <span className="edu-note">{t.chooseFirst}</span>}
        </div>
      </article>
    </Section>
  );
}
