export const STORAGE_KEY = "reelbase:watchlist:v1";

export type WatchlistStorage = Pick<Storage, "getItem" | "setItem">;

const EMPTY: readonly string[] = Object.freeze([]);

/** Parse stored data. Anything missing, malformed or unknown reads as empty. */
export function parseWatchlist(raw: string | null, knownSlugs: ReadonlySet<string>): string[] {
  if (!raw) return [];
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(value)) return [];
  const slugs = value.filter((item): item is string => typeof item === "string" && knownSlugs.has(item));
  return [...new Set(slugs)];
}

export function serializeWatchlist(slugs: readonly string[]): string {
  return JSON.stringify(slugs);
}

export function hasSlug(slugs: readonly string[], slug: string): boolean {
  return slugs.includes(slug);
}

export function addSlug(slugs: readonly string[], slug: string): string[] {
  return hasSlug(slugs, slug) ? [...slugs] : [...slugs, slug];
}

export function removeSlug(slugs: readonly string[], slug: string): string[] {
  return slugs.filter((item) => item !== slug);
}

function readRaw(storage: WatchlistStorage | undefined): string | null {
  try {
    return storage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

export function readWatchlist(storage: WatchlistStorage | undefined, knownSlugs: ReadonlySet<string>): string[] {
  return parseWatchlist(readRaw(storage), knownSlugs);
}

/** Returns false when storage is unavailable or refuses the write. */
export function writeWatchlist(storage: WatchlistStorage | undefined, slugs: readonly string[]): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, serializeWatchlist(slugs));
    return true;
  } catch {
    return false;
  }
}

interface WatchlistStoreOptions {
  getStorage: () => WatchlistStorage | undefined;
  knownSlugs: ReadonlySet<string>;
  /** Where cross-tab `storage` events arrive; `window` in the browser. */
  events?: EventTarget;
}

export interface WatchlistStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): readonly string[];
  getServerSnapshot(): readonly string[];
  add(slug: string): void;
  remove(slug: string): void;
}

/** An external store for `useSyncExternalStore`. Snapshots are cached by the raw stored string. */
export function createWatchlistStore({ getStorage, knownSlugs, events }: WatchlistStoreOptions): WatchlistStore {
  const listeners = new Set<() => void>();
  let cachedRaw: string | null = null;
  let cached: readonly string[] = EMPTY;

  const emit = () => listeners.forEach((listener) => listener());
  const onStorage = (event: Event) => {
    const { key } = event as StorageEvent;
    if (key === STORAGE_KEY || key === null) emit();
  };

  const getSnapshot = () => {
    const raw = readRaw(getStorage());
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      const parsed = parseWatchlist(raw, knownSlugs);
      cached = parsed.length ? parsed : EMPTY;
    }
    return cached;
  };

  const update = (change: (slugs: readonly string[]) => string[]) => {
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
    add: (slug) => update((slugs) => addSlug(slugs, slug)),
    remove: (slug) => update((slugs) => removeSlug(slugs, slug)),
  };
}
