"use client";

import { useSyncExternalStore } from "react";
import { createWatchlistStore, hasEntry } from "./watchlist";

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

/** The saved movie snapshots, in the order they were added. Empty on the server and before hydration. */
export function useWatchlist() {
  const entries = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return {
    entries,
    has: (id: number) => hasEntry(entries, id),
    add: store.add,
    remove: store.remove,
  };
}
