import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import type { PositionRow } from "../../dashboard-portfolio.ts";
import { DemoBadge, DeltaChip, MetricBar } from "./basics.tsx";
import { assetClassNames, dash, type Lang } from "./copy.ts";
import { eur, pct, signedEur } from "./format.ts";
import "./dashboard.css";

type SortKey = "name" | "risk" | "value" | "weight" | "pnl" | "change12m";
const sorters: Record<SortKey, (a: PositionRow, b: PositionRow) => number> = {
  name: (a, b) => a.fund.name.localeCompare(b.fund.name),
  risk: (a, b) => (a.fund.riskLevel ?? Infinity) - (b.fund.riskLevel ?? Infinity),
  value: (a, b) => a.value - b.value,
  weight: (a, b) => a.weight - b.weight,
  pnl: (a, b) => a.pnlAmount - b.pnlAmount,
  change12m: (a, b) => (a.change12m ?? -Infinity) - (b.change12m ?? -Infinity),
};

export function FundTable({ rows, language = "es", caption, demo, loading, error }: {
  rows: readonly PositionRow[]; language?: Lang; caption: string; demo?: boolean; loading?: boolean; error?: string;
}) {
  const t = dash[language];
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "value", dir: -1 });
  const sorted = useMemo(() => [...rows].sort((a, b) => sort.dir * sorters[sort.key](a, b)), [rows, sort]);
  const head = (key: SortKey, label: string, numeric = false) => {
    const active = sort.key === key;
    const Icon = !active ? ChevronsUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
    return (
      <th scope="col" className={numeric ? "is-num" : undefined} aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
        <button type="button" onClick={() => setSort({ key, dir: active ? (sort.dir === 1 ? -1 : 1) : key === "name" ? 1 : -1 })}>
          {label}<Icon size={14} aria-hidden="true" /><span className="dash-sr">. {t.sortBy} {label}</span>
        </button>
      </th>
    );
  };
  return (
    <article className="dash-card dash-funds">
      <header className="dash-card__head"><h3>{caption}</h3>{demo && <DemoBadge language={language} />}</header>
      {error ? <p className="dash-state dash-state--error" role="alert">{error}</p>
        : loading ? <p className="dash-state" role="status">{t.loading}</p>
        : !rows.length ? <p className="dash-state">{t.noRows}</p>
        : (
          <div className="dash-funds__scroll" role="region" aria-label={t.tableRegion} tabIndex={0}>
            <table>
              <caption className="dash-sr">{caption}</caption>
              <thead>
                <tr>
                  {head("name", t.fund)}
                  <th scope="col">{t.assetClass}</th>
                  {head("risk", t.risk)}
                  {head("value", t.value, true)}
                  {head("weight", t.weight, true)}
                  {head("pnl", t.result, true)}
                  {head("change12m", t.change12m, true)}
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.fund.id}>
                    <th scope="row"><span className="dash-funds__name">{r.fund.name}</span><small>{r.fund.manager}</small></th>
                    <td>{assetClassNames[language][r.fund.assetClass]}</td>
                    <td><MetricBar label={`${t.risk}: ${r.fund.name}`} value={r.fund.riskLevel} language={language} /></td>
                    <td className="is-num">{eur(r.value, language)}</td>
                    <td className="is-num">{pct(r.weight * 100, language)}</td>
                    <td className="is-num"><span className="dash-funds__pnl">{signedEur(r.pnlAmount, language)}</span><DeltaChip value={r.pnlPercent} language={language} /></td>
                    <td className="is-num"><DeltaChip value={r.change12m} language={language} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </article>
  );
}
