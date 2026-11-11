import { useState } from "react";
import {
  scenarioReady,
  allocateCents,
  scenarioTemplate,
  validAllocation,
  type GoalAnswers,
} from "./goal-scenario";
import type { Language } from "./copy";
import "./goals.css";
export default function GoalsPanel({ language }: { language: Language }) {
  const es = language === "es";
  const [answers, setAnswers] = useState<GoalAnswers>({
    objective: "",
    horizon: "",
    liquidity: "",
    reserve: "",
    debt: "",
    loss: "",
  });
  const [amount, setAmount] = useState("");
  const [edited, setEdited] = useState(false);
  const [allocation, setAllocation] = useState(["30", "40", "30"]);
  const ready = scenarioReady(answers);
  const nums = allocation.map((x) => (x.trim() === "" ? NaN : Number(x)));
  const valid = validAllocation(nums);
  const cents = allocateCents(amount, nums);
  const set = (key: keyof GoalAnswers, value: string) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    setAllocation((scenarioTemplate(next) ?? [30, 40, 30]).map(String));
    setEdited(false);
  };
  const question = (
    key: keyof GoalAnswers,
    label: string,
    choices: [string, string][],
  ) => (
    <label>
      {label}
      <select value={answers[key]} onChange={(e) => set(key, e.target.value)}>
        <option value="">{es ? "Selecciona" : "Select"}</option>
        {choices.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <details className="goals-panel">
      <summary>
        {es
          ? "Objetivos y escenarios de aprendizaje"
          : "Goals and learning scenarios"}
      </summary>
      <p>
        {es
          ? "Explora un ejemplo editable. No es una recomendación, una evaluación de idoneidad ni una garantía. El nivel de detalle no determina el riesgo."
          : "Explore an editable example. It is not a recommendation, suitability assessment or guarantee. Detail level does not determine risk."}
      </p>
      <p>
        {es
          ? "Este ejercicio se queda en la pantalla; sus respuestas no se envían al asistente."
          : "This worksheet stays on this screen; its answers are not sent to the assistant."}
      </p>
      <div className="goals-fields">
        {question(
          "objective",
          es ? "¿Para qué ahorras?" : "What are you saving for?",
          [
            ["retirement", es ? "Jubilación" : "Retirement"],
            ["project", es ? "Proyecto futuro" : "Future project"],
            ["general", es ? "Ahorro general" : "General savings"],
          ],
        )}
        {question(
          "horizon",
          es ? "¿Cuándo podrías necesitarlo?" : "When might you need it?",
          [
            ["short", es ? "Antes de 5 años" : "Within 5 years"],
            ["long", es ? "5 años o más" : "5 years or more"],
            ["unknown", es ? "No lo sé" : "Not sure"],
          ],
        )}
        {question(
          "liquidity",
          es
            ? "¿Podrías necesitar este dinero pronto?"
            : "Could you need this money soon?",
          [
            ["yes", es ? "Sí" : "Yes"],
            ["no", es ? "No" : "No"],
            ["unknown", es ? "No lo sé" : "Not sure"],
          ],
        )}
        {question(
          "reserve",
          es
            ? "¿Tienes una reserva para imprevistos?"
            : "Do you have an emergency reserve?",
          [
            ["yes", es ? "Sí" : "Yes"],
            ["no", es ? "No" : "No"],
            ["unknown", es ? "No lo sé" : "Not sure"],
          ],
        )}
        {question(
          "debt",
          es
            ? "¿Tienes deudas costosas pendientes?"
            : "Do you have expensive outstanding debt?",
          [
            ["yes", es ? "Sí" : "Yes"],
            ["no", es ? "No" : "No"],
            ["unknown", es ? "No lo sé" : "Not sure"],
          ],
        )}
        {question(
          "loss",
          es
            ? "¿Qué fluctuaciones estarías dispuesto a explorar?"
            : "What fluctuations are you willing to explore?",
          [
            ["low", es ? "Menores" : "Lower"],
            ["medium", es ? "Intermedias" : "Moderate"],
            ["high", es ? "Mayores" : "Higher"],
            ["unknown", es ? "No lo sé" : "Not sure"],
          ],
        )}
        <label>
          {es
            ? "Importe de ejemplo opcional (€)"
            : "Optional example amount (€)"}
          <input
            type="number"
            min="0"
            max="1000000000"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
      </div>
      {!ready ? (
        <p className="goals-notice" role="status">
          {es
            ? "Completa las respuestas para explorar una plantilla educativa."
            : "Complete the answers to explore a learning template."}
          {answers.horizon &&
            answers.horizon !== "long" &&
            (es
              ? " Este ejemplo requiere un horizonte de al menos cinco años."
              : " This example requires a horizon of at least five years.")}
          {answers.liquidity &&
            answers.liquidity !== "no" &&
            (es
              ? " Revisa primero tu necesidad de liquidez."
              : " Consider your need for cash first.")}
          {answers.reserve &&
            answers.reserve !== "yes" &&
            (es
              ? " Considera primero una reserva para imprevistos."
              : " Consider an emergency reserve first.")}
          {answers.debt &&
            answers.debt !== "no" &&
            (es
              ? " Considera primero la deuda costosa."
              : " Consider expensive debt first.")}
          {answers.loss &&
            !["low", "medium", "high"].includes(answers.loss) &&
            (es
              ? " Indica qué fluctuaciones deseas explorar."
              : " Choose which fluctuations you wish to explore.")}
        </p>
      ) : (
        <div className="goals-example">
          <h3>
            {es
              ? "Un escenario ilustrativo editable"
              : "One editable illustrative scenario"}
          </h3>
          <p>
            {es
              ? "Una regla educativa combina el objetivo y la preferencia de fluctuación indicados: para un proyecto reserva más efectivo, y al explorar fluctuaciones mayores muestra más acciones. No determina qué te conviene."
              : "A teaching rule combines your stated goal and fluctuation preference: a project assigns more cash, while exploring higher fluctuations shows more shares. It does not determine what suits you."}
          </p>
          <p>
            {es
              ? "Efectivo: liquidez, aunque puede perder poder adquisitivo. Bonos: pueden estabilizar una mezcla, pero también pierden valor. Acciones: pueden fluctuar más y sufrir pérdidas; ninguna proporción garantiza resultados."
              : "Cash: liquidity, though purchasing power can fall. Bonds: may moderate a mix but can lose value. Shares: can fluctuate more and lose value; no allocation guarantees results."}
          </p>
          {edited && (
            <p role="status">
              {es
                ? "Ajuste manual: puede no corresponder a tus respuestas."
                : "Manual adjustment: it may not correspond to your answers."}
            </p>
          )}
          <div className="allocation-grid">
            {(es
              ? ["Efectivo", "Bonos", "Acciones"]
              : ["Cash", "Bonds", "Shares"]
            ).map((label, index) => (
              <label key={label}>
                {label} (%)
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={allocation[index]}
                  onChange={(e) => {
                    setEdited(true);
                    setAllocation((old) =>
                      old.map((v, i) => (i === index ? e.target.value : v)),
                    );
                  }}
                />
              </label>
            ))}
          </div>
          <p role="status">
            {valid
              ? es
                ? "Total: 100 %."
                : "Total: 100%."
              : es
                ? "Los porcentajes deben estar entre 0 y 100 y sumar 100 %."
                : "Percentages must be between 0 and 100 and total 100%."}
          </p>
          {valid && amount.trim() !== "" && !cents && (
            <p role="status">
              {es
                ? "Introduce un importe entre 0 y 1.000.000.000 € con hasta dos decimales."
                : "Enter an amount from 0 to €1,000,000,000 with up to two decimal places."}
            </p>
          )}
          {valid && cents && (
            <p>
              {es
                ? "Importes ilustrativos (redondeados para sumar el total):"
                : "Illustrative amounts (rounded to preserve the total):"}{" "}
              {cents
                .map(
                  (n, i) =>
                    `${(es ? ["Efectivo", "Bonos", "Acciones"] : ["Cash", "Bonds", "Shares"])[i]} ${new Intl.NumberFormat(es ? "es-ES" : "en-GB", { style: "currency", currency: "EUR" }).format(n / 100)}`,
                )
                .join(" · ")}
            </p>
          )}
          <p>
            {es
              ? "No se envían órdenes ni se recomienda un producto. Valora tus circunstancias y consulta asesoramiento cualificado si lo necesitas."
              : "No orders are sent and no product is recommended. Consider your circumstances and seek qualified advice if needed."}
          </p>
        </div>
      )}
    </details>
  );
}
