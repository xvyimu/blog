# Chronicle

**GitHub：** [xvyimu/Chronicle](https://github.com/xvyimu/Chronicle)  
**产品显示名：** 西江月博客  
**本地路径 / package 名：** `D:\Chronicle` · npm private name `chronicle`  
**线上：** https://incca.ccwu.cc  
**许可：** [MIT](./LICENSE)

> 产品品牌为「西江月」；工程与 GitHub 身份统一用 **Chronicle**。  
> **自有工程** · MIT · [LICENSE](./LICENSE) · 非 GitHub fork · 仅 `origin`。  
> 身份卡：[GITHUB_IDENTITY.md](./GITHUB_IDENTITY.md)

基于 Next.js 16 App Router 的个人博客兼作品集：MDX 驱动、本地内容驱动、严格 CSP nonce、数字花园与双 API（search / preview）。

## 技术栈

Next.js 16.2 · React 19.2 · TypeScript 5 strict · Tailwind CSS v4 · MDX (next-mdx-remote) · Shiki (rehype-pretty-code) · Giscus · fuse.js · Vitest · Playwright · ESLint 9 · pnpm 11

**形态与栈 SSOT（Agent/立项）：** [`docs/PROJECT.md`](./docs/PROJECT.md) — 个人博客 Web；换栈先改该文档。

## 产品方案与文档地图

| 文档                                               | 用途                                       |
| -------------------------------------------------- | ------------------------------------------ |
| [docs/PRODUCT-LAYERS.md](./docs/PRODUCT-LAYERS.md) | 产品分层 L0–L6 · **L0 身份** · **L4 验收** |
| [docs/PROJECT.md](./docs/PROJECT.md)               | 形态与栈 SSOT                              |
| [CONTRIBUTING.md](./CONTRIBUTING.md)               | 协作 · Issues/PRs                          |
| [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)         | 社区行为准则                               |
| [SECURITY.md](./SECURITY.md)                       | 安全策略与漏洞报告                         |
| [CHANGELOG.md](./CHANGELOG.md)                     | 版本记录（Keep a Changelog）               |

完整索引见 `docs/`。

## 快速启动

```bash
pnpm install
# 复制 .env.example → .env.local 并填写
pnpm dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

### 环境变量

```bash
# .env.local
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GISCUS_REPO=xvyimu/Chronicle
NEXT_PUBLIC_GISCUS_REPO_ID=your_repo_id
NEXT_PUBLIC_GISCUS_CATEGORY_ID=your_category_id
```

生产请使用 `NEXT_PUBLIC_SITE_URL=https://incca.ccwu.cc`。完整说明见 `.env.example`。

## 常用命令

| 命令                            | 作用                                                      |
| ------------------------------- | --------------------------------------------------------- |
| `pnpm dev`                      | 本地开发服务器                                            |
| `pnpm content:build`            | 重建 `generated/content-snapshot/`（改 MDX 后必跑并提交） |
| `pnpm build`                    | RSS + content snapshot + 生产构建                         |
| `pnpm start`                    | 启动生产服务器                                            |
| `pnpm test`                     | Vitest 单元/集成（当前基线 716 / 95）                     |
| `pnpm test:e2e`                 | Playwright E2E                                            |
| `pnpm typecheck`                | `tsc --noEmit`                                            |
| `pnpm check:seo`                | 内容 / sitemap / SEO 完整性                               |
| `pnpm check:production-content` | 生产内容烟测                                              |
| `pnpm check:docs`               | 文档相对链接检查                                          |
| `pnpm lint`                     | ESLint                                                    |
| `pnpm analyze`                  | Bundle 体积分析                                           |

## 项目结构

```text
.
├─ content/                     # 内容源（SSOT）
│  ├─ about.mdx
│  └─ blog/*.mdx
├─ data/
│  ├─ projects.json             # 作品集（GitHub 链接已对齐新仓库名）
│  └─ links.json
├─ generated/content-snapshot/  # T2 构建期快照（生产默认读取；需提交）
├─ docs/                        # 架构 / ADR / 工作流
├─ e2e/                         # Playwright
├─ public/                      # 静态资源、feed.*
├─ scripts/                     # content:build / RSS / SEO / smoke
├─ src/
│  ├─ app/                      # App Router（含 /api/search、/api/preview）
│  ├─ components/
│  ├─ lib/                      # posts / content-snapshot / site / content-dirs …
│  ├─ server/                   # 服务端 search 等
│  └─ types/
├─ .github/workflows/ci.yml     # quality / e2e / deploy（master + PR→master）
├─ AGENTS.md                    # AI 协作约定
├─ CONTRIBUTING.md              # 协作 · CoC 同意
├─ CODE_OF_CONDUCT.md           # 社区行为准则
├─ SECURITY.md                  # 漏洞上报（非 CoC）
├─ CHANGELOG.md                 # 选择性版本记录（完整史见 git）
├─ .editorconfig                # 与 Prettier 对齐
├─ LICENSE                      # MIT · Copyright 2026 雨天狂奔
└─ package.json                 # private · name: chronicle
```

## 路由

| 路由                                                        | 说明                                          |
| ----------------------------------------------------------- | --------------------------------------------- |
| `/`                                                         | Paper Gallery 首页                            |
| `/about`                                                    | 关于                                          |
| `/blog` · `/blog/[slug]`                                    | 列表与文章                                    |
| `/garden`                                                   | 数字花园图谱                                  |
| `/projects` · `/projects/[id]`                              | 作品集（id 例：`chronicle`、`chrono-portal`） |
| `/links` · `/series` · `/tags` · `/categories`              | 收藏 / 专题 / 标签 / 分类                     |
| `/api/search` · `/api/preview/[slug]`                       | 搜索与 wikilink 预览                          |
| `/feed.xml` · `/feed.json` · `/sitemap.xml` · `/robots.txt` | 订阅与爬虫                                    |

## 功能摘要

- 明暗主题（View Transition）· 严格 CSP nonce · HSTS
- 服务端 fuse 搜索 + 预览 API（错误契约 `error` + `code`）
- 数字花园：wikilink、反链、力导向图
- 生产默认 `CONTENT_BACKEND=snapshot`（见 `docs/content-workflow.md`）
- Giscus 评论（默认 repo：`xvyimu/Chronicle`）
- RSS / JSON Feed / Sitemap / PWA manifest

## 内容约定

- 文章：`content/blog/YYYY-MM-主题名.mdx`，slug 去日期前缀
- **改 MDX 后必须** `pnpm content:build`，并提交 `generated/content-snapshot/*`
- 作品集 GitHub 字段使用新名：`Chronicle` / `ChronoPortal` / `ChronoRelay` 等
- 站点配置 SSOT：`src/lib/site.ts`；路径与 Vercel tracing：`src/lib/content-dirs.ts`

## CI / 部署

- GitHub Actions：`push`→`master` 与 `pull_request`→`master`
- quality 含 `content:build` + snapshot `git diff --exit-code`
- deploy 仅 master（Vercel）
- Actions 入口：https://github.com/xvyimu/Chronicle/actions

## 文档索引

- [docs/overview.md](./docs/overview.md) — 文档导航
- [docs/architecture.md](./docs/architecture.md) — 架构
- [docs/content-workflow.md](./docs/content-workflow.md) — 内容与 snapshot
- [docs/API.md](./docs/API.md) — search / preview 契约
- [docs/handoff-to-agent.md](./docs/handoff-to-agent.md) — Agent 接手
- [AGENTS.md](./AGENTS.md) — AI 编码约定

## 许可证

源码与随附软件文档采用 [MIT License](./LICENSE)（Copyright © 2026 雨天狂奔）。  
文章若声明独立 `license` frontmatter，以文章声明为准。
