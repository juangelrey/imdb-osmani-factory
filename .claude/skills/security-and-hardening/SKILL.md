---
name: security-and-hardening
description: Hardens the app against vulnerabilities. Use when handling an API token or any secret, when rendering data from an external API, URL params or browser storage, when adding or changing security headers, or when auditing dependencies and triaging package-audit findings or supply-chain risk in a new package.
---

# Security and Hardening

## Secrets stay on the server

- Read a secret only in server-side modules, from an env var the framework does not expose to the client.
- Pass components the data the API returned, never the token or a URL that carries it. Client code and values returned to the client never see it.
- Keep it out of logs and error messages. Commit `.env.example` with placeholders; real `.env*` files stay gitignored; grep the staged diff before committing.
- A secret that reaches a remote is compromised the moment it lands: rotate it at the provider and the host first, then purge history.

## XSS

The framework escapes everything rendered as text and attributes; let it. Render untrusted data (API fields, URL params, stored entries) as text. Inject raw HTML only for content the code itself controls, and only after an allowlist sanitizer. Build `href`/`src` values from known prefixes (a fixed image host) rather than from raw input, so a `javascript:` URL can't slip in.

## Untrusted input: validate the shape at the boundary

- **URL query and route params:** parse to the expected type and range (a numeric id, a bounded page number, a trimmed query of capped length) before they reach an API or the page. Fall back to an explicit empty or not-found state.
- **External API responses:** treat them as external data. Check status, then narrow the JSON to the fields the app uses; a missing field becomes a visible fallback the type system knows about, not a crash.
- **Browser storage:** `JSON.parse` can throw and can return anything. Wrap it, check the parsed value matches the expected shape, and recover to an empty default on mismatch.

Downstream code uses only the parsed, typed value. State each fallback explicitly in code; a silent fallback hides the bug.

## Security headers

Set them in the framework's config for every route:

```
Content-Security-Policy: default-src 'self'; img-src 'self' <image host>; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0   (disabled; rely on CSP)
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

A strict `script-src 'self'` can block the framework's inline scripts; use a nonce-based CSP or allow what the framework needs, and confirm on the preview deploy that pages still work. Tighten CSP over time; loosening it needs a reason in the PR.

## Errors

Error UI and responses say what the user can do ("Couldn't load results, try again"). Status codes, upstream API messages and stack traces go to server logs only.

## Dependencies and supply chain

Adding or upgrading a dependency, or triaging audit findings: follow `dependency-audit.md` in this folder.

## Verification

- [ ] Security headers present on the preview deploy (DevTools, Network tab)
