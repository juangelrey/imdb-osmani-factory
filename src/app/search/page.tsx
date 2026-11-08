import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MediaSwitch } from "@/components/media-switch";
import { SearchResults, searchHref } from "@/components/search-results";
import { SearchSortControl } from "@/components/search-sort-control";
import { firstParam, parseKind, parsePage, type SearchParamValue } from "@/lib/catalog/browse-params";
import { searchShows, searchTitles } from "@/lib/catalog/queries";
import { parseSearchSort } from "@/lib/catalog/search-params";

export const metadata: Metadata = { title: "Search · Reelbase" };

interface SearchPageProps {
  searchParams: Promise<Record<string, SearchParamValue>>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = firstParam(params.q) ?? "";
  const trimmed = query.trim();
  const kind = parseKind(params.type);
  const sort = parseSearchSort(params.sort);
  const page = parsePage(params.page);
  const results = kind === "tv" ? await searchShows(query, page, sort) : await searchTitles(query, page, sort);
  // A page past the last one (a stale or edited link, or past a sorted search's window) falls back to page 1.
  if (results.results.length === 0 && page > 1) redirect(searchHref(trimmed, 1, kind, sort));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search</h1>
      {/* Switching kind or sort keeps the query and the other choice, and starts again at page 1. */}
      <div className="flex flex-wrap items-center gap-4">
        <MediaSwitch current={kind} hrefForKind={(next) => searchHref(trimmed, 1, next, sort)} />
        {trimmed && <SearchSortControl current={sort} hrefForSort={(next) => searchHref(trimmed, 1, kind, next)} />}
      </div>
      <SearchResults query={query} kind={kind} sort={sort} results={results} />
    </div>
  );
}
