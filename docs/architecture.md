# 项目架构说明

> 状态：当前维护版（2026-07-18）
>
> 这份文档是面向接手者的架构摘要：说明内容从哪里来、如何被解析、页面如何渲染、样式和安全边界在哪里，以及新增能力时应该落在哪一层。更细的运行状态与后续方向见 [`docs/handoff-to-agent.md`](./handoff-to-agent.md)，具体设计决策见 `docs/specs/` 与 `docs/adr/`。全栈审查：[`docs/full-stack-audit-2026-07-17.md`](./full-stack-audit-2026-07-17.md)。

## 1. 项目定位

这是一个本地内容驱动的个人博客与作品集站点，核心目标是：

- 用 MDX 管理博客与关于页内容；
- 用 JSON 管理作品集与个人收藏链接；
- 用 Next.js App Router 渲染页面、RSS、sitemap、OG image 与 PWA manifest；
- 用严格 CSP nonce、安全响应头和内容校验保证静态博客也能按生产站点标准运行；
- 用 Vitest、Playwright、SEO 检查、Bundle 预算和生产内容 smoke test 守住回归。

**渲染模型（重要）**

| 层        | 行为                                            | 原因                                                          |
| --------- | ----------------------------------------------- | ------------------------------------------------------------- |
| HTML 文档 | **动态**（`headers()` + per-request CSP nonce） | 严格 `script-src` + `strict-dynamic`，优先于全站 SSG 边缘缓存 |
| 内容数据  | 本地 MDX/JSON，进程内缓存                       | 无运行时数据库                                                |
| 静态资产  | feed / 图片 / `_next/static` 可边缘缓存         | 与 HTML 策略分离                                              |
| 搜索 API  | Node runtime + 短 CDN cache                     | 见 [`docs/API.md`](./API.md)                                  |

**不要**为了 HTML 静态化而把脚本 CSP 放宽到 `unsafe-inline`。

当前技术栈：

| 层         | 选型                                                          |
| ---------- | ------------------------------------------------------------- |
| Framework  | Next.js 16.2 App Router                                       |
| UI         | React 19.2, Tailwind CSS 4, BEM CSS modules                   |
| Content    | MDX, `next-mdx-remote`, `js-yaml`, local JSON                 |
| Validation | Zod schemas + custom frontmatter parser                       |
| Search     | fuse.js：生产 `GET /api/search`；测试可嵌 `posts` 客户端 Fuse |
| Tests      | Vitest + Testing Library, Playwright                          |
| Deploy     | Vercel + GitHub Actions                                       |

## 2. 总体分层

```text
content/ + data/
  -> src/lib/* repositories, schemas, cache, shared search contract
  -> src/server/* content facade + search service/engine/rate-limit
  -> src/app/* route pages, Route Handlers, metadata
  -> src/components/* UI composition（仅共享 DTO/纯函数 + HTTP）
  -> src/app/styles/* design tokens and CSS modules
  -> public/feed.* + sitemap + robots + OG images
```

| 层       | 目录                               | 职责                                                                             |
| -------- | ---------------------------------- | -------------------------------------------------------------------------------- |
| 内容源   | `content/`, `data/`                | 原始 MDX、关于页、作品集 JSON、收藏链接 JSON                                     |
| 数据层   | `src/lib/`                         | 文件读取、frontmatter 解析、Zod 校验、缓存、查询、共享搜索契约、SEO/JSON-LD 辅助 |
| 服务端层 | `src/server/`                      | 内容访问 facade、搜索用例/引擎/限流；仅供 App Router / Route Handler 使用        |
| 路由层   | `src/app/`                         | App Router 页面、动态 metadata、sitemap、robots、manifest、OG image、Search API  |
| 组件层   | `src/components/`                  | 页面结构、交互组件、通用 UI primitive                                            |
| 样式层   | `src/app/styles/`                  | 设计令牌、全局基础、页面/组件 CSS、响应式覆盖                                    |
| 验证层   | `*.test.ts(x)`, `e2e/`, `scripts/` | 单元/集成/E2E/SEO/Bundle/生产内容检查、模块边界测试                              |

依赖方向：`components/hooks -> lib（共享契约）+ HTTP`；`app -> server + lib`；`server -> lib`。禁止 client/`src/lib` 反向导入 `@/server`（见 `src/lib/module-boundaries.test.ts`）。

### 样式加载

- **根 layout**：tokens / base / components / archive / controls / blog-ui / article-ui / backdrop / prose / animations / responsive。
- **路由下沉**：`home*.css` → `app/page.tsx`；`search-ui.css` → `app/blog/layout.tsx`；`links.css` → `app/links/layout.tsx`；`project-detail.css` → `app/projects/[id]/layout.tsx`。

### JSON 数据 fail-fast

`createJsonContentRepository`：生产默认 `strict`（缺文件/坏 JSON **抛错**）；开发与测试默认 `lenient`（fallback）。CI `check:seo` 是另一道硬门禁。

## 3. 内容数据流

### 3.1 博客文章

```text
content/blog/*.mdx
  -> lib/parse-frontmatter.ts
  -> lib/schemas/post-frontmatter.ts
  -> lib/posts/repository.ts
  -> lib/posts/query.ts + search-text.ts
  -> server/content（页面/Route Handler 统一入口）
  -> app/blog/* pages
  -> components/blog/*
```

关键规则：

- 文件名采用 `YYYY-MM-topic.mdx`，slug 会去掉日期前缀；
- frontmatter 至少需要 `title`、`description`、`date`；
- `published: false` 在生产环境过滤；
- `category` 可显式填写，不填时通过 `category-rules` 从 tags 推断；
- `series` / `seriesOrder` 驱动专题页与相关文章排序；
- headings、excerpt、searchText、readingTime 由仓库层派生。

关键文件：

- `src/lib/schemas/post-frontmatter.ts`
- `src/lib/posts/repository.ts`
- `src/lib/posts/query.ts`
- `src/lib/posts/search-text.ts`
- `src/lib/content-source.ts`
- `src/lib/test-utils/in-memory-source.ts`

### 3.2 作品集

```text
data/projects.json
  -> lib/json-content-repository.ts
  -> lib/projects.ts
  -> server/content
  -> app/projects/* pages
  -> components/projects/ProjectCard
```

作品数据适合放结构化摘要、链接、标签、年份、封面与精选状态。若后续项目需要长篇复盘，建议新增 `content/projects/`，让 JSON 继续只承担索引职责。

### 3.3 个人收藏链接

```text
data/links.json
  -> lib/json-content-repository.ts
  -> lib/links.ts
  -> server/content
  -> app/links/page.tsx
  -> components/links/LinksDirectory
  -> components/home/CuratedLinksPreview
```

链接数据当前是 10 分类、123 条收藏，支持可选 `tags`、`official`、`priority`、`useCase`、`lastChecked`。校验层会拒绝常见推广/追踪参数，并检查重复分类、空分类和 URL 唯一性。`LinksDirectory` 在客户端提供轻量关键词筛选，匹配分类、标题、描述、官网域名、用途和标签；数据仍由 `app/links/page.tsx` 在服务端读取后传入。VPS、云服务、工具类收藏应优先放官网或原始页面链接。

## 4. 路由与页面组合

| 路由                                    | 入口                             | 数据来源                                          |
| --------------------------------------- | -------------------------------- | ------------------------------------------------- |
| `/`                                     | `src/app/page.tsx`               | posts、projects、links                            |
| `/about`                                | `src/app/about/page.tsx`         | `content/about.mdx`                               |
| `/blog`                                 | `src/app/blog/page.tsx`          | paginated posts；搜索走 API（无全站索引 payload） |
| `/api/search`                           | `src/app/api/search/route.ts`    | `server/search` 用例 + Fuse 投影 + 进程限流       |
| `/blog/[slug]`                          | `src/app/blog/[slug]/page.tsx`   | post detail + related posts                       |
| `/projects`                             | `src/app/projects/page.tsx`      | projects JSON                                     |
| `/projects/[id]`                        | `src/app/projects/[id]/page.tsx` | project detail                                    |
| `/links`                                | `src/app/links/page.tsx`         | links JSON                                        |
| `/tags`, `/tags/[tag]`                  | `src/app/tags/*`                 | tag aggregation                                   |
| `/categories`, `/categories/[category]` | `src/app/categories/*`           | category aggregation                              |
| `/series`, `/series/[series]`           | `src/app/series/*`               | series aggregation                                |

动态路由优先使用 `src/lib/route-adapter.ts` 的 `createDynamicRoute` 收敛参数处理、404 和静态参数生成模式。

首页当前组合顺序：

```text
EditorialHero
ManifestoSection
ReadingPathSection
FeaturedArticleRail
CuratedLinksPreview
ProjectsSection
HomeCtaSection
```

## 5. 组件边界

| 目录                   | 职责                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| `components/home/`     | 首页叙事、精选内容、滚动 reveal                                                                  |
| `components/blog/`     | BlogCard、SearchBar、Pagination、MdxContent、TOC、ReadingProgress、ReadingPreferences、ImageZoom |
| `components/layout/`   | Header、Footer、PageSection、ArchiveCard、EmptyState、SiteBackdropStage、SiteBackdropParallax    |
| `components/projects/` | ProjectCard                                                                                      |
| `components/links/`    | LinksDirectory（收藏目录、分类锚点、关键词筛选）                                                 |
| `components/comments/` | Giscus                                                                                           |
| `components/ui/`       | ThemeToggle、MetaBadge、Card/Button/Badge primitive、BackToTop、MagneticCard                     |

约定：

- 组件不直接读文件系统，也不导入 `@/server`；内容读取经 `src/server/content`，底层 repository 仍在 `src/lib/`；
- 归档页与列表页优先复用 `PageSection`、`ArchiveCard`、`MetaBadge`；
- shadcn CLI 在当前 Node 24 + zod exports 组合下不可用，继续维护本地已落地的 shadcn-style primitive，不运行 CLI 覆盖。
- 布局/纸感用 BEM CSS；交互用 `components/ui/*`（`size=cta|icon-toolbar|search`）；禁止业务侧再写 `.btn` / `.icon-btn`。

## 5.1 搜索

```text
生产: SearchBar (无 posts) → useServerSearch → GET /api/search
       → server/search（限流 + searchPublishedPosts）
       → server/content.getAllPosts + searchPostsCached → SearchResultItem 投影
测试: SearchBar posts={mock} → useFuseSearch → 同投影类型（仅共享契约）
```

- 共享契约/常量/投影：`src/lib/search/`（无引擎、无限流）
- 服务端用例/引擎/限流：`src/server/search/`
- 限流：进程内 60 req / IP / min，配合 `s-maxage=60`
- 边界门禁：`src/lib/module-boundaries.test.ts` 阻断 client/lib → server
- 规模：~14 文不上外部引擎；见 `docs/bem-search-architecture-2026-07-12.md`

## 6. CSS 与视觉架构

Tailwind v4 的 `@tailwindcss/postcss` 会静默丢弃 `globals.css` 内的 CSS `@import`，所以所有 CSS 模块必须在拥有该样式的根/segment `layout.tsx` 或页面中显式 import。

根 layout 的全局加载顺序必须保持：

```text
tokens.css
base.css
components.css
archive.css
controls.css
blog-ui.css
article-ui.css
backdrop.css
prose.css
animations.css
responsive.css
```

路由专属模块下沉到最近入口：首页 `page.tsx` 导入 `home.css`、`home-hero.css`、`home-sections.css`；`/blog` layout 导入 `search-ui.css`；`/links` layout 导入 `links.css`；`/projects/[id]` layout 导入 `project-detail.css`。这样保持显式依赖关系，同时避免所有路由下载无关样式。

职责分配：

- `tokens.css`：设计令牌、浅色/深色主题变量；
- `base.css`：html/body、skip link、header/footer、reduced-motion；
- `components.css`：section、通用卡片与基础布局；
- `archive.css`：归档网格、归档卡片与归档列表；
- `controls.css`：按钮、分页、标签链接和轻量控制；
- `links.css`：收藏导航目录；
- `blog-ui.css`：博客列表、目录、标签云、图片放大和 not-found；
- `search-ui.css`：搜索输入与搜索结果；
- `article-ui.css`：文章详情布局、阅读面板、相关文章和文章导航；
- `backdrop.css`：全站背景层；
- `home.css`：首页 Paper Gallery 主题覆盖、共享样式和首页响应式；
- `home-hero.css`：首页首屏；
- `home-sections.css`：首页 Manifesto、ReadingPath、ArticleRail、链接预览、项目和 CTA；
- `prose.css`：MDX 正文排版与代码块；
- `project-detail.css`：项目详情；
- `animations.css`：reveal、fade motion；
- `responsive.css`：移动端覆盖，最后加载。

颜色应通过 CSS 变量引用，避免硬编码；结构类使用 BEM，自定义状态或布局可配合少量 Tailwind utility。

## 7. 全站背景架构

背景采用三层分离：

| 层         | 实现                       | 职责                                  |
| ---------- | -------------------------- | ------------------------------------- |
| 静态背景层 | `body::before/after`       | 渐变、光晕、网格遮罩                  |
| 装饰元素层 | `<SiteBackdropStage />`    | server-rendered decorative DOM        |
| 视差跟随层 | `<SiteBackdropParallax />` | client-side CSS variables side effect |

关键文件：

- `src/components/layout/SiteBackdropStage.tsx`
- `src/components/layout/SiteBackdropParallax.tsx`
- `src/app/styles/backdrop.css`
- `docs/specs/2026-06-29-site-backdrop-architecture-design.md`

E2E 验证视差时，需要等待 hydration 后的 `useEffect` 监听器就绪；不要只等待 `.site-backdrop__stage` 出现。

## 8. 安全、渲染与部署边界

项目使用严格 CSP nonce：

- `src/proxy.ts` 为每个请求设置 nonce 与安全 header；
- `src/lib/csp.ts` 从 request headers 读取 nonce；
- `layout.tsx` 与 JSON-LD script 使用同一个 nonce；
- 因为 nonce 依赖请求，主要页面按需动态渲染是预期行为。

`next.config.ts` 还负责安全响应头、`outputFileTracingIncludes` 和 bundle analyzer 配置。远程图片配置保持关闭，图片资源优先放 `public/`。

部署链路：

```text
push master
  -> GitHub Actions quality + bundle-analyze
  -> e2e (production build + Playwright + Lighthouse)
  -> Vercel production deploy
  -> check-production-content against NEXT_PUBLIC_SITE_URL
```

生产内容 smoke 覆盖首页、博客、作品、收藏链接、RSS 和 sitemap。

## 9. 缓存与测试

数据读取缓存统一使用 `src/lib/cache.ts` 的 `createCache<T>`，测试中用 `resetAllCaches()` 隔离状态。

当前测试基线：

| 层         | 基线                                                         |
| ---------- | ------------------------------------------------------------ |
| Vitest     | 599 tests / 77 files                                         |
| Playwright | 48 tests / 5 spec files                                      |
| Build      | production build succeeds; document routes remain dynamic    |
| CI         | quality / bundle-analyze / e2e（含 Lighthouse）/ deploy 全绿 |

新增行为时优先补单元或组件测试；浏览器交互、移动端布局、CSP/Giscus、搜索和导航路径需要 Playwright 覆盖。

## 10. 新增能力落点

| 需求                      | 优先修改位置                                                 |
| ------------------------- | ------------------------------------------------------------ |
| 新增博客文章              | `content/blog/*.mdx`                                         |
| 新增关于页内容            | `content/about.mdx`                                          |
| 新增项目卡片              | `data/projects.json`                                         |
| 新增收藏链接              | `data/links.json`                                            |
| 新增内容字段              | schema -> repository -> content workflow -> tests            |
| 新增页面                  | `src/app/*` + sitemap + navigation + tests                   |
| 新增归档/列表 UI          | `PageSection` / `ArchiveCard` / `MetaBadge`                  |
| 修改主题或视觉令牌        | `tokens.css`，再检查相关 CSS 模块                            |
| 修改文章正文排版          | `prose.css`                                                  |
| 修改搜索                  | `components/blog/SearchBar.tsx` + `lib/posts/search-text.ts` |
| 修改 CSP/security headers | `src/proxy.ts` + `src/lib/csp.ts` + ADR                      |

## 11. 常用验证

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm check:seo
pnpm test
pnpm build
pnpm test:e2e
pnpm check:production-content
```

改 CSS 后还应确认生产 CSS bundle 包含关键选择器；改内容源、RSS 或 sitemap 后至少运行 `pnpm check:seo` 与 `pnpm build`。

## 12. 相关文档

- [`docs/handoff-to-agent.md`](./handoff-to-agent.md) — 当前状态、接手顺序与后续方向
- [`docs/content-workflow.md`](./content-workflow.md) — 内容维护与发布流程
- [`docs/css-conventions.md`](./css-conventions.md) — CSS 分层与写法约定
- [`docs/cache-components-migration.md`](./cache-components-migration.md) — 缓存与未来迁移策略
- [`docs/specs/2026-06-29-css-import-fix-design.md`](./specs/2026-06-29-css-import-fix-design.md) — Tailwind v4 CSS import 限制
- [`docs/specs/2026-06-29-site-backdrop-architecture-design.md`](./specs/2026-06-29-site-backdrop-architecture-design.md) — 三层背景架构
- [`docs/specs/2026-07-04-shadcn-visual-architecture-design.md`](./specs/2026-07-04-shadcn-visual-architecture-design.md) — shadcn-style UI 收口
- [`docs/adr/2026-07-17-csp-nonce-over-ssg.md`](./adr/2026-07-17-csp-nonce-over-ssg.md) — 当前 CSP nonce 与 SSG 取舍
