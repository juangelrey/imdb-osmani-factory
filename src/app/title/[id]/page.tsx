import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { TitleDetails } from "@/components/title-details";
import { WatchlistButton } from "@/components/watchlist-button";
import { parseTitleParam, titleHref } from "@/lib/catalog/map";
import { getTitle } from "@/lib/catalog/queries";
import { entryFromTitle } from "@/lib/watchlist/watchlist";

interface TitlePageProps {
  params: Promise<{ id: string }>;
}

// Rendered on first request and cached for an hour; no movie is prerendered at build time.
export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams(): { id: string }[] {
  return [];
}

async function findTitle(param: string) {
  const parsed = parseTitleParam(param);
  if (!parsed) return { title: undefined, canonical: false };
  const title = await getTitle(parsed.id);
  return { title, canonical: title !== undefined && param === `${title.id}-${title.slug}` };
}

export async function generateMetadata({ params }: TitlePageProps): Promise<Metadata> {
  const { title } = await findTitle((await params).id);
  return { title: title ? `${title.name} · Reelbase` : "Not found · Reelbase" };
}

export default async function TitlePage({ params }: TitlePageProps) {
  const { title, canonical } = await findTitle((await params).id);
  if (!title) notFound();
  if (!canonical) permanentRedirect(titleHref(title));
  return <TitleDetails title={title} actions={<WatchlistButton entry={entryFromTitle(title)} />} />;
}
