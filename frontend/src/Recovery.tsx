import { forwardRef } from "react";
import { Moon, Sun } from "lucide-react";
import type { Language } from "./copy";
import "./recovery.css";

type Props = {
  language: Language; theme: "light" | "dark"; failed: boolean;
  onLanguage: (language: Language) => void; onTheme: (theme: "light" | "dark") => void;
  onRetry: () => void; onLocal: () => void;
};

const Recovery = forwardRef<HTMLDivElement, Props>(function Recovery({language, theme, failed, onLanguage, onTheme, onRetry, onLocal}, ref) {
  const es = language === "es";
  return <div className="recovery" ref={ref}>
    <header className="recovery-header">
      <div className="brand"><div className="brand-mark" aria-hidden="true"><span>t</span><span>2</span></div><div><strong>tech<span>2</span>finance</strong><small>{es ? "Tu espacio de inversión" : "Your investment space"}</small></div></div>
      <div className="recovery-preferences" aria-label={es ? "Preferencias" : "Preferences"}>
        <button type="button" aria-pressed={es} onClick={() => onLanguage("es")}>ES<span className="sr-only"> Español</span></button>
        <button type="button" aria-pressed={!es} onClick={() => onLanguage("en")}>EN<span className="sr-only"> English</span></button>
        <button type="button" className="recovery-theme" onClick={() => onTheme(theme === "light" ? "dark" : "light")} aria-label={theme === "light" ? (es ? "Activar tema oscuro" : "Use dark theme") : (es ? "Activar tema claro" : "Use light theme")}>{theme === "light" ? <Moon size={20}/> : <Sun size={20}/>}</button>
      </div>
    </header>
    <main className="recovery-main">
      <div className="recovery-panel">
        <div className="recovery-label"><span aria-hidden="true"/> {es ? "SERVIDOR DE DEMO" : "DEMO SERVER"}</div>
        <div role="status" aria-live="polite" aria-atomic="true">
          <h1>{failed ? (es ? "No se pudo cargar el catálogo" : "The catalog could not be loaded") : (es ? "Preparando tu espacio" : "Preparing your space")}</h1>
          <p>{failed ? (es ? "No se pudo completar la solicitud. Puedes volver a intentarlo o elegir la demo local para continuar." : "The request could not be completed. Try again or choose the local demo to continue.") : (es ? "Estamos conectando con el servidor de demo y cargando el catálogo." : "Connecting to the demo server and loading the catalog.")}</p>
        </div>
        <div className="recovery-actions">
          {failed && <button type="button" className="recovery-primary" onClick={onRetry}>{es ? "Reintentar" : "Retry"}</button>}
          <button type="button" className={failed ? "recovery-secondary" : "recovery-primary"} onClick={onLocal}>{es ? "Usar demo local" : "Use local demo"}</button>
        </div>
        <p className="recovery-note">{es ? "La demo local usa datos incluidos en la aplicación. Puedes volver al servidor más adelante." : "The local demo uses data included in the app. You can return to the server later."}</p>
      </div>
    </main>
  </div>;
});
export default Recovery;
