# 西江月博客

基于 Next.js 16 App Router 的个人博客兼作品集，MDX 驱动、本地内容驱动，并使用严格 CSP nonce。

## 技术栈

Next.js 16.2 · React 19.2 · TypeScript 5 strict · Tailwind CSS v4 · MDX (next-mdx-remote) · Shiki (rehype-pretty-code) · Giscus 评论 · fuse.js · Vitest · Playwright · ESLint 9

## 快速启动

```bash
pnpm install
pnpm dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

### 环境变量

```bash
# .env.local
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GISCUS_REPO=owner/repo
NEXT_PUBLIC_GISCUS_REPO_ID=your_repo_id
NEXT_PUBLIC_GISCUS_CATEGORY_ID=your_category_id
```

参见 `.env.example`。

## 常用命令

| 命令                            | 作用                                                          |
| ------------------------------- | ------------------------------------------------------------- |
| `pnpm dev`                      | 本地开发服务器                                                |
| `pnpm build`                    | 生成 RSS + 生产构建                                           |
| `pnpm start`                    | 启动生产服务器                                                |
| `pnpm test`                     | Vitest 单元/集成测试                                          |
| `pnpm test:watch`               | Vitest 监听模式                                               |
| `pnpm test:e2e`                 | Playwright E2E 测试（自动启动 dev server）                    |
| `pnpm check:seo`                | 内容、资源、sitemap 与 SEO 完整性检查                         |
| `pnpm check:production-content` | 生产环境内容烟测（首页 / 博客 / 作品 / 导航 / RSS / Sitemap） |
| `pnpm lint`                     | ESLint                                                        |
| `pnpm analyze`                  | Bundle 体积分析                                               |

## 项目结构

```text
.
├─ content/                  # 内容源
│  ├─ about.mdx              # 关于页
│  └─ blog/*.mdx             # 博客文章（14 篇）
├─ data/
│  └─ projects.json          # 作品集数据
├─ docs/                     # 项目文档
│  ├─ overview.md            # 文档导航
│  ├─ architecture.md        # 架构与模块职责
│  ├─ content-workflow.md    # 内容维护流程
│  ├─ css-conventions.md     # CSS 范式规范
│  ├─ cache-components-migration.md  # Cache Components 迁移指南
│  └─ 项目审查与改进文档.md   # 历史审查记录
├─ e2e/                      # Playwright E2E 测试（4 文件 / 43 用例）
│  ├─ home.spec.ts           # 首页测试
│  ├─ blog.spec.ts           # 博客列表与详情测试
│  ├─ navigation.spec.ts     # 主题切换 / 项目 / 标签 / 关于 / 404
│  └─ extended.spec.ts       # 作品详情 / 标签详情 / RSS / Sitemap / robots
├─ public/
│  ├─ images/projects/       # 项目封面图
│  ├─ feed.xml               # RSS（构建前由脚本生成）
│  ├─ feed.json              # JSON Feed（构建前由脚本生成）
│  └─ icon.svg               # 站点图标
├─ scripts/
│  ├─ generate-rss.ts        # 构建前生成 RSS / JSON Feed
│  └─ check-bundle-budget.ts # Bundle 体积预算检查
├─ src/
│  ├─ app/                   # App Router 路由
│  │  ├─ styles/             # CSS 分层（11 个显式 import 的语义模块）
│  │  ├─ blog/[slug]/        # 文章详情（含 opengraph-image）
│  │  ├─ projects/[id]/      # 作品详情
│  │  ├─ tags/[tag]/         # 标签归档
│  │  ├─ layout.tsx          # 根布局（字体 / 主题 / 跳转链接）
│  │  ├─ manifest.ts         # PWA manifest
│  │  ├─ robots.ts           # robots.txt
│  │  └─ sitemap.ts          # 站点地图
│  ├─ components/
│  │  ├─ blog/               # 博客组件（SearchBar / MdxContent / TOC / CodeBlock / 阅读偏好…）
│  │  ├─ layout/             # Header / Footer
│  │  ├─ projects/           # ProjectCard
│  │  ├─ comments/           # Giscus
│  │  └─ ui/                 # ThemeToggle / BackToTop / MagneticCard / ParticleCanvas
│  ├─ lib/                   # 数据层（posts / projects / tags / utils / site / content-dirs / cache / jsonld）
│  └─ types/                 # TypeScript 类型定义
├─ .github/workflows/ci.yml  # CI 流水线（lint / test / tsc / build / bundle-budget / e2e / deploy smoke）
├─ eslint.config.mjs         # ESLint 9 flat config
├─ next.config.ts            # Next.js 配置（安全头 / 内容 trace / viewTransition / bundle analyzer）
├─ playwright.config.ts      # Playwright 配置
├─ postcss.config.mjs        # PostCSS 配置
├─ tsconfig.json             # TypeScript 配置（strict / @/* 路径别名）
├─ vitest.config.ts          # Vitest 配置（jsdom 环境）
└─ package.json
```

## 路由

| 路由               | 说明                                         |
| ------------------ | -------------------------------------------- |
| `/`                | 首页（Hero 粒子背景 + 最新文章 + 精选项目）  |
| `/about`           | 关于页                                       |
| `/blog`            | 博客列表（fuse.js 模糊搜索 + 键盘导航）      |
| `/blog/[slug]`     | 文章详情（TOC + 阅读进度 + 阅读偏好 + 评论） |
| `/projects`        | 作品集                                       |
| `/projects/[id]`   | 作品详情                                     |
| `/series`          | 专题列表                                     |
| `/series/[series]` | 专题详情                                     |
| `/tags`            | 标签汇总                                     |
| `/tags/[tag]`      | 单标签归档                                   |
| `/feed.xml`        | RSS 订阅                                     |
| `/feed.json`       | JSON Feed                                    |
| `/sitemap.xml`     | 站点地图                                     |
| `/robots.txt`      | 爬虫规则                                     |

## 设计系统

CSS 自定义属性 + Tailwind v4 `@theme` 令牌，当前按 11 个显式导入的语义模块组织：

- `tokens.css` — 色彩 / 间距 / 圆角 / 阴影 / 主题过渡
- `base.css` — 全局基础 / Header / Footer / reduced-motion
- `components.css` — Section / Card / Button / ArchiveCard / 通用布局
- `links.css` — 个人收藏导航目录
- `blog-ui.css` — BlogCard / SearchBar / TOC / Article panels
- `backdrop.css` — Paper Gallery 背景层
- `home.css` — 首页专题模块
- `prose.css` — MDX 排版 / 代码块双主题（vitesse-dark / vitesse-light）
- `project-detail.css` — 项目详情
- `animations.css` — reveal / loading / fade motion
- `responsive.css` — 移动端适配 / 覆盖样式

详见 [docs/css-conventions.md](./docs/css-conventions.md)。

## 功能清单

- 明暗主题切换（View Transition API 平滑过渡）
- 模糊搜索（fuse.js + `/` 快捷键 + 键盘导航，索引标题 / 摘要 / 标签 / 分类 / 系列 / 小标题 / 正文摘录）
- 代码块主题跟随站点（亮色用 github-light）
- 阅读偏好（字号调节 · 宽窄切换 · 图片点击放大）
- 文章卡片 magnetic hover 微交互
- Hero 区 Canvas 2D 粒子背景（尊重 reduced-motion）
- 阅读进度条 + 目录 + 相关文章 + 上一篇/下一篇 + 回到顶部
- Giscus 评论（主题同步）
- RSS / JSON Feed / Sitemap / PWA manifest
- WCAG 无障碍（focus-visible / aria-label / skip-link）
- CSP nonce 安全头 + HSTS

## 测试

| 层级      | 工具                     | 数量               | 覆盖范围                                                              |
| --------- | ------------------------ | ------------------ | --------------------------------------------------------------------- |
| 单元/集成 | Vitest + Testing Library | 519 用例 / 65 文件 | lib 数据层 / 组件交互 / 页面渲染                                      |
| E2E       | Playwright               | 43 用例 / 4 文件   | 首页 / 博客 / 导航 / 主题 / 作品 / 标签 / 分类 / 专题 / RSS / Sitemap |

```bash
pnpm test          # 运行单元测试
pnpm test:e2e      # 运行 E2E 测试（自动启动 dev server）
```

## CI/CD

GitHub Actions 流水线（`.github/workflows/ci.yml`）包含质量检查、E2E、Lighthouse 与部署后烟测：

- **quality** — lint → test → tsc → generate-rss → build → bundle-budget
- **bundle-analyze** — 构建并上传 Bundle 分析报告
- **e2e** — 安装 Chromium → 运行 Playwright E2E 测试
- **lighthouse** — Lighthouse CI 审计
- **deploy** — Vercel 生产部署 → `pnpm check:production-content` 线上内容烟测（仅 master push）

部署平台：Vercel（自动跟随 main 分支）。

## 内容约定

- 文章文件名：`YYYY-MM-主题名.mdx`，slug 自动去掉日期前缀
- frontmatter 支持 `updatedAt`、`category`、`series`、`source`、`license` 等扩展字段
- 搜索索引、文章摘要、小标题列表和相关文章由构建期从 MDX 自动推导
- `published: false` 的文章不在生产环境展示
- `pnpm check:seo` 会检查重复 slug/标题、标签命名、锚点、资源路径、sitemap 覆盖等内容质量问题
- `pnpm check:production-content` 会用线上 URL 检查首页、博客、作品、导航、RSS 和 Sitemap 是否包含本地内容
- 站点配置唯一源：`src/lib/site.ts`；内容路径、Vercel trace include 与分页常量在 `src/lib/content-dirs.ts`
- 新增页面后同步更新 sitemap 和导航

详见 [docs/content-workflow.md](./docs/content-workflow.md)。

## 文档索引

- [docs/overview.md](./docs/overview.md) — 文档导航
- [docs/architecture.md](./docs/architecture.md) — 架构与模块职责
- [docs/content-workflow.md](./docs/content-workflow.md) — 内容维护流程
- [docs/css-conventions.md](./docs/css-conventions.md) — CSS 范式规范
- [docs/cache-components-migration.md](./docs/cache-components-migration.md) — Cache Components 迁移指南
- [docs/specs/2026-07-04-shadcn-visual-architecture-design.md](./docs/specs/2026-07-04-shadcn-visual-architecture-design.md) — shadcn 视觉组件架构收口
- [docs/项目审查与改进文档.md](./docs/项目审查与改进文档.md) — 历史审查记录
- [AGENTS.md](./AGENTS.md) — AI 编码助手指引
