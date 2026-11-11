import { ArrowRight, FlaskConical, Info } from "lucide-react";
import type { ReactNode } from "react";
import { DemoBadge } from "../../components/dashboard/index.ts";
import type { Lang } from "../../components/dashboard/copy.ts";
import type { Level } from "../../types/level.ts";
import ScenarioLab from "./ScenarioLab.tsx";
import "./simulator.css";

const tx = {
  es: {
    title: "Simulador", practice: "Abrir práctica guiada", catalogTitle: "Prueba con un producto del catálogo",
    catalogAdvTitle: "Producto del catálogo: histórico publicado, fuentes y costes",
    lead: "Prueba productos del catálogo con sus datos publicados y escenarios ilustrativos con supuestos ficticios (DEMO), separados entre sí. Nada de esto predice ni garantiza rendimientos.", illustrative: "ILUSTRATIVO",
  },
  en: {
    title: "Simulator", practice: "Open guided practice", catalogTitle: "Try a catalog product",
    catalogAdvTitle: "Catalog product: published history, sources and costs",
    lead: "Try catalog products with their published data and illustrative scenarios with fictional (DEMO) assumptions, kept apart. None of this predicts or guarantees returns.", illustrative: "ILLUSTRATIVE",
  },
} as const;

/**
 * Sección única «Simulador». El orden depende del nivel (el nivel cambia la explicación, no el perfil de riesgo):
 * Encabezado (h1) arriba. Básico: escenario guiado DEMO y recorrido de producto; Intermedio: recorrido de producto y comparación
 * de escenarios y plazos; Avanzado: escenarios, plazos y costes y recorrido de producto. El recorrido (Simulator.tsx, 3 pasos con
 * «¿Y si vendo?» como paso 3) se muestra con `embedded`, sin repetir el h1.
 */
export default function SimulatorPage({ language, level, onExplain, onPractice, product }: {
  language: Lang; level: Level; onExplain: () => void; onPractice: () => void; product: (embedded: boolean) => ReactNode;
}) {
  const t = tx[language];
  const intermediate = level === "intermediate";
  const lab = <ScenarioLab key="lab" language={language} level={level} onExplain={level === "beginner" ? onExplain : undefined} />;
  // Un solo h1 («Simulador») encima de todo. El recorrido de producto (3 pasos de main, con «¿Y si vendo?» como paso 3)
  // aporta sus h2 por paso; los escenarios ilustrativos DEMO son secciones h2 aparte, separadas de los datos publicados.
  // Los hijos llevan clave y el recorrido ocupa siempre la misma posición: al cambiar de nivel no se pierde su estado.
  return (
    <div className="sim-page">
      <header className="sim-page__header">
        <h1 className="sim-page__title"><FlaskConical size={22} aria-hidden="true" /> {t.title} <DemoBadge language={language} label={t.illustrative} /></h1>
        <p className="sim-page__lead"><Info size={15} aria-hidden="true" /> {t.lead}</p>
      </header>
      <div key="practice"><button type="button" className="text-link history-shortcut" onClick={onPractice}>{t.practice}<ArrowRight size={15} /></button></div>
      {!intermediate && lab}
      <section key="product" className="sim-catalog" aria-label={level === "advanced" ? t.catalogAdvTitle : t.catalogTitle}>
        {product(true)}
      </section>
      {intermediate && lab}
    </div>
  );
}
