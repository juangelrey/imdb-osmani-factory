"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useWatchlist } from "@/lib/watchlist/use-watchlist";
import { cardFromEntry } from "./card-title";
import { TitleGrid } from "./title-grid";

const noopSubscribe = () => () => {};

/** False during the server render and hydration, true once running in the browser. */
function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/** Renders the saved snapshots; needs no catalogue or API data. */
export function WatchlistView() {
  const hydrated = useHydrated();
  const { entries } = useWatchlist();

  if (!hydrated) {
    return (
      <p role="status" className="text-zinc-400">
        Loading your watchlist…
      </p>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-700 p-8 text-center">
        <p className="text-zinc-400">Your watchlist is empty.</p>
        <Link href="/" className="mt-3 inline-block font-semibold text-amber-400 hover:text-amber-300">
          Browse titles
        </Link>
      </div>
    );
  }

  return <TitleGrid titles={entries.map(cardFromEntry)} emptyMessage="" />;
}
