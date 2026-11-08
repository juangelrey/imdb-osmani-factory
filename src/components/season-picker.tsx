import Link from "next/link";
import type { SeasonSummary } from "@/lib/catalog/types";

interface SeasonPickerProps {
  /** The show's canonical path; each season links to `<href>?season=N`. */
  href: string;
  /** In picker order, Specials last. */
  seasons: SeasonSummary[];
  /** The selected season's number. */
  current: number;
}

/** Links to every season of a show, the selected one marked `aria-current`. Renders nothing without seasons. */
export function SeasonPicker({ href, seasons, current }: SeasonPickerProps) {
  if (seasons.length === 0) return null;
  return (
    <nav aria-label="Seasons">
      <ul className="flex flex-wrap gap-2">
        {seasons.map((season) => {
          const selected = season.number === current;
          return (
            <li key={season.number}>
              <Link
                href={`${href}?season=${season.number}`}
                aria-current={selected ? "page" : undefined}
                className={`flex flex-col rounded-md border px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${
                  selected
                    ? "border-amber-400 bg-amber-400/15 text-amber-200"
                    : "border-zinc-700 text-zinc-200 hover:border-zinc-500 hover:text-amber-300"
                }`}
              >
                <span className="font-medium">{season.name}</span>
                <span className="text-xs text-zinc-400">
                  {season.episodeCount} {season.episodeCount === 1 ? "episode" : "episodes"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
