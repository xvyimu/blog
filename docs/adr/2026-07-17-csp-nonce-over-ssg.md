# ADR: Prefer CSP nonce over full-site SSG HTML cache

- Status: Accepted
- Date: 2026-07-17
- Related: `src/proxy.ts`, `src/lib/csp.ts`, `docs/architecture.md`, `docs/full-stack-audit-2026-07-17.md`

## Context

Next App Router emits inline hydration scripts. A strict CSP needs a per-request nonce (or hashes). Applying nonce in the root layout via `headers()` makes document routes dynamic, so HTML responses use `private, no-cache` and rarely hit the edge cache (`X-Vercel-Cache: MISS`).

## Decision

Keep **per-request CSP nonce** with `script-src 'nonce-…' 'strict-dynamic'` (plus allowlisted Giscus / Vercel script hosts). Accept dynamic HTML cost. Do **not** relax script CSP to `unsafe-inline` to recover SSG.

Static assets (feed, images, `/_next/static`) remain cacheable independently.

## Consequences

- Higher Function invocations / TTFB vs pure SSG HTML.
- Stronger XSS baseline for third-party and framework scripts.
- Revisit only with Speed Insights evidence (p75 TTFB, invocations) and a Next-supported static CSP/SRI path.

## Alternatives rejected

1. Full SSG + `unsafe-inline` scripts — weaker XSS posture.
2. Drop Giscus/Analytics to simplify CSP — product regression.
