import Link from "next/link";
import type { CardTitle } from "./card-title";
import { Poster } from "./poster";

/** How many titles after the hero get the large billing. */
const BILLED = 4;

interface RankedTitlesProps {
  /** The page's results after the one in the hero, in sort order. */
  titles: CardTitle[];
  /** The first title's place in the whole sorted list: 2 on page 1, 22 on page 2. */
  firstRank: number;
}

function Rating({ rating }: { rating: number }) {
  return (
    <span>
      <span className="sr-only">Rating {rating.toFixed(1)} out of 10</span>
      <span aria-hidden="true">★ {rating.toFixed(1)}</span>
    </span>
  );
}

/**
 * The home page's results under the hero, each with its place in the sorted list. The first four are billed
 * large, four to a row (two on a phone); the rest run five to a row (three on a phone). One list, so the
 * numbering reads straight through: the grid has 20 columns (6 on a phone) and the two sizes span 5 and 4 (3 and 2).
 */
export function RankedTitles({ titles, firstRank }: RankedTitlesProps) {
  if (titles.length === 0) return null;
  return (
    <ol aria-label="Titles" className="grid grid-cols-6 gap-x-4 gap-y-8 sm:grid-cols-20 sm:gap-x-5">
      {titles.map((title, index) => {
        const billed = index < BILLED;
        return (
          <li key={title.key} className={billed ? "col-span-3 sm:col-span-5" : "col-span-2 sm:col-span-4"}>
            <Link
              href={title.href}
              className="group block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
            >
              <Poster
                colorKey={title.colorKey}
                name={title.name}
                posterUrl={title.posterUrl}
                transitionName={title.transitionName}
                className="transition duration-150 ease-out group-hover:brightness-110 group-focus-visible:brightness-110 motion-reduce:transition-none"
              />
              <div className={`flex items-start ${billed ? "mt-3 gap-3" : "mt-2 gap-2"}`}>
                <span data-testid="rank" className={`font-marquee text-amber-300 ${billed ? "text-5xl leading-[0.85] sm:text-6xl sm:leading-[0.85]" : "text-sm leading-snug"}`}>
                  {firstRank + index}
                </span>
                <div className="min-w-0">
                  <h2 className={`leading-snug group-hover:text-amber-300 group-focus-visible:text-amber-300 ${billed ? "font-semibold" : "text-sm font-medium"}`}>
                    {title.name}
                  </h2>
                  <p className={`mt-1 flex gap-3 text-zinc-400 ${billed ? "text-sm" : "text-xs"}`}>
                    <span>{title.year}</span>
                    {title.rating !== undefined && <Rating rating={title.rating} />}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
