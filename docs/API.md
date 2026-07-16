# Search API

Public endpoint used by the blog search UI.

## `GET /api/search`

| Query   | Type   | Notes                                                                 |
| ------- | ------ | --------------------------------------------------------------------- |
| `q`     | string | Trimmed. Empty → empty results. Max length: `SEARCH_MAX_QUERY_LENGTH` |
| `limit` | number | Clamped to `[1, SEARCH_MAX_LIMIT]`; default `SEARCH_RESULT_LIMIT`     |

### Success `200`

```json
{
  "query": "next",
  "results": [{ "item": { "slug": "...", "title": "..." }, "matches": [], "score": 0.1 }],
  "count": 1,
  "source": "server"
}
```

- `count` is the **returned row count after limit**, not an untruncated total.
- Items are projected (`SearchResultItem`): no `searchText` / headings / body.
- Cache: `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`.

### Errors

| Status | `code`           | When                                              |
| ------ | ---------------- | ------------------------------------------------- |
| 400    | `QUERY_TOO_LONG` | `q` exceeds max length                            |
| 429    | `RATE_LIMITED`   | Origin process window exceeded; `Retry-After` set |

### Rate limit semantics

Process-local fixed window (default 60 / 60s) keyed by `x-vercel-forwarded-for` only.

- **Best-effort at origin**: multi-instance serverless does not share counters.
- **CDN hits do not count**: cached 200 responses never enter the Map.
- Not a global security boundary. Hard quotas → Vercel Firewall / platform WAF.

Runtime: Node.js (`export const runtime = 'nodejs'`).
