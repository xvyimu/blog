# 全栈代码审查与优化报告 · 2026-07-17

## 0. 审查范围与基线

| 项           | 值                                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------------- |
| 项目         | 西江月博客 `D:\blog`                                                                                             |
| 线上         | https://incca.ccwu.cc                                                                                            |
| Git 基线     | `af6a919`（`master` = `origin/master`，工作树 clean）                                                            |
| 栈           | Next.js 16.2.9 App Router · React 19.2 · TypeScript · Tailwind v4 · MDX · Fuse.js · Vitest · Playwright · Vercel |
| 内容规模     | 14 篇 MDX · `data/projects.json` · `data/links.json`                                                             |
| 运行时数据库 | **无**；“后端”= Route Handler + 本地内容仓库 + 进程内缓存/限流                                                   |
| 近期已落地   | 审查收敛 `569a54f`、文章 lab CLS `af6a919`；CI `29513385257` quality/e2e/lighthouse/deploy 全绿                  |

### 线上探针（审查时）

| 探针                     | 结果                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `GET /`                  | 200；`Cache-Control: private, no-cache, no-store`；CSP nonce 动态；`X-Vercel-Cache: MISS` |
| `GET /api/search?q=next` | 200 JSON；结果投影无 `searchText`；`X-Vercel-Cache: STALE`（CDN 有命中迹象）              |
| 安全头                   | HSTS / X-Frame-Options / nosniff / Referrer-Policy / Permissions-Policy 齐全              |

### 结论摘要

- **无新增 P0 安全阻断项**（无密钥入库、搜索字段投影已收紧、JSON-LD 做了 `<` 转义）。
- **最大结构性代价**：per-request CSP nonce 使主文档路由动态化，首页无法走完整边缘静态缓存。
- **最大性能杠杆**：按路由拆分 CSS（根 layout 全量 import）、文章页 lab CLS 继续收敛、搜索限流语义与 CDN 行为对齐。
- **数据层风险**：`projects`/`links` 运行时对缺失/坏 JSON 仍 silent fallback `[]`；CI 的 `check:seo` 已严，生产进程仍可能“静默空页”。

---

## 1. 前端代码审查

### FE-1 [P1] 根布局全量导入业务 CSS，全路由支付全站样式成本

**问题描述**  
`src/app/layout.tsx` 同步 import `tokens`～`responsive` 共 17 个语义 CSS 模块（约 90KB 源；生产 CSS 含 Shiki 主题约 **302KB**，最大单包约 **181KB**）。首页、文章、链接目录、项目详情样式全部进入根图，任意路由都要下载/解析无关 CSS。

**影响评估**

- 增大 FCP/LCP 与样式计算时间，尤其移动端与冷启动。
- Bundle budget 仍在 2MB 内，但 CSS 已是预算紧张项。
- 与“静态内容博客”目标不一致：样式体积随功能线性堆叠到所有页面。

**推荐操作步骤**

1. 用 Coverage / `@next/bundle-analyzer` 确认各路由未用选择器（已有 `pnpm analyze`）。
2. 保持 `tokens.css` + `base.css` + `responsive.css` 在根 layout。
3. 将 `home-*.css`、`links.css`、`project-detail.css`、`search-ui.css` 等迁到对应 segment 的 `layout.tsx` 或页面级 import。
4. 每迁一个模块：视觉 diff + 相关 E2E + `check-bundle-budget`。

**预期收益**  
非首页路由 CSS 下降 **15–40%**（视路由而定）；文章页少解析首页/链接目录规则。

**验证**  
对比迁移前后 `.next/static/css` 体积、Lighthouse total-byte-weight、首页与 `/blog/[slug]` 截图。

---

### FE-2 [P1] CSP nonce 强制主文档动态渲染，边缘缓存几乎失效

**问题描述**  
`src/proxy.ts` 每请求生成 nonce 并写入 CSP；`getCspNonce()` 在根 layout 读取 `headers()`。线上首页响应：`Cache-Control: private, no-cache, no-store`、`X-Vercel-Cache: MISS`、`Age: 0`。

**影响评估**

- 每次 HTML 都打 Function，TTFB 与账单高于纯 SSG。
- 安全收益真实（严格 `script-src` + `strict-dynamic`），属于有意权衡，但需用 RUM 证明可接受。
- 与 RSS/sitemap 等可静态资源并存，心智上“半动态站”。

**推荐操作步骤**

1. 在 Vercel Speed Insights 记录首页/文章 p75 TTFB 与 Function Invocations 7 日。
2. 若成本/延迟可接受：保持现状，文档写明“nonce CSP > 全站 SSG”。
3. 若不可接受：评估 Next 支持的静态 CSP/SRI 方案；**禁止**为静态化回退 `unsafe-inline` 脚本。
4. 静态资源（`/feed.xml`、图片）继续边缘缓存，与 HTML 策略分离。

**预期收益**  
用数据决定是否改架构，避免凭感觉牺牲 XSS 基线。

**验证**  
改前改后对比 TTFB p75、Function 次数、浏览器 CSP 违规、Giscus/Analytics 是否仍可用。

---

### FE-3 [P2] MagneticCard 高频 pointermove 仍同步布局读/写

**问题描述**  
`src/components/ui/MagneticCard.tsx` 已去掉重复 mouse 监听，但 `handleMove` 仍在每次 `pointermove` 中同步 `getBoundingClientRect()` 并写 transform + 5 个 CSS 变量，无 rAF 合并。

**影响评估**  
卡片网格（首页/项目/链接）在指针滑动时放大主线程压力，影响 INP 与低端设备流畅度。

**推荐操作步骤**

1. 缓存 `latestX/Y`，`requestAnimationFrame` 单帧应用（对齐 `SiteBackdropParallax`）。
2. unmount/`pointerleave` 时 `cancelAnimationFrame`。
3. 单测断言：一帧内多次 move 只 apply 一次（mock rAF）。

**预期收益**  
样式更新上限≈刷新率；减少 layout thrashing。

**验证**  
MagneticCard 单测；Performance 面板 handler 不再成对尖峰。

---

### FE-4 [P2] 文章页 lab CLS 仍偏高（门禁已放宽到 0.15）

**问题描述**  
CI 曾在 `/blog/nextjs-app-router` 出现 lab CLS≈0.33 / perf≈0.75。`af6a919` 增加了 display/mono `adjustFontFallback`、标题 `line-height: 1.05`、Giscus `min-height: 320px`，并将 lab CLS 门禁调至 **0.15**（field 目标仍 0.1）。

**影响评估**

- lab 与 field 可能分叉；门禁放宽掩盖回归风险。
- 标题用 `clamp(2.7rem, 6vw, 5.2rem)` + 展示字体，字体 swap 仍是主要嫌疑。
- 代码块/Shiki 主题与阅读偏好 hydration 也可能贡献位移。

**推荐操作步骤**

1. 对文章页跑 Lighthouse 并导出 “Avoid large layout shifts” 归因。
2. 评估标题改用系统衬线栈或降低 `clamp` 上限。
3. 为 `rehype-pretty-code` 容器预设 `min-height` 或骨架行高。
4. lab 门禁维持 0.15 的同时，在 `docs/performance-baseline.md` 记录 field p75；p75>0.1 再开专项。

**预期收益**  
lab perf 回到 ≥0.8 更稳；真实 CLS 接近 Good。

**验证**  
Lighthouse 文章页 CLS≤0.15（目标 ≤0.1）；Speed Insights 文章路由 p75。

---

### FE-5 [P2] `Noto_Sans_SC` 仅 `subsets: ['latin']`

**问题描述**  
`layout.tsx` 中 `Noto_Sans_SC({ subsets: ['latin'], ... })`。中文正文大量依赖 fallback 字体度量，与 `adjustFontFallback` 目标部分冲突。

**影响评估**  
中文排版首屏可能 FOIT/FOUT 或度量跳动，放大 CLS；latin subset 对中文页面收益有限却仍 preload。

**推荐操作步骤**

1. 查阅 next/font 对 Noto Sans SC 的可用 subset/预加载策略。
2. 优先：`preload: true` 仅保留真正首屏需要的 face；或改用可变字体/自托管子集。
3. 用中文标题页对比 CLS。

**预期收益**  
中文首屏文字稳定性提升。

**验证**  
文章页 Lighthouse CLS；Network 字体请求体积与 unicode-range。

---

### FE-6 [P2] LoadingIntro 延迟显示仍可能造成“闪一下”

**问题描述**  
`LoadingIntro` 默认 `show=false`，idle/timeout 80ms 后才 `loading-intro--visible`。首屏若依赖该层遮罩，可能出现空白帧或布局跳动。

**影响评估**  
首页体验与 LCP 元素稳定性；a11y 上 `role="status"` 可接受，但视觉价值存疑。

**推荐操作步骤**

1. 确认首页是否仍挂载 LoadingIntro；若产品不需要，删除组件与 CSS。
2. 若保留：SSR 即 visible，或用 CSS 动画而非挂载延迟。
3. 补 E2E：首屏关键文案在 1s 内可见。

**预期收益**  
减少无效客户端工作与首屏闪烁。

**验证**  
首页 E2E + Lighthouse FCP/LCP。

---

### FE-7 [P3] 安全面：JSON-LD / 第三方脚本

**问题描述**

- `ArticleJsonLd` 使用 `dangerouslySetInnerHTML`，但 `toJsonLd` 对 `<` 做了 `<` 转义，风险可控。
- Giscus / Vercel Analytics 为第三方脚本；CSP 已限制到 `giscus.app` 与 `va.vercel-scripts.com`。
- `style-src 'unsafe-inline'` 因 Tailwind 注入保留，脚本侧相对严格。

**影响评估**  
当前威胁模型下可接受；未来若 MDX 允许原始 HTML，需防 XSS 升级。

**推荐操作步骤**

1. 保持 MDX 组件白名单（现仅 `pre`/`img` 映射）。
2. 不在 MDX 中引入未消毒 HTML。
3. 定期用 CSP report-only 观察违规（可选）。

**预期收益**  
维持 XSS 基线不回退。

**验证**  
CSP 无意外违规；搜索/评论功能正常。

---

## 2. 后端代码审查

（Route Handler · 内容仓库 · 缓存 · 限流；无 SQL 数据库）

### BE-1 [P1] 必需 JSON 在运行时仍可静默降级为空数组

**问题描述**  
`createJsonContentRepository` 在文件缺失或 `JSON.parse` 失败时 `console.warn/error` 后 `return fallback()`（projects/links 为 `[]`）。`scripts/check-seo.ts` 已对 projects 做存在/parse/schema 硬失败，但**运行时路径**与 CI 不一致。

**影响评估**  
错误部署或追踪遗漏时，线上作品/链接页可能“成功渲染但内容为空”，SEO 与信任受损。

**推荐操作步骤**

1. 为 repository 增加 `mode: 'strict' | 'lenient'`；生产 `getAll` strict 抛错。
2. 或在 `app/projects/page.tsx` / `app/links/page.tsx` 检测空数据且文件应存在时 `notFound()`/error boundary。
3. 保留测试 in-memory source 的 lenient 行为。
4. 确认 `outputFileTracingIncludes` 覆盖 `data/**`（已有根级 trace）。

**预期收益**  
把静默空页前移为 5xx/构建失败，避免“绿部署空内容”。

**验证**  
临时改名 `data/projects.json` 后本地 `next start` 应失败或明确错误页；CI `check:seo` 仍红。

---

### BE-2 [P1] `/api/search` 限流为进程内 Map，语义是 origin best-effort

**问题描述**  
`src/lib/search/rate-limit.ts` 使用模块级 `Map`；serverless 多实例各自计数。`route.ts` 对 200 响应设置 `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`，缓存命中请求不会进入限流。IP 仅信任 `x-vercel-forwarded-for`（正确）。

**影响评估**

- 无法承诺全局 60 次/分钟。
- 对公开静态搜索内容，风险主要是 origin 成本而非数据泄露。
- 若运维误把该 Map 当安全边界，会产生虚假安全感。

**推荐操作步骤**

1. 在 `route.ts` 与 API 文档注释明确 “origin best-effort；CDN 命中不计数”。
2. 需要硬配额时：Vercel Firewall / WAF 按路径+IP，而不是上 Redis（当前规模不值）。
3. 监控 Function Invocations 与 429 率。

**预期收益**  
语义与实现一致；避免错误加固方向。

**验证**  
预览环境：缓存 miss 触发 429；平台规则可拦截突发。

---

### BE-3 [P2] 搜索引擎每次构建 Fuse 的输入含完整 PostMeta 列表

**问题描述**  
`getAllPosts()` 从缓存的 `PostFull[]` 映射掉 `content`，但仍保留 `searchText` 等字段；`searchPostsCached` 用 `WeakMap` 按数组引用缓存 Fuse，生产路径合理。每次 cold start 需读盘+建索引。

**影响评估**  
14 篇文章下可忽略；文章到数百篇时 cold start 与内存上升。`searchText` 进索引是正确的，但勿再把正文 `content` 放进列表 API。

**推荐操作步骤**

1. 短期：保持现状。
2. 中期：缓存层拆 `PostMeta[]` 与按 slug 的 `content` 二级缓存，避免 list 路径持有全文。
3. 文章 >200 或 p95 搜索 >100ms 再评估专用索引。

**预期收益**  
规模增长时延迟可预期；现在避免过度设计。

**验证**  
对 `getAllPosts` 做简单 benchmark；内存快照对比。

---

### BE-4 [P2] API 契约：仅单一搜索端点，`count` 为返回条数

**问题描述**  
公开 API 实质只有 `GET /api/search`。`count` 已从易误解的 `total` 更名，表示**截断后返回条数**，无分页 cursor。无 OpenAPI/版本前缀。

**影响评估**  
当前 UI 足够；第三方若当“总命中数”会错。缺少版本号在破坏性变更时难兼容。

**推荐操作步骤**

1. 在响应或文档中保持 `count` JSDoc（已有方向）。
2. 真正需要分页时再引入 `total`/`nextCursor`，勿提前复杂化。
3. 可选：`docs/API.md` 一小节描述查询参数与错误码（`RATE_LIMITED`/`QUERY_TOO_LONG`）。

**预期收益**  
契约清晰；未来演进不伤 UI。

**验证**  
route 单测覆盖空查询、超长、limit clamp、429。

---

### BE-5 [P2] 内容读取错误处理不统一

**问题描述**

- Posts：frontmatter 失败 **throw**（好）。
- JSON 仓库：parse 失败 **fallback**（见 BE-1）。
- 目录不存在：posts warn + `[]`。

**影响评估**  
运维排障依赖日志级别与是否看得到 warn；用户侧表现不一致。

**推荐操作步骤**  
统一“生产 fail-fast / 测试 fallback”策略，写入 `docs/architecture.md` 一小节。

**预期收益**  
降低“偶发空数据”类故障的 MTTR。

**验证**  
破坏性 fixture 下行为表驱动测试。

---

### BE-6 [P3] 无传统数据库查询；N+1 不适用

**问题描述**  
无 ORM/SQL。潜在“重复读”来自多次 `getAllPosts()` 调用，但生产缓存使 factory 只跑一次。

**影响评估**  
当前架构匹配内容规模；引入 DB/ES 会增加同步与故障面，**明确不建议**。

**推荐操作步骤**  
保持 `ContentSource → cache → query/search → route`；规模门闩写入 baseline 文档。

**预期收益**  
避免过早平台化。

---

## 3. 整体架构建议

### ARCH-1 [P1] 动态 HTML + 静态内容资产的混合模型需产品化说明

**问题描述**  
nonce CSP → 动态 HTML；MDX/JSON 本地只读；搜索 Node runtime；评论第三方。边界清晰但文档若仍写“纯 SSG”会误导。

**影响评估**  
部署预期、缓存策略、成本评估偏差。

**推荐操作步骤**

1. 更新 `docs/architecture.md`：标明“文档响应动态 / 数据本地静态”。
2. 架构决策记录 ADR：为何 nonce 优先于全站静态。
3. 监控看板：Function 次数、搜索 429、LCP/CLS p75。

**预期收益**  
后续优化有统一北极星，减少反复横跳。

**验证**  
文档与线上 `Cache-Control` 行为一致可核对。

---

### ARCH-2 [保持] 内容分层合理，不引入搜索集群

**问题描述**  
Fuse + 内存缓存 + 投影 DTO 对 14 文足够；CI 有 SEO/blur/bundle/E2E/Lighthouse 多层门禁。

**影响评估**  
引入 Meili/ES/CMS 的运维成本远高于收益。

**推荐操作步骤**  
仅当文章数或搜索 p95 超标再评估；当前 **YAGNI**。

**预期收益**  
控制复杂度。

---

### ARCH-3 [P2] CI 多 job 重复 `pnpm build`（quality / e2e / lighthouse）

**问题描述**  
三份完整 production build 串/并消耗分钟数与缓存；注释已说明跨 job artifact 的 BUILD_ID 问题。

**影响评估**  
反馈时间变长；与 deploy 侧“只远端构建一次”已改善，但 CI 仍三重构建。

**推荐操作步骤**

1. 评估 `actions/cache` 基于 `pnpm-lock` + content hash 缓存 `.next`（注意密钥/环境）。
2. 或合并 e2e+lighthouse 到同一 job 共享一次 build（牺牲并行）。
3. 保持 deploy 不再本地 build（已完成）。

**预期收益**  
CI 墙钟时间下降 30–50%（视 runner 而定）。

**验证**  
对比优化前后 workflow 时长。

---

### ARCH-4 [P2] 客户端交互组件偏多但边界清楚

**问题描述**  
搜索、视差、磁吸卡片、阅读偏好、Giscus、主题切换均为 client 岛；主体页面仍为 Server Component + RSC。

**影响评估**  
整体健康；风险是首页同时挂载多个动画岛。

**推荐操作步骤**

1. 首页审计：LoadingIntro / RevealOnScroll / MagneticCard 是否可减。
2. 非首屏 client 组件继续依赖动态 import（搜索 Fuse 已按路径收敛）。

**预期收益**  
降低 hydration 与主线程竞争。

**验证**  
Lighthouse TBT；React Profiler。

---

## 4. 配置与部署优化

### CFG-1 [已完成 · 保持] Node 22 与 Vercel CLI 钉死

**现状**  
`engines.node=22.x`、`.nvmrc` / `.node-version`、`npx vercel@56.2.1`、`pnpm install --frozen-lockfile`（CI + `vercel.json`）。

**影响评估**  
消除 `@latest` 漂移；本地 Node 24 仅 warning。

**推荐操作步骤**  
升级 CLI/Node 时走显式 PR + CI；开发机可用 nvm 切 22。

**预期收益**  
可复现构建。

**验证**  
CI setup-node 22；deploy 日志 CLI 版本。

---

### CFG-2 [P2] Deploy 仍是“源码上传 + 远端构建”，非 prebuilt

**问题描述**  
deploy job 去掉了重复本地 build，但 `vercel deploy --prod` 仍让 Vercel 再构建；CI 验证产物 ≠ 部署产物（同类源码，不同机器）。

**影响评估**  
环境差异（字体下载、env）仍可能导致 “CI 绿、线上挂”。

**推荐操作步骤**

1. 评估 `vercel build --prod` + `vercel deploy --prebuilt`（需 CLI 与权限验证）。
2. 或接受现状，依赖 `check:production-content` smoke（已有）。
3. 确保 Vercel 项目 env 与 CI `NEXT_PUBLIC_SITE_URL` 一致。

**预期收益**  
更高部署保真度或更明确的 smoke 兜底。

**验证**  
预览部署 dry-run；production content 检查稳定绿。

---

### CFG-3 [P2] 本地 `.env.local` 易污染 RSS 生成

**问题描述**  
`pnpm build` 会跑 `generate-rss.ts`；若 `NEXT_PUBLIC_SITE_URL=http://localhost:3000`，`public/feed.*` 会写入 localhost。CI 有 `git diff --exit-code` 门禁，本地提交前易踩坑。

**影响评估**  
错误 feed 若绕过门禁会污染生产订阅源。

**推荐操作步骤**

1. generate-rss 在 `NODE_ENV=production` 且 URL 为 localhost 时直接 fail。
2. 或文档/脚本：`NEXT_PUBLIC_SITE_URL=https://incca.ccwu.cc pnpm build`。
3. 保持 CI feed 一致性检查。

**预期收益**  
消灭 localhost feed 回归。

**验证**  
故意 localhost 构建应非零退出。

---

### CFG-4 [P3] 依赖与工具链卫生

**问题描述**

- `@stryker-mutator/*` 在 devDependencies，CI 主路径未跑突变测试。
- `postcss-import` 与 Tailwind v4 场景可能冗余（历史注释称 postcss-import 失效）。
- Playwright / Next 小版本跟进依赖 dependabot 分支存在。

**影响评估**  
安装体积与认知负担；非运行时风险。

**推荐操作步骤**

1. 若 90 天不用 Stryker，移至可选文档或移除。
2. 确认 `postcss.config` 是否仍需要 `postcss-import`。
3. 有选择合并 dependabot，避免一次性大跳。

**预期收益**  
更瘦的 dev 安装与更清晰工具边界。

**验证**  
`pnpm install` 时间/体积；CI 全绿。

---

### CFG-5 [P3] Lighthouse 仅 desktop；mobile 配置未进 CI

**问题描述**  
`lighthouse.config.js` desktop error 门禁；`lighthouse.mobile.config.js` 仅手工。

**影响评估**  
移动回归可能漏网；与真实用户移动占比有关。

**推荐操作步骤**

1. 手工基线跑一轮写入 `performance-baseline.md`。
2. 稳定后把 mobile 以 `warn` 接入夜间 job，而非阻塞 deploy。

**预期收益**  
移动性能可见性。

**验证**  
`.lighthouse-mobile/` 报告与基线表。

---

## 5. 优先级路线图

| 优先级 | 项                                    | 类型      |
| ------ | ------------------------------------- | --------- |
| P1     | FE-1 按路由拆 CSS                     | 性能      |
| P1     | FE-2 用 RUM 确认动态 HTML 成本        | 架构/成本 |
| P1     | BE-1 生产 JSON fail-fast              | 可靠性    |
| P1     | BE-2 限流语义文档化 / 可选 WAF        | 安全语义  |
| P2     | FE-3 MagneticCard rAF                 | 性能      |
| P2     | FE-4/FE-5 文章 CLS 与中文字体         | 性能      |
| P2     | ARCH-3 CI 构建去重                    | 工程效率  |
| P2     | CFG-2/CFG-3 prebuilt 或 RSS fail-fast | 部署      |
| P3     | 工具链瘦身、mobile Lighthouse warn    | 卫生      |

### 明确不做（当前规模）

- Elasticsearch / MeiliSearch / 外置 CMS
- 全量 BEM 重写
- 为 SSG 削弱 nonce CSP（`unsafe-inline` 脚本）
- 无 RUM 时宣称虚构 p75 收益

---

## 6. 建议验证清单（落地任意一项后）

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm check:seo
pnpm check:blur
NEXT_PUBLIC_SITE_URL=https://incca.ccwu.cc pnpm build
pnpm exec tsx scripts/check-bundle-budget.ts
pnpm test:e2e
# 可选
pnpm analyze
npx @lhci/cli autorun --config=./lighthouse.config.js
```

线上：`/`、`/blog/nextjs-app-router`、`/api/search?q=next`、CSP 控制台、生产内容 smoke。

---

## 7. 附录：与既有工作的关系

| 报告/提交                         | 关系                                                    |
| --------------------------------- | ------------------------------------------------------- |
| `docs/codex-review-2026-07-13.md` | 前序审查；多项 P0/P1 已修                               |
| `569a54f`                         | 搜索/缓存/事件/部署钉扎/删 ParticleCanvas               |
| `af6a919`                         | 文章 lab CLS 与 lighthouse 门禁                         |
| 本报告                            | 基于 `af6a919` 的**增量**全栈审查，聚焦仍开放的可执行项 |

---

_审查人角色：资深全栈代码审查 · 方法：静态阅读关键路径 + 生产探针 + 既有 CI/门禁证据 · 日期：2026-07-17_
