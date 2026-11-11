import Link from "next/link";
import type { SearchKind } from "@/lib/catalog/search-params";

const LABELS: Record<SearchKind, string> = { movie: "Movies", tv: "TV", person: "People" };

/** "Movies or TV", "Movies, TV or People": the switch's accessible name, from the kinds it shows. */
function navLabel(kinds: readonly SearchKind[]): string {
  const labels = kinds.map((kind) => LABELS[kind]);
  return labels.length < 2 ? labels.join("") : `${labels.slice(0, -1).join(", ")} or ${labels.at(-1)}`;
}

interface MediaSwitchProps<K extends SearchKind> {
  /** The kinds to offer, in order: browse shows Movies and TV, search adds People. */
  kinds: readonly K[];
  /** The kind on view; a kind not in `kinds` marks none. */
  current: SearchKind;
  /** The URL for each kind. Callers decide what to keep (the query, the sort) and what to reset (the page). */
  hrefForKind: (kind: K) => string;
  /** The home page's look: the kinds as large marquee lettering instead of a boxed switch. */
  marquee?: boolean;
}

/** Links to each kind, the current one marked `aria-current`. Shared by search and browse. */
export function MediaSwitch<K extends SearchKind>({ kinds, current, hrefForKind, marquee = false }: MediaSwitchProps<K>) {
  return (
    <nav aria-label={navLabel(kinds)}>
      <ul className={marquee ? "flex gap-5 font-marquee text-3xl uppercase" : "inline-flex rounded-md border border-zinc-700 p-0.5 text-sm"}>
        {kinds.map((kind) => {
          const selected = kind === current;
          return (
            <li key={kind}>
              <Link
                href={hrefForKind(kind)}
                aria-current={selected ? "page" : undefined}
                className={`block rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${
                  marquee
                    ? selected
                      ? "text-amber-300"
                      : "text-zinc-500 hover:text-zinc-300"
                    : `px-3 py-1 font-medium ${selected ? "bg-amber-400/15 text-amber-200" : "text-zinc-300 hover:text-amber-300"}`
                }`}
              >
                {LABELS[kind]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
