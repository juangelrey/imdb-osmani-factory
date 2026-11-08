import Link from "next/link";
import type { CardTitle } from "./card-title";
import { Poster } from "./poster";

export function TitleCard({ title }: { title: CardTitle }) {
  return (
    <Link
      href={title.href}
      // Default prefetch: it stops at the route's loading.tsx, so the poster morph plays only when the detail page
      // is already loaded and the skeleton shows otherwise. Full prefetch was declined (#40 decision 11).
      // Lifts and brightens on hover and keyboard focus; with reduced motion it brightens without moving.
      className="group block rounded-lg transition duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400 motion-safe:hover:-translate-y-1 motion-safe:focus-visible:-translate-y-1 motion-reduce:transition-none"
    >
      <Poster
        colorKey={title.colorKey}
        name={title.name}
        posterUrl={title.posterUrl}
        transitionName={title.transitionName}
        className="shadow-black/40 transition duration-150 ease-out group-hover:shadow-lg group-hover:brightness-110 group-focus-visible:shadow-lg group-focus-visible:brightness-110 motion-reduce:transition-none"
      />
      <h2 className="mt-2 text-sm font-semibold leading-snug transition-colors duration-150 group-hover:text-amber-300 group-focus-visible:text-amber-300">
        {title.name}
      </h2>
      <p className="mt-1 flex items-center justify-between text-xs text-zinc-400">
        <span>{title.year}</span>
        {title.rating !== undefined && (
          <span>
            <span className="sr-only">Rating {title.rating.toFixed(1)} out of 10</span>
            <span aria-hidden="true">★ {title.rating.toFixed(1)}</span>
          </span>
        )}
      </p>
    </Link>
  );
}
