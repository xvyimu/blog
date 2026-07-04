# 任务计划：内容部署架构优化

## 目标

把本地内容读取路径与 Vercel serverless 文件追踪配置统一起来，防止内容文件在生产部署包中遗漏。

## 当前阶段

阶段 6

## 各阶段

### 阶段 1：需求与发现

- [x] 理解用户意图：进行架构优化
- [x] 确定约束：Next.js App Router、本地 MDX/JSON 内容、Vercel 部署
- [x] 记录线上内容缺失根因
- **状态：** complete

### 阶段 2：TDD 约束

- [x] 为内容路径与 tracing 配置关系写失败测试
- [x] 确认测试在实现前失败
- **状态：** complete

### 阶段 3：实现

- [x] 集中定义内容路径与 tracing include 配置
- [x] 让 `next.config.ts` 复用同一配置来源
- [x] 保持现有内容仓库 API 不变
- **状态：** complete

### 阶段 4：测试与验证

- [x] 运行目标测试
- [x] 运行 lint、typecheck、build
- [x] 验证 `.next` trace 包含 `content` 与 `data`
- **状态：** complete

### 阶段 5：审查与交付

- [x] 做 Standards / Spec 双轴复查
- [x] 清理测试产物
- [x] 汇总结果给用户
- **状态：** complete

### 阶段 6：Local content repository factory

- [x] 写 `json-content-repository` 失败测试
- [x] 实现共享 JSON 内容 repository factory
- [x] 迁移 `projects` 与 `links` 到共享 factory
- [x] 保持现有公开 API 与错误行为不变
- [x] 运行目标测试、全量测试、lint、typecheck、build
- [x] 做 Standards / Spec 双轴复查
- **状态：** complete

## 关键问题

1. 如何避免 `CONTENT_DIR` 与 `next.config.ts` tracing glob 再次漂移？
2. 如何用轻量测试覆盖这个部署架构约束？

## 已做决策

| 决策                                             | 理由                                                                              |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| 将优化范围限定在内容部署架构                     | 刚发生的生产内容缺失问题风险最高，且改动面可控                                    |
| 使用 TDD 增加架构约束测试                        | 防止后续改内容路径时忘记同步部署追踪配置                                          |
| 选择 Local content repository factory 作为下一步 | ADR 0002 推荐，能收口 `projects` / `links` 的重复 read/parse/cache implementation |

## 遇到的错误

| 错误                                          | 尝试次数 | 解决方案                                                                |
| --------------------------------------------- | -------- | ----------------------------------------------------------------------- |
| 暂无                                          | 0        | 暂无                                                                    |
| PowerShell 清理校验命令变量转义失败           | 2        | 改用已确认在工作区内的绝对 `-LiteralPath` 删除                          |
| PowerShell 内联脚本 `$变量` 被外层 shell 展开 | 1        | 使用反引号转义 `$` 后重跑，确认只删除 `html/` 与 `tsconfig.tsbuildinfo` |

## 备注

- 规划文件为本次 superpower 工作流状态记录。
