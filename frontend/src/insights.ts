/**
 * Observaciones del asistente (panel «Asistente de IA» y botones de Inicio) redactadas por el modelo del backend
 * (`POST /api/insights`, mismo proveedor y modelo que el análisis de caídas). Las cifras se calculan aquí con el
 * código de métricas probado y se envían solo como contexto; el servidor rechaza textos con cifras, órdenes o
 * promesas. Sin servidor, o si el modelo no está configurado o falla, la interfaz usa su plantilla local y lo indica.
 */
import { useEffect, useState } from "react";
import type { DemoPortfolio } from "./dashboard-portfolio.ts";
import type { Level } from "./types/level.ts";

export type InsightKind = "agent" | "what" | "how";
export type InsightPage = "home" | "portfolio";
export type InsightFacts = {
  dataKind: "historical_nav" | "fictional"; months: number; valueEur: number; contributedEur: number; resultPct: number;
  lastMonthPct?: number; volatilityPct?: number; maxDrawdownPct?: number; sharpe?: number; equityExposurePct?: number; averageRisk?: number;
  goalProgressPct?: number; planExpectedPct?: number; weights: { name: string; weightPct: number }[];
};
export type InsightRequest = { kind: InsightKind; page: InsightPage; level: Level; language: "es" | "en"; facts: InsightFacts };
export type Insight = { summary: string; points: string[] };
export type InsightProvider = (request: InsightRequest, signal: AbortSignal) => Promise<Insight>;

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const opt = (n: number | null | undefined, d = 2) => (n == null || !Number.isFinite(n) ? undefined : round(n, d));

/** Cifras de la cartera calculadas por código, acotadas al esquema del servidor. */
export function insightFacts(p: DemoPortfolio, extra: { lastMonthPct?: number | null; goalProgressPct?: number | null; planExpectedPct?: number | null } = {}): InsightFacts {
  const facts: InsightFacts = {
    dataKind: p.real ? "historical_nav" : "fictional",
    months: Math.max(1, p.valueSeries.length - 1),
    valueEur: round(p.totalValue), contributedEur: round(p.totalCost), resultPct: round(p.pnlPercent ?? 0),
    weights: [...p.positions].sort((a, b) => b.weight - a.weight).slice(0, 8).map((r) => ({ name: r.fund.name.slice(0, 80), weightPct: round(r.weight * 100, 1) })),
  };
  const add = <K extends keyof InsightFacts>(k: K, v: InsightFacts[K] | undefined) => { if (v !== undefined) facts[k] = v; };
  add("lastMonthPct", opt(extra.lastMonthPct));
  add("volatilityPct", opt(p.volatilityPct));
  add("maxDrawdownPct", opt(p.maxDrawdownPct));
  add("sharpe", opt(p.sharpe));
  add("equityExposurePct", opt(p.equityExposure == null ? null : p.equityExposure * 100, 1));
  add("averageRisk", opt(p.averageRisk, 1));
  add("goalProgressPct", opt(extra.goalProgressPct, 1));
  add("planExpectedPct", opt(extra.planExpectedPct, 1));
  return facts;
}

export function isInsight(v: unknown): v is Insight {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return o.mode === "ai" && typeof o.summary === "string" && Array.isArray(o.points) && o.points.length <= 4 && o.points.every((p) => typeof p === "string");
}

/** Proveedor del servidor; `undefined` en modo local (se usa la plantilla). */
export function insightProvider(mode: "server" | "local"): InsightProvider | undefined {
  if (mode !== "server") return undefined;
  return async (request, signal) => {
    const response = await fetch("/api/insights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request), signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body: unknown = await response.json();
    if (!isInsight(body)) throw new Error("Invalid insight");
    return { summary: body.summary, points: body.points };
  };
}

const cache = new Map<string, Insight | "failed">();

export type InsightState = { status: "loading" | "ai" | "template"; insight?: Insight };

/** Pide la observación al modelo (con caché por petición); ante cualquier fallo, «template». */
export function useInsight(provider: InsightProvider | undefined, request: InsightRequest | null): InsightState {
  const key = request ? JSON.stringify(request) : "";
  const cached = key ? cache.get(key) : undefined;
  const initial: InsightState = !provider || !request || cached === "failed" ? { status: "template" } : cached ? { status: "ai", insight: cached } : { status: "loading" };
  const [state, setState] = useState<InsightState>(initial);
  useEffect(() => {
    if (!provider || !request) { setState({ status: "template" }); return; }
    const hit = cache.get(key);
    if (hit) { setState(hit === "failed" ? { status: "template" } : { status: "ai", insight: hit }); return; }
    const controller = new AbortController();
    setState({ status: "loading" });
    provider(request, controller.signal)
      .then((insight) => { cache.set(key, insight); if (!controller.signal.aborted) setState({ status: "ai", insight }); })
      .catch(() => { if (controller.signal.aborted) return; cache.set(key, "failed"); setState({ status: "template" }); });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, key]);
  return state;
}
