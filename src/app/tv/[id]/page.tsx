import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { EpisodeList } from "@/components/episode-list";
import { SeasonPicker } from "@/components/season-picker";
import { ShowDetails } from "@/components/show-details";
import { parseSeasonParam, parseShowParam, showHref } from "@/lib/catalog/map";
import { getShow } from "@/lib/catalog/queries";

interface ShowPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// `?season` makes this page dynamic: it renders per request (never at build time), and its TMDB
// responses stay in the fetch cache for an hour, so a repeat view makes no TMDB call.
export const revalidate = 3600;

/** Today's date as "YYYY-MM-DD" (UTC), which decides which episodes are upcoming. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** `season` is the parsed `?season`; undefined (absent or malformed) means the default season. */
async function findShow(param: string, season: number | undefined) {
  const parsed = parseShowParam(param);
  if (!parsed) return { show: undefined, canonical: false };
  const show = await getShow(parsed.id, season);
  return { show, canonical: show !== undefined && param === `${show.id}-${show.slug}` };
}

export async function generateMetadata({ params, searchParams }: ShowPageProps): Promise<Metadata> {
  const { show } = await findShow((await params).id, parseSeasonParam((await searchParams).season));
  return { title: show ? `${show.name} · Reelbase` : "Not found · Reelbase" };
}

export default async function ShowPage({ params, searchParams }: ShowPageProps) {
  const season = parseSeasonParam((await searchParams).season);
  const { show, canonical } = await findShow((await params).id, season);
  if (!show) notFound();
  const href = showHref(show);
  if (!canonical) permanentRedirect(season === undefined ? href : `${href}?season=${season}`);
  return (
    <div className="space-y-10">
      <ShowDetails show={show} />
      {show.season && (
        <div className="space-y-6">
          <SeasonPicker href={href} seasons={show.seasons} current={show.season.number} />
          <EpisodeList season={show.season} today={today()} />
        </div>
      )}
    </div>
  );
}
