# 公开 HTTP API

> 状态：当前契约（2026-07-22）。公开 Route Handler：只读的搜索与 wikilink 预览（`GET`，无请求体），以及只写的 CSP 违规上报（`POST`，collect-only）。均不要求登录。  
> 运行时：Node.js（内容读取基于 fs，不面向 Edge）。  
> 规范源补充：`docs/architecture-optimization-research-2026-07-21-v4.md` §7。

| 路径                      | 用途                         | 限流                                           | 成功缓存                          |
| ------------------------- | ---------------------------- | ---------------------------------------------- | --------------------------------- |
| `GET /api/search`         | 全文/元数据模糊搜索          | 60 次 / 60s / origin key                       | `max-age=0, s-maxage=60, swr=300` |
| `GET /api/preview/[slug]` | wikilink 悬停卡片轻量元数据  | 120 次 / 60s / origin key（`preview:` 前缀）   | `s-maxage=3600, swr=86400`        |
| `POST /api/csp-report`    | CSP 违规上报（collect-only） | 30 次 / 60s / origin key（`csp-report:` 前缀） | `no-store`（204，无 body）        |

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
- 成功响应缓存头：`public, max-age=0, s-maxage=60, stale-while-revalidate=300`（浏览器每次校验；CDN 短缓存）。

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

| 职责                              | 路径                              |
| --------------------------------- | --------------------------------- |
| HTTP 参数/状态码/缓存头映射       | `src/app/api/search/route.ts`     |
| 搜索用例（语料 + 缓存引擎）       | `src/server/search/service.ts`    |
| 语料（snapshot 只读 search-docs） | `src/server/search/corpus.ts`     |
| Fuse 引擎与引用缓存               | `src/server/search/engine.ts`     |
| 进程内限流                        | `src/server/search/rate-limit.ts` |
| 内容 facade                       | `src/server/content`              |
| 共享 DTO / 常量 / 纯投影          | `src/lib/search/`                 |

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

> 状态：已上线（master）。Route Handler：`src/app/api/preview/[slug]/route.ts`。内容读取经 `@/server/content` 的 `getPostBySlug`。

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

### 错误响应

错误 body 与 search 对齐为 `error` + `code`：

| 状态  | `code`         | 触发                                                                  | 额外行为                                                             |
| ----- | -------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `404` | `NOT_FOUND`    | 文章不存在或不可见（与 `getPostBySlug` 一致）                         | —                                                                    |
| `429` | `RATE_LIMITED` | 当前 origin 进程窗口超过 **120 次 / 60s**（key 前缀 `preview:` 隔离） | `Retry-After`、`X-RateLimit-Remaining: 0`、`Cache-Control: no-store` |
| `500` | `SERVER_ERROR` | repository 抛错等                                                     | `Cache-Control: no-store`，不暴露 stack                              |

```json
{ "error": "not found", "code": "NOT_FOUND" }
```

调用方（`WikilinkPopover`）对非 ok 响应显示「暂无预览」，不向读者抛全局错误。

### 与 search 的差异

| 维度       | search                      | preview                       |
| ---------- | --------------------------- | ----------------------------- |
| 输入       | 自由文本 `q`                | 精确 `slug`                   |
| 引擎       | Fuse 模糊                   | 直接 repository 查找          |
| 限流       | 60/60s                      | **120/60s**（独立 key 前缀）  |
| 缓存       | 短（60s）                   | 长（1h + SWR 1d）             |
| 错误码风格 | `error` + `code`            | **同** `error` + `code`       |
| 500 处理   | 显式 catch → `SERVER_ERROR` | **同** catch → `SERVER_ERROR` |

### 客户端行为

`WikilinkPopover`（`src/components/blog/WikilinkPopover.tsx`）：

- 仅当锚点带 `data-wikilink` 时请求本 API；普通外链不请求。
- `AbortController` 取消过期请求；组件卸载时 abort。
- 首次成功结果缓存在组件 state；同一实例二次 hover **不重新请求**；失败可重试。
- 打开时设置 `aria-describedby` 指向 `role="tooltip"`；视口上方空间不足时卡片翻到链接下方。
- 触屏无可靠 hover：`title` 提示直接点开链接。
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

---

## `POST /api/csp-report`

> 状态：`feat/t3-csp-report-sri-preview` 新增（2026-07-21）。Route Handler：`src/app/api/csp-report/route.ts`。CSP 违规**收集端点**，collect-only：只写服务端日志，不落库、不外发、不回显。

浏览器在 CSP 违规时把报告 POST 到本端点。`src/proxy.ts` 在每个响应的 CSP 上同时挂了两条上报通道：

- `report-to csp-endpoint` —— 现代 Reporting API，配合 `Reporting-Endpoints: csp-endpoint="/api/csp-report"` 响应头。
- `report-uri /api/csp-report` —— 旧浏览器回退。

**本端点只增加遥测出口，不放宽任何 CSP 指令**：nonce + `strict-dynamic` 的执行策略完全不变。

### 请求

| 维度         | 值                                                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 方法         | `POST`（仅浏览器自动发起；无鉴权、公开可达）                                                                           |
| Content-Type | `application/csp-report`（report-uri）或 `application/reports+json`（Reporting API）；实际按 body 结构解析，不强校验头 |
| 请求体上限   | 16 KiB；超过直接丢弃不解析                                                                                             |
| 限流         | 30 次 / 60s / origin key（`csp-report:` 前缀隔离，与 search/preview 共用固定窗口）                                     |

两种 body 结构都接受：

```jsonc
// report-uri
{ "csp-report": { "document-uri": "...", "violated-directive": "...", "blocked-uri": "..." } }

// Reporting API（数组）
[{ "type": "csp-violation", "body": { "documentURL": "...", "effectiveDirective": "...", "blockedURL": "..." } }]
```

### 响应

| 状态  | 触发                       | 说明                                                                    |
| ----- | -------------------------- | ----------------------------------------------------------------------- |
| `204` | 正常收集 / body 畸形或超限 | 无响应体；`Cache-Control: no-store`。畸形上报也返回 204，不暴露解析细节 |
| `429` | 超过 30 次 / 60s           | 无响应体；带 `Retry-After`、`Cache-Control: no-store`                   |

### 安全边界

- 端点无鉴权、公开可 POST，故用进程限流防日志刷量；这不是安全配额，硬限制放平台 WAF。
- 只提取白名单字段（documentUri / violatedDirective / effectiveDirective / blockedUri / disposition），每字段截断 512 字符，**绝不把攻击者可控的原始结构整体写进日志**。
- 不落库、不转发第三方、不回显给客户端。

### 实现位置（csp-report）

| 职责               | 路径                                                           |
| ------------------ | -------------------------------------------------------------- |
| HTTP 映射 / 规范化 | `src/app/api/csp-report/route.ts`                              |
| 单测               | `src/app/api/csp-report/route.test.ts`                         |
| CSP 指令 / 上报头  | `src/proxy.ts`                                                 |
| 限流               | `src/server/search/rate-limit.ts`（`checkCspReportRateLimit`） |
