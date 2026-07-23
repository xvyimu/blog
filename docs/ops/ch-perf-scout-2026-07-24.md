# Chronicle 性能波 · Phase 0 只读测绘（scout）

- **日期：** 2026-07-24
- **分支 / wt：** `xvyimu/ch-perf-scout` · 本工作区 `ch-perf-scout`
- **tip：** `83085a7`
- **范围：** 只读测绘 + 本 findings；**未**改业务代码、**未** push、**未**动其它仓
- **本文件：** 可提交 ops 副本（根目录 `findings.md` 同文，但被 `.gitignore` 忽略）

---

## 1) 关键键路由表

**全局渲染前提（ADR 2026-07-17）：** 根 layout 调 `getCspNonce()` → `headers()`（`src/lib/csp.ts`），生产 HTML 文档路由为 **dynamic / request-time**，`private, no-cache`；**不为 SSG 放宽 CSP**。`generateStaticParams` 仍存在于动态段，用于参数枚举 / 构建期路径发现，**不**等于全站静态 HTML。

| 路由 | 入口 | 渲染模式 | 数据 / 备注 |
|------|------|----------|-------------|
| `/` | `src/app/page.tsx` | RSC + **dynamic**（nonce + content） | posts / projects / links；JSON-LD nonce |
| `/blog` | `src/app/blog/page.tsx` | RSC + **dynamic**；`searchParams.page` | 分页 `PAGE_SIZE=12`；**无**全站索引 payload；`SearchBar` 走 API |
| `/blog/[slug]` | `src/app/blog/[slug]/page.tsx` | RSC + **dynamic**；`createDynamicRoute` + `generateStaticParams` | MDX + TOC + Giscus + backlinks/neighbors；OG：`opengraph-image.tsx` |
| `/garden` | `src/app/garden/page.tsx` | RSC + **dynamic**；client `GardenExplorer` | snapshot graph + positions |
| `/series` · `/series/[series]` | `src/app/series/*` | RSC + **dynamic**；`[series]` 用 adapter | 专题聚合 |
| `/categories` · `/categories/[category]` | `src/app/categories/*` | RSC + **dynamic** | 分类聚合 |
| `/tags` · `/tags/[tag]` | `src/app/tags/*` | RSC + **dynamic** | 标签聚合 |
| `/projects` · `/projects/[id]` | `src/app/projects/*` | RSC + **dynamic**；`[id]` adapter | `data/projects.json`；详情 layout 下沉 `project-detail.css` |
| `/links` | `src/app/links/page.tsx` | RSC + **dynamic**；client `LinksDirectory` | `data/links.json`（~10 类 / 123 链） |
| `/about` | `src/app/about/page.tsx` | RSC + **dynamic** | `content/about.mdx` → `MdxContent` |
| `GET /api/search` | `src/app/api/search/route.ts` | **Node runtime**；`s-maxage=60, swr=300` | Fuse + 限流 60/IP/min |
| `GET /api/preview/[slug]` | `src/app/api/preview/[slug]/route.ts` | Route Handler | 预览缓存头 |
| `POST/report /api/csp-report` | `src/app/api/csp-report/route.ts` | Node | CSP Reporting API 收集 |
| `sitemap` / `robots` / `manifest` | `src/app/sitemap.ts` 等 | Metadata routes | SEO/PWA |
| OG | `src/app/opengraph-image.tsx` · `blog/[slug]/opengraph-image.tsx` | `next/og` | 动态图 |

**主导航 SSOT：** `src/lib/navigation.ts` → `/` · `/blog` · `/garden` · `/links` · `/categories` · `/series` · `/projects` · `/about`。

**Loading：** `src/app/blog/loading.tsx` · `src/app/blog/[slug]/loading.tsx`。

---

## 2) 图片与字体策略

### 图片

| 项 | 位置 / 行为 |
|----|-------------|
| 配置 | `next.config.ts` → `images.remotePatterns: []`（仅本地） |
| `next/image` 使用点 | `EditorialHero`（LCP 候选 `priority`+`eager`）、`ProjectCard`（前 2 张 `priority`）、`ImageZoom`（MDX `img`）、`projects/[id]/page` |
| Blur / LQIP | `pnpm gen:blur` → `scripts/generate-blur-data.mjs` → **`src/lib/image-blur-map.ts`**（自动生成，禁手改）；读取 `image-blur-data.ts` · `imageBlurProps()` |
| 覆盖检查 | `pnpm check:blur` → `scripts/check-project-blur-coverage.ts` |
| 资产目录 | `public/images/projects/*`；blog 正文图位预留 `public/images/blog/`（workflow 记「当前尚无正文图资产」） |

### 字体（`src/app/layout.tsx` · `next/font/google` only）

| 字体 | CSS 变量 | weight | preload | 备注 |
|------|----------|--------|---------|------|
| Noto Sans SC | `--font-noto-sans-sc` | 400, 700 | **true** | body；`subsets: ['latin']` + `adjustFontFallback` |
| Cormorant Garamond | `--font-display` | 500, 600 | **true** | 大标题；历史 CLS 驱动，已加 fallback 调整 |
| JetBrains Mono | `--font-jetbrains-mono` | 400, 700 | **false** | 代码；metric fallback 收紧 |

无第三方 CSS `@font-face` 旁路；CSP `font-src 'self' data:`。

---

## 3) CSP / nonce 入口

| 职责 | 路径 |
|------|------|
| **Per-request CSP + nonce 生成** | `src/proxy.ts`（Next 16 proxy 入口；**无** `middleware.ts`） |
| Nonce 读取 | `src/lib/csp.ts` → `headers().get('x-nonce')` |
| 根 layout 应用 | `src/app/layout.tsx` → `DarkModeScript nonce` |
| JSON-LD | `src/app/page.tsx`、`src/components/blog/ArticleJsonLd.tsx`、`blog/[slug]/page.tsx` |
| 静态安全头（非 CSP） | `next.config.ts` `headers()`：HSTS / XFO / nosniff / Referrer / Permissions-Policy |
| 违规收集 | `src/app/api/csp-report/route.ts`；`report-uri` + `Reporting-Endpoints` |
| ADR | `docs/adr/2026-07-17-csp-nonce-over-ssg.md`；SRI 评估 `docs/adr/2026-07-21-sri-over-nonce-evaluation.md`（`ENABLE_SRI=1` 实验，**生产默认关**） |

**生产 CSP 要点：** `script-src 'self' 'nonce-…' 'strict-dynamic' giscus + va.vercel-scripts.com`；`style-src 'self' 'unsafe-inline'`（Tailwind 内联）；dev 跳过 CSP（HMR）。

---

## 4) Content snapshot

| 项 | 值 |
|----|-----|
| 命令 | `pnpm content:build` → `tsx scripts/build-content-snapshot.ts` |
| 目录 | **`generated/content-snapshot/`**（已提交，非 gitignore） |
| 产物 | `manifest.json` · `posts-meta.json` · `posts-full.json` (~209 KB) · `search-docs.json` · `garden-graph.json` · `positions.json` |
| 解析 | `src/lib/content-snapshot/*`；路径常量 `paths.ts`；后端选择 `resolveContentBackend()` |
| 默认 | **production → `snapshot`**；dev → `fs`；`CONTENT_BACKEND` 可覆盖 |
| 纪律 | **改 MDX / frontmatter 指纹字段后必 `pnpm content:build` 并提交 snapshot**（同 `public/feed.*`） |
| 门闩 | CI：`content:build` + `git diff --exit-code -- generated/content-snapshot` |
| 环境 | `CONTENT_BUILD_FORCE=1`；`SOURCE_DATE_EPOCH` 冻结 `builtAt` |
| 当前 manifest | `postCount: 20` · `contentHash: ec03c7da…` · `builtAt: 2026-07-22T17:21:36.974Z` |
| 本 scout 实测 | `pnpm content:build` → **unchanged** · **exit 0** |

文档：`docs/content-workflow.md` §「内容快照」；`docs/architecture.md` §3。

---

## 5) 质量命令与实测

| 命令 | 用途 | 本 wt 结果 |
|------|------|------------|
| `pnpm typecheck` | `tsc --noEmit` | **exit 0** |
| `pnpm test` | Vitest | **exit 0** · **716 / 95 files**（与 tip 基线一致） |
| `pnpm content:build` | 内容快照 | **exit 0** · hash unchanged |
| `pnpm build` | RSS + snapshot + next build | **未跑**（全量 prod build 重；scout 优先 typecheck/vitest） |
| `pnpm test:e2e` | Playwright 49+ | **未跑**（需 Chromium + prod server；过重） |
| `pnpm lint` / `check:seo` / `check:blur` | 其它门闩 | **未跑**（非本波优先） |
| Bundle 预算 | `scripts/check-bundle-budget.ts`（需 build 后） | **未跑**；基线见 performance-baseline 2026-07-17 |

**运行时备注：** 本机 Node **v24.16.0**（engines 要 **22.x**）→ pnpm WARN Unsupported engine；typecheck/vitest 仍绿。生产/CI 仍以 Node 22 为准。

详见 `evidence.md`。

---

## 6) 可疑性能债 Top N（带路径）

按 **CWV / 架构证据** 排序（lab + 代码，非 RUM p75；RUM 仍 pending）。

1. **HTML 全站 dynamic + CSP nonce（TTFB / LCP 结构债）**  
   `src/proxy.ts` · `src/lib/csp.ts` · `src/app/layout.tsx` · ADR `docs/adr/2026-07-17-csp-nonce-over-ssg.md`  
   → 边缘难缓存 HTML；Function 调用成本。**不可**用 `unsafe-inline` 换 SSG。后续只可在「资产缓存 / 流式 / 部分预计算」内挖。

2. **移动端 lab FCP/LCP 严重超时（render-blocking CSS）**  
   基线 `docs/performance-baseline.md`（2026-07-17 mobile）：`/` LCP **9794 ms**、`/links` **10554 ms**、`/blog` **8730 ms**；主因 route CSS 阻塞。  
   根 layout 仍串联 11 个全局 CSS：`src/app/layout.tsx` imports `tokens`…`responsive`；路由下沉未尽（`article-ui`/`blog-ui` 仍全局）。

3. **三字体 + 双 preload（字体带宽 / LCP 竞争）**  
   `src/app/layout.tsx`：Noto SC + Cormorant **均 preload**；Mono 额外两 weight。中文面 + display 同时抢 LCP 窗口。

4. **文章页 MDX + Shiki 运行时高亮**  
   `src/components/blog/MdxContent.tsx`（`rehype-pretty-code` + 双主题 vitesse light/dark）· `CodeBlock.tsx`（client）  
   → 详情 LCP/TBT 候选；`posts-full.json` ~209 KB 进运行时读路径。

5. **Client 边界偏多（INP / hydration）**  
   含：`SearchBar` · `useServerSearch` · `GardenExplorer` · `LinksDirectory` · `Giscus` · `MagneticCard` · `SiteBackdropParallax` · `RevealOnScroll` · `ReadingProgress` · `ReadingPreferences` · `ImageZoom` · `CodeBlock` · `Header` · `ThemeToggle` · `BackToTop` · `WikilinkPopover` 等（约 20+ client 面）。  
   首页 `MagneticCard` + `RevealOnScroll` + parallax 叠加 pointer/rAF。

6. **首页 LCP 图像与装饰层**  
   `EditorialHero.tsx` → `/images/projects/blog.png`；`SiteBackdropStage.tsx` + `backdrop.css`（历史 CLS：mesh 几何，已部分修）。

7. **搜索 API 冷路径**  
   `src/app/api/search/route.ts` · `src/server/search/*` · snapshot `search-docs.json` (~48 KB)  
   生产已不嵌页面索引（好）；debounce 180ms；限流 + Node 冷启动仍可能影响首查 INP 体感。引擎保持 Fuse（ADR 2026-07-22，n=20）。

8. **`/links` 客户端全量目录**  
   `src/app/links/page.tsx` → `LinksDirectory.tsx`（client 筛 123 链）；mobile lab 最差 LCP 页之一。

9. **Giscus 第三方脚本 / iframe**  
   `src/components/comments/Giscus.tsx`；CSP 已 allowlist；文章页下方，影响 LCP 次要、影响主线程与 privacy 边界。

10. **Bundle 余量偏紧（观察）**  
    2026-07-17：max JS **222 KB** / max CSS **181.8 KB** / total **1.15 MB**（预算 300 / 300 / 2 MB）。CSS 路由继续下沉可降「最大 CSS」与阻塞。

11. **View Transitions experimental**  
    `next.config.ts` `experimental.viewTransition: true` — 交互/导航成本需在 e2e/CWV 中盯。

12. **RUM 空窗**  
    Speed Insights 已挂（`layout.tsx`），p75 **pending**（无 `VERCEL_TOKEN` 查询记录）。优化优先级应用 field 校准 lab。

---

## 7) 建议模块切片（一 wt 一边界）

| 模块名 | 目录 glob | 目标 | 互斥 / 依赖 |
|--------|-----------|------|-------------|
| **perf-css-route-split** | `src/app/layout.tsx` · `src/app/styles/**` · 各 route `layout.tsx`/`page.tsx` | 继续把 `blog-ui`/`article-ui`/archive 等按路由下沉；验证选择器仍在产物中 | 互斥改 tokens 语义；勿并行大改 prose |
| **perf-font-subset** | `src/app/layout.tsx`（font 段 only） | 评估 display 是否首页-only、preload 矩阵、weight 裁剪 | 与 CLS 回归互斥；需 Lighthouse 前后对比 |
| **perf-home-lcp** | `src/components/home/**` · `src/app/page.tsx` · hero 图 / blur | 首页 LCP 元素、优先图、首屏 JS | 勿与全站 CSS 大拆并行同一 PR |
| **perf-article-mdx** | `src/components/blog/MdxContent.tsx` · `CodeBlock*` · `src/lib/posts/**`（只读契约） | 高亮缓存/预计算、减小详情主线程 | **禁**改 CSP；snapshot 契约变更要 content:build |
| **perf-client-trim** | `MagneticCard` · `RevealOnScroll` · `SiteBackdropParallax` · `Header` | 减 rAF/pointer、条件挂载 | 与 a11y/`prefers-reduced-motion` 测试绑定 |
| **perf-links-payload** | `src/app/links/**` · `src/components/links/**` · `src/lib/links.ts` | 目录虚拟化/分段/SSR 筛 | 勿与 links schema 大改同 PR |
| **perf-search-edge** | `src/app/api/search/**` · `src/server/search/**` · `src/lib/search/**` | 缓存命中、投影体积、冷启动 | **禁**换 Orama/Pagefind（ADR keep-fuse，无 ≥200 文触发） |
| **perf-rum-backfill** | `docs/performance-baseline.md` · ops scripts | 填 Speed Insights p75 | 需密钥；只写 docs/ops |
| **perf-bundle-budget-refresh** | `scripts/check-bundle-budget.ts` · `.next` 产物 | 刷新 2026-07 预算数字 | 依赖干净 `pnpm build`（Node 22） |

**硬互斥（跨切片）：**

- **CSP/nonce**（`proxy.ts` / `csp.ts` / layout script）↔ 任何「恢复全站 SSG HTML」尝试  
- **content snapshot 格式** ↔ 运行时 repository 读取  
- **搜索引擎替换** ↔ 未触发 ADR reopen  
- **ChronoPortal / 其它仓** — 本波禁止

---

## 残留风险（一句）

本 scout 在 **Node 24** 下只验证了 typecheck/vitest/content:build，**未**跑 production build / e2e / Lighthouse / bundle-budget，且 **RUM p75 仍空**，故 Top 债排序以 lab 基线 + 代码结构为准，上线优先级需 field 与 Node 22 CI 再校准。
