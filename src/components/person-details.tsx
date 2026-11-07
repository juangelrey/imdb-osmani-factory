import type { Person } from "@/lib/catalog/types";
import { CareerTimeline } from "./career-timeline";
import { Poster } from "./poster";

interface PersonDetailsProps {
  person: Person;
}

export function PersonDetails({ person }: PersonDetailsProps) {
  const facts = (
    [
      ["Known for", person.knownFor],
      ["Born", person.born],
      ["Died", person.died],
      ["Birthplace", person.birthplace],
    ] satisfies [string, string | undefined][]
  ).filter((fact): fact is [string, string] => Boolean(fact[1]));

  return (
    <article className="grid gap-6 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-8">
      <Poster
        colorKey={person.slug}
        name={person.name}
        posterUrl={person.profileUrl}
        size="profile"
        alt={person.name}
        className="mx-auto w-40 text-5xl sm:w-full"
      />
      <div className="min-w-0 space-y-5">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold leading-tight">{person.name}</h1>
          {facts.length > 0 && (
            <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
              {facts.map(([term, value]) => (
                <div key={term} className="contents">
                  <dt className="font-semibold text-zinc-400">{term}</dt>
                  <dd className="text-zinc-200">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </header>
        <CareerTimeline career={person.career} />
      </div>
    </article>
  );
}
