import Link from "next/link";
import { browseHref, type BrowseState } from "@/lib/catalog/browse-params";
import type { Genre, SortKey } from "@/lib/catalog/types";

const SORT_LABELS: Record<SortKey, string> = { rating: "Rating", year: "Year", name: "Name" };

interface BrowseControlsProps {
  genres: Genre[];
  state: BrowseState;
}

function Pill({ href, active, children }: { href: string; active: boolean; children: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-block rounded-full border px-3 py-1 text-xs ${
        active
          ? "border-amber-400 bg-amber-400 font-semibold text-zinc-950"
          : "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

export function BrowseControls({ genres, state }: BrowseControlsProps) {
  return (
    <div className="space-y-3">
      <nav aria-label="Genre">
        <ul className="flex flex-wrap gap-2">
          <li>
            <Pill href={browseHref({ ...state, genre: undefined })} active={!state.genre}>
              All
            </Pill>
          </li>
          {genres.map((genre) => (
            <li key={genre}>
              <Pill href={browseHref({ ...state, genre })} active={state.genre === genre}>
                {genre}
              </Pill>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label="Sort" className="flex items-center gap-2 text-xs text-zinc-400">
        <span>Sort by</span>
        <ul className="flex flex-wrap gap-2">
          {(Object.keys(SORT_LABELS) as SortKey[]).map((sort) => (
            <li key={sort}>
              <Pill href={browseHref({ ...state, sort })} active={state.sort === sort}>
                {SORT_LABELS[sort]}
              </Pill>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
