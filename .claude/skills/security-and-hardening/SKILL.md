---
name: security-and-hardening
description: Hardens the app against vulnerabilities. Use when handling an API token or any secret, when rendering data from an external API, URL params or browser storage, when adding or changing security headers, when adding or upgrading a dependency, or when triaging package-audit findings.
---

# Security and Hardening

## Secrets stay on the server

- Read a secret only in server-side modules, from an env var the framework does not expose to the client.
- Pass components the data the API returned, never the token or a URL that carries it.
- Keep it out of logs, error messages and version control. Real env files stay ignored, and each required variable is documented by name with a placeholder value.
- A secret that reaches a remote is compromised the moment it lands: stop and have the user rotate it at the provider and the host. Rewriting history comes after rotation and is the user's call.

## XSS

The framework escapes everything rendered as text and attributes; let it. Render untrusted data (API fields, URL params, stored entries) as text. Inject raw HTML only for content the code itself controls, and only after an allowlist sanitizer. Build `href`/`src` values from known prefixes (a fixed image host) rather than from raw input, so a `javascript:` URL can't slip in.

## Untrusted input: validate the shape at the boundary

- **URL query and route params:** parse to the expected type and range (a numeric id, a bounded page number, a trimmed query of capped length) before they reach an API or the page. Fall back to an explicit empty or not-found state.
- **External API responses:** check status, then narrow the JSON to the fields the app uses; a missing field becomes a visible fallback the type system knows about, not a crash.
- **Browser storage:** `JSON.parse` can throw and can return anything. Wrap it, check the parsed value matches the expected shape, and recover to an empty default on mismatch.

Downstream code uses only the parsed, typed value. State each fallback explicitly in code; a silent fallback hides the bug.

## Security headers

Every route sends a Content-Security-Policy, HSTS, `X-Content-Type-Options: nosniff`, `frame-ancestors 'none'`, a strict Referrer-Policy, and a Permissions-Policy that denies unused features. The CSP allows exactly the origins, inline scripts and inline styles the pages use. Allow the framework's inline scripts with a nonce or hashes; a nonce is generated per response, so it can't live in static config and rules out statically cached pages.

A header change is done when every page type loads on a production build with no CSP violation in the console. If you can't load pages in a browser, report that check as outstanding and add it to the PR's Manual check. Loosening the CSP needs a reason in the PR.

## Errors

Error UI and responses say what the user can do ("Couldn't load results, try again"). Upstream status codes and messages, and stack traces, go to server logs only.

## Dependencies and supply chain

Adding or upgrading a dependency, or triaging audit findings: follow `dependencies.md` in this folder.
