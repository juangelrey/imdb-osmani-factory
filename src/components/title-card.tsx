import Link from "next/link";
import type { CardTitle } from "./card-title";
import { Poster } from "./poster";

export function TitleCard({ title }: { title: CardTitle }) {
  return (
    <Link
      href={title.href}
      className="group block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
    >
      <Poster
        colorKey={title.colorKey}
        name={title.name}
        posterUrl={title.posterUrl}
        className="transition group-hover:brightness-110"
      />
      <h2 className="mt-2 text-sm font-semibold leading-snug group-hover:text-amber-300">{title.name}</h2>
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
