import Link from "next/link";
import { personHref } from "@/lib/catalog/map";
import type { PersonSummary } from "@/lib/catalog/types";
import { Poster } from "./poster";

interface PersonGridProps {
  people: PersonSummary[];
  emptyMessage: string;
}

/** People search results: a card per person (photo or initials, name, department) linking to their page. */
export function PersonGrid({ people, emptyMessage }: PersonGridProps) {
  if (people.length === 0) {
    return <p className="rounded-lg border border-dashed border-zinc-700 p-8 text-center text-zinc-400">{emptyMessage}</p>;
  }
  return (
    <ul aria-label="People" className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {people.map((person) => (
        <li key={person.id}>
          <Link
            href={personHref(person)}
            className="group block rounded-lg transition duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400 motion-safe:hover:-translate-y-1 motion-safe:focus-visible:-translate-y-1 motion-reduce:transition-none"
          >
            {/* Same colour key as the person page, so the placeholder gradient matches it. */}
            <Poster
              colorKey={person.slug}
              name={person.name}
              posterUrl={person.profileUrl}
              className="shadow-black/40 transition duration-150 ease-out group-hover:shadow-lg group-hover:brightness-110 group-focus-visible:shadow-lg group-focus-visible:brightness-110 motion-reduce:transition-none"
            />
            <h2 className="mt-2 text-sm font-semibold leading-snug transition-colors duration-150 group-hover:text-amber-300 group-focus-visible:text-amber-300">
              {person.name}
            </h2>
            {person.knownFor && <p className="mt-1 text-xs text-zinc-400">{person.knownFor}</p>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
