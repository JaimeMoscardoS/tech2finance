import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/tokens.css";
import "./style.css";
import "./dark-theme.css";
import "./level-colors.css";
import "./styles/transitions.css";
import "./dashboard/showcase.css";

// Ruta temporal /componentes (fase 2): galería de componentes, fuera de la navegación real.
const Showcase = lazy(() => import("./dashboard/ComponentsShowcase"));
const showcase = window.location.pathname.replace(/\/+$/, "") === "/componentes";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>{showcase ? <Suspense fallback={null}><Showcase /></Suspense> : <App />}</React.StrictMode>,
);