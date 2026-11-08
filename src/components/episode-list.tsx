import Image from "next/image";
import { formatRuntime, formatShortDate } from "@/lib/catalog/format";
import type { Episode, Season } from "@/lib/catalog/types";

interface EpisodeListProps {
  season: Season;
  /** "YYYY-MM-DD"; episodes airing after it are marked Upcoming. */
  today: string;
}

/** The episodes of one season, in order. Fields TMDB leaves out are hidden. */
export function EpisodeList({ season, today }: EpisodeListProps) {
  return (
    <section aria-labelledby="season-heading" className="space-y-4">
      <h2 id="season-heading" className="text-xl font-semibold">
        {season.name}
      </h2>
      {season.episodes.length === 0 ? (
        <p className="text-sm text-zinc-400">No episodes listed yet.</p>
      ) : (
        <ol className="space-y-4">
          {season.episodes.map((episode) => (
            <EpisodeItem key={episode.number} episode={episode} today={today} />
          ))}
        </ol>
      )}
    </section>
  );
}

function EpisodeItem({ episode, today }: { episode: Episode; today: string }) {
  const date = episode.airDate && formatShortDate(episode.airDate);
  const upcoming = Boolean(episode.airDate && episode.airDate > today);
  return (
    <li className="flex flex-col gap-3 sm:flex-row sm:gap-4">
      {episode.stillUrl && (
        <Image
          src={episode.stillUrl}
          alt=""
          width={185}
          height={104}
          unoptimized
          loading="lazy"
          className="aspect-video h-auto w-full max-w-[185px] shrink-0 rounded-md bg-zinc-800 object-cover"
        />
      )}
      <div className="min-w-0 space-y-1">
        <h3 className="font-medium break-words">
          {episode.number}. {episode.name}
        </h3>
        {(date || episode.runtime || upcoming) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400">
            {date && <time dateTime={episode.airDate}>{date}</time>}
            {episode.runtime && <span>{formatRuntime(episode.runtime)}</span>}
            {upcoming && (
              <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-medium text-amber-300">
                Upcoming
              </span>
            )}
          </div>
        )}
        {episode.synopsis && <p className="text-sm leading-relaxed text-zinc-300">{episode.synopsis}</p>}
      </div>
    </li>
  );
}
