import { Sparkles } from "lucide-react";
import { useId } from "react";
import type { AgentFacts } from "../../dashboard-portfolio.ts";
import type { Level } from "../../types/level.ts";
import { DemoBadge, StatusChip } from "./basics.tsx";
import type { Lang } from "./copy.ts";
import { eur, num, pct, signedPct } from "./format.ts";
import "./dashboard.css";

const copy = {
  es: {
    title: "Asistente de IA", badge: "Texto de ejemplo",
    sample: "Esta fase no usa IA real: el texto es una plantilla DEMO que explica cifras calculadas por código sobre una cartera ficticia.",
    limits: "Contenido educativo y general. No son órdenes de compra o venta ni asesoramiento personalizado; las simulaciones no predicen ni garantizan rendimientos.",
    summary: "Resumen", observations: "Observaciones", review: "Puntos para reflexionar", scenarios: "Escenarios ficticios", assumptions: "Supuestos y límites",
    scenarioCol: "Si la renta variable variara…", impactCol: "Efecto aproximado en la cartera", scenarioNote: "Ejercicio de sensibilidad con datos DEMO; no es una predicción.",
  },
  en: {
    title: "AI assistant", badge: "Sample text",
    sample: "This phase uses no real AI: the text is a DEMO template that explains figures computed by code on a fictional portfolio.",
    limits: "Educational, general content. These are not buy or sell orders or personalised advice; simulations neither predict nor guarantee returns.",
    summary: "Summary", observations: "Observations", review: "Points to think about", scenarios: "Fictional scenarios", assumptions: "Assumptions and limits",
    scenarioCol: "If equities moved by…", impactCol: "Approximate effect on the portfolio", scenarioNote: "Sensitivity exercise on DEMO data; not a forecast.",
  },
} as const;

export function AgentPanel({ level, facts, language = "es" }: { level: Level; facts: AgentFacts; language?: Lang }) {
  const c = copy[language];
  const id = useId();
  const es = language === "es";
  const n = (v: number | null, d = 1) => (v == null ? (es ? "n. d." : "n/a") : num(v, language, d));
  return (
    <aside className="dash-card dash-agent" aria-labelledby={`${id}-t`} data-agent-level={level}>
      <header className="dash-card__head">
        <h3 id={`${id}-t`}><Sparkles size={18} aria-hidden="true" /> {c.title}</h3>
        <span className="dash-agent__tags"><DemoBadge language={language} label="DEMO" /><StatusChip tone="info" icon={false}>{c.badge}</StatusChip></span>
      </header>
      <p className="dash-agent__sample">{c.sample}</p>

      {level === "beginner" && (
        <section aria-label={c.summary}>
          <h4>{c.summary}</h4>
          <p>{es
            ? `Tu cartera de ejemplo vale ${eur(facts.totalValue, language)}${facts.pnlPercent != null ? ` y su resultado es ${signedPct(facts.pnlPercent, language)} sobre lo invertido` : ""}. La parte más grande está en «${facts.topName}» (${pct(facts.topWeightPct, language, 0)}).`
            : `Your sample portfolio is worth ${eur(facts.totalValue, language)}${facts.pnlPercent != null ? ` and its result is ${signedPct(facts.pnlPercent, language)} on the amount invested` : ""}. The largest part is in “${facts.topName}” (${pct(facts.topWeightPct, language, 0)}).`}</p>
        </section>
      )}

      {level === "intermediate" && (
        <>
          <section aria-label={c.observations}>
            <h4>{c.observations}</h4>
            <ul>
              <li>{es ? `Concentración: «${facts.topName}» pesa ${pct(facts.topWeightPct, language, 0)} de la cartera.` : `Concentration: “${facts.topName}” weighs ${pct(facts.topWeightPct, language, 0)} of the portfolio.`}</li>
              <li>{es ? `La renta variable supone ${pct(facts.equityWeightPct, language, 0)} del valor; el riesgo medio ponderado de los productos es ${n(facts.averageRisk)} sobre 7.` : `Equities make up ${pct(facts.equityWeightPct, language, 0)} of the value; the weighted average product risk is ${n(facts.averageRisk)} out of 7.`}</li>
              <li>{es ? `En la serie DEMO, la volatilidad anualizada es ${facts.volatilityPct == null ? "n. d." : pct(facts.volatilityPct, language)} y la mayor caída desde un máximo, ${facts.maxDrawdownPct == null ? "n. d." : pct(facts.maxDrawdownPct, language)}.` : `In the DEMO series, annualised volatility is ${facts.volatilityPct == null ? "n/a" : pct(facts.volatilityPct, language)} and the largest fall from a peak is ${facts.maxDrawdownPct == null ? "n/a" : pct(facts.maxDrawdownPct, language)}.`}</li>
            </ul>
          </section>
          <section aria-label={c.review}>
            <h4>{c.review}</h4>
            <ul>
              <li>{es ? "¿Tu horizonte y tu necesidad de liquidez encajan con la parte invertida en renta variable?" : "Do your horizon and liquidity needs fit the part invested in equities?"}</li>
              <li>{es ? "¿Conoces los gastos corrientes (TER) de cada fondo y cómo restan rentabilidad?" : "Do you know each fund's ongoing charges (TER) and how they reduce returns?"}</li>
            </ul>
          </section>
        </>
      )}

      {level === "advanced" && (
        <>
          <section aria-label={c.scenarios}>
            <h4>{c.scenarios} <DemoBadge language={language} /></h4>
            <table className="dash-agent__table">
              <caption className="dash-sr">{c.scenarios}</caption>
              <thead><tr><th scope="col">{c.scenarioCol}</th><th scope="col" className="is-num">{c.impactCol}</th></tr></thead>
              <tbody>{facts.scenarios.map((s) => <tr key={s.equityShockPct}><th scope="row">{signedPct(s.equityShockPct, language, 0)}</th><td className="is-num">{s.portfolioImpactPct == null ? (es ? "n. d." : "n/a") : signedPct(s.portfolioImpactPct, language)}</td></tr>)}</tbody>
            </table>
            <p className="dash-agent__note">{c.scenarioNote}</p>
          </section>
          <section aria-label={c.assumptions}>
            <h4>{c.assumptions}</h4>
            <ul>
              <li>{es ? `Efecto = exposición a renta variable (${pct(facts.equityExposurePct, language)}, incluida la parte de renta variable del fondo mixto) × variación supuesta; el resto de activos no cambia. Sin efecto de divisa.` : `Effect = equity exposure (${pct(facts.equityExposurePct, language)}, including the equity part of the mixed fund) × assumed move; other assets unchanged. No currency effect.`}</li>
              <li>{es ? `Sharpe anualizado ${n(facts.sharpe, 2)} con tipo libre de riesgo supuesto del ${pct(facts.riskFreeAnnualPct, language)}, sobre 36 rentabilidades mensuales ficticias netas de gastos y sin tipo de cambio (se muestra «n. d.» con menos de 12).` : `Annualised Sharpe ${n(facts.sharpe, 2)} with an assumed risk-free rate of ${pct(facts.riskFreeAnnualPct, language)}, over 36 fictional monthly returns, net of fees and without exchange rate (shown as “n/a” with fewer than 12).`}</li>
              <li>{es ? "Sin costes de transacción, impuestos ni correlaciones cambiantes: simplificación didáctica." : "No transaction costs, taxes or changing correlations: a didactic simplification."}</li>
            </ul>
          </section>
        </>
      )}
      <p className="dash-agent__limits">{c.limits}</p>
    </aside>
  );
}
