# Chronicle L2 · P0 hygiene action board · 2026-07-22

Derived from `docs/ops/L2-hygiene-checklist.md`. **No stack rewrite.**

## P0 (human / account)

| ID       | Item                            | Owner      | Action                                                            |
| -------- | ------------------------------- | ---------- | ----------------------------------------------------------------- |
| P0-GSC   | Google Search Console property  | You        | Verify domain; submit sitemap from `pnpm` SEO scripts if not done |
| P0-Bing  | Bing Webmaster                  | You        | Same as GSC                                                       |
| P0-Audit | `pnpm audit --audit-level=high` | CI + local | Must stay 0 high; re-run on dependency PRs                        |

## P0 automated (already green / keep green)

| Check              | Command / evidence                               |
| ------------------ | ------------------------------------------------ |
| Audit              | `pnpm audit --audit-level=high`                  |
| CI quality         | `.github/workflows` quality job                  |
| Production content | `pnpm check:production-content` (when networked) |
| CSP/SRI            | Production headers + `ENABLE_SRI=1`              |

## P1 (optional next)

| ID      | Item                                             |
| ------- | ------------------------------------------------ |
| P1-RUM  | Read-only RUM/p75 if product wants; not blocking |
| P1-Deps | Dependabot PR triage                             |

## Explicit non-actions

- GardenExplorer large refactor
- Vue migration
- Fake GSC metrics

**Status**: Board only; no production changes this commit.
