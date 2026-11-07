import type { ReactNode } from "react";
import { formatRuntime } from "@/lib/catalog/format";
import type { Title } from "@/lib/catalog/types";
import { Poster } from "./poster";

interface TitleDetailsProps {
  title: Title;
  /** Controls shown under the heading, such as the watchlist button. */
  actions?: ReactNode;
}

export function TitleDetails({ title, actions }: TitleDetailsProps) {
  const facts: [string, string | undefined][] = [
    ["Year", title.year?.toString()],
    ["Runtime", title.runtime ? formatRuntime(title.runtime) : undefined],
    ["Genres", title.genres.map(({ name }) => name).join(", ") || undefined],
    ["Rating", `${title.rating.toFixed(1)} / 10`],
    ["Director", title.director],
    ["Cast", title.cast.join(", ") || undefined],
  ];

  return (
    <article className="grid gap-6 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-8">
      <Poster
        colorKey={title.slug}
        name={title.name}
        posterUrl={title.posterUrl}
        size="detail"
        className="mx-auto w-40 text-5xl sm:w-full"
      />
      <div className="min-w-0 space-y-5">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold leading-tight">{title.name}</h1>
          {actions}
        </header>
        {title.synopsis && <p className="leading-relaxed text-zinc-300">{title.synopsis}</p>}
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
          {facts.flatMap(([term, value]) =>
            value === undefined
              ? []
              : [
                  <div key={term} className="contents">
                    <dt className="font-semibold text-zinc-400">{term}</dt>
                    <dd className="text-zinc-200">{value}</dd>
                  </div>,
                ],
          )}
        </dl>
      </div>
    </article>
  );
}
