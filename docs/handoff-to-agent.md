# 西江月博客 · Agent 接手指南

> 生成日期：2026-07-03
> 项目路径：`D:\blog`
> 接手后第一步：阅读本文件，然后运行 `cd D:\blog && pnpm run build && pnpm test && pnpm test:e2e` 确认基线。

---

## 一、项目档案

| 项目 | 值                                                                               |
| ---- | -------------------------------------------------------------------------------- |
| 框架 | Next.js 16.2.9 App Router + Turbopack                                            |
| 样式 | Tailwind CSS v4 + BEM 自定义类 + CSS 变量令牌系统                                |
| 语言 | TypeScript (strict mode)                                                         |
| 字体 | Noto Sans SC (中文) + JetBrains Mono (代码) + Cormorant Garamond (展示)          |
| 数据 | 本地 MDX 文件 (`content/blog/`) + JSON (`data/projects.json`, `data/links.json`) |
| 构建 | `pnpm build` → `tsx scripts/generate-rss.ts && next build`                       |
| 运行 | `pnpm dev` → dev 模式 :3000 (Turbopack);E2E 用 :3001                             |
| 测试 | Vitest (单元) + Playwright (E2E)                                                 |
| 部署 | Vercel (需设 `NEXT_PUBLIC_SITE_URL`)                                             |
| 评论 | Giscus (GitHub Discussions)                                                      |

### 文章现状

- 14 篇 MDX 文章在 `content/blog/`，覆盖主题：Next.js、性能优化、PostgreSQL、Redis、Docker、VPS、CI/CD、TypeScript、Cloudflare Workers、Supabase、Go CLI、Git 等。
- 6 个项目在 `data/projects.json`（3 个 featured）。

### 技术栈关键版本

| 依赖        | 版本   |
| ----------- | ------ |
| next        | 16.2.9 |
| react       | 19.2.4 |
| tailwindcss | v4     |
| vitest      | 4.1.9  |
| playwright  | 1.61.0 |
| typescript  | ^5     |
| zod         | ^4.4.3 |

---

## 二、当前状态（截至 2026-07-05 上线运营收尾）

> 说明：2026-07-03 代码复查确认的 4 个稳定性缺陷已修复；2026-07-05 完成收藏库 2.0、移动端 E2E 与 Giscus 浏览器级验证。后续接手重点见“2.1 当前接手优先级”。

所有 Phase 已完成（基于 `docs/salesdex-inspired-redesign.md` 的 Phase 1-3）：

| Phase   | 内容                                                                           | 状态 |
| ------- | ------------------------------------------------------------------------------ | ---- |
| Phase 1 | EditorialHero 首屏视觉改造                                                     | ✅   |
| Phase 2 | Manifesto / ReadingPath / FeaturedArticleRail / CuratedLinksPreview + 信息架构 | ✅   |
| Phase 3 | LoadingIntro / RevealOnScroll / 章节进入动画 / 首屏视差                        | ✅   |
| 额外    | HomeCtaSection 尾屏 CTA                                                        | ✅   |

### 首页渲染顺序（`src/app/page.tsx`）

```
1. EditorialHero        — 强口号 "Build Quiet Systems, Write Useful Notes." + 统计指标
2. ManifestoSection     — "少一点噪音，多一点可复用经验"
3. ReadingPathSection   — 4 条专题路径（VPS/Web 性能/数据库/TypeScript）
4. FeaturedArticleRail  — 6 篇精选文章横向轨道
5. CuratedLinksPreview  — AI/工程文档/自托管/VPS 分类预览
6. ProjectSection       — 精选作品卡片
7. HomeCtaSection       — CTA：关于我 / GitHub / 导航收藏
```

### 质量门禁

| 门禁       | 状态                                                   | 命令                       |
| ---------- | ------------------------------------------------------ | -------------------------- |
| TypeScript | 0 errors                                               | `tsc --noEmit`             |
| Lint       | 0 errors                                               | `eslint`                   |
| 单元测试   | 523 tests, 65 files 全绿                               | `vitest run`               |
| E2E 测试   | 47 tests, 5 spec files 全绿                            | `node scripts/run-e2e.mjs` |
| 生产构建   | 编译成功 (93 个页面工件；CSP nonce 使路由按需动态渲染) | `pnpm build`               |
| 代码清洁   | 无 `.only`/`@ts-*`；仅保留数据缺失保护性 `test.skip`   | 已验证                     |
| 无障碍     | `prefers-reduced-motion: reduce` 覆盖                  | 已验证                     |
| 远程图片   | 无远程图片依赖                                         | 已验证                     |

> ⚠️ 关键约束:Tailwind v4 的 `@tailwindcss/postcss` 会静默丢弃 `globals.css` 中的 `@import "./styles/xxx.css"` 语句。CSS 模块必须在 `layout.tsx` 顶部显式 import,详见 `docs/specs/2026-06-29-css-import-fix-design.md`。

### 2.1 当前接手优先级（2026-07-05）

权威设计文档：`docs/superpowers/specs/2026-07-03-claude-code-handoff-design.md`。

Claude Code 接手后按以下顺序推进：

1. **Handoff readiness**：保持本文件、`TODO.md` 与当前缺陷列表一致。
2. **Visual direction**：继续低饱和、简洁、艺术感方向；`/links` 本轮已扩展为 10 分类 123 条收藏，后续只做小步视觉复查，不扩大首页动画复杂度。
3. **Stability repair**：2026-07-03 已完成首批稳定性修复；后续新增行为仍需先补回归测试。

2026-07-03 已完成的稳定性修复：

- `/blog?page=2` 已根据 `searchParams.page` 渲染对应分页内容，单测与 `e2e/blog.spec.ts` 均覆盖。
- `LoadingIntro` 已改为安全检测 `window.requestIdleCallback`，不支持时 fallback 到 `setTimeout`，并补清理测试。
- `src/lib/categories.ts` 已以仓库层归一化后的 `post.category` 为来源，显式分类不再丢失。
- `src/app/blog/[slug]/page.tsx` 已在 series/category/tags 任一存在时渲染徽章容器。

已验证：

- `pnpm lint`
- `pnpm typecheck`
- `pnpm check:seo`
- `pnpm test`（523 tests / 65 files）
- `pnpm build`（93 个页面工件）
- `pnpm test:e2e`（47 tests / 5 spec files，全绿）

测试缺口：

- Giscus 的真实 script 属性与 CSP/lazy-load 行为已由 `e2e/mobile.spec.ts` 覆盖。
- 移动端 header/search/article/links 已由 `e2e/mobile.spec.ts` 覆盖。

### 全站背景架构（2026-06-29 重构）

首页 EditorialHero 的深色 stage 视觉已扩展为全站共享背景,采用三层分离架构:

| 层         | 实现                                                        | 渲染时机               | 职责                                  |
| ---------- | ----------------------------------------------------------- | ---------------------- | ------------------------------------- |
| 静态背景层 | `body::before/after` (CSS 伪元素)                           | server HTML+CSS 即时   | 渐变 + 紫色光晕 + 1px 网格遮罩        |
| 装饰元素层 | `<SiteBackdropStage />` (server component)                  | server-rendered DOM    | 飞机条 × 2 + 网格圈 + 代码块 × 2      |
| 视差跟随层 | `<SiteBackdropParallax />` (client component, returns null) | CSR (useEffect 副作用) | mousemove → `--parallax-x/y` CSS 变量 |

关键文件:

- `src/components/layout/SiteBackdropStage.tsx` (server component, aria-hidden)
- `src/components/layout/SiteBackdropParallax.tsx` (client component, returns null)
- `src/app/styles/backdrop.css` (`body::before/after` + `.site-backdrop__stage` 选择器)
- `src/app/layout.tsx` (接入三层 + 显式 import 11 个 CSS 模块)

设计文档:

- `docs/specs/2026-06-29-site-backdrop-architecture-design.md` (三层架构设计)
- `docs/specs/2026-06-29-css-import-fix-design.md` (CSS 加载机制修复)

### shadcn / Paper Gallery 视觉组件收口（2026-07-04）

权威增量文档：`docs/specs/2026-07-04-shadcn-visual-architecture-design.md`。

本轮已完成的架构收口：

- 新增 `src/components/layout/PageSection.tsx`，统一列表页、归档页、关于页等 section 外壳。
- 新增 `src/components/layout/ArchiveCard.tsx`，统一分类页和专题页的整卡链接结构。
- 新增 `src/components/ui/MetaBadge.tsx`，统一标签、计数、精选标记等 metadata chip。
- `src/components/ui/card.tsx` 增加 `asChild` 支持，用于 shadcn Card 与 `next/link` 组合。
- 博客卡片、搜索结果、首页精选、相关文章、标签页、链接目录、项目卡片、项目详情均已迁移到 `MetaBadge`。
- 项目卡片媒体层改为 `card__media` / `card__image`，并加低饱和滤镜以贴合 Paper Gallery 方向。

环境注意：

- shadcn CLI 在当前 Node 24 + zod exports 组合下仍会报 `ERR_PACKAGE_PATH_NOT_EXPORTED`。
- 当前策略是沿用本地已落地的 shadcn 源码组件，不运行 CLI 覆盖或安装。

已验证：

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`（523 tests / 65 files）
- `pnpm build`
- Chrome 访问 `http://localhost:7897` 的 `/`、`/blog`、`/blog/docker-deploy-guide`、`/tags`、`/links`、`/projects/nav-site`，无 console error/warning、无横向溢出。

---

## 三、架构速览

### 关键目录

```
D:\blog\
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── page.tsx            # 首页
│   │   ├── layout.tsx          # 根布局（Header + Footer + 字体 + CSS 显式 import）
│   │   ├── globals.css         # CSS 入口（仅 @tailwindcss + @plugin,12 行）
│   │   └── styles/             # 语义化 CSS 模块（每个 ≤500 行,共 11 个）
│   │       ├── tokens.css          # 设计令牌（明暗主题变量、间距、阴影）
│   │       ├── base.css            # 全局基础（skip-link、header、footer、reduced-motion）
│   │       ├── components.css     # 通用组件（card、button、section、hero 容器）
│   │       ├── blog-ui.css        # 博客 UI（SearchBar、TOC、CodeBlock、ThemeToggle）
│   │       ├── backdrop.css       # 背景层（body::before/after + .site-backdrop__stage）
│   │       ├── home.css           # 首页（Manifesto、ReadingPath、ArticleRail、CTA）
│   │       ├── prose.css         # 文章排版（.prose、code block）
│   │       ├── project-detail.css # 项目详情
│   │       ├── animations.css    # 动画（reveal、fade-in-up、loading-intro）
│   │       └── responsive.css     # 响应式断点（最后加载,覆盖前面）
│   ├── components/
│   │   ├── home/               # 首页专属组件（8 个:EditorialHero/Manifesto/ReadingPath/ArticleRail/CuratedLinks/HomeCta/RevealOnScroll/LoadingIntro）
│   │   ├── blog/               # 博客组件（BlogCard/SearchBar/Pagination/CodeBlock/TOC/ReadingProgress/ReadingPreferences/ImageZoom/MdxContent/TagLink）
│   │   ├── layout/             # Header/Footer + SiteBackdropStage + SiteBackdropParallax
│   │   ├── ui/                 # ThemeToggle/ParticleCanvas/BackToTop/MagneticCard
│   │   ├── projects/           # ProjectCard
│   │   └── comments/           # Giscus
│   ├── hooks/                  # React hooks（useInView/usePersistedEnum/usePrefersReducedMotion,均带测试）
│   ├── lib/                    # 数据层
│   │   ├── posts/              # 文章模块（schema/repository/query/search-text,4 子模块）
│   │   ├── schemas/            # 共享 Zod schema（post-frontmatter）
│   │   ├── test-utils/         # 测试夹具（in-memory ContentSource）
│   │   ├── projects.ts         # 项目数据
│   │   ├── links.ts            # 导航收藏仓库（读取 data/links.json）
│   │   ├── tags.ts             # 标签聚合
│   │   ├── series.ts           # 专题/系列聚合
│   │   ├── categories.ts       # 分类聚合
│   │   ├── category-rules.ts   # 分类推断函数
│   │   ├── category-rules-data.ts # TAG_TO_CATEGORY 映射
│   │   ├── about.ts            # 关于页内容
│   │   ├── content-source.ts   # ContentSource 接口 + createPostRepository 工厂
│   │   ├── parse-frontmatter.ts # MDX frontmatter 解析（js-yaml 4.x）
│   │   ├── route-adapter.ts    # createDynamicRoute 适配器（4 条动态路由收敛）
│   │   ├── metadata.ts         # SEO metadata 辅助
│   │   ├── observability.ts    # 日志/遥测辅助
│   │   ├── cache.ts            # 内存缓存工具 + resetAllCaches() 测试隔离
│   │   ├── storage.ts          # safeLocalStorage 包装（SSR-safe）
│   │   ├── jsonld.ts           # JSON-LD 结构化数据
│   │   ├── site.ts             # SITE_CONFIG / resolveSiteUrl
│   │   ├── content-dirs.ts     # CONTENT_DIR / PAGE_SIZE
│   │   └── utils.ts            # slugify / formatDate
│   └── types/
│       └── index.ts            # PostFrontmatter / PostMeta / PostFull / Project / TagInfo
├── content/
│   └── blog/                   # 14 篇 .mdx 文章
├── data/
│   └── projects.json           # 6 个项目
├── e2e/                        # 5 个 Playwright 测试文件
│   ├── home.spec.ts            # 15 tests（含 4 个 backdrop 测试）
│   ├── blog.spec.ts            # 8 tests
│   ├── navigation.spec.ts      # 10 tests
│   ├── extended.spec.ts        # 10 tests
│   └── mobile.spec.ts          # 4 tests（移动端 header / search / article / links）
├── docs/                       # 设计/规范文档
│   ├── handoff-to-agent.md     # ← 当前文档（权威架构来源）
│   ├── architecture.md         # 历史架构概览（已标注部分过时,保留参考）
│   ├── overview.md             # 文档总览与阅读顺序
│   ├── content-workflow.md     # 内容工作流（新增/修改文章的规范）
│   ├── css-conventions.md      # CSS 约定（BEM + Tailwind 分工）
│   ├── cache-components-migration.md # createCache<T> 与 Cache Components 迁移
│   ├── salesdex-inspired-redesign.md # 首页改版设计（Phase 1-3 已完成）
│   ├── performance-baseline.md # 性能预算与 Lighthouse baseline
│   ├── architecture-review.html # 架构审查快照（2026-06-29,作为 specs/posts-deepening 输入）
│   ├── specs/                  # 设计文档目录
│   │   ├── 2026-06-29-site-backdrop-architecture-design.md # 三层背景架构
│   │   ├── 2026-06-29-css-import-fix-design.md              # Tailwind v4 import 修复
│   │   └── 2026-06-29-posts-deepening-design.md             # posts.ts 拆分 + 路由 adapter（已实施）
│   └── adr/
│       └── 0001-csp-nonce-vs-ssg.md # ADR: CSP nonce 在 SSG 下的取舍
├── scripts/
│   ├── generate-rss.ts         # RSS 生成（构建前调用）
│   ├── check-bundle-budget.ts  # Bundle 预算检查（CI 中强制执行）
│   ├── check-seo.ts            # SEO 审计脚本
│   └── run-e2e.mjs             # E2E 启动包装（处理 build + start）
├── public/
│   ├── feed.xml / feed.json    # RSS 输出（构建时生成）
│   ├── images/projects/        # 项目截图（6 张 PNG）
│   └── icon.svg
├── next.config.ts              # viewTransition + security headers
├── vitest.config.ts            # jsdom + @ alias
├── vitest.setup.ts             # 测试环境初始化（@testing-library/jest-dom）
├── playwright.config.ts        # :3001 + chromium + CI 用 next start
├── eslint.config.mjs
├── tsconfig.json               # strict + bundler resolution
├── lighthouse.config.js        # Lighthouse CI 预算（5 页 × 2 次跑,desktop preset）
└── postcss.config.mjs          # @tailwindcss/postcss（⚠️ 静默丢弃 @import,见 CSS 约定）
```

### 组件层级

```
page.tsx
├── EditorialHero             ← 首屏（口号 + 信号导轨 + CTA + 统计）
├── ManifestoSection           ← 定位宣言
├── RevealOnScroll > ReadingPathSection  ← 专题路径（4 条）
├── RevealOnScroll > FeaturedArticleRail ← 精选文章轨道（6 篇）
├── RevealOnScroll > CuratedLinksPreview ← 导航收藏预览
├── RevealOnScroll > ProjectsSection     ← 精选作品
└── RevealOnScroll > HomeCtaSection      ← 尾屏 CTA
```

---

## 四、可能的后续方向

以下任务各自独立，任一方向均可直接开始。

### 方向 A：内容扩充

**难度**：低 | **影响**：无代码变更 | **适合**：纯内容型 Agent

- 在 `content/blog/` 新增 .mdx 文章，frontmatter 格式参考现有文章
- 文章 frontmatter 必需字段：`title`、`description`、`date` (YYYY-MM-DD)、`tags` (array)
- 可选：`category`、`series`/`seriesOrder`、`featured`、`image`
- 新增项目：编辑 `data/projects.json`，遵循同结构
- 新增导航收藏：编辑 `data/links.json`，遵循现有 `items` 结构

### 方向 B：性能预算 CI

**难度**：低-中 | **影响**：CI 配置微调 + 数据回填 | **适合**：DevOps 型 Agent

> ⚠️ 状态订正（2026-06-28）：原文档称"未在 CI 中执行"已过时。9 条预算阈值（Lighthouse 6 项 + bundle 3 项）**已全部接入 CI 并强制执行**。详见 `docs/performance-baseline.md` 的 "Current CI Budgets" 表（含 Enforced in 列）。

当前已落地：

- `treosh/lighthouse-ci-action@v12`（`configPath: ./lighthouse.config.js`）跑 5 个页面 × 2 次，desktop 预设
- `scripts/check-bundle-budget.ts` 在 `quality` job 强制 JS/CSS 单文件 ≤ 300 KB、总量 ≤ 2 MB
- `bundle-analyze` job 上传 `.next/analyze/` 报告为 artifact

剩余待办（小）：

- ~~Lighthouse 分数 baseline 待回填~~ ✅ 已于 2026-06-29 从 CI run `28362770380` artifact 回填到 `performance-baseline.md`（5 页 desktop 预设 2 次均值，全绿；`/blog/nextjs-app-router` CLS=0.13 略超阈值但 CI 取中位数通过，列为后续优化关注点）
- Speed Insights p75 baseline 待生产流量后回填（按 `performance-baseline.md` 的 Refresh Procedure）
- 可选增强：增加 mobile preset（当前仅 desktop）。注：TBT 已于 2026-06-29 从 warn 提升为 error（commit `63f31dc`）；实测 TBT 全部 0–3 ms，余量充足。mobile preset 需新建 `lighthouse.mobile.config.js` + 在 CI 加第二个 job/matrix，会使 lighthouse 运行时间翻倍（10→20 次），建议待 Speed Insights p75 baseline 建立后再评估

关键文件：`lighthouse.config.js`、`scripts/check-bundle-budget.ts`、`.github/workflows/ci.yml`、`docs/performance-baseline.md`

### 方向 C：图片优化与项目截图

**难度**：低-中 | **影响**：`public/images/` + 视觉检查 | **适合**：全栈型 Agent

当前项目卡片引用了 `/images/projects/*.png` 但可能缺失或质量参差。

待办：

- 检查 `public/images/projects/` 下 6 张截图是否存在
- 截图质量优化（分辨率、裁剪、压缩）
- 确保 `next/image` 配置可正确处理本地图片
- 补充 `src/app/opengraph-image.tsx` 的自定义 OG 图策略

### 方向 D：RSS / SEO 增强

**难度**：低-中 | **影响**：脚本/元数据变更 | **适合**：内容运营型 Agent

- RSS feed 当前通过 `scripts/generate-rss.ts` 在构建时生成
- 可增加：按分类/标签生成独立 RSS feed
- 可增加：文章的 `updatedAt` 字段在 RSS 中体现
- SEO：检查每个页面当前 metadata 是否完整（title、description、OG）

关键文件：`scripts/generate-rss.ts`、`src/app/blog/[slug]/page.tsx`（metadata 动态生成）、`scripts/check-seo.ts`

### 方向 E：暗色主题打磨

**难度**：中 | **影响**：CSS 变量调整 | **适合**：UI/UX 型 Agent

- 检查各组件在深色模式下的对比度
- HomeCtaSection 卡片在暗色下的一致性
- ParticleCanvas 在暗色下的粒子亮度
- 代码高亮颜色（Shiki）在明暗主题下的切换

关键文件：`src/app/globals.css` (14-84 行)

### 方向 F：新功能 — 文章标签云

**难度**：中 | **影响**：新组件 + 页面 | **适合**：全栈型 Agent

新增一个标签云页面/组件，按权重展示所有标签。

数据来源：`src/lib/tags.ts` — `getAllTags()` 已返回 `TagInfo[]` (`{tag, slug, count}`)

参考实现：

- `src/components/blog/TagLink.tsx` — 已有标签链接组件
- `src/app/tags/page.tsx` — 已有标签列表页
- 新增：权重气泡/字体大小映射 `count` 值

### 方向 G：新功能 — 搜索增强

**难度**：中-高 | **影响**：SearchBar + Fuse.js 配置 | **适合**：全栈型 Agent

当前搜索基于 Fuse.js 在前端执行，支持文章标题/描述/标签/正文。

待办：

- 搜索评分调优（当前权重可能需调整）
- 搜索结果高亮匹配词
- 搜索键盘快捷键（Ctrl+K）

关键文件：`src/components/blog/SearchBar.tsx`、`src/components/blog/SearchBar.test.tsx`

---

## 五、命令速查

```bash
# 开发
cd D:\blog
pnpm dev                    # → localhost:3000 (Turbopack)
pnpm dev --port 3001        # 显式指定端口（E2E 默认用 3001）

# 测试
pnpm test                   # Vitest 单元测试（523 tests, 65 files）
pnpm test:e2e               # Playwright E2E（47 tests, 5 spec files;自动启动 :3001）
pnpm test:e2e:raw -- --ui   # 带 UI 模式调试

# 构建/检查
pnpm build                  # 生产构建（含 RSS 生成；93 个页面工件,路由因 CSP nonce 按需动态渲染）
pnpm lint                   # ESLint
pnpm check:seo              # SEO 审计（tsx scripts/check-seo.ts）
tsc --noEmit                # TypeScript 检查

# bundle 分析
pnpm analyze                # 生成 .next/analyze/
```

---

## 六、关键约束

1. **CSS 风格**：BEM 自定义类 + Tailwind 微调，禁止混用重复（参考 `docs/css-conventions.md`）
2. **颜色主题**：所有颜色通过 `var(--*)` CSS 变量引用，禁止硬编码
3. **可访问性**：所有动画必须通过 `prefers-reduced-motion` 检查
4. **远程资源**：不使用远程图片，所有图片放 `public/` 下
5. **数据源**：文章 = MDX frontmatter，项目 = JSON，导航收藏 = `data/links.json`——不新增数据存储
6. **测试**：新组件必须配套测试（Vitest + 必要时 Playwright）
7. **评论**：Giscus 配置在 `SITE_CONFIG.giscus`
8. **安全**：CSP headers 通过 `src/proxy.ts` 动态设置 per-request nonce；`layout.tsx` / JSON-LD 通过 `src/lib/csp.ts` 读取 `x-nonce`

---

## 七、给 Claude Code 的接手指引

本节为 Claude Code（或任何接手的 AI 编码助手）准备的快速启动清单。读完上一至六节后,按此清单完成接手。

### 7.1 环境与工具链

| 项       | 要求                                                                           |
| -------- | ------------------------------------------------------------------------------ |
| Node.js  | ≥ 20（参考 `.nvmrc`）                                                          |
| 包管理器 | pnpm 11.8.0（`package.json` 的 `packageManager` 字段已锁）                     |
| 操作系统 | Windows / macOS / Linux 均可（路径分隔符用 `path` 模块,不要硬编码 `\` 或 `/`） |
| 编辑器   | VS Code 推荐（启用 ESLint + TypeScript 插件）                                  |
| 浏览器   | Chromium（E2E 用,`npx playwright install chromium`）                           |

### 7.2 接手后第一步：基线验证

```bash
cd D:\blog
pnpm install                 # 确认依赖装得上（注意：pnpm v11 store 偶尔会损坏,见 Lessons Learned）
pnpm test                    # 期望:523 tests / 65 files 全绿
pnpm lint                    # 期望:0 errors
tsc --noEmit                 # 期望:0 errors
pnpm build                   # 期望:生成 RSS + 93 个页面工件；build output 中页面为 ƒ Dynamic（CSP nonce 的预期结果）
pnpm test:e2e                # 期望:47 tests / 5 spec files 全绿（首次会自动 build + start :3001）
```

> 任一项失败时,先看 `project_memory.md` 的 Lessons Learned 段；再读 `docs/specs/` 下相关设计文档。

### 7.3 上下文加载顺序

按以下顺序读文档,可在 15 分钟内建立完整心智模型:

1. `AGENTS.md` — 项目结构与约定速览
2. 本文件（`docs/handoff-to-agent.md`）— 当前状态 + 架构 + 后续方向
3. `docs/specs/2026-06-29-site-backdrop-architecture-design.md` — 三层背景架构
4. `docs/specs/2026-06-29-css-import-fix-design.md` — Tailwind v4 CSS 加载约束
5. `docs/specs/2026-07-04-shadcn-visual-architecture-design.md` — shadcn / Paper Gallery 视觉组件收口
6. `docs/css-conventions.md` — 写样式前必读
7. `docs/performance-baseline.md` — 改性能预算前必读

**不必读**:`docs/architecture.md`（已标注部分过时,保留作历史参考）、`docs/architecture-review.html`（历史架构扫描快照,作为 specs/posts-deepening-design 的输入）。

### 7.4 高频踩坑点

- **Tailwind v4 `@import` 失效**：`globals.css` 不能用 `@import "./styles/xxx.css"`,会被静默丢弃。所有 CSS 模块必须在 `layout.tsx` 顶部显式 `import`。
- **反相设计失效**：禁止 `background: var(--text); color: var(--bg)`,改用 `--bg-soft` / `--surface` 等 surface token。
- **E2E 视差测试**：`.site-backdrop__stage` 是 server-rendered 静态 DOM,hydration 前即存在,所以**只等该节点出现不足以保证 `mousemove` 监听器就绪**（监听器在 `SiteBackdropParallax` 的 `useEffect` 中、hydration 后才挂载）。正确做法:用 `page.waitForFunction` **反复 dispatch 并轮询**,直到 `--parallax-x` 被写入再断言（见 `e2e/home.spec.ts:137`）;不要单次 `page.evaluate` 触发,也不要用 `page.mouse.move`。
- **Blog card 点击被 `::after` 拦截**：用 `focus()` + `keyboard.type()` 处理搜索输入,`dispatchEvent('click')` 处理按钮,`page.goto()` 处理导航。
- **pnpm store 损坏**：`pnpm install --lockfile-only --no-frozen-lockfile --store-dir="<local-tmp>"` 可在不依赖损坏 store 的情况下重新生成 lockfile。
- **CSS 验证缺失**：build 成功 ≠ CSS 生效。改 CSS 后必须验证 `.next/static/css/*.css` bundle 含关键选择器（如 `.editorial-hero`、`body:before`、`--hero-ink`）。

### 7.5 提交与分支

- 当前分支：`master`（工作树包含未提交的分批整理改动）
- 默认 base 分支：`master`（不是 `main`）—— CI 配置已订正,见 `project_memory.md`
- 提交规范：`type(scope): subject`（见 `git log --oneline` 历史样式,如 `feat(home):` / `fix(css):` / `refactor(layout):` / `docs:`）
- 提交信息在 Windows PowerShell 下用临时文件：`git commit -F tmp/commit-msg.txt`（HEREDOC 不支持）

### 7.6 网络代理（仅 Windows + 需要访问 GitHub 时）

如果 `git push` 报 `Failed to connect to github.com port 443`,说明本地需要走代理。可临时为单次 push 设置：

```bash
git -c http.proxy=socks5h://127.0.0.1:7897 -c https.proxy=socks5h://127.0.0.1:7897 push origin <branch>
```

如果 schannel 握手失败,追加 `-c http.sslBackend=openssl`。**不要写入全局 config**,会污染其他仓库；接手完成时应清除：`git config --global --unset http.proxy; git config --global --unset https.proxy; git config --global --unset http.sslBackend`。

### 7.7 接手清单

完成以下步骤后,视为成功接手：

- [ ] 跑通 7.2 的 5 条基线命令,全绿
- [ ] 读完 7.3 的 6 份文档
- [ ] 理解三层背景架构（body::before/after + SiteBackdropStage + SiteBackdropParallax）的职责分离
- [ ] 理解 CSS 11 模块的加载顺序约束（tokens 最先,responsive 最后）
- [ ] 在 `src/app/styles/home.css` 中找到 ArticleRail 的自定义滚动条样式
- [ ] 在 `src/lib/posts/` 中找到文章查询的 4 个子模块
- [ ] 在 `src/components/home/` 中找到首页 8 个组件的渲染顺序（参考本文件 §三的"组件层级"）
- [ ] 知道改 CSP 相关代码时,要看 `docs/adr/0001-csp-nonce-vs-ssg.md`
