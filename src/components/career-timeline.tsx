import Link from "next/link";
import { titleHref } from "@/lib/catalog/map";
import type { CareerYear } from "@/lib/catalog/types";
import { Poster } from "./poster";

interface CareerTimelineProps {
  career: CareerYear[];
}

/** Every film credit, one row per film, under year headings, newest first. Hidden without credits. */
export function CareerTimeline({ career }: CareerTimelineProps) {
  if (career.length === 0) return null;

  return (
    <section aria-labelledby="career-heading" className="space-y-4">
      <h2 id="career-heading" className="text-xl font-semibold">
        Career
      </h2>
      {career.map((year) => (
        <div key={year.label} className="space-y-2">
          <h3 className="border-b border-zinc-800 pb-1 text-sm font-semibold tracking-wide text-zinc-400">
            {year.label}
          </h3>
          <ul className="space-y-2">
            {year.entries.map(({ title, upcoming, roles }) => (
              <li key={title.id} className="flex items-center gap-3">
                <Poster
                  colorKey={title.slug}
                  name={title.name}
                  posterUrl={title.posterUrl}
                  size="thumb"
                  className="w-12 shrink-0"
                />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <Link
                      href={titleHref(title)}
                      className="font-medium hover:text-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                    >
                      {title.name}
                    </Link>
                    {upcoming && (
                      <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-medium text-amber-300">
                        Upcoming
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-zinc-400">{roles.join(" · ")}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
