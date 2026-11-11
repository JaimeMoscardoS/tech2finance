import { ArrowRight, FlaskConical, Info } from "lucide-react";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { DemoBadge } from "../../components/dashboard/index.ts";
import type { Lang } from "../../components/dashboard/copy.ts";
import type { Level } from "../../types/level.ts";
import ScenarioLab from "./ScenarioLab.tsx";
import "./simulator.css";

const tx = {
  es: {
    title: "Simulador", practice: "Abrir práctica guiada", catalogTitle: "Prueba con un producto del catálogo",
    catalogDesc: "Datos del catálogo y de la ficha del producto, separados de los escenarios ilustrativos.",
    catalogAdvTitle: "Producto del catálogo: histórico publicado, fuentes y costes", catalogAdvDesc: "Datos publicados y costes del producto del catálogo, separados de los escenarios ilustrativos DEMO de arriba.",
    tabsLabel: "Secciones del simulador", tabSim: "Simular", tabSell: "¿Y si vendo?",
    lead: "Prueba productos del catálogo con sus datos publicados y escenarios ilustrativos con supuestos ficticios (DEMO), separados entre sí. Nada de esto predice ni garantiza rendimientos.", illustrative: "ILUSTRATIVO",
  },
  en: {
    title: "Simulator", practice: "Open guided practice", catalogTitle: "Try a catalog product",
    catalogDesc: "Catalog and product-sheet data, kept apart from the illustrative scenarios.",
    catalogAdvTitle: "Catalog product: published history, sources and costs", catalogAdvDesc: "Published data and product costs from the catalog, kept apart from the illustrative DEMO scenarios above.",
    tabsLabel: "Simulator sections", tabSim: "Simulate", tabSell: "What if I sell?",
    lead: "Try catalog products with their published data and illustrative scenarios with fictional (DEMO) assumptions, kept apart. None of this predicts or guarantees returns.", illustrative: "ILLUSTRATIVE",
  },
} as const;

/**
 * Sección única «Simulador». El orden depende del nivel (el nivel cambia la explicación, no el perfil de riesgo):
 * Encabezado (h1) siempre arriba y, debajo, pestañas «Simular» / «¿Y si vendo?». En «Simular»: Básico, juego guiado y simulador
 * de producto; Intermedio, simulador de producto y comparación de escenarios y plazos; Avanzado, escenarios, plazos y costes y
 * simulador de producto. `product(true)` anida el simulador de producto bajo su h2 (su encabezado baja a h3).
 */
export default function SimulatorPage({ language, level, onExplain, onPractice, product, holdSell }: {
  language: Lang; level: Level; onExplain: () => void; onPractice: () => void; product: (embedded: boolean) => ReactNode;
  /** Ejercicio «¿Y si vendo?» (HoldSellGame, ya con sus props); si falta no se muestran pestañas. */
  holdSell?: ReactNode;
}) {
  const [tab, setTab] = useState<"sim" | "sell">("sim");
  const tabRefs = useRef<Record<"sim" | "sell", HTMLButtonElement | null>>({ sim: null, sell: null });
  const order = ["sim", "sell"] as const;
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = order.indexOf(tab);
    const next = event.key === "ArrowRight" ? order[(index + 1) % 2] : event.key === "ArrowLeft" ? order[(index + 1) % 2] : event.key === "Home" ? order[0] : event.key === "End" ? order[1] : null;
    if (!next) return;
    event.preventDefault(); setTab(next); tabRefs.current[next]?.focus();
  };
  const t = tx[language];
  const practice = (
    <button type="button" className="text-link history-shortcut" onClick={onPractice}>{t.practice}<ArrowRight size={15} /></button>
  );

  const intermediate = level === "intermediate";
  const catalogTitle = level === "advanced" ? t.catalogAdvTitle : t.catalogTitle;
  const catalogDesc = level === "advanced" ? t.catalogAdvDesc : t.catalogDesc;
  const lab = <ScenarioLab key="lab" language={language} level={level} onExplain={level === "beginner" ? onExplain : undefined} />;
  // Los hijos llevan clave y el simulador de producto ocupa siempre la misma posición dentro de su envoltorio:
  // al cambiar de nivel solo se reordenan y el estado del simulador (vista %, tabla…) no se pierde.
  const tabs = holdSell ? (
    <div className="sim-tabs" role="tablist" aria-label={t.tabsLabel}>
      {order.map(key => (
        <button key={key} ref={node => { tabRefs.current[key] = node; }} type="button" role="tab" id={`sim-tab-${key}`} className="sim-tab"
          aria-selected={tab === key} aria-controls={`sim-panel-${key}`} tabIndex={tab === key ? 0 : -1}
          onClick={() => setTab(key)} onKeyDown={onTabKey}>{key === "sim" ? t.tabSim : t.tabSell}</button>
      ))}
    </div>
  ) : null;
  // Encabezado único de la página, siempre encima de las pestañas (un solo h1 en todos los niveles y pestañas).
  const header = (
    <header className="sim-page__header">
      <h1 className="sim-page__title"><FlaskConical size={22} aria-hidden="true" /> {t.title} <DemoBadge language={language} label={t.illustrative} /></h1>
      <p className="sim-page__lead"><Info size={15} aria-hidden="true" /> {t.lead}</p>
    </header>
  );
  const simulate = (
    <div className="sim-page__panel" role={holdSell ? "tabpanel" : undefined} id={holdSell ? "sim-panel-sim" : undefined} aria-labelledby={holdSell ? "sim-tab-sim" : undefined} hidden={holdSell ? tab !== "sim" : undefined}>
      <div key="practice">{practice}</div>
      {!intermediate && lab}
      <section key="product" className="dash-section" aria-labelledby="sim-catalog-title">
        <header className="dash-section__head"><div><h2 id="sim-catalog-title">{catalogTitle}</h2><p>{catalogDesc}</p></div></header>
        <div className="sim-catalog">{product(true)}</div>
      </section>
      {intermediate && lab}
    </div>
  );
  if (!holdSell) return <div className="sim-page">{header}{simulate}</div>;
  return (
    <div className="sim-page">
      {header}
      {tabs}
      {simulate}
      <div className="sim-page__panel" role="tabpanel" id="sim-panel-sell" aria-labelledby="sim-tab-sell" hidden={tab !== "sell"}>
        {tab === "sell" && holdSell}
      </div>
    </div>
  );
}
