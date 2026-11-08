import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { PersonDetails } from "@/components/person-details";
import { parseCreditsParam, parsePersonParam, personHref } from "@/lib/catalog/map";
import { getPerson } from "@/lib/catalog/queries";

interface PersonPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// `?credits` makes this page dynamic: it renders per request (never at build time), and its TMDB
// response stays in the fetch cache for an hour, so a repeat view makes no TMDB call.
export const revalidate = 3600;

/** Today's date as "YYYY-MM-DD" (UTC), which decides which films are upcoming. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function findPerson(param: string) {
  const parsed = parsePersonParam(param);
  if (!parsed) return { person: undefined, canonical: false };
  const person = await getPerson(parsed.id, today());
  return { person, canonical: person !== undefined && param === `${person.id}-${person.slug}` };
}

export async function generateMetadata({ params }: PersonPageProps): Promise<Metadata> {
  const { person } = await findPerson((await params).id);
  return { title: person ? `${person.name} · Reelbase` : "Not found · Reelbase" };
}

export default async function PersonPage({ params, searchParams }: PersonPageProps) {
  const credits = parseCreditsParam((await searchParams).credits);
  const { person, canonical } = await findPerson((await params).id);
  if (!person) notFound();
  const href = personHref(person);
  if (!canonical) permanentRedirect(credits === undefined ? href : `${href}?credits=${credits}`);
  return <PersonDetails person={person} credits={credits} />;
}
