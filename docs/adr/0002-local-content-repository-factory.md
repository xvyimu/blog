# ADR 0002 — Local content repository factory

- **Status**: Accepted
- **Date**: 2026-07-04
- **Deciders**: yuanjia
- **Related**: `src/lib/content-source.ts`, `src/lib/projects.ts`, `src/lib/links.ts`, `src/lib/about.ts`, `src/lib/content-dirs.ts`

## Context

The project is local-content driven. Blog posts use a deep `PostRepository` module with an explicit `ContentSource` seam, cache ownership, parsing, validation, and query helpers. The other local content modules have moved in the same direction, but `projects` and `links` still repeat the same implementation shape: read one JSON file, parse JSON, validate with zod, cache the parsed value, expose a default filesystem-backed adapter, and keep compatibility helper functions.

That repetition is manageable today, but it becomes a drift risk as the site adds more structured local content such as long project case studies, curated collections, or content health checks. The recent Vercel file tracing issue also showed that local content paths and deployment behavior need stronger locality.

## Decision

Introduce a shared local content repository factory for JSON-backed content, then keep `projects` and `links` as domain adapters over that factory.

Implemented in `src/lib/json-content-repository.ts`. `src/lib/projects.ts` and `src/lib/links.ts` now reuse the shared read / parse / cache implementation while keeping their domain-specific methods.

## Considered Alternatives

- **Keep per-domain repository implementations**: lowest immediate cost, but preserves shallow modules where each interface nearly mirrors the same implementation.
- **Move all content to a CMS or external database**: not aligned with the current local-content architecture and would add operational cost before the project needs it.
- **Create a generic repository for every content type including MDX posts**: too broad. Posts are already a deep module with MDX parsing, excerpt generation, search text, reading time, and production draft filtering.

## Consequences

- **Positive**: JSON parsing, zod error mode, missing-file fallback, cache construction, and `ContentSource` usage become local to one module.
- **Positive**: New JSON-backed content can be added with a small domain adapter instead of copying read/parse/cache code.
- **Positive**: Tests can target one factory interface plus thin domain adapter behavior.
- **Negative**: A generic factory can become too wide if it tries to absorb domain query behavior. Domain-specific methods such as `getFeatured()` should remain in adapters.
- **Risk**: Over-abstracting before a third JSON content type appears would reduce clarity. The first implementation should be minimal and only cover the repeated read/parse/cache path.

## Revisit triggers

- A third JSON-backed local content module is added.
- `projects` move from JSON-only summaries to `content/projects/*.mdx`.
- Error handling needs to become fail-fast in production instead of returning empty arrays.
- Cache behavior changes because the project adopts Next Cache Components or external data sources.
