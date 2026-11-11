import { test } from "node:test";
import { strict as assert } from "node:assert";
import { isCorrect, questionsForLevel, scoreAnswers, validateQuestions } from "./education-mifid.ts";
import { mifidQuestions, type MifidQuestion } from "../../shared/mock/mifid-questions.ts";

test("the sample questions are well formed", () => {
  assert.deepEqual(validateQuestions(mifidQuestions), []);
  assert.ok(mifidQuestions.some((q) => q.kind === "knowledge") && mifidQuestions.some((q) => q.kind === "personal"));
});

test("questions grow with the level", () => {
  const n = (l: "beginner" | "intermediate" | "advanced") => questionsForLevel(mifidQuestions, l).length;
  assert.ok(n("beginner") <= n("intermediate") && n("intermediate") <= n("advanced"));
  assert.equal(n("advanced"), mifidQuestions.length);
});

test("only knowledge questions score; personal ones never do", () => {
  const k = mifidQuestions.find((q) => q.kind === "knowledge")!;
  const p = mifidQuestions.find((q) => q.kind === "personal")!;
  assert.equal(isCorrect(p, p.options[0].id), null);
  const right = k.options.find((o) => o.correct)!.id, wrong = k.options.find((o) => !o.correct)!.id;
  assert.equal(isCorrect(k, right), true);
  assert.equal(isCorrect(k, wrong), false);
  const qs = [k, p];
  const s = scoreAnswers(qs, { [k.id]: right, [p.id]: p.options[0].id });
  assert.deepEqual([s.scorable, s.correct, s.percent, s.personalAnswered, s.complete], [1, 1, 100, 1, true]);
  assert.equal(scoreAnswers(qs, { [k.id]: wrong, [p.id]: p.options[2].id }).percent, 0);
});

test("incomplete, unknown answers and no knowledge questions", () => {
  const k = mifidQuestions.find((q) => q.kind === "knowledge")!;
  const s = scoreAnswers([k], { [k.id]: "zzz" });
  assert.equal(s.answered, 0);
  assert.equal(s.complete, false);
  const p = mifidQuestions.find((q) => q.kind === "personal")!;
  assert.equal(scoreAnswers([p], { [p.id]: p.options[0].id }).percent, null);
  assert.equal(scoreAnswers([], {}).complete, false);
});

test("validateQuestions flags malformed data", () => {
  const bad: MifidQuestion = {
    id: "x", kind: "personal", text: { es: "a", en: "a" }, why: { es: "a", en: "" }, explanation: { es: "a", en: "a" },
    options: [{ id: "a", correct: true, text: { es: "a", en: "a" }, implication: { es: "a", en: "a" } }],
  };
  assert.ok(validateQuestions([bad, bad]).length >= 4);
});
