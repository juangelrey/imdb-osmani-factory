import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TitleDetails } from "@/components/title-details";
import { getTitleBySlug, listTitles } from "@/lib/catalog/queries";

interface TitlePageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return listTitles().map(({ slug }) => ({ slug }));
}

async function findTitle(params: TitlePageProps["params"]) {
  const { slug } = await params;
  return getTitleBySlug(listTitles(), slug);
}

export async function generateMetadata({ params }: TitlePageProps): Promise<Metadata> {
  const title = await findTitle(params);
  return { title: title ? `${title.name} · Reelbase` : "Not found · Reelbase" };
}

export default async function TitlePage({ params }: TitlePageProps) {
  const title = await findTitle(params);
  if (!title) notFound();
  return <TitleDetails title={title} />;
}
