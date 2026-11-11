import Link from "next/link";
import type { ReactNode } from "react";
import { SORT_KEYS, browseHref, toggleId, type BrowseState, type SortKey } from "@/lib/catalog/browse-params";
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
  /** The Movies / TV switch, shown at the start of the bar's first row. */
  children?: ReactNode;
}

interface PillProps {
  href: string;
  active: boolean;
  /** The link's accessible name when its content would announce it twice (a logo whose alt repeats the text). */
  label?: string;
  children: ReactNode;
}

/** A browse filter link, marked current while its value is selected: the service filter uses it. */
export function Pill({ href, active, label, children }: PillProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      aria-label={label}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${
        active
          ? "border-amber-400 bg-amber-400 font-semibold text-zinc-950"
          : "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-strong"
      }`}
    >
      {children}
    </Link>
  );
}

const FOCUS = "rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400";

/**
 * The home page's filter bar, which stays at the top of the window while the results scroll. Its first row holds
 * `children` (the Movies / TV switch) and the sort; under it the genres run on one line that scrolls sideways.
 * A genre link toggles its genre in the selection, and "All" clears it. Any change starts again from page 1.
 */
export function BrowseControls({ genres, state, children }: BrowseControlsProps) {
  const genreClass = (active: boolean) =>
    `${FOCUS} ${active ? "font-semibold text-amber-300" : "text-zinc-400 hover:text-strong"}`;
  return (
    <div className="sticky top-0 z-10 -mx-4 space-y-2 bg-zinc-950/90 px-4 py-3 backdrop-blur">
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        {children}
        <nav aria-label="Sort">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {SORT_KEYS.map((sort) => (
              <li key={sort}>
                <Link
                  href={browseHref({ ...state, sort, page: 1 })}
                  aria-current={state.sort === sort ? "true" : undefined}
                  className={`${FOCUS} ${
                    state.sort === sort
                      ? "text-strong underline decoration-amber-400 decoration-2 underline-offset-8"
                      : "text-zinc-400 hover:text-strong"
                  }`}
                >
                  {SORT_LABELS[sort]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      {/* The padding keeps focus outlines inside the scroll box, which would clip them. */}
      <nav aria-label="Genre" className="-mx-4 overflow-x-auto px-4 py-1 [scrollbar-width:none]">
        <ul className="flex gap-5 whitespace-nowrap text-sm">
          <li>
            <Link
              href={browseHref({ ...state, genres: [], page: 1 })}
              aria-current={state.genres.length === 0 ? "true" : undefined}
              className={genreClass(state.genres.length === 0)}
            >
              All
            </Link>
          </li>
          {genres.map((genre) => (
            <li key={genre.id}>
              <Link
                href={browseHref({ ...state, genres: toggleId(state.genres, genre.id), page: 1 })}
                aria-current={state.genres.includes(genre.id) ? "true" : undefined}
                className={genreClass(state.genres.includes(genre.id))}
              >
                {genre.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
