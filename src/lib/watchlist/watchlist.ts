import type { Title } from "@/lib/catalog/types";

export const STORAGE_KEY = "reelbase:watchlist:v2";

/** A small snapshot of a saved movie, enough to render its card without calling TMDB. */
export interface WatchlistEntry {
  id: number;
  slug: string;
  name: string;
  year?: number;
  rating?: number;
  /** TMDB poster path such as "/abc.jpg". */
  posterPath?: string;
}

export type WatchlistStorage = Pick<Storage, "getItem" | "setItem">;

const EMPTY: readonly WatchlistEntry[] = Object.freeze([]);
const POSTER_PATH = /^\/[\w.-]+$/;

export function entryFromTitle({ id, slug, name, year, rating, posterPath }: Title): WatchlistEntry {
  return { id, slug, name, year, rating, posterPath };
}

/** Validate one stored item, keeping only known fields. Returns undefined for anything malformed. */
function toEntry(item: unknown): WatchlistEntry | undefined {
  if (typeof item !== "object" || item === null) return undefined;
  const { id, slug, name, year, rating, posterPath } = item as Record<string, unknown>;
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) return undefined;
  if (typeof slug !== "string" || typeof name !== "string") return undefined;
  if (rating !== undefined && (typeof rating !== "number" || !Number.isFinite(rating))) return undefined;
  if (year !== undefined && (typeof year !== "number" || !Number.isInteger(year))) return undefined;
  if (posterPath !== undefined && (typeof posterPath !== "string" || !POSTER_PATH.test(posterPath))) return undefined;
  return { id, slug, name, year, rating, posterPath };
}

/** Parse stored data. Anything missing or malformed reads as empty; bad entries and duplicate ids are dropped. */
export function parseWatchlist(raw: string | null): WatchlistEntry[] {
  if (!raw) return [];
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(value)) return [];
  const entries: WatchlistEntry[] = [];
  for (const item of value) {
    const entry = toEntry(item);
    if (entry && !hasEntry(entries, entry.id)) entries.push(entry);
  }
  return entries;
}

export function serializeWatchlist(entries: readonly WatchlistEntry[]): string {
  return JSON.stringify(entries);
}

export function hasEntry(entries: readonly WatchlistEntry[], id: number): boolean {
  return entries.some((entry) => entry.id === id);
}

export function addEntry(entries: readonly WatchlistEntry[], entry: WatchlistEntry): WatchlistEntry[] {
  return hasEntry(entries, entry.id) ? [...entries] : [...entries, entry];
}

export function removeEntry(entries: readonly WatchlistEntry[], id: number): WatchlistEntry[] {
  return entries.filter((entry) => entry.id !== id);
}

function readRaw(storage: WatchlistStorage | undefined): string | null {
  try {
    return storage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

export function readWatchlist(storage: WatchlistStorage | undefined): WatchlistEntry[] {
  return parseWatchlist(readRaw(storage));
}

/** Returns false when storage is unavailable or refuses the write. */
export function writeWatchlist(storage: WatchlistStorage | undefined, entries: readonly WatchlistEntry[]): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, serializeWatchlist(entries));
    return true;
  } catch {
    return false;
  }
}

interface WatchlistStoreOptions {
  getStorage: () => WatchlistStorage | undefined;
  /** Where cross-tab `storage` events arrive; `window` in the browser. */
  events?: EventTarget;
}

export interface WatchlistStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): readonly WatchlistEntry[];
  getServerSnapshot(): readonly WatchlistEntry[];
  add(entry: WatchlistEntry): void;
  remove(id: number): void;
}

/** An external store for `useSyncExternalStore`. Snapshots are cached by the raw stored string. */
export function createWatchlistStore({ getStorage, events }: WatchlistStoreOptions): WatchlistStore {
  const listeners = new Set<() => void>();
  let cachedRaw: string | null = null;
  let cached: readonly WatchlistEntry[] = EMPTY;

  const emit = () => listeners.forEach((listener) => listener());
  const onStorage = (event: Event) => {
    const { key } = event as StorageEvent;
    if (key === STORAGE_KEY || key === null) emit();
  };

  const getSnapshot = () => {
    const raw = readRaw(getStorage());
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      const parsed = parseWatchlist(raw);
      cached = parsed.length ? parsed : EMPTY;
    }
    return cached;
  };

  const update = (change: (entries: readonly WatchlistEntry[]) => WatchlistEntry[]) => {
    if (writeWatchlist(getStorage(), change(getSnapshot()))) emit();
  };

  return {
    subscribe(listener) {
      if (listeners.size === 0) events?.addEventListener("storage", onStorage);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) events?.removeEventListener("storage", onStorage);
      };
    },
    getSnapshot,
    getServerSnapshot: () => EMPTY,
    add: (entry) => update((entries) => addEntry(entries, entry)),
    remove: (id) => update((entries) => removeEntry(entries, id)),
  };
}
