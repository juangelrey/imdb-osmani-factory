import type { Metadata } from "next";
import { WatchlistView } from "@/components/watchlist-view";
import { listTitles } from "@/lib/seed-catalog/queries";
import { toSummary } from "@/lib/seed-catalog/types";

export const metadata: Metadata = { title: "Watchlist · Reelbase" };

export default function WatchlistPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Your watchlist</h1>
      <WatchlistView titles={listTitles().map(toSummary)} />
    </div>
  );
}
