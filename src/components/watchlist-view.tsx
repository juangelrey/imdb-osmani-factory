"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { getTitleBySlug, listTitles } from "@/lib/catalog/queries";
import type { Title } from "@/lib/catalog/types";
import { useWatchlist } from "@/lib/watchlist/use-watchlist";
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

export function WatchlistView() {
  const hydrated = useHydrated();
  const { slugs } = useWatchlist();

  if (!hydrated) {
    return (
      <p role="status" className="text-zinc-400">
        Loading your watchlist…
      </p>
    );
  }

  const catalogue = listTitles();
  const titles = slugs
    .map((slug) => getTitleBySlug(catalogue, slug))
    .filter((title): title is Title => title !== undefined);

  if (titles.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-700 p-8 text-center">
        <p className="text-zinc-400">Your watchlist is empty.</p>
        <Link href="/" className="mt-3 inline-block font-semibold text-amber-400 hover:text-amber-300">
          Browse titles
        </Link>
      </div>
    );
  }

  return <TitleGrid titles={titles} emptyMessage="Your watchlist is empty." />;
}
