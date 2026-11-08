import Link from "next/link";
import { formatShortDate } from "@/lib/catalog/format";
import { careerKinds, filterCareer, summaryHref } from "@/lib/catalog/map";
import type { CareerEntry, CareerYear, CreditsFilter } from "@/lib/catalog/types";
import { Poster } from "./poster";
import { TitlePreview } from "./title-preview";

interface CareerTimelineProps {
  career: CareerYear[];
  /** The `?credits=` filter; defaults to all. */
  credits?: CreditsFilter;
  /** The URL for each filter. Without it, no filter links are shown. */
  hrefForCredits?: (credits: CreditsFilter) => string;
}

const FILTERS: { credits: CreditsFilter; label: string; empty: string }[] = [
  { credits: "all", label: "All", empty: "No credits." },
  { credits: "movie", label: "Movies", empty: "No movie credits." },
  { credits: "tv", label: "TV", empty: "No TV credits." },
];

/** Three columns: the date, the line with the nodes, and the film. The line sits in the middle one. */
const ROW = "grid grid-cols-[4.5rem_1.5rem_minmax(0,1fr)] sm:grid-cols-[6rem_2rem_minmax(0,1fr)]";
/** The centre of the middle column, where the line runs. */
const LINE_X = "left-[5.25rem] sm:left-[7rem]";

/**
 * Every film and TV credit as a vertical timeline, newest first: a date column, a line with one node
 * per title and a year marker at each year change, then the title, with a "TV" badge on shows.
 * An All / Movies / TV filter sits above it when the person has credits of both kinds. Hidden without credits.
 */
export function CareerTimeline({ career, credits = "all", hrefForCredits }: CareerTimelineProps) {
  if (career.length === 0) return null;
  const shown = filterCareer(career, credits);
  const showFilter = hrefForCredits !== undefined && careerKinds(career).size > 1;

  return (
    <section aria-labelledby="career-heading" className="space-y-4">
      <h2 id="career-heading" className="text-xl font-semibold">
        Career
      </h2>
      {showFilter && <CreditsFilterLinks current={credits} hrefForCredits={hrefForCredits} />}
      {shown.length === 0 ? (
        <p className="text-sm text-zinc-400">
          {FILTERS.find((filter) => filter.credits === credits)?.empty}{" "}
          {hrefForCredits && (
            <Link
              href={hrefForCredits("all")}
              className="text-amber-300 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              Show all credits
            </Link>
          )}
        </p>
      ) : (
        <div className="relative">
          <div
            aria-hidden="true"
            data-timeline-line
            className={`absolute inset-y-0 ${LINE_X} w-px -translate-x-1/2 bg-zinc-800`}
          />
          <ol className="relative space-y-3">
            {shown.flatMap((year) =>
              year.entries.map((entry, index) => (
                <TimelineEntry
                  key={`${entry.title.kind}-${entry.title.id}`}
                  entry={entry}
                  yearMarker={index === 0 ? year.label : undefined}
                />
              )),
            )}
          </ol>
        </div>
      )}
    </section>
  );
}

interface CreditsFilterLinksProps {
  current: CreditsFilter;
  hrefForCredits: (credits: CreditsFilter) => string;
}

/** "All · Movies · TV" links, the current one marked `aria-current`; styled like the Movies / TV switch. */
function CreditsFilterLinks({ current, hrefForCredits }: CreditsFilterLinksProps) {
  return (
    <nav aria-label="Filter credits">
      <ul className="inline-flex rounded-md border border-zinc-700 p-0.5 text-sm">
        {FILTERS.map(({ credits, label }) => {
          const selected = credits === current;
          return (
            <li key={credits}>
              <Link
                href={hrefForCredits(credits)}
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

interface TimelineEntryProps {
  entry: CareerEntry;
  /** The year label, on the first title of each year: a marker on the line, above the title. */
  yearMarker?: string;
}

function TimelineEntry({
  entry: { title, releaseDate, upcoming, roles, synopsis, previewPosterUrl },
  yearMarker,
}: TimelineEntryProps) {
  const date = releaseDate && formatShortDate(releaseDate);
  const href = summaryHref(title);

  return (
    <li className={`${ROW} items-center gap-y-3 ${yearMarker ? "pt-2 first:pt-0" : ""}`}>
      {yearMarker && (
        <h3 className="col-start-2 flex justify-center">
          <span className="whitespace-nowrap rounded-full border border-zinc-700 bg-zinc-950 px-2 py-0.5 text-xs font-semibold tracking-wide text-zinc-300">
            {yearMarker}
          </span>
        </h3>
      )}
      <p className="col-start-1 pr-2 text-right text-xs tabular-nums text-zinc-400 sm:text-sm">
        {date ? <time dateTime={releaseDate}>{date}</time> : <span data-date>TBA</span>}
      </p>
      <div className="flex justify-center">
        <span
          aria-hidden="true"
          data-timeline-node
          className={`size-3 rounded-full border-2 ${
            upcoming ? "border-amber-400 bg-zinc-950" : "border-zinc-950 bg-zinc-500"
          }`}
        />
      </div>
      <div className="flex min-w-0 items-center gap-3">
        <TitlePreview
          colorKey={title.slug}
          name={title.name}
          href={href}
          year={title.year}
          rating={title.rating}
          synopsis={synopsis}
          posterUrl={previewPosterUrl}
        >
          <Poster
            colorKey={title.slug}
            name={title.name}
            posterUrl={title.posterUrl}
            size="thumb"
            className="w-10 shrink-0"
          />
        </TitlePreview>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href={href}
              className="font-medium break-words hover:text-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              {title.name}
            </Link>
            {title.kind === "tv" && (
              <span className="rounded-full border border-zinc-700 px-1.5 py-px text-[0.6875rem] font-semibold tracking-wide text-zinc-300">
                TV
              </span>
            )}
            {upcoming && (
              <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-medium text-amber-300">
                Upcoming
              </span>
            )}
          </p>
          <p className="text-sm break-words text-zinc-400">{roles.join(" · ")}</p>
        </div>
      </div>
    </li>
  );
}
