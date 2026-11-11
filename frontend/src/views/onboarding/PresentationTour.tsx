import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import "./onboarding.css";

export type TourPage = "home" | "simulator" | "learn" | "portfolio";
type Step = { page: TourPage; selectors: readonly string[]; title: { es: string; en: string }; text: { es: string; en: string } };

/** Recorrido guiado de 5 pasos para presentar la demo (botón «Presentar» o `?demo=1`). */
export const TOUR_STEPS: readonly Step[] = [
  { page: "home", selectors: ['[data-tour="intro"]'], title: { es: "Invertir empieza por entender", en: "Investing starts with understanding" },
    text: { es: "La portada de Inicio ofrece cuatro caminos: explorar fondos, simular, ver tu cartera y aprender. Primero se entiende, después se decide.", en: "The Home cover offers four paths: explore funds, simulate, see your portfolio and learn. First you understand, then you decide." } },
  { page: "home", selectors: ['[data-tour="level"]'], title: { es: "Tu nivel, tu ritmo", en: "Your level, your pace" },
    text: { es: "Básico, Intermedio o Avanzado: el nivel adapta toda la interfaz y la profundidad de las explicaciones.", en: "Basic, Intermediate or Advanced: the level adapts the whole interface and the depth of the explanations." } },
  { page: "home", selectors: ['[data-tour="assistant"]'], title: { es: "Un agente que te acompaña", en: "An agent by your side" },
    text: { es: "«¿Qué estoy viendo?» y «¿Cómo van las cosas?» responden en lenguaje claro con datos reales de la CNMV y explicaciones educativas, sin órdenes.", en: "“What am I looking at?” and “How are things going?” answer in plain language with real CNMV data and educational explanations, with no orders." } },
  { page: "home", selectors: ['[data-tour="worry"]', '[data-tour="decline"]'], title: { es: "Calma antes de vender", en: "Calm before selling" },
    text: { es: "Ante una caída, la pausa informativa muestra qué ha pasado con datos y fuentes. No bloquea la venta ni presiona a mantener.", en: "Facing a decline, the informative pause shows what happened with data and sources. It does not block selling or push you to hold." } },
  { page: "learn", selectors: ['[data-tour="mifid"]'], title: { es: "Aprende", en: "Learn" },
    text: { es: "Educación explica los conceptos clave y permite practicar el Test MiFID, con el porqué de cada pregunta.", en: "Education explains key concepts and lets you practise the MiFID test, with the reason behind each question." } },
  { page: "simulator", selectors: ["#jr-step-3", '[data-tour="simulator"]'], title: { es: "Practica sin riesgo", en: "Practise without risk" },
    text: { es: "El simulador usa fondos reales y responde «¿Y si vendo?»: compara mantener frente a vender en un mes concreto, sin dinero real.", en: "The simulator uses real funds and answers “What if I sell?”: it compares holding versus selling in a given month, with no real money." } },
  { page: "portfolio", selectors: ['[data-tour="portfolio"]'], title: { es: "Tu cartera, clara", en: "Your portfolio, clear" },
    text: { es: "Mi cartera resume valor, evolución y objetivo con datos de ejemplo. Entender primero, invertir después.", en: "My portfolio summarises value, evolution and goal with sample data. Understand first, invest later." } },
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
