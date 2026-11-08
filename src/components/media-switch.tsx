import Link from "next/link";
import type { SearchKind } from "@/lib/catalog/search-params";
import type { TitleKind } from "@/lib/catalog/types";

const KINDS: { kind: TitleKind; label: string }[] = [
  { kind: "movie", label: "Movies" },
  { kind: "tv", label: "TV" },
];

interface MediaSwitchProps {
  /** The kind on view; on People search, neither Movies nor TV is marked. */
  current: SearchKind;
  /** The URL for each kind. Callers decide what to keep (the query, the sort) and what to reset (the page). */
  hrefForKind: (kind: TitleKind) => string;
}

/** Movies / TV links, the current kind marked `aria-current`. Shared by search and browse. */
export function MediaSwitch({ current, hrefForKind }: MediaSwitchProps) {
  return (
    <nav aria-label="Movies or TV">
      <ul className="inline-flex rounded-md border border-zinc-700 p-0.5 text-sm">
        {KINDS.map(({ kind, label }) => {
          const selected = kind === current;
          return (
            <li key={kind}>
              <Link
                href={hrefForKind(kind)}
                aria-current={selected ? "page" : undefined}
                className={`block rounded px-3 py-1 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${
                  selected ? "bg-amber-400/15 text-amber-200" : "text-zinc-300 hover:text-amber-300"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
