"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

/** On a TV view of browse or search (`type=tv`), a new search stays on TV; on People search, on People. */
function KeepKind() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const type = pathname === "/" || pathname === "/search" ? searchParams.get("type") : null;
  const kept = type === "tv" || (type === "person" && pathname === "/search") ? type : null;
  return kept ? <input type="hidden" name="type" value={kept} /> : null;
}

export function SearchBox() {
  return (
    <form role="search" action="/search" method="get" className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
      <label htmlFor="site-search" className="sr-only">
        Search titles and people
      </label>
      <input
        id="site-search"
        type="search"
        name="q"
        placeholder="Search titles and people"
        autoComplete="off"
        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none sm:max-w-xs"
      />
      {/* useSearchParams needs a Suspense boundary so static pages still prerender the form. */}
      <Suspense fallback={null}>
        <KeepKind />
      </Suspense>
    </form>
  );
}
