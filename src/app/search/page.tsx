import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SearchResults, searchHref } from "@/components/search-results";
import { firstParam, parsePage, type SearchParamValue } from "@/lib/catalog/browse-params";
import { searchTitles } from "@/lib/catalog/queries";

export const metadata: Metadata = { title: "Search · Reelbase" };

interface SearchPageProps {
  searchParams: Promise<Record<string, SearchParamValue>>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = firstParam(params.q) ?? "";
  const page = parsePage(params.page);
  const results = await searchTitles(query, page);
  // A page past the last one (a stale or edited link) falls back to page 1.
  if (results.results.length === 0 && page > 1) redirect(searchHref(query.trim(), 1));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search</h1>
      <SearchResults query={query} results={results} />
    </div>
  );
}
