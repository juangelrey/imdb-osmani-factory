import Link from "next/link";
import { SORT_KEYS, browseHref, type BrowseState, type SortKey } from "@/lib/catalog/browse-params";
import type { Genre } from "@/lib/catalog/types";

const SORT_LABELS: Record<SortKey, string> = {
  popularity: "Popular",
  rating: "Top rated",
  release: "Newest",
  title: "Title",
};

interface BrowseControlsProps {
  genres: Genre[];
  state: BrowseState;
}

function Pill({ href, active, children }: { href: string; active: boolean; children: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`inline-block rounded-full border px-3 py-1 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${
        active
          ? "border-amber-400 bg-amber-400 font-semibold text-zinc-950"
          : "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-strong"
      }`}
    >
      {children}
    </Link>
  );
}

/** The selection with `id` removed if present, else added; ascending, as `BrowseState.genres` is. */
function toggleGenre(selected: readonly number[], id: number): number[] {
  return selected.includes(id) ? selected.filter((other) => other !== id) : [...selected, id].sort((a, b) => a - b);
}

/** Genre pills toggle their genre in the selection, and "All" clears it. Any change starts again from page 1. */
export function BrowseControls({ genres, state }: BrowseControlsProps) {
  return (
    <div className="space-y-3">
      <nav aria-label="Genre">
        <ul className="flex flex-wrap gap-2">
          <li>
            <Pill href={browseHref({ ...state, genres: [], page: 1 })} active={state.genres.length === 0}>
              All
            </Pill>
          </li>
          {genres.map((genre) => (
            <li key={genre.id}>
              <Pill
                href={browseHref({ ...state, genres: toggleGenre(state.genres, genre.id), page: 1 })}
                active={state.genres.includes(genre.id)}
              >
                {genre.name}
              </Pill>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label="Sort" className="flex items-center gap-2 text-xs text-zinc-400">
        <span>Sort by</span>
        <ul className="flex flex-wrap gap-2">
          {SORT_KEYS.map((sort) => (
            <li key={sort}>
              <Pill href={browseHref({ ...state, sort, page: 1 })} active={state.sort === sort}>
                {SORT_LABELS[sort]}
              </Pill>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
