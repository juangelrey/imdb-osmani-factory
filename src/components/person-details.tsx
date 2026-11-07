import type { Person } from "@/lib/catalog/types";
import { CareerTimeline } from "./career-timeline";
import { Poster } from "./poster";

interface PersonDetailsProps {
  person: Person;
}

export function PersonDetails({ person }: PersonDetailsProps) {
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
        </header>
        <CareerTimeline career={person.career} />
      </div>
    </article>
  );
}
