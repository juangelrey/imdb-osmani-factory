import Link from "next/link";
import type { SortKey } from "@/lib/catalog/browse-params";
import type { CardTitle } from "./card-title";
import { Poster } from "./poster";

/** Why the first result leads the list, by sort. True only on page 1; later pages name the page instead. */
const LEAD_REASON: Record<SortKey, string> = {
  popularity: "Most popular right now",
  rating: "Highest rated",
  release: "Newest release",
  title: "First by title",
};

interface BrowseHeroProps {
  /** The page's h1: "All titles", "Drama series", … */
  heading: string;
  /** The first result of the page on view. */
  lead: CardTitle;
  sort: SortKey;
  page: number;
}

/**
 * The home page's marquee: the first result headlines the page, over a blurred wash of its own poster.
 * It breaks out of <main>'s max width to the viewport edges (the body hides the horizontal overflow) and sits
 * flush under the header, so it cancels <main>'s top padding.
 */
export function BrowseHero({ heading, lead, sort, page }: BrowseHeroProps) {
  return (
    <section className="relative isolate mx-[calc(50%-50vw)] -mt-8 overflow-hidden">
      {lead.posterUrl && (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 scale-125 bg-cover bg-center opacity-40 blur-3xl"
          style={{ backgroundImage: `url(${lead.posterUrl})` }}
        />
      )}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
      <div className="mx-auto grid max-w-5xl items-end gap-x-10 gap-y-6 px-4 pb-10 pt-12 sm:grid-cols-[minmax(0,240px)_1fr]">
        <Link
          href={lead.href}
          // The name beside it is the link a screen reader or keyboard needs; this one is the larger pointer target.
          tabIndex={-1}
          aria-hidden="true"
          className="block w-40 -rotate-2 shadow-2xl shadow-black/60 transition duration-200 hover:rotate-0 motion-reduce:transition-none sm:w-auto"
        >
          {/* Detail size loads eagerly: this poster is the page's largest paint. */}
          <Poster size="detail" colorKey={lead.colorKey} name={lead.name} posterUrl={lead.posterUrl} transitionName={lead.transitionName} />
        </Link>
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 text-sm">
            <h1 className="font-semibold text-amber-300">{heading}</h1>
            <p className="text-zinc-300">{page === 1 ? LEAD_REASON[sort] : `Page ${page}`}</p>
          </div>
          <h2 className="mt-3 text-balance font-marquee text-6xl uppercase leading-[0.92] sm:text-7xl lg:text-8xl">
            <Link
              href={lead.href}
              className="hover:text-amber-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
            >
              {lead.name}
            </Link>
          </h2>
          {(lead.year !== undefined || lead.rating !== undefined) && (
            <p className="mt-5 flex items-baseline gap-5 text-lg text-zinc-300">
              {lead.year !== undefined && <span>{lead.year}</span>}
              {lead.rating !== undefined && (
                <span className="text-amber-300">
                  <span className="sr-only">Rating {lead.rating.toFixed(1)} out of 10</span>
                  <span aria-hidden="true">★ {lead.rating.toFixed(1)}</span>
                </span>
              )}
            </p>
          )}
        </div>
      </div>
      {/* A row of marquee bulbs closes the hero. */}
      <div
        aria-hidden="true"
        className="h-3 bg-[radial-gradient(circle,var(--color-amber-300)_2px,transparent_3px)] bg-[length:18px_12px] bg-center"
      />
    </section>
  );
}
