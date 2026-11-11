import { displayCatalog } from "./fund-names.ts";
import type { Catalog } from "./server-api";
/** UI scope only; the server remains responsible for authorization. */
export function scopeCatalog(catalog: Catalog, bankId: string): Catalog {
  if (!catalog.banks.some(b => b.id === bankId)) throw new Error('Unknown bank');
  return {
    ...catalog,
    banks: bankId === "demo" ? catalog.banks : catalog.banks.filter((b) => b.id === bankId),
    instruments: displayCatalog(catalog.instruments).filter((i) => bankId === "demo" ? catalog.demoStudyInstrumentIds.includes(i.instrumentId) : i.bankId === bankId).map(i =>
      i.dataStatus === "historical_nav" && !catalog.navHistory.instruments.some(h => h.isin === i.identifier && h.eligible)
        ? {...i, dataStatus: "unsupported_distributions" as const}
        : i),
  };
}
