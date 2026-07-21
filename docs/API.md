# 公开 HTTP API

> 状态：当前契约（2026-07-21）。本站公开、只读的 Route Handler 共两个：搜索与 wikilink 预览。均不要求登录，不接受 JSON 请求体。  
> 运行时：Node.js（内容读取基于 fs，不面向 Edge）。  
> 规范源补充：`docs/architecture-optimization-research-2026-07-21-v4.md` §7。

| 路径                      | 用途                        | 限流                     | 成功缓存                   |
| ------------------------- | --------------------------- | ------------------------ | -------------------------- |
| `GET /api/search`         | 全文/元数据模糊搜索         | 60 次 / 60s / origin key | `s-maxage=60, swr=300`     |
| `GET /api/preview/[slug]` | wikilink 悬停卡片轻量元数据 | **当前无限流**           | `s-maxage=3600, swr=86400` |

---

## `GET /api/search`

### Query 参数

| 参数    | 类型   | 默认值 | 规则                                         |
| ------- | ------ | ------ | -------------------------------------------- |
| `q`     | string | `""`   | 先 `trim()`；最长 100 字符；空查询返回空结果 |
| `limit` | number | `10`   | 截断为整数并钳制到 1–20；非有限数回退为 10   |

示例：

```bash
curl "http://localhost:3000/api/search?q=Next.js&limit=5"
```

### 成功响应 `200`

```json
{
  "query": "Next.js",
  "results": [
    {
      "item": {
        "slug": "nextjs-app-router",
        "title": "Next.js 16 App Router 实战：服务端组件与流式渲染",
        "description": "Next.js App Router 生产笔记：Server Component 默认、Streaming、Server Actions 与数据获取边界。",
        "date": "2026-06-23",
        "tags": ["Next.js", "React", "App Router"],
        "category": "前端开发",
        "featured": true,
        "excerpt": "结论先说：默认全是服务端组件，只在交互边界加 use client……"
      },
      "matches": [
        {
          "key": "title",
          "value": "Next.js 16 App Router 实战：服务端组件与流式渲染",
          "indices": [[0, 6]]
        }
      ],
      "score": 0.0004
    }
  ],
  "count": 1,
  "source": "server"
}
```

示例来自当前内容集的 `Next.js` 查询；为控制篇幅，`excerpt`、`matches` 和 `score` 做了截断/四舍五入，字段结构与实际响应一致。

- `results[].item` 是 `SearchResultItem` 投影，不包含正文、`searchText` 或 headings。
- `category`、`series`、`featured` 和 `score` 可缺省。
- `count` 是应用 `limit` 后实际返回的数量，不是未截断总匹配数。
- 空查询同样返回 `200`，其中 `query=""`、`results=[]`、`count=0`。
- 成功响应缓存头：`public, s-maxage=60, stale-while-revalidate=300`。

### 错误响应

错误 body 使用统一的 `error` + `code` 结构。以下是 `500` 示例：

```json
{
  "error": "search unavailable",
  "code": "SERVER_ERROR"
}
```

| 状态  | `code`           | 触发条件                       | 额外行为                                         |
| ----- | ---------------- | ------------------------------ | ------------------------------------------------ |
| `400` | `QUERY_TOO_LONG` | `q` 超过 100 字符              | 不执行搜索                                       |
| `429` | `RATE_LIMITED`   | 当前 origin 进程窗口超过限制   | 返回 `Retry-After` 和 `X-RateLimit-Remaining: 0` |
| `500` | `SERVER_ERROR`   | 内容 repository 或搜索引擎异常 | `Cache-Control: no-store`，不暴露路径和 stack    |

`400` 的 `error` 为 `query exceeds 100 characters`，`429` 为 `rate limit exceeded`；调用方应以稳定的 `code` 分支，不依赖 error 文案。

`SearchErrorBody` 类型还保留 `BAD_REQUEST` 供客户端分类，但当前 Route Handler 不主动返回该 code。

## 限流语义

- 固定窗口：同一 key 每 60 秒最多 60 次到达 origin 的请求。
- key 只读取平台提供的 `x-vercel-forwarded-for`；无有效 IP 时使用 `anonymous`。
- 限流在 query 校验之前执行，因此到达 origin 的空查询和非法查询也计数。
- CDN 命中的缓存响应不会进入进程内 Map；多个 serverless 实例也不共享计数。
- 这是尽力而为的资源保护，不是全局安全配额；硬限制应放在 Vercel Firewall/WAF。

## 客户端行为

`useServerSearch` 在输入停止 180ms 后发送请求，查询变化时中止旧请求。客户端区分 query too long、rate limited、network、bad request 和 server error；429 会解析 `Retry-After`。

## 实现位置

| 职责                          | 路径                              |
| ----------------------------- | --------------------------------- |
| HTTP 参数/状态码/缓存头映射   | `src/app/api/search/route.ts`     |
| 搜索用例（读内容 + 缓存引擎） | `src/server/search/service.ts`    |
| Fuse 引擎与引用缓存           | `src/server/search/engine.ts`     |
| 进程内限流                    | `src/server/search/rate-limit.ts` |
| 内容 facade                   | `src/server/content`              |
| 共享 DTO / 常量 / 纯投影      | `src/lib/search/`                 |

## 变更检查（search）

修改 route、搜索 DTO、常量、缓存或限流后，至少运行：

```bash
pnpm test src/lib/module-boundaries.test.ts src/server/search src/app/api/search/route.test.ts src/components/blog/useServerSearch.test.tsx
pnpm typecheck
pnpm lint
```

同时更新本文件和受影响的 E2E 搜索用例。

---

## `GET /api/preview/[slug]`

> 状态：`feat/v3-ship` 已实现（2026-07-21）；**生产 origin/master 在合入前可能无此路由**。Route Handler：`src/app/api/preview/[slug]/route.ts`。内容读取经 `@/server/content` 的 `getPostBySlug`。

G3 wikilink popover 在 hover/focus 时请求本接口，获取**不含正文**的轻量元数据。接口公开、只读、无请求体。

### Path 参数

| 参数   | 类型   | 规则                                                                                                                                           |
| ------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `slug` | string | 文章 slug（与 `/blog/[slug]` 相同）。来自 `params: Promise<{ slug: string }>`（Next 16）。底层按可见文章列表查找，**不是**任意路径拼接读文件。 |

示例：

```bash
curl -sS "http://localhost:3000/api/preview/nextjs-app-router"
curl -sS "http://localhost:3000/api/preview/react-compiler-in-practice"
```

### 成功响应 `200`

```json
{
  "slug": "nextjs-app-router",
  "title": "Next.js 16 App Router 实战：服务端组件与流式渲染",
  "description": "Next.js App Router 生产笔记：Server Component 默认、Streaming、Server Actions 与数据获取边界。",
  "date": "2026-06-23",
  "category": "前端开发",
  "tags": ["Next.js", "React", "App Router"]
}
```

字段约定：

| 字段          | 类型             | 说明                                   |
| ------------- | ---------------- | -------------------------------------- |
| `slug`        | string           | 与 path 一致                           |
| `title`       | string           | 标题                                   |
| `description` | string           | 摘要                                   |
| `date`        | string           | `YYYY-MM-DD`                           |
| `category`    | `string \| null` | 无分类时为 JSON `null`（不是省略字段） |
| `tags`        | string[]         | 可为 `[]`                              |

**明确不出现的字段**（防止 popover 载荷膨胀与内容泄露）：

- `content`（MDX 正文）
- `searchText`、`headings`、`excerpt`、`wordCount`、`readingTime` 等索引/派生字段

成功响应头：

```http
Cache-Control: s-maxage=3600, stale-while-revalidate=86400
```

### 错误响应 `404`

文章不存在，或存在但不可见（`published: false` 等，与 `getPostBySlug` 可见性一致）时：

```json
{ "error": "not found" }
```

状态码 `404`。调用方（`WikilinkPopover`）对非 ok 响应保持静默，可停留在「加载中…」而不向读者抛错。

### 与 search 的差异

| 维度       | search                      | preview                                      |
| ---------- | --------------------------- | -------------------------------------------- |
| 输入       | 自由文本 `q`                | 精确 `slug`                                  |
| 引擎       | Fuse 模糊                   | 直接 repository 查找                         |
| 限流       | 有（60/60s）                | **无**（v4 记为 P2 可评估）                  |
| 缓存       | 短（60s）                   | 长（1h + SWR 1d）                            |
| 错误码风格 | `error` + `code`            | 当前仅 `{ error }` 字符串（无 `code` 字段）  |
| 500 处理   | 显式 catch → `SERVER_ERROR` | **当前未单独 catch**（P1 债：可对齐 search） |

### 客户端行为

`WikilinkPopover`（`src/components/blog/WikilinkPopover.tsx`）：

- 仅当锚点带 `data-wikilink` 时请求本 API；普通外链不请求。
- `AbortController` 取消过期请求；组件卸载时 abort。
- 首次成功结果缓存在组件 state；同一实例二次 hover **不重新请求**。
- 预览标题/描述/日期以 React 文本节点渲染（自动转义），禁止 HTML 注入。

### 实现位置（preview）

| 职责                      | 路径                                                  |
| ------------------------- | ----------------------------------------------------- |
| HTTP 映射 / 投影 / 缓存头 | `src/app/api/preview/[slug]/route.ts`                 |
| 单测                      | `src/app/api/preview/[slug]/route.test.ts`            |
| 内容读取                  | `src/server/content` → `getPostBySlug`                |
| 客户端消费                | `src/components/blog/WikilinkPopover.tsx`             |
| remark 打标               | `src/lib/posts/remark-wikilink.ts`（`data-wikilink`） |

### 变更检查（preview）

```bash
pnpm test src/app/api/preview src/components/blog/WikilinkPopover.test.tsx src/lib/module-boundaries.test.ts
pnpm typecheck
pnpm lint
```

修改投影字段时必须同步：本文件、popover UI、route 测试。
