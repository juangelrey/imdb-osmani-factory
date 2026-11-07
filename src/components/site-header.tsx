import Link from "next/link";
import { SearchBox } from "./search-box";

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="text-xl font-bold tracking-tight text-amber-400 hover:text-amber-300">
          Reelbase
        </Link>
        <SearchBox />
        <nav aria-label="Main" className="ml-auto">
          <ul className="flex items-center gap-4 text-sm">
            <li>
              <Link href="/watchlist" className="text-zinc-300 hover:text-white">
                Watchlist
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
