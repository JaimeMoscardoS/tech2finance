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
    catalogDesc: "Datos del catálogo y de la ficha del producto, separados de los escenarios ilustrativos de arriba.",
    catalogAdvTitle: "Producto del catálogo: histórico publicado, fuentes y costes", catalogAdvDesc: "Datos publicados y costes del producto del catálogo, separados de los escenarios ilustrativos DEMO de arriba.",
    lead: "Escenarios ilustrativos con supuestos ficticios (DEMO). No predicen ni garantizan rendimientos y no usan datos reales.", illustrative: "ILUSTRATIVO",
  },
  en: {
    title: "Simulator", practice: "Open guided practice", catalogTitle: "Try a catalog product",
    catalogDesc: "Catalog and product-sheet data, kept apart from the illustrative scenarios above.",
    catalogAdvTitle: "Catalog product: published history, sources and costs", catalogAdvDesc: "Published data and product costs from the catalog, kept apart from the illustrative DEMO scenarios above.",
    lead: "Illustrative scenarios with fictional assumptions (DEMO). They neither predict nor guarantee returns and use no real data.", illustrative: "ILLUSTRATIVE",
  },
} as const;

/**
 * Sección única «Simulador». El orden depende del nivel (el nivel cambia la explicación, no el perfil de riesgo):
 * Básico: juego guiado y, debajo, el simulador de producto; Intermedio: simulador de producto y comparación de
 * escenarios y plazos; Avanzado: encabezado propio, escenarios, plazos y costes y, debajo, el simulador de producto.
 * `product(embedded)` renderiza el simulador de producto; `product(true)` lo anida bajo un h2, por lo que su encabezado baja a h3 y la página mantiene un único h1.
 */
export default function SimulatorPage({ language, level, onExplain, onPractice, product }: {
  language: Lang; level: Level; onExplain: () => void; onPractice: () => void; product: (embedded: boolean) => ReactNode;
}) {
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
  return (
    <div className="sim-page">
      {!intermediate && (
        <header key="head">
          <h1 className="sim-page__title"><FlaskConical size={22} aria-hidden="true" /> {t.title} <DemoBadge language={language} label={t.illustrative} /></h1>
          <p className="sim-page__lead"><Info size={15} aria-hidden="true" /> {t.lead}</p>
        </header>
      )}
      <div key="practice">{practice}</div>
      {!intermediate && lab}
      <section key="product" className={intermediate ? undefined : "dash-section"} aria-labelledby={intermediate ? undefined : "sim-catalog-title"}>
        {intermediate ? null : (
          <header className="dash-section__head"><div><h2 id="sim-catalog-title">{catalogTitle}</h2><p>{catalogDesc}</p></div></header>
        )}
        <div className={intermediate ? undefined : "sim-catalog"}>{product(!intermediate)}</div>
      </section>
      {intermediate && lab}
    </div>
  );
}
