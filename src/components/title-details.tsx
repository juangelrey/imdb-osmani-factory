import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { formatRuntime } from "@/lib/catalog/format";
import { personHref } from "@/lib/catalog/map";
import type { PersonLink, Title } from "@/lib/catalog/types";
import { Poster } from "./poster";

/** A labelled fact; an undefined value hides the row. */
export type Fact = [term: string, value: ReactNode];

interface DetailsLayoutProps {
  /** Seeds the fallback poster gradient. */
  colorKey: string;
  name: string;
  posterUrl?: string;
  synopsis?: string;
  facts: Fact[];
  /** Controls shown under the heading, such as the watchlist button. */
  actions?: ReactNode;
}

/** Comma-separated links to each person's page, or undefined when there is nobody to list. */
export function personLinks(people: PersonLink[]): ReactNode {
  if (people.length === 0) return undefined;
  return people.map((person, index) => (
    <Fragment key={person.id}>
      {index > 0 && ", "}
      <Link
        href={personHref(person)}
        className="hover:text-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
      >
        {person.name}
      </Link>
    </Fragment>
  ));
}

/** "8.2 / 10", or undefined when nobody has voted. */
export function ratingFact(rating: number | undefined): string | undefined {
  return rating === undefined ? undefined : `${rating.toFixed(1)} / 10`;
}

/** The detail page layout shared by movies and shows: poster, heading, actions, synopsis and facts. */
export function DetailsLayout({ colorKey, name, posterUrl, synopsis, facts, actions }: DetailsLayoutProps) {
  return (
    <article className="grid gap-6 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-8">
      <Poster
        colorKey={colorKey}
        name={name}
        posterUrl={posterUrl}
        size="detail"
        className="mx-auto w-40 text-5xl sm:w-full"
      />
      <div className="min-w-0 space-y-5">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold leading-tight">{name}</h1>
          {actions}
        </header>
        {synopsis && <p className="leading-relaxed text-zinc-300">{synopsis}</p>}
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

interface TitleDetailsProps {
  title: Title;
  /** Controls shown under the heading, such as the watchlist button. */
  actions?: ReactNode;
}

export function TitleDetails({ title, actions }: TitleDetailsProps) {
  const facts: Fact[] = [
    ["Year", title.year?.toString()],
    ["Runtime", title.runtime ? formatRuntime(title.runtime) : undefined],
    ["Genres", title.genres.map(({ name }) => name).join(", ") || undefined],
    ["Rating", ratingFact(title.rating)],
    [title.directors.length > 1 ? "Directors" : "Director", personLinks(title.directors)],
    ["Cast", personLinks(title.cast)],
  ];

  return (
    <DetailsLayout
      colorKey={title.slug}
      name={title.name}
      posterUrl={title.posterUrl}
      synopsis={title.synopsis}
      facts={facts}
      actions={actions}
    />
  );
}
