# Reelbase

Browse, search and save real movies. Browse popular titles by genre and sort, search by name, open
a title page, and keep a watchlist in your browser. Movie data and posters come from
[TMDB](https://www.themoviedb.org/).

**Live:** https://reelbase-tau.vercel.app/

This product uses the TMDB API but is not endorsed or certified by TMDB.

## Commands

```
Install: npm ci
Dev:     npm run dev     (needs TMDB_READ_ACCESS_TOKEN, see below)
Build:   npm run build
Test:    npm test
Lint:    npm run lint
Types:   npm run typecheck
```

Requires Node 24 (see `.nvmrc`). Tests and the build need neither a token nor network access.
Tests use the fixtures in `src/lib/tmdb/fixtures`, and no page calls TMDB at build time.

## TMDB token

The app reads TMDB's v4 **API Read Access Token** from `TMDB_READ_ACCESS_TOKEN` on the server only.
It is sent as `Authorization: Bearer` and never reaches the browser. Never give it a `NEXT_PUBLIC_`
prefix.

- **Local:** put `TMDB_READ_ACCESS_TOKEN=...` in `.env.local` (gitignored).
- **Vercel:** set `TMDB_READ_ACCESS_TOKEN` for Production, Preview and Development in the project's
  environment variables.

Without the token, pages that need TMDB show a friendly error page, and the server logs say the
token is missing. Responses are cached for an hour.

## Deployment

Vercel (Hobby plan) builds a preview for every pull request and deploys `main` to production.
There is no `vercel.json`; the defaults for a Next.js app are used. Posters load straight from
`image.tmdb.org`, and Vercel image optimization is off.

## How work is tracked

The spec, plan and tasks live in GitHub Issues. See `CLAUDE.md`.
