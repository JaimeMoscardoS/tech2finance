import { useEffect, useRef } from "react";
import type { Level } from "../../types/level.ts";
import "./onboarding.css";

/** Clave de localStorage: la bienvenida ya se respondió o se saltó. */
export const WELCOME_KEY = "t2f-welcome-done";

/**
 * Se muestra en la primera visita. En navegadores automatizados (Playwright: `navigator.webdriver`) no aparece salvo con
 * `?welcome=1`, para no interferir en las pruebas existentes.
 */
export function shouldShowWelcome(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("welcome") === "1") return true;
    if (params.get("demo") === "1" || navigator.webdriver) return false;
    return localStorage.getItem(WELCOME_KEY) !== "1";
  } catch {
    return false;
  }
}
export function markWelcomeDone() {
  try { localStorage.setItem(WELCOME_KEY, "1"); } catch { /* sin almacenamiento: se volverá a mostrar */ }
}

const tx = {
  es: {
    title: "¿Cuánto sabes de invertir?",
    hint: "Así adaptamos las explicaciones. Puedes cambiarlo cuando quieras en «Nivel», arriba a la derecha.",
    options: [["beginner", "Poco o nada", "Explicaciones sencillas, lo esencial."], ["intermediate", "Algo", "Más contexto y comparaciones."], ["advanced", "Bastante", "Métricas, supuestos y detalle técnico."]] as const,
    skip: "Saltar",
  },
  en: {
    title: "How much do you know about investing?",
    hint: "This tailors the explanations. You can change it any time under “Level”, top right.",
    options: [["beginner", "Little or nothing", "Simple explanations, the essentials."], ["intermediate", "Some", "More context and comparisons."], ["advanced", "Quite a lot", "Metrics, assumptions and technical detail."]] as const,
    skip: "Skip",
  },
} as const;

export default function WelcomeDialog({ language, onChoose, onSkip }: { language: "es" | "en"; onChoose: (level: Level) => void; onSkip: () => void }) {
  const t = tx[language];
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onSkip(); return; }
      if (e.key !== "Tab" || !ref.current) return;
      const items = Array.from(ref.current.querySelectorAll<HTMLButtonElement>("button"));
      if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === items[items.length - 1]) { e.preventDefault(); items[0].focus(); }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [onSkip]);
  return (
    <div className="onb-backdrop">
      <div ref={ref} className="onb-dialog" role="dialog" aria-modal="true" aria-labelledby="onb-title" aria-describedby="onb-hint">
        <h2 id="onb-title">{t.title}</h2>
        <div className="onb-options">
          {t.options.map(([id, label, desc]) => (
            <button key={id} type="button" className="onb-option" onClick={() => onChoose(id)}>
              <strong>{label}</strong><span>{desc}</span>
            </button>
          ))}
        </div>
        <p id="onb-hint" className="onb-hint">{t.hint}</p>
        <button type="button" className="onb-skip" onClick={onSkip}>{t.skip}</button>
      </div>
    </div>
  );
}
