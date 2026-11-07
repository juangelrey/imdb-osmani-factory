# Reelbase

A small catalogue of invented movies: browse, search, view a title, keep a watchlist.
Every title and person in it is made up.

**Live:** https://tmdb-osmani-factory.vercel.app/

## Commands

```
Install: npm ci
Dev:     npm run dev
Build:   npm run build
Test:    npm test
Lint:    npm run lint
Types:   npm run typecheck
```

Requires Node 24 (see `.nvmrc`).

## Deployment

Vercel (Hobby plan) builds a preview for every pull request and deploys `main` to production.
There is no `vercel.json`; the defaults for a Next.js app are used.

## How work is tracked

The spec, plan and tasks live in GitHub Issues. See `CLAUDE.md`.
