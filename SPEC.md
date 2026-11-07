# Spec: Reelbase

## Objective

Reelbase is a small movie catalogue web app: browse, search, view a title, keep a watchlist.

Its real purpose is learning. It is a low-stakes project for practising the `agent-skills`
workflow (spec, plan, build, test, review, ship), then a small factory run with parallel agents.

- **User:** anyone with the link, browsing without an account.
- **Done means:** all success criteria below pass and the app is live on a public Vercel URL.
- **Cost limit:** $0 beyond the existing Claude Max plan.

## Capability Map

| Module id | Responsibility | Depends on |
|---|---|---|
| `catalog` | Seed data, types, pure query functions | none |
| `shell` | Layout, navigation, CI, Vercel deploy | none |
| `browse` | Home page: title grid, genre filter, sort | `catalog`, `shell` |
| `search` | Search box and results page | `catalog`, `shell` |
| `title` | Title detail page | `catalog`, `shell` |
| `watchlist` | Add/remove control, watchlist page | `catalog`, `title` |

Build order: `catalog`, `shell` → `browse` → `search` + `title` (parallel, factory test) → `watchlist`

Each module has its acceptance criteria in this file. Separate `SPEC-<id>.md` files are skipped
because the modules are small.

Tasks are tracked in GitHub Issues, one issue per task. See `CLAUDE.md`.

## Tech Stack

- Node 24 (Next.js requires >= 20.9)
- Next.js 16 (App Router) with React 19
- TypeScript, strict mode, at the latest version Next.js supports
- Tailwind CSS 4
- Vitest 5 with React Testing Library
- Runtime dependencies stay limited to the above

Data lives in the repo as JSON. There is no database, API, authentication or analytics.

## Commands

```
Install: npm ci
Dev:     npm run dev
Build:   npm run build
Test:    npm test
Lint:    npm run lint
Types:   npm run typecheck
```

## Project Structure

```
src/app/                 → Routes and pages
src/components/          → Shared UI components
src/lib/catalog/         → Types and query functions
src/lib/watchlist/       → localStorage watchlist logic
src/data/titles.json     → Seed catalogue
tasks/plan.md            → Plan, with an ordered index of GitHub Issues
.github/workflows/ci.yml → Lint, typecheck, tests, build
```

Tests sit next to the code they cover as `*.test.ts` or `*.test.tsx`.

## Code Style

Pages stay thin. Logic lives in pure, typed functions that are tested directly:

```ts
export function searchTitles(titles: Title[], query: string): Title[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return titles.filter((title) => title.name.toLowerCase().includes(needle));
}
```

- Files: `kebab-case`. Components: `PascalCase`. Functions: `camelCase`.
- Named exports, except where Next.js requires a default export.
- Server Components by default. Use `"use client"` only when interaction needs it.

## Testing Strategy

- **Unit:** every query function and all watchlist logic, written test-first.
- **Component:** the watchlist button, and empty states.
- **Manual:** check each slice in the browser or the Vercel preview.
- No end-to-end suite and no coverage target, to keep CI and agent runs cheap.

## Boundaries

- **Always:** run lint, typecheck and tests before committing. Keep commits to one task. Work from
  this spec, and update it first if a decision changes.
- **Ask first:** adding a dependency, changing CI, changing the data shape, any step that costs
  money, any push or deploy.
- **Never:** use IMDb branding, or real movie titles, posters or data. Commit secrets. Remove or
  skip a failing test to get a pass. Run Claude from GitHub Actions.

## Success Criteria

**`catalog`**
- `titles.json` holds about 50 invented movies, each with a unique slug, name, year, runtime,
  genres, rating (0 to 10), synopsis, and invented cast and director.
- Query functions cover list, get by slug, filter by genre, sort, and search.
- A test validates that every seed entry has all required fields and a unique slug.

**`shell`**
- Every page shares a header with links to home and the watchlist.
- Layout works at 360px and at desktop widths, and uses semantic HTML.
- CI runs lint, typecheck, tests and build on every PR.
- A PR gets a Vercel preview, and a merge to `main` deploys to production.

**`browse`**
- `/` shows all titles as a grid of posters generated in code, with name, year and rating.
- Users can filter by genre and sort by rating, year or name.
- An empty filter result shows a clear message.

**`search`**
- The header has a search box that goes to `/search?q=<query>`.
- Search is case-insensitive and matches title names only.
- A blank or no-match query shows a clear message.

**`title`**
- `/title/[slug]` shows all fields for that title, statically generated.
- An unknown slug shows a 404 page.

**`watchlist`**
- Users can add and remove a title from the title page.
- `/watchlist` lists saved titles, and shows a clear message when empty.
- The list survives a page reload, and corrupt or missing localStorage data does not crash the app.

## Open Questions

- Is `Reelbase` free to use? It has not been checked. This only matters beyond a sample app.
- TypeScript 7 is the latest release; confirm Next.js 16 works with it during setup, or use the
  newest version that does.
