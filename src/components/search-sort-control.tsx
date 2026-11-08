import Link from "next/link";
import { SEARCH_SORT_KEYS, type SearchSortKey } from "@/lib/catalog/search-params";

const SORT_LABELS: Record<SearchSortKey, string> = {
  recency: "Recency",
  rating: "Rating",
  relevance: "Relevance",
};

interface SearchSortControlProps {
  current: SearchSortKey;
  /** The URL for each sort. Callers keep the query and kind and reset the page. */
  hrefForSort: (sort: SearchSortKey) => string;
}

/** Links to each search sort, in `SEARCH_SORT_KEYS` order, the current one marked `aria-current`. */
export function SearchSortControl({ current, hrefForSort }: SearchSortControlProps) {
  return (
    <nav aria-label="Sort results" className="flex items-center gap-2 text-xs text-zinc-400">
      <span>Sort by</span>
      <ul className="flex flex-wrap gap-2">
        {SEARCH_SORT_KEYS.map((sort) => {
          const active = sort === current;
          return (
            <li key={sort}>
              <Link
                href={hrefForSort(sort)}
                aria-current={active ? "true" : undefined}
                className={`inline-block rounded-full border px-3 py-1 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${
                  active
                    ? "border-amber-400 bg-amber-400 font-semibold text-zinc-950"
                    : "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
                }`}
              >
                {SORT_LABELS[sort]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
