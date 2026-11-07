import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { PersonDetails } from "@/components/person-details";
import { parsePersonParam, personHref } from "@/lib/catalog/map";
import { getPerson } from "@/lib/catalog/queries";

interface PersonPageProps {
  params: Promise<{ id: string }>;
}

// Rendered on first request and cached for an hour; no person is prerendered at build time.
export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams(): { id: string }[] {
  return [];
}

async function findPerson(param: string) {
  const parsed = parsePersonParam(param);
  if (!parsed) return { person: undefined, canonical: false };
  const person = await getPerson(parsed.id);
  return { person, canonical: person !== undefined && param === `${person.id}-${person.slug}` };
}

export async function generateMetadata({ params }: PersonPageProps): Promise<Metadata> {
  const { person } = await findPerson((await params).id);
  return { title: person ? `${person.name} · Reelbase` : "Not found · Reelbase" };
}

export default async function PersonPage({ params }: PersonPageProps) {
  const { person, canonical } = await findPerson((await params).id);
  if (!person) notFound();
  if (!canonical) permanentRedirect(personHref(person));
  return <PersonDetails person={person} />;
}
