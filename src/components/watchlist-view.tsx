"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { TitleSummary } from "@/lib/seed-catalog/types";
import { useWatchlist } from "@/lib/watchlist/use-watchlist";
import { cardFromSeed } from "./card-title";
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

interface WatchlistViewProps {
  /** The catalogue, slimmed to card fields by the server page. */
  titles: TitleSummary[];
}

export function WatchlistView({ titles }: WatchlistViewProps) {
  const hydrated = useHydrated();
  const { slugs } = useWatchlist();

  if (!hydrated) {
    return (
      <p role="status" className="text-zinc-400">
        Loading your watchlist…
      </p>
    );
  }

  const bySlug = new Map(titles.map((title) => [title.slug, title]));
  const saved = slugs.flatMap((slug) => bySlug.get(slug) ?? []);

  if (saved.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-700 p-8 text-center">
        <p className="text-zinc-400">Your watchlist is empty.</p>
        <Link href="/" className="mt-3 inline-block font-semibold text-amber-400 hover:text-amber-300">
          Browse titles
        </Link>
      </div>
    );
  }

  return <TitleGrid titles={saved.map(cardFromSeed)} emptyMessage="" />;
}
