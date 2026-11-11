import { LEVELS, type Level } from "./types/level.ts";

export const LEVEL_STORAGE_KEY = "t2f-level";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/** Nivel guardado; cualquier valor ausente, no válido o un almacenamiento que falle devuelve el fallback. */
export function readStoredLevel(fallback: Level = "beginner", storage: StorageLike | null = defaultStorage()): Level {
  try {
    const value = storage?.getItem(LEVEL_STORAGE_KEY);
    return LEVELS.includes(value as Level) ? (value as Level) : fallback;
  } catch {
    return fallback;
  }
}

/** Guarda el nivel; devuelve false si no se pudo (modo privado, cuota, valor no válido). */
export function writeStoredLevel(level: Level, storage: StorageLike | null = defaultStorage()): boolean {
  if (!LEVELS.includes(level)) return false;
  try {
    if (!storage) return false;
    storage.setItem(LEVEL_STORAGE_KEY, level);
    return true;
  } catch {
    return false;
  }
}
