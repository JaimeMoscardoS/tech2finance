import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import "./onboarding.css";

export type TourPage = "home" | "simulator" | "learn";
type Step = { page: TourPage; selectors: readonly string[]; title: { es: string; en: string }; text: { es: string; en: string } };

/** Recorrido guiado de 5 pasos para presentar la demo (botón «Presentar» o `?demo=1`). */
export const TOUR_STEPS: readonly Step[] = [
  { page: "home", selectors: ['[data-tour="summary"]'], title: { es: "Resumen de la cartera", en: "Portfolio summary" },
    text: { es: "Valor, último mes y objetivo de una cartera de ejemplo con fondos reales (valores liquidativos de la CNMV) y participaciones DEMO.", en: "Value, last month and goal of a sample portfolio with real funds (CNMV net asset values) and DEMO holdings." } },
  { page: "home", selectors: ['[data-tour="assistant"]'], title: { es: "Asistente de IA", en: "AI assistant" },
    text: { es: "Dos preguntas, una respuesta en lenguaje claro: el modelo redacta y el código calcula las cifras. Sin órdenes ni consejos personalizados.", en: "Two questions, one plain-language answer: the model writes and code computes the figures. No orders or personalised advice." } },
  { page: "home", selectors: ['[data-tour="decline"]', '[data-tour="assistant"]'], title: { es: "Probar una caída", en: "Try a decline" },
    text: { es: "Pulsa «Probar una caída»: una pausa informativa explica la caída con datos y fuentes antes de decidir. No bloquea la venta.", en: "Press “Try a decline”: an informative pause explains the fall with data and sources before deciding. It does not block selling." } },
  { page: "simulator", selectors: ["#jr-step-3", '[data-tour="simulator"]'], title: { es: "Simulador: ¿y si vendo?", en: "Simulator: what if I sell?" },
    text: { es: "Recorrido en 3 pasos con un fondo real: elige, simula y compara mantener frente a vender en un mes concreto.", en: "3-step journey with a real fund: choose, simulate and compare holding versus selling in a given month." } },
  { page: "learn", selectors: ['[data-tour="mifid"]'], title: { es: "Práctica del Test MiFID", en: "MiFID test practice" },
    text: { es: "Preguntas típicas del test de conveniencia con explicación de por qué se hacen, adaptadas al nivel.", en: "Typical suitability-test questions explaining why they are asked, adapted to the level." } },
];

type Rect = { top: number; left: number; width: number; height: number };

export default function PresentationTour({ language, onNavigate, onClose }: { language: "es" | "en"; onNavigate: (page: TourPage) => void; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const step = TOUR_STEPS[index];
  const es = language === "es";

  const measure = useCallback(() => {
    const el = step.selectors.map((s) => document.querySelector<HTMLElement>(s)).find((e) => e && e.getClientRects().length > 0);
    if (!el) { setRect(null); return null; }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top - 8, left: r.left - 8, width: r.width + 16, height: r.height + 16 });
    return el;
  }, [step]);

  useEffect(() => { onNavigate(step.page); }, [step, onNavigate]);
  useLayoutEffect(() => {
    let tries = 0;
    let frame = 0;
    const find = () => {
      const el = measure();
      if (el) {
        const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
        window.setTimeout(measure, reduced ? 0 : 450);
      } else if (tries++ < 30) frame = requestAnimationFrame(find);
    };
    frame = requestAnimationFrame(find);
    return () => cancelAnimationFrame(frame);
  }, [measure]);
  useEffect(() => {
    const update = () => measure();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => { window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
  }, [measure]);
  useEffect(() => { cardRef.current?.focus(); }, [index]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      else if (e.key === "ArrowRight" && !(e.target instanceof HTMLInputElement)) setIndex((i) => Math.min(TOUR_STEPS.length - 1, i + 1));
      else if (e.key === "ArrowLeft" && !(e.target instanceof HTMLInputElement)) setIndex((i) => Math.max(0, i - 1));
    };
    document.addEventListener("keydown", key, true);
    return () => document.removeEventListener("keydown", key, true);
  }, [onClose]);

  const last = index === TOUR_STEPS.length - 1;
  return (
    <div className="tour" aria-live="off">
      {rect && <div className="tour__spot" style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }} aria-hidden="true" />}
      <div ref={cardRef} className="tour__card" role="dialog" aria-modal="false" aria-labelledby="tour-title" tabIndex={-1}>
        <p className="tour__count">{es ? `Paso ${index + 1} de ${TOUR_STEPS.length}` : `Step ${index + 1} of ${TOUR_STEPS.length}`}</p>
        <h2 id="tour-title">{step.title[language]}</h2>
        <p>{step.text[language]}</p>
        <div className="tour__actions">
          <button type="button" onClick={() => setIndex(index - 1)} disabled={index === 0}><ChevronLeft size={18} aria-hidden="true" />{es ? "Anterior" : "Previous"}</button>
          {last
            ? <button type="button" className="tour__primary" onClick={onClose}>{es ? "Terminar" : "Finish"}</button>
            : <button type="button" className="tour__primary" onClick={() => setIndex(index + 1)}>{es ? "Siguiente" : "Next"}<ChevronRight size={18} aria-hidden="true" /></button>}
          <button type="button" className="tour__close" onClick={onClose} aria-label={es ? "Salir de la presentación (Esc)" : "Exit presentation (Esc)"}><X size={18} aria-hidden="true" /></button>
        </div>
      </div>
    </div>
  );
}
