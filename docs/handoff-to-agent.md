# 西江月博客 · Agent 接手指南

> 生成日期：2026-06-28
> 项目路径：`D:\blog`
> 接手后第一步：阅读本文件，然后运行 `cd D:\blog && pnpm run build && pnpm test && pnpm test:e2e` 确认基线。

---

## 一、项目档案

| 项目 | 值 |
|------|-----|
| 框架 | Next.js 16.2.9 App Router + Turbopack |
| 样式 | Tailwind CSS v4 + BEM 自定义类 + CSS 变量令牌系统 |
| 语言 | TypeScript (strict mode) |
| 字体 | Noto Sans SC (中文) + JetBrains Mono (代码) + Cormorant Garamond (展示) |
| 数据 | 本地 MDX 文件 (`content/blog/`) + JSON (`data/projects.json`) |
| 构建 | `pnpm build` → `tsx scripts/generate-rss.ts && next build` |
| 运行 | `pnpm dev` → dev 模式 :3001 |
| 测试 | Vitest (单元) + Playwright (E2E) |
| 部署 | Vercel (需设 `NEXT_PUBLIC_SITE_URL`) |
| 评论 | Giscus (GitHub Discussions) |

### 文章现状

- 14 篇 MDX 文章在 `content/blog/`，覆盖主题：Next.js、性能优化、PostgreSQL、Redis、Docker、VPS、CI/CD、TypeScript、Cloudflare Workers、Supabase、Go CLI、Git 等。
- 6 个项目在 `data/projects.json`（3 个 featured）。

### 技术栈关键版本

| 依赖 | 版本 |
|------|------|
| next | 16.2.9 |
| react | 19.2.4 |
| tailwindcss | v4 |
| vitest | 4.1.9 |
| playwright | 1.61.0 |
| typescript | ^5 |
| zod | ^4.4.3 |

---

## 二、当前状态（截至 Phase 3 完成）

所有 Phase 已完成（基于 `docs/salesdex-inspired-redesign.md` 的 Phase 1-3）：

| Phase | 内容 | 状态 |
|-------|------|------|
| Phase 1 | EditorialHero 首屏视觉改造 | ✅ |
| Phase 2 | Manifesto / ReadingPath / FeaturedArticleRail / CuratedLinksPreview + 信息架构 | ✅ |
| Phase 3 | LoadingIntro / RevealOnScroll / 章节进入动画 / 首屏视差 | ✅ |
| 额外 | HomeCtaSection 尾屏 CTA | ✅ |

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

| 门禁 | 状态 | 命令 |
|------|------|------|
| TypeScript | 0 errors | `tsc --noEmit` |
| Lint | 0 errors | `eslint` |
| 单元测试 | 291 tests, 31 files 全绿 | `vitest run` |
| E2E 测试 | 42 tests, 4 spec files 全绿 | `node scripts/run-e2e.mjs` |
| 生产构建 | 编译成功 (91 静态页面) | `pnpm build` |
| 代码清洁 | 无 `.only`/`.skip`/`@ts-*`/`TODO`/`FIXME` | 已验证 |
| 无障碍 | `prefers-reduced-motion: reduce` 覆盖 | 已验证 |
| 远程图片 | 无远程图片依赖 | 已验证 |

> ⚠️ 关键约束:Tailwind v4 的 `@tailwindcss/postcss` 会静默丢弃 `globals.css` 中的 `@import "./styles/xxx.css"` 语句。CSS 模块必须在 `layout.tsx` 顶部显式 import,详见 `docs/specs/2026-06-29-css-import-fix-design.md`。

### 全站背景架构（2026-06-29 重构）

首页 EditorialHero 的深色 stage 视觉已扩展为全站共享背景,采用三层分离架构:

| 层 | 实现 | 渲染时机 | 职责 |
|----|------|----------|------|
| 静态背景层 | `body::before/after` (CSS 伪元素) | SSG (HTML+CSS 即时) | 渐变 + 紫色光晕 + 1px 网格遮罩 |
| 装饰元素层 | `<SiteBackdropStage />` (server component) | SSG (HTML 静态 DOM) | 飞机条 × 2 + 网格圈 + 代码块 × 2 |
| 视差跟随层 | `<SiteBackdropParallax />` (client component, returns null) | CSR (useEffect 副作用) | mousemove → `--parallax-x/y` CSS 变量 |

关键文件:
- `src/components/layout/SiteBackdropStage.tsx` (server component, aria-hidden)
- `src/components/layout/SiteBackdropParallax.tsx` (client component, returns null)
- `src/app/styles/backdrop.css` (`body::before/after` + `.site-backdrop__stage` 选择器)
- `src/app/layout.tsx` (接入三层 + 显式 import 10 个 CSS 模块)

设计文档:
- `docs/specs/2026-06-29-site-backdrop-architecture-design.md` (三层架构设计)
- `docs/specs/2026-06-29-css-import-fix-design.md` (CSS 加载机制修复)

---

## 三、架构速览

### 关键目录

```
D:\blog\
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── page.tsx            # 首页
│   │   ├── layout.tsx          # 根布局（Header + Footer + 字体 + CSP nonce + CSS 显式 import）
│   │   ├── globals.css         # CSS 入口（仅 @tailwindcss + @plugin,12 行）
│   │   └── styles/             # 语义化 CSS 模块（每个 ≤500 行,共 10 个）
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
│   │   ├── home/               # 首页专属组件（8 个）
│   │   ├── blog/               # 博客组件（BlogCard/SearchBar/Pagination/CodeBlock 等）
│   │   ├── layout/             # Header/Footer + SiteBackdropStage + SiteBackdropParallax
│   │   ├── ui/                 # ThemeToggle/ParticleCanvas/BackToTop/MagneticCard
│   │   ├── projects/           # ProjectCard
│   │   └── comments/           # Giscus
│   ├── lib/                    # 数据层
│   │   ├── posts/              # 文章模块（schema/repository/query/search-text,4 子模块）
│   │   ├── projects.ts         # 项目数据
│   │   ├── links.ts            # 导航收藏数据（6 分类 67 条）
│   │   ├── tags.ts             # 标签聚合
│   │   ├── categories.ts       # 分类聚合
│   │   ├── constants.ts        # SITE_CONFIG / CONTENT_DIR / TAG_TO_CATEGORY
│   │   ├── cache.ts            # 内存缓存工具 + resetAllCaches() 测试隔离
│   │   ├── jsonld.ts           # JSON-LD 结构化数据
│   │   └── utils.ts            # 工具函数
│   └── types/
│       └── index.ts            # PostFrontmatter / PostMeta / PostFull / Project / TagInfo
├── content/
│   └── blog/                   # 14 篇 .mdx 文章
├── data/
│   └── projects.json           # 6 个项目
├── e2e/                        # 4 个 Playwright 测试文件
│   ├── home.spec.ts            # 15 tests（含 4 个 backdrop 测试）
│   ├── blog.spec.ts            # 9 tests
│   ├── navigation.spec.ts      # 10 tests
│   └── extended.spec.ts        # 8 tests
├── docs/                       # 设计/规范文档
│   ├── specs/                  # 设计文档目录
│   │   ├── 2026-06-29-site-backdrop-architecture-design.md
│   │   └── 2026-06-29-css-import-fix-design.md
│   ├── salesdex-inspired-redesign.md
│   ├── css-conventions.md
│   ├── cache-components-migration.md
│   ├── performance-baseline.md
│   └── handoff-to-agent.md
├── next.config.ts              # viewTransition + security headers
├── vitest.config.ts            # jsdom + @ alias
├── playwright.config.ts        # :3001 + chromium
├── eslint.config.mjs
└── tsconfig.json               # strict + bundler resolution
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
- 新增导航收藏：编辑 `src/lib/links.ts`，遵循 `LinkCategory` 结构

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

关键文件：`src/scripts/generate-rss.ts`、`src/app/blog/[slug]/page.tsx`（metadata 动态生成）

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
pnpm dev                    # → localhost:3001 (Turbopack)
pnpm dev --port 3001

# 测试
pnpm test                   # Vitest 单元测试（221 tests）
pnpm test:e2e               # Playwright E2E（38 tests）
pnpm test:e2e:raw -- --ui   # 带 UI 模式调试

# 构建/检查
pnpm build                  # 生产构建（含 RSS 生成）
pnpm lint                   # ESLint
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
5. **数据源**：文章 = MDX frontmatter，项目 = JSON，导航 = TS 常量——不新增数据存储
6. **测试**：新组件必须配套测试（Vitest + 必要时 Playwright）
7. **评论**：Giscus 配置在 `SITE_CONFIG.giscus`
8. **安全**：CSP nonce 通过 `src/proxy.ts` 动态生成
