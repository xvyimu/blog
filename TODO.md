# 西江月博客 · 项目待办

> 当前状态: 523 tests / 65 files / 47 E2E 全绿；CI Lighthouse / deploy / production content smoke 全绿；线上域名 `https://incca.ccwu.cc` 可用
> 更新: 2026-07-05

---

## P0 · Lighthouse 性能阈值回归 ✅ 已完成 (2026-07-05)

> 最新 CI 已恢复通过: quality / e2e / lighthouse / deploy 全绿，deploy 后 `pnpm check:production-content` 线上内容烟测通过。

- [x] Lighthouse 首页性能阈值回归已解除：GitHub Actions run `28731579207` 中 Lighthouse CI audit 通过，生产部署与内容烟测同步通过。

---

## P0 · Claude Code 接手与稳定性修复

有完整设计文档，接手文档同步与稳定性修复已落地。

### Claude Code 接手执行顺序 ✅ 设计已完成 (2026-07-03)

**设计**: [`docs/superpowers/specs/2026-07-03-claude-code-handoff-design.md`](docs/superpowers/specs/2026-07-03-claude-code-handoff-design.md)

执行顺序按用户确认的 `3 → 2 → 1`：

- [x] 先做接手文档：新增 Claude Code handoff design，并同步 `docs/handoff-to-agent.md`
- [x] 再做稳定性修复：分页、LoadingIntro、分类一致性、文章徽章条件
- [x] 继续体验升级方向：`/links` 内容与标签、文章详情 Giscus、移动端 header/search/article/links 覆盖已完成（2026-07-05），不扩大首页动画复杂度

#### 已完成稳定性修复

- [x] `/blog?page=2` 根据 `searchParams.page` 渲染对应分页内容，并补单测/E2E 回归
- [x] `LoadingIntro` 在无 `requestIdleCallback` 的浏览器里安全 fallback，并在 unmount 时清理定时器
- [x] 分类聚合以 `post.category` 为来源，避免显式分类丢失
- [x] 文章详情徽章容器在有 series/category/tags 任一项时渲染

#### 当前测试缺口

- [x] Giscus script 属性与 CSP/lazy-load 真实浏览器验证（`e2e/mobile.spec.ts`）
- [x] 移动端 Playwright 覆盖：header、search、article、links（`e2e/mobile.spec.ts`）

### W2: links.ts 纯数据迁移 JSON ✅ 已完成 (2026-07-01)

**设计**: [`docs/specs/2026-06-30-links-json-migration-design.md`](docs/specs/2026-06-30-links-json-migration-design.md)

- [x] `data/links.json` 新建 — 当前 10 分类 123 条纯数据，支持可选 `tags`
- [x] `src/lib/links.ts` 重写 — Zod schema + ContentSource 读取 + 缓存
- [x] `src/lib/links.test.ts` 新建 — `parseLinks` 纯函数单元测试
- [x] 调用方迁移: `page.tsx` / `page.test.tsx` 改用 `getAllLinkCategories()`
- [x] 验证: ✅ 504 全绿 | ✅ tsc 零错误

### S2+S4+S6: posts.ts 深化重构 + 路由 adapter ✅ 已完成 (2026-07-01)

**设计**: [`docs/specs/2026-06-29-posts-deepening-design.md`](docs/specs/2026-06-29-posts-deepening-design.md)

- [x] `src/lib/posts/` 目录新建 (schema/repository/query/search-text + barrel)
- [x] `src/lib/content-source.ts` 增加 `createPostRepository` 工厂（实际位于 posts/repository.ts）
- [x] `src/lib/test-utils/in-memory-source.ts` 新建
- [x] `src/lib/cache.ts` 增加 `source` 可选参数
- [x] `src/types/index.ts` 从 zod 派生 `PostFrontmatter`
- [x] `src/lib/route-adapter.ts` 新建 — `createDynamicRoute`
- [x] 4 个动态路由迁移 (blog/[slug], projects/[id], tags/[tag], categories/[category])
- [x] scripts 迁移到共享 schema (generate-rss, check-seo)
- [x] 新增单元测试覆盖新模块（query.test.ts, repository.test.ts, search-text.test.ts）
- [x] 回归验证: ✅ 505 tests 全绿 | ✅ tsc 零错误

---

## P1 · 测试增强

### 新组件 E2E 覆盖 ✅ 已完成 (2026-07-01)

- [x] 首页: EditorialHero / ManifestoSection / CuratedLinksPreview / FeaturedArticleRail / ReadingPathSection / HomeCtaSection — 全有 `.test.tsx`
- [x] ProjectCard 点击跳转 + 外链 — `ProjectCard.test.tsx` 存在
- [x] ImageZoom 交互 — `ImageZoom.tsx` + test 存在
- [x] Giscus 占位渲染 — `Giscus.tsx` + test 存在
- [x] BackToTop / MagneticCard — 组件与单元测试均已存在

### 测试质量 ✅ 已完成 (2026-07-02)

- [x] 确认 Mutation testing (stryker) 是否必要 — 已安装 + 跑通 baseline：491 tests / 24 文件 / 859 mutations / 2 survived (0.2%)，变异穿透率极低，结论：**无需常驻 CI**，保留配置做阶段性审计即可
- [x] 检查是否有 flaky test (重复运行 3 次) — 3 次全绿，491/491 无波动，**无 flaky**
- [x] CI 中 vitest `--reporter=html` 产出报告 artifact — `vitest.config.ts` 加 `reporters: ['default', 'html']`，CI 加 `vitest-report` artifact upload step

---

## P2 · 内容深化 ✅ 已审计 (2026-07-02)

> 审计结论：frontmatter / license / series 均完整；categories 字段全站未使用，与 tags 无冲突；全站零交叉链接；RSS 基础 feed 已有。

### 已完成内容增强：

- [x] 数据与内容批次收敛 — `data/links.json` 10 分类 123 条已结构化校验，URL 无重复且无 aff/ref/utm 等追踪参数；内容维护文档已同步到 `site.ts` / `content-dirs.ts`
- [x] 收藏库 2.0 — 新增 VPS 官网入口、self-hosted 目录资源、博客项目与设计参考分类，并在卡片中展示可选 metadata tags
- [x] RSS 丰富度 — JSON Feed 输出 `feed_url` / `tags` / `date_published` / `date_modified`，RSS 输出站点级与文章级分类
- [x] 文章交叉链接 — 文章详情底部已有“相关文章”，规则为共享 tag 优先，同 category / 同 series 加权补充；页面测试已覆盖
- [x] 文章系列 / 专题页增强 — 新增 `/series` 与 `/series/[series]`，主导航、sitemap、SEO 检查、Vitest 与 E2E 均已覆盖

### 需内容决策（等你定方向）：

- [ ] 缺 `source` 字段的文章补 source（仅在确有外部来源或仓库链接时填写；原创文章保持缺省，禁止写空字符串）
- [ ] 精简冗余 tags（如 Next.js 文章同时有 "前端" "全栈" 语义重叠）

### 暂不处理：

- `image` 字段 — Next.js OG 自动生成，无需手动维护
- `categories` 字段 — 全站从未使用，加不加均可

---

## P3 · 基础设施

- [x] **提交批次 1 收敛**: 基础设施变更已归组到 ignore / Prettier / ESLint / CI / 脚本 / 文档基线，后续提交时可作为独立批次审查
- [x] **信息架构批次收敛**: `constants.ts` 已删除并拆分为 `site.ts` / `content-dirs.ts` / `category-rules-data.ts`，专题 URL 在页面、metadata、sitemap 与 SEO 检查中统一编码
- [x] **架构文档更新**: `docs/architecture.md` 已存在且包含 posts 拆分、hook 目录、三层背景架构
- [x] **Prettier + pre-commit**: 新增 `format` / `format:check`、`.prettierrc`、`.prettierignore`、`lint-staged` 与 Husky pre-commit；CI quality job 已执行 `pnpm format:check`
- [x] **生成物忽略规则**: 已忽略 `html/`、`test-results/`、`tmp/`、`stryker-report/`、`.stryker-tmp/`、`*.tsbuildinfo`
- [x] **依赖去重**: 移除未使用的 `eslint-plugin-prettier-vue`，保留 `eslint-plugin-prettier` + `eslint-config-prettier`
- [x] **CI 缓存 warm**: `pnpm install` + `actions/setup-node@v4` cache: 'pnpm' 已配置
- [x] **CI 超时设置**: 5 个 job 均已设置 timeout-minutes（quality/bundle-analyze/lighthouse/deploy: 10min, e2e: 15min）
- [x] **pnpm audit 阈值**: `--audit-level=high` 已配置
- [x] **bundle budget**: `scripts/check-bundle-budget.ts` 已存在且在 CI 中执行
- [x] **W1: constants.ts 拆分**: 站点配置迁移到 `src/lib/site.ts`，内容路径与分页常量迁移到 `src/lib/content-dirs.ts`
- [x] **RSS / Sitemap 稳定化**: RSS `lastBuildDate` 与 sitemap `lastModified` 改为内容派生，避免构建时间造成无意义 diff

---

## Future · 远期

- [ ] 搜索增强: fuse.js 索引持久化 / 服务端搜索
- [ ] 图片优化: 统一 next/image 配置 + 预生成 blur data URL
- [ ] 性能基线: 回填 Speed Insights p75 基线 (依赖生产流量)
- [ ] mobile Lighthouse preset 评估
- [x] 导航页 `/links` UI 迭代：metadata tags + 10 分类 123 条收藏已落地
