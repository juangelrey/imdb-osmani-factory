import type { Metadata } from "next";
import { SearchResults } from "@/components/search-results";
import { firstParam, parsePage, type SearchParamValue } from "@/lib/catalog/browse-params";
import { searchTitles } from "@/lib/catalog/queries";

export const metadata: Metadata = { title: "Search · Reelbase" };

interface SearchPageProps {
  searchParams: Promise<Record<string, SearchParamValue>>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = firstParam(params.q) ?? "";
  const results = await searchTitles(query, parsePage(params.page));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search</h1>
      <SearchResults query={query} results={results} />
    </div>
  );
}
