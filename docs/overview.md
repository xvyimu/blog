# 项目文档总览

> 状态：当前维护版（2026-07-21 增补仓库身份）。本页是文档导航的唯一入口。  
> **GitHub：** [xvyimu/Chronicle](https://github.com/xvyimu/Chronicle) · 产品名「西江月」· 本地 `D:\Chronicle`（junction `D:\blog`）

项目文档分为四类：当前维护文档、架构决策、已实施设计、历史报告与运行记录。只有“当前维护文档”描述现行操作；日期型报告、spec 和 run 中的测试数、提交和待办都是当时快照，不应作为当前基线。

## 建议阅读顺序

1. [README](../README.md)：项目定位、启动方式、路由、功能和常用命令。
2. [Agent 接手指南](./handoff-to-agent.md)：当前生产基线、接手步骤、边界和验证顺序。
3. [架构说明](./architecture.md)：数据流、模块职责、渲染、安全、CSS 和缓存边界。
4. 按任务选择 API、内容、CSS、性能或缓存文档。
5. 需要理解“为什么这样设计”时再读 ADR 和 specs。

## 当前维护文档

| 文档                                                                                    | 负责内容                                                                                      | 更新触发条件                   |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------ |
| [README](../README.md)                                                                  | 项目入口、安装、功能、路由、命令                                                              | 依赖、路由、脚本或功能变化     |
| [AGENTS](../AGENTS.md)                                                                  | AI 协作规则和项目约定                                                                         | 工具链、目录、测试或工作流变化 |
| [TODO](../TODO.md)                                                                      | 仅保留当前未完成或条件触发事项                                                                | 待办完成、取消或条件变化       |
| [架构说明](./architecture.md)                                                           | 当前模块和运行时边界                                                                          | 模块、数据流、渲染或部署变化   |
| [Search API](./API.md)                                                                  | `/api/search` 请求、响应、错误和缓存                                                          | route、DTO、限流或缓存变化     |
| [内容工作流](./content-workflow.md)                                                     | 文章、项目、收藏、RSS 发布                                                                    | schema、内容目录或检查脚本变化 |
| [CSS 规范](./css-conventions.md)                                                        | token、BEM、shadcn、文件归属                                                                  | token、CSS 文件或导入归属变化  |
| [Cache Components 指南](./cache-components-migration.md)                                | 当前缓存和未来迁移门槛                                                                        | 缓存实现或外部数据源变化       |
| [上线基线](./launch-baseline.md)                                                        | 最新生产证据和发布门禁                                                                        | 新生产基线或 smoke 变化        |
| [延后运营计划](./ops-deferred-work-plan.md)                                             | GSC/Bing/RUM 与条件触发执行手册                                                               | 授权剧本或门槛变化             |
| [性能基线](./performance-baseline.md)                                                   | CI 预算、实验室数据、RUM 目标                                                                 | Lighthouse、bundle 或 p75 更新 |
| [Agent 接手指南](./handoff-to-agent.md)                                                 | 当前状态、优先级和交接边界                                                                    | 生产状态或主要待办变化         |
| [架构优化整合调研 2026-07-21](./architecture-optimization-research-2026-07-21.md)       | v1：同类对照、多方案对比、首轮决议与 §28–35 评分史                                            | 历史决议变更时参阅             |
| [架构优化整合调研 v2 2026-07-21](./architecture-optimization-research-2026-07-21-v2.md) | v2 决策快照：G0/G1 落地后重扫、边密度、Q10–Q20 ship 清单                                      | 花园/轨道/验收假设变化         |
| [架构优化整合调研 v3 2026-07-21](./architecture-optimization-research-2026-07-21-v3.md) | v3 快照：G2 上线后重扫、Q21–Q30 规划、Compiler/FS cache 评估                                  | 历史参阅                       |
| [架构优化整合调研 v4 2026-07-21](./architecture-optimization-research-2026-07-21-v4.md) | **现行决策**：v3 ship 分支落地后重扫、市调/架构/规范/路线图/双 API、D1 交付优先评分、§18 表单 | 交付策略或契约变化             |

## 决策与设计记录

- [ADR 索引](./adr/README.md)：已接受、被替代的关键架构决策。
- [Specs 索引](./specs/README.md)：已经实施的详细设计及其当前落点。
- [Superpower specs 索引](./superpowers/specs/README.md)：工作流产生的已实施设计。

ADR 和 spec 保留决策当时的事实、测试数和方案对比。状态行可以更新，正文不为了追逐当前统计而改写。

## 历史报告与运行记录

以下文件是时间点快照，不是当前操作手册：

- `launch-readiness-2026-07-10.md`
- `frontend-ui-optimization-report-2026-07-12.md`
- `bem-search-architecture-2026-07-12.md`
- `content-seo-plan-2026-07-12.md`
- `codex-review-2026-07-13.md`
- `full-stack-audit-2026-07-17.md`
- `docs/superpowers/runs/2026-07-18-frontend-backend-boundary/`（逻辑分层实施快照）
- `docs/superpowers/runs/2026-07-18-deferred-ops-readiness/`（延后运营门禁与硬阻塞快照）
- `optimization-roadmap-2026-07-06.md`
- `salesdex-inspired-redesign.md`
- `architecture-review.html`
- [Superpower runs 索引](./superpowers/runs/README.md)

历史文件中的未勾选项只表示该次运行在记录结束时的状态。仍有效的工作必须重新出现在根 [TODO](../TODO.md) 中；否则不得据此推断当前项目未完成。

## 文档维护规则

1. 行为、接口、参数和命令以源码、配置和测试收集结果为准。
2. 当前测试数必须带验证日期；历史报告中的旧数量不修改。
3. 新增页面时同步 README、sitemap、导航和测试；新增数据字段时同步 schema、内容工作流和测试。
4. 修改 CSP、内容源、缓存或部署模型时新增或更新 ADR。
5. 外部账号、生产流量和未来规模相关事项必须标明前置条件，不能写成已完成。
6. 合并前运行 `pnpm format:docs:check`、`pnpm check:docs`、`pnpm check:seo` 与 `git diff --check`。
