"use client";

import { useWatchlist } from "@/lib/watchlist/use-watchlist";
import type { WatchlistEntry } from "@/lib/watchlist/watchlist";

export function WatchlistButton({ entry }: { entry: WatchlistEntry }) {
  const { has, add, remove } = useWatchlist();
  const saved = has(entry.id);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label="Save to watchlist"
      onClick={() => (saved ? remove(entry.id) : add(entry))}
      className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition ${
        saved
          ? "border-amber-400 bg-amber-400 text-zinc-950 hover:bg-amber-300"
          : "border-zinc-600 text-zinc-100 hover:border-amber-400 hover:text-amber-300"
      }`}
    >
      <span aria-hidden="true">{saved ? "★ Saved" : "☆ Save to watchlist"}</span>
    </button>
  );
}
