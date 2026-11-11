import type { Catalog } from "./server-api";
/** UI scope only; the server remains responsible for authorization. */
export function scopeCatalog(catalog: Catalog, bankId: string): Catalog {
  return {
    ...catalog,
    banks: catalog.banks.filter((b) => b.id === bankId),
    instruments: catalog.instruments.filter((i) => i.bankId === bankId),
  };
}
