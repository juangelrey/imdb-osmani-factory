import type { Metadata } from "next";
import { SearchResults } from "@/components/search-results";
import { firstParam, type SearchParamValue } from "@/lib/catalog/browse-params";
import { listTitles } from "@/lib/seed-catalog/queries";

export const metadata: Metadata = { title: "Search · Reelbase" };

interface SearchPageProps {
  searchParams: Promise<Record<string, SearchParamValue>>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = firstParam((await searchParams).q) ?? "";
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search</h1>
      <SearchResults titles={listTitles()} query={query} />
    </div>
  );
}
