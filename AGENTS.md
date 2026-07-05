# AGENTS.md

> This file helps AI coding assistants understand the project structure and conventions.

## Project Overview

A personal blog built with Next.js 16.2 (App Router), React 19, and Tailwind CSS 4. Content is authored in MDX, stored in `content/blog/`. Projects data is in `data/projects.json`.

## Skill Routing

- Routine project continuation: use `superpower`.
- Large feature delivery: use `ship`.
- Pre-production launch preparation: use `shipping-and-launch`.
- Deep code review: use `review`.

## Tech Stack

- **Framework**: Next.js 16.2 (App Router; local-content driven, dynamic rendering for CSP nonce)
- **UI**: React 19.2, Tailwind CSS 4, BEM custom CSS
- **Content**: MDX with custom frontmatter parser (`lib/parse-frontmatter.ts`, js-yaml 4.x), next-mdx-remote
- **Syntax Highlighting**: Shiki via rehype-pretty-code
- **Search**: fuse.js (client-side fuzzy search)
- **Testing**: Vitest (unit/integration, 523 tests, 65 files), Playwright (E2E, 47 tests, 5 spec files)
- **CI**: GitHub Actions (lint / test / tsc / build / bundle-budget / e2e)
- **Deployment**: Vercel

## Key APIs

- Use `next/font/google` for fonts (not CSS @font-face)
- Use `next/og` `ImageResponse` for dynamic OG images
- Use `next/link` for navigation (supports `transitionTypes` prop)
- Use `Metadata` type for SEO metadata
- Use `MetadataRoute.Sitemap` / `MetadataRoute.Robots` for sitemap/robots

## Project Structure

```
src/
├── app/                    # App Router pages
│   ├── blog/[slug]/        # Blog post detail (with opengraph-image.tsx)
│   ├── projects/[id]/      # Project detail
│   ├── tags/[tag]/         # Tag archive
│   ├── series/[series]/    # Series archive
│   ├── about/              # About page
│   ├── styles/             # Semantic CSS modules (11 files, each ≤500 lines)
│   │   ├── tokens.css      # Design tokens (light/dark theme vars, spacing, shadows)
│   │   ├── base.css        # Global base (skip-link, header, footer, reduced-motion)
│   │   ├── components.css   # Generic components (card, button, section, hero container)
│   │   ├── links.css       # Links directory and curated resource UI
│   │   ├── blog-ui.css     # Blog UI (SearchBar, TOC, CodeBlock, ThemeToggle)
│   │   ├── backdrop.css    # Backdrop layer (body::before/after + .site-backdrop__stage)
│   │   ├── home.css        # Home (Manifesto, ReadingPath, ArticleRail, CTA)
│   │   ├── prose.css      # Article typography (.prose, code block)
│   │   ├── project-detail.css # Project detail
│   │   ├── animations.css # Animations (reveal, fade-in-up, loading-intro)
│   │   └── responsive.css  # Responsive breakpoints (loaded last, overrides above)
│   ├── globals.css         # CSS entry (Tailwind v4 only, ~12 lines, NO @import chain)
│   ├── layout.tsx          # Root layout (fonts, theme, skip-link, CSS imports)
│   ├── manifest.ts         # PWA manifest (from site config)
│   ├── page.tsx            # Home page
│   ├── sitemap.ts          # Dynamic sitemap
│   ├── robots.ts           # Robots.txt
│   ├── proxy.ts            # CSP headers (per-request)
│   └── error.tsx           # Error boundary (production-safe)
├── components/
│   ├── blog/               # Blog-specific (SearchBar, BlogCard, CodeBlock, TOC, etc.)
│   ├── home/               # Home-only (EditorialHero, Manifesto, ReadingPath, ArticleRail, CTA, RevealOnScroll, LoadingIntro)
│   ├── layout/             # Header, Footer, ArchiveCard, PageSection, SiteBackdropStage/Parallax
│   ├── projects/           # ProjectCard
│   ├── comments/           # Giscus comments
│   └── ui/                 # Reusable UI (ThemeToggle, MetaBadge, Card, BackToTop, MagneticCard, ParticleCanvas)
├── hooks/                  # React hooks (useInView, usePersistedEnum, usePrefersReducedMotion)
├── lib/                    # Business logic
│   ├── posts/              # Post modules (schema, repository, query, search-text — 4 submodules)
│   ├── schemas/            # Zod schemas (post-frontmatter)
│   ├── test-utils/         # Test fixtures (in-memory ContentSource)
│   ├── projects.ts         # Project data (uses createCache<T>, zod validation)
│   ├── tags.ts             # Tag management
│   ├── series.ts           # Series aggregation and routes
│   ├── categories.ts       # Category aggregation
│   ├── category-rules.ts   # Category inference helper
│   ├── category-rules-data.ts # TAG_TO_CATEGORY mapping
│   ├── about.ts            # About page content
│   ├── links.ts            # Curated links repository (reads data/links.json)
│   ├── content-source.ts   # ContentSource interface (fs abstraction) + createPostRepository factory
│   ├── json-content-repository.ts # Shared JSON read/parse/cache repository factory
│   ├── parse-frontmatter.ts # MDX frontmatter parser (js-yaml 4.x, gray-matter parity)
│   ├── route-adapter.ts    # createDynamicRoute adapter for [slug|id|tag|category] routes
│   ├── metadata.ts         # SEO metadata helpers
│   ├── observability.ts    # Logging / telemetry helpers
│   ├── cache.ts            # createCache<T> utility + resetAllCaches() for test isolation
│   ├── storage.ts          # safeLocalStorage wrapper (SSR-safe)
│   ├── jsonld.ts           # JSON-LD structured data
│   ├── site.ts             # Site config and env-aware site URL
│   ├── content-dirs.ts     # Content file paths, Vercel tracing includes, and page size
│   └── utils.ts            # slugify, formatDate
└── types/                  # TypeScript types (PostMeta, PostFull, Project, TagInfo)
```

## Conventions

- **CSS**: BEM for structural components, Tailwind for utilities. See `docs/css-conventions.md`
- **CSS Module Loading**: ⚠️ Tailwind v4 `@tailwindcss/postcss` silently drops `@import "./styles/xxx.css"` in `globals.css`. All CSS modules MUST be explicitly imported in `layout.tsx` (order: tokens → base → components → links → blog-ui → backdrop → home → prose → project-detail → animations → responsive last). See `docs/specs/2026-06-29-css-import-fix-design.md`
- **shadcn Visual Composition**: Keep primitive shadcn-style components in `src/components/ui/` and page/archive composition helpers in `src/components/layout/`. Current shared pieces are `MetaBadge`, `ArchiveCard`, and `PageSection`. See `docs/specs/2026-07-04-shadcn-visual-architecture-design.md`
- **Background Architecture**: Three-layer separation — `body::before/after` (CSS pseudo-elements) + `<SiteBackdropStage />` (server-rendered decorative DOM) + `<SiteBackdropParallax />` (client component, returns null, only side effects). See `docs/specs/2026-06-29-site-backdrop-architecture-design.md`
- **Caching**: Use `createCache<T>` from `lib/cache.ts`. Use `resetAllCaches()` for test isolation. See `docs/cache-components-migration.md`
- **Testing**: Unit tests in `*.test.tsx` alongside components. E2E in `e2e/` directory
- **Security**: CSP headers via `src/proxy.ts` (per-request nonce). `layout.tsx` and JSON-LD scripts read `x-nonce` via `src/lib/csp.ts`, so routes render dynamically on demand. Security headers also live in `next.config.ts`. No remote images (`remotePatterns: []`)
- **Fonts**: `next/font/google` only. CSS variables: `--font-noto-sans-sc`, `--font-jetbrains-mono`
- **SEO**: JSON-LD via `lib/jsonld.ts`. OG images via `opengraph-image.tsx` file convention
- **Site Config**: `SITE_CONFIG` lives in `src/lib/site.ts`; content paths, Vercel tracing includes, and `PAGE_SIZE` live in `src/lib/content-dirs.ts`

## Commands

```bash
pnpm dev          # Start dev server (port 3000; Turbopack)
pnpm build        # Generate RSS + production build (93 page artifacts; routes are dynamic due CSP nonce)
pnpm test         # Run unit/integration tests (523 tests, 65 files)
pnpm test:e2e     # Run E2E tests (47 tests, 5 spec files; auto-starts dev/prod server on port 3001)
pnpm test:e2e:raw # Playwright raw (pass-through flags, e.g. --ui)
pnpm lint         # ESLint
pnpm check:seo    # SEO audit (tsx scripts/check-seo.ts)
pnpm check:production-content # Production content smoke test against NEXT_PUBLIC_SITE_URL
pnpm analyze      # Bundle size analysis (ANALYZE=true next build)
tsc --noEmit      # TypeScript check
```

## E2E Testing Notes

- Playwright config uses port 3001 with `reuseExistingServer: true`
- To test against an already-running local server, set `PLAYWRIGHT_BASE_URL`, for example `pnpm exec cross-env PLAYWRIGHT_BASE_URL=http://localhost:7897 pnpm test:e2e`
- Blog card `::after` overlays can intercept clicks — use `focus()` + `keyboard.type()` for search inputs, `dispatchEvent('click')` for buttons, and `page.goto()` for navigation
- React hydration in dev mode requires waiting for `button[aria-label="切换主题"]` to have a `title` attribute
- Use `getByRole('heading', { name: '...', exact: true })` to avoid substring matches on Chinese headings

## CI Pipeline

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to master:

1. **quality** — pnpm audit → lint → test → tsc → generate-rss → build → bundle-budget
2. **bundle-analyze** — builds with analyzer, uploads report as artifact
3. **e2e** — installs Chromium, runs Playwright tests (production build)
4. **lighthouse** — Lighthouse CI via treosh/lighthouse-ci-action@v12 (needs quality; reuses `lighthouse.config.js` for assertions)
5. **deploy** — Vercel production deploy + production content smoke test (needs quality + e2e + lighthouse; master push only)
