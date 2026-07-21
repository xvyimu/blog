# 西江月博客 · Agent 接手指南

> 状态：当前维护版（2026-07-21 增补仓库身份）。详细模块说明见 [architecture.md](./architecture.md)，当前未完成事项只以根 [TODO](../TODO.md) 为准。

## 0. 仓库身份

| 项      | 值                                                                                          |
| ------- | ------------------------------------------------------------------------------------------- |
| GitHub  | **[xvyimu/Chronicle](https://github.com/xvyimu/Chronicle)**（旧名 `blog`，GitHub 会重定向） |
| 产品名  | 西江月博客                                                                                  |
| 本地    | 真路径 `D:\Chronicle` · junction `D:\blog` · package name `blog`（private）                 |
| 生产    | https://incca.ccwu.cc                                                                       |
| LICENSE | MIT · Copyright 2026 雨天狂奔                                                               |

## 1. 接手顺序

1. 读取根 `AGENTS.md`、`README.md`、`TODO.md` 和本文件。
2. 运行 `git status --short`，保留所有既有改动，不清理未知文件。
3. 读取与任务直接相关的源码、测试和对应维护文档。
4. 小步修改，先跑受影响检查，再跑与风险匹配的完整门禁。
5. 提交、推送、部署、账号登录、DNS 和生产配置变更必须重新取得用户确认。

## 2. 当前生产基线

| 项目           | 当前证据                                                                                |
| -------------- | --------------------------------------------------------------------------------------- |
| 生产域名       | `https://incca.ccwu.cc`                                                                 |
| 功能基线提交   | `a91a07d`（前后端分层）                                                                 |
| 运营工程提交   | `96e0214`（ops-readiness）；阻塞记录 `fa3e579`                                          |
| GitHub Actions | 最近 master CI success（见 Actions；分层 run `29631593044`，运营 run `29632273522`）    |
| 内容规模       | 14 篇文章、6 个项目、10 类 123 条收藏链接                                               |
| Vitest         | 81 files / 618+ tests（2026-07-18；含 ops-readiness）                                   |
| Playwright     | 5 files / 48 tests                                                                      |
| Node / pnpm    | Node 22.x / pnpm 11.8.0；本机 Node 24 仅 warning                                        |
| 延后运营       | GSC/Bing/RUM pending；手册 `docs/ops-deferred-work-plan.md`；`pnpm check:ops-readiness` |

生产证据是时间点快照。接手时仍需用当前 `git log`、CI 和命令重新确认，不要把本表当作永久真值。

## 3. 不可破坏的架构边界

- HTML 因每请求 CSP nonce 动态渲染；不要为 SSG 放宽 `script-src` 到 `unsafe-inline`。
- 本地内容路径由 `src/lib/content-dirs.ts` 统一定义，MDX/JSON 通过 repository 和 Zod schema 读取。
- 页面与 Route Handler 的内容读取经 `src/server/content`；底层 repository/cache 仍在 `src/lib/`，不复制第二套实现。
- 缓存统一使用 `createCache<T>`；测试替换 ContentSource 后调用 `resetAllCaches()`。
- `globals.css` 不承载本地 CSS `@import` 链。全局语义 CSS 由根 layout 显式导入，home/search/links/project-detail 样式由最近路由入口导入。
- 搜索生产路径为 Node runtime `GET /api/search`：限流与用例在 `src/server/search`，共享契约在 `src/lib/search`；当前规模不上外部搜索服务。
- 客户端与 `src/lib` 不得导入 `@/server`；由 `src/lib/module-boundaries.test.ts` 守门。
- 图片默认只允许本地资源，`next.config.ts` 的 `remotePatterns` 保持为空，除非明确审核远程主机。

## 4. 常用修改落点

| 需求             | 首要文件                                                                         | 必须联查                                                                  |
| ---------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 新增文章         | `content/blog/*.mdx`                                                             | schema、SEO、RSS、sitemap、内链                                           |
| 修改项目         | `data/projects.json`                                                             | `src/lib/projects.ts`、图片、项目页测试                                   |
| 修改收藏         | `data/links.json`                                                                | `src/lib/links.ts`、首页预览、SEO 检查                                    |
| 新增路由         | `src/app/**`                                                                     | metadata、导航、sitemap、测试                                             |
| 修改搜索         | `src/app/api/search/route.ts`、`src/server/search/`、`src/lib/search/`（仅契约） | [API 文档](./API.md)、客户端 hook、`module-boundaries`、限流/service 测试 |
| 修改内容读取入口 | `src/server/content`、相关 `src/app/**` 页面                                     | 底层 `src/lib/*` repository、页面测试 mock 路径                           |
| 修改视觉 token   | `src/app/styles/tokens.css`                                                      | 明暗主题、CSS 规范、移动端与截图检查                                      |
| 修改 CSP         | `src/proxy.ts`、`src/lib/csp.ts`                                                 | layout、第三方脚本、ADR、生产 header                                      |
| 修改 CI/部署     | `.github/workflows/ci.yml`                                                       | Node 22、RSS 一致性、smoke、回滚                                          |

## 5. 验证矩阵

| 变更类型         | 最低验证                                                         |
| ---------------- | ---------------------------------------------------------------- |
| 仅文档           | `pnpm format:docs:check`、`pnpm check:docs`、`git diff --check`  |
| 内容/JSON        | 上述 + `pnpm check:seo`、`pnpm build`                            |
| TypeScript/组件  | `pnpm format:check`、`pnpm lint`、`pnpm typecheck`、受影响测试   |
| 路由/交互/响应式 | 上述 + `pnpm test`、`pnpm test:e2e`                              |
| 构建/CSS/性能    | 上述 + `pnpm build`、bundle budget、必要的 Lighthouse/浏览器验证 |
| 部署             | 完整 CI + `pnpm check:production-content`，且需要用户授权        |

生产构建必须提供非 localhost 的 `NEXT_PUBLIC_SITE_URL`。`pnpm build` 会重写 `public/feed.xml` 和 `public/feed.json`；构建后检查这两个文件没有意外 diff。

## 6. 当前剩余边界

- GSC/Bing：用户禁止登录，暂停属性验证与 sitemap 提交；授权后按 [ops-deferred-work-plan.md](./ops-deferred-work-plan.md) 执行。
- Speed Insights：真实 p75 需要授权 token 和足够样本，不能用实验室 Lighthouse 代替。
- 外部搜索、正文图 LQIP、Cache Components 和 CSS 深度下沉均有明确规模或素材触发条件，见 [TODO](../TODO.md) 与 `pnpm check:ops-readiness`。
- 延后事项不得伪装成无条件工程任务；就绪状态以 `check:ops-readiness` 为准。

## 7. 文档规则

- 当前操作以 [文档总览](./overview.md) 中“当前维护文档”为准。
- 日期型审查、spec 和 `docs/superpowers/runs/` 是历史快照，其中的旧测试数和未勾选项不是当前待办。
- 行为描述必须先读源码；接口参数、错误码和命令不得凭旧报告补写。
- 改动当前行为后，在同一批次同步对应维护文档。
