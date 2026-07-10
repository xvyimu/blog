# Launch Readiness - 2026-07-10

本文件记录 2026-07-10 本轮上线前检查结果。当前尚未部署；本轮变更仍处于本地未提交状态。

## 1. 变更范围

基线提交：

- `7c26e3a fix: harden content validation and sitemap urls`

本轮待发布改动：

- 首页阅读路径中的中文 tag/category 链接统一使用 URL segment 编码。
- 标签云 `/tags` 页中的 tag 链接统一使用 URL segment 编码。
- 文章页复用的 `TagLink` 组件统一对 tag slug 做 URL segment 编码。
- 新增对应单元测试，覆盖中文 tag/category 路由入口。

涉及文件：

- `src/app/page.tsx`
- `src/app/page.test.tsx`
- `src/app/tags/page.tsx`
- `src/app/tags/page.test.tsx`
- `src/components/blog/TagLink.tsx`
- `src/components/blog/TagLink.test.tsx`

## 2. 上线检查结果

| 检查项         | 命令                                                                                                             | 结果                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| 聚焦测试       | `pnpm test src/components/blog/TagLink.test.tsx src/app/tags/page.test.tsx src/app/page.test.tsx -- --runInBand` | pass, 18 tests                 |
| 格式检查       | `pnpm format:check`                                                                                              | pass                           |
| Lint           | `pnpm lint`                                                                                                      | pass                           |
| TypeScript     | `pnpm typecheck`                                                                                                 | pass                           |
| 单元/集成测试  | `pnpm test`                                                                                                      | pass, 70 files / 553 tests     |
| SEO/内容检查   | `pnpm check:seo`                                                                                                 | pass                           |
| 生产构建       | `pnpm build`                                                                                                     | pass, 93 pages                 |
| 依赖安全审计   | `pnpm audit --audit-level high --registry=https://registry.npmjs.org/`                                           | pass, no known vulnerabilities |
| Bundle budget  | `pnpm exec tsx scripts/check-bundle-budget.ts`                                                                   | pass, 1.15 MB / 2.00 MB        |
| E2E            | `pnpm test:e2e`                                                                                                  | pass, 47 tests                 |
| 当前生产 smoke | `pnpm check:production-content -- --base-url=https://incca.ccwu.cc`                                              | pass                           |
| Diff 检查      | `git diff --check`                                                                                               | pass                           |

说明：

- 默认镜像源 `https://registry.npmmirror.com` 不支持 `pnpm audit` 所需 API，本轮审计使用官方 npm registry 完成。
- `console.log` 扫描命中仅位于脚本、测试或文章示例，不在生产组件/路由运行时代码中。
- `shipping-and-launch` skill 提到的 `references/security-checklist.md`、`references/performance-checklist.md`、`references/accessibility-checklist.md` 在本地 skill 目录不存在；本轮按主 `SKILL.md` 清单和项目已有发布基线执行。

## 3. 风险评估

| 风险                                     | 等级 | 说明                                                                                       | 缓解                                                                |
| ---------------------------------------- | ---- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| 中文 tag/category 链接编码后无法匹配页面 | low  | 动态路由已通过 `decodeRouteSegment` 解码，E2E 覆盖 `/tags/%E5%90%8E%E7%AB%AF` 和中文分类。 | 聚焦测试、E2E、sitemap/SEO 检查均通过。                             |
| 首页阅读路径 URL 改动影响导航            | low  | 只改变 URL 表达形式，不改变目标资源。                                                      | 首页单元测试和 E2E 导航通过。                                       |
| 部署后 CDN/缓存短暂保留旧页面            | low  | 静态资源和页面可能存在短暂缓存窗口。                                                       | 部署完成后运行 production smoke，并手动访问 `/tags`、首页阅读路径。 |

## 4. 发布步骤

1. 提交本轮 6 个文件改动。
2. 推送到 `origin/master`。
3. 等待 GitHub Actions 完成 `quality`、`e2e`、`lighthouse`、`deploy`。
4. 部署完成后运行：

```bash
pnpm check:production-content -- --base-url=https://incca.ccwu.cc
```

5. 手动 smoke：

- 打开 `/`，点击「Web 性能与体验」进入 `/tags/%E6%80%A7%E8%83%BD%E4%BC%98%E5%8C%96`。
- 打开 `/tags`，点击中文标签，确认进入对应详情页且文章列表存在。
- 打开任意文章详情，点击中文 tag，确认正常跳转。

## 5. 回滚方案

触发条件：

- 部署后中文标签或分类页面出现 404。
- 首页阅读路径或文章 tag 导航无法跳转。
- CI/Vercel 部署失败且不能快速定位。

回滚步骤：

1. 使用 Vercel 回滚到上一个成功部署，或在 Git 中 revert 本轮提交。
2. 重新等待部署完成。
3. 运行：

```bash
pnpm check:production-content -- --base-url=https://incca.ccwu.cc
```

4. 手动确认 `/`、`/tags`、`/blog`、`/links` 返回正常。

预计回滚时间：

- Vercel 回滚：小于 5 分钟。
- Git revert + CI 部署：约 10-20 分钟，取决于流水线排队和构建时间。
