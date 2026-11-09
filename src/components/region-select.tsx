"use client";

import { browseHref, type BrowseState } from "@/lib/catalog/browse-params";

interface RegionSelectProps {
  /** TMDB's watch-provider regions, A-Z by name, from `listRegions` (server-only, so passed in). */
  regions: { code: string; name: string }[];
  state: BrowseState;
}

/**
 * The browse query to keep across a region change: every param `browseHref` writes for this state on page 1,
 * except `region`, which the select sends. Read from the href rather than listed by name, so params added to
 * browse later ride along without editing this component.
 */
function carriedParams(state: BrowseState): [string, string][] {
  const params = new URL(browseHref({ ...state, page: 1 }), "http://localhost").searchParams;
  return [...params].filter(([name]) => name !== "region");
}

/**
 * A plain GET form to `/region`, which remembers the choice and returns home on page 1 with the carried
 * params. It works without JavaScript through the Apply button; with it, choosing a region submits at once.
 */
export function RegionSelect({ regions, state }: RegionSelectProps) {
  return (
    <form action="/region" method="get" aria-label="Region" className="flex items-center gap-2 text-xs text-zinc-400">
      <label htmlFor="browse-region">Region</label>
      <select
        id="browse-region"
        name="region"
        defaultValue={state.region}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 focus:border-amber-400 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
      >
        {regions.map(({ code, name }) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
      {carriedParams(state).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-zinc-500 hover:text-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
      >
        Apply
      </button>
    </form>
  );
}
