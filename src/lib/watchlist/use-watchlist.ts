"use client";

import { useSyncExternalStore } from "react";
import { createWatchlistStore, hasSlug } from "./watchlist";

function browserStorage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    // Accessing localStorage throws when storage is blocked.
    return undefined;
  }
}

const store = createWatchlistStore({
  getStorage: browserStorage,
  events: typeof window === "undefined" ? undefined : window,
});

/**
 * The saved slugs, in the order they were added. Empty on the server and before hydration.
 * Slugs are not checked against the catalogue here; views drop unknown ones when resolving titles.
 */
export function useWatchlist() {
  const slugs = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return {
    slugs,
    has: (slug: string) => hasSlug(slugs, slug),
    add: store.add,
    remove: store.remove,
  };
}
