# 西江月博客 · 当前待办

> 状态：**工程侧可无条件推进的事项已关闭**；仅剩外部账号或条件触发。数字花园 G0–G3 已合入 `feat/v3-ship`（未 push）。  
> 更新：2026-07-21（v3 ship + G3/G2 测试补全 · 685/93）  
> 生产：`https://incca.ccwu.cc`  
> 归档 HEAD：`ef77986`（origin/master）  
> 功能基线：`feat/v3-ship`（G3 popover + G2 hover + React Compiler + VT）· 运营工程：`96e0214` · 硬阻塞记录：`fa3e579`  
> 手册：[ops-deferred-work-plan.md](./docs/ops-deferred-work-plan.md)  
> 自动检查：`pnpm check:ops-readiness`（可选 `-- --live`）  
> run 归档：
>
> - [前后端分层](./docs/superpowers/runs/2026-07-18-frontend-backend-boundary/)
> - [延后运营](./docs/superpowers/runs/2026-07-18-deferred-ops-readiness/)

## 外部依赖（需真人账号；Agent 已穷尽自动路径）

- [ ] **Google Search Console**  
      域名资源 `incca.ccwu.cc` + DNS TXT + 提交 `https://incca.ccwu.cc/sitemap.xml`。  
      阻塞：无 Google 登录会话 / 无 GSC 服务账号 / CF DNS 无写权限。  
      状态：`blocked_auth` · 剧本 §3 / §10。
- [ ] **Bing Webmaster**  
      GSC 验证后**导入**，不重复 DNS。状态：`blocked_auth` · §4。
- [ ] **Vercel Speed Insights p75**  
      工程：`hasData=true`；CLI **无法**导出明细。控制台只读六页或正式 metrics API。  
      **禁止** Lighthouse 代填。状态：`engineering_ready_waiting_samples` · §5。

## 条件触发（未到门槛 = 正确终态，不是欠账）

- [ ] **外部搜索评估**：≥200 文或搜索 p95 证据 → ADR；当前 14 文 Fuse。
- [ ] **正文图 LQIP**：`public/images/blog/**` 有图 → `pnpm gen:blur && pnpm check:blur`。
- [ ] **prose/article-ui 下沉**：Coverage + 层叠方案 + ADR。
- [ ] **Cache Components**：外部数据/ISR/失效需求 + 迁移指南。

## 数字花园（Next 内增量）

- [x] G0 wikilink remark + pure helpers（`[[slug]]` / `[[slug|label]]` → `/blog/{slug}`）
- [x] G1 backlinks panel + link graph cache（fail-closed 坏链；`getBacklinks`）
- [x] G2 次级原型 `/garden`（边列表 + 力导向 + 专题/标签筛选；`prefers-reduced-motion` 降级列表）
- [x] 文章页折叠邻接（`ArticleNeighbors` 出/入边）
- [x] G2 再增强：节点拖拽 + 本机保存/恢复视图（localStorage）
- [x] G2 hover 邻居高亮（`hoverSlug` + `neighborsOf` dim）+ 测试
- [x] G3 wikilink popover（`/api/preview/[slug]` + `WikilinkPopover`）+ 测试
- [ ] G2 可选：更多布局算法 / 导出 PNG
- [ ] Q28 正文概念链加深 4–8 篇 MDX（需用户授权改 content/）
- [ ] Q29 SRI preview 验证（需 Vercel preview deploy 授权）

## 已完成索引（本阶段）

| 范围           | 结果                          | 证据                                          |
| -------------- | ----------------------------- | --------------------------------------------- |
| 逻辑前后端分层 | `src/server` + 边界测试已上线 | run `frontend-backend-boundary` · `a91a07d`   |
| 延后运营工程化 | 就绪门禁 + 手册 + live 实测   | run `deferred-ops-readiness` · `96e0214`      |
| 生产质量       | CI/e2e/deploy/smoke 绿        | launch-baseline                               |
| 阶段归档       | TODO/记忆/run 索引收口        | `ef77986`                                     |
| v3 ship 工程   | Compiler + FS cache + VT + G3 | `feat/v3-ship` · `pnpm build` 94/94 绿        |
| v3 测试补全    | G3/G2 + preview route 13 测   | 685 tests / 93 files                          |
| 数字花园 G0/G1 | wikilink + 反链面板           | 本仓 `src/lib/posts/wikilink*` · `link-graph` |

更早 P0–P10 见历史报告与 `docs/superpowers/runs/`，不在此重复。

## 接手规则

1. 先 `pnpm check:ops-readiness`（必要时 `-- --live`）。
2. 状态为 `blocked_auth` / `not_triggered` / `engineering_ready_waiting_samples` → **不要**开无关重构。
3. 用户完成 GSC/Bing/RUM 后，只更新基线文档中的 pending 行。
4. 若希望 Agent 代写 DNS TXT：提供 Cloudflare `Zone.DNS Edit` token（环境变量，勿入库）。
5. 用户说「你自己看着做 / 我不会」时：穷尽自动路径到硬阻塞并写清，**禁止**甩回逐步人工操作清单代替执行。
