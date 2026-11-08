import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MediaSwitch } from "@/components/media-switch";
import { SearchResults, searchHref } from "@/components/search-results";
import { firstParam, parseKind, parsePage, type SearchParamValue } from "@/lib/catalog/browse-params";
import { searchShows, searchTitles } from "@/lib/catalog/queries";

export const metadata: Metadata = { title: "Search · Reelbase" };

interface SearchPageProps {
  searchParams: Promise<Record<string, SearchParamValue>>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = firstParam(params.q) ?? "";
  const kind = parseKind(params.type);
  const page = parsePage(params.page);
  const results = kind === "tv" ? await searchShows(query, page) : await searchTitles(query, page);
  // A page past the last one (a stale or edited link) falls back to page 1.
  if (results.results.length === 0 && page > 1) redirect(searchHref(query.trim(), 1, kind));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search</h1>
      {/* Switching kind keeps the query and starts again at page 1. */}
      <MediaSwitch current={kind} hrefForKind={(next) => searchHref(query.trim(), 1, next)} />
      <SearchResults query={query} kind={kind} results={results} />
    </div>
  );
}
