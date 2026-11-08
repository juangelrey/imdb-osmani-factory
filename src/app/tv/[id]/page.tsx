import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ShowDetails } from "@/components/show-details";
import { parseShowParam, showHref } from "@/lib/catalog/map";
import { getShow } from "@/lib/catalog/queries";

interface ShowPageProps {
  params: Promise<{ id: string }>;
}

// Rendered on first request and cached for an hour; no show is prerendered at build time.
export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams(): { id: string }[] {
  return [];
}

async function findShow(param: string) {
  const parsed = parseShowParam(param);
  if (!parsed) return { show: undefined, canonical: false };
  const show = await getShow(parsed.id);
  return { show, canonical: show !== undefined && param === `${show.id}-${show.slug}` };
}

export async function generateMetadata({ params }: ShowPageProps): Promise<Metadata> {
  const { show } = await findShow((await params).id);
  return { title: show ? `${show.name} · Reelbase` : "Not found · Reelbase" };
}

export default async function ShowPage({ params }: ShowPageProps) {
  const { show, canonical } = await findShow((await params).id);
  if (!show) notFound();
  if (!canonical) permanentRedirect(showHref(show));
  return <ShowDetails show={show} />;
}
