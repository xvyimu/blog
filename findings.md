# 发现与决策

## 需求

- 用户要求使用 `$superpower` 进行架构优化。
- 本次优化应优先解决最近暴露出的部署架构风险：本地内容存在，但线上运行包缺少内容文件。
- 用户确认按建议执行，进入 ADR 0002 推荐的 Local content repository factory 落地阶段。

## 研究发现

- 项目使用 `src/lib/content-source.ts` 在请求时通过 `process.cwd()` + `fs.readFileSync/readdirSync` 读取本地内容。
- 内容路径集中在 `src/lib/content-dirs.ts`：
  - `content/blog`
  - `content/about.mdx`
  - `data/projects.json`
  - `data/links.json`
- 生产部署曾出现首页 `0 篇文章 / 0 个项目`，根因是 Vercel serverless tracing 无法推断动态 fs 路径。
- 当前 `next.config.ts` 已手写 `outputFileTracingIncludes: { '/**': ['content/**/*', 'data/**/*'] }`，但它与 `CONTENT_DIR` 仍是两个来源，存在后续漂移风险。
- `projects` 与 `links` repository 共享同一 implementation 形状：读取 JSON、处理缺失文件、捕获 JSON 语法错误、zod/schema parse、`createCache` 缓存、默认 filesystem adapter。
- 现有行为需要保留：文件缺失返回空数组，JSON 语法错误返回空数组，schema/zod 校验错误继续抛出。

## 技术决策

| 决策                                                    | 理由                                                                   |
| ------------------------------------------------------- | ---------------------------------------------------------------------- |
| 将 tracing include 配置移动到内容路径模块附近           | 让“内容在哪里”和“部署需要打包什么”保持同源                             |
| 增加单元测试约束每个本地内容路径都被 tracing roots 覆盖 | 比只靠人工记忆更可靠                                                   |
| 新增共享 JSON 内容 repository factory                   | 深化本地内容 repository interface，把重复 implementation 收口到一处    |
| 保持 domain 查询在 `projects` / `links` adapters 中     | 避免 generic factory 过宽，只抽取重复的 JSON read / parse / cache 路径 |

## 遇到的问题

| 问题                                               | 解决方案                                              |
| -------------------------------------------------- | ----------------------------------------------------- |
| `CONTENT_DIR` 与 `next.config.ts` tracing 配置分离 | 新增测试并从 `CONTENT_DIR` 推导 tracing includes      |
| `projects` / `links` JSON 读取实现重复             | 用 TDD 新增共享 factory，并让两个 domain adapter 复用 |
| 测试和构建会生成 `html/`、`tsconfig.tsbuildinfo`   | 最终复验后清理，并确认二者不再存在                    |

## 审查结论

- Standards：当前 diff 与项目约定一致，`CONTENT_DIR` / tracing 同源，新增 factory 位于 `src/lib/`，文档中的测试数量与模块说明已同步。
- Spec：ADR 0002 已落地；`projects` 与 `links` 的公开 API 保持不变；缺文件、坏 JSON、schema 错误三类行为与原有约束一致。
- 风险：未来新增更复杂的 JSON 内容类型时，factory 不应吸收 domain query；只在第三个 JSON-backed 模块出现后再考虑扩展能力。

## 资源

- 本地源码与 Next 构建 trace 输出。

## 视觉/浏览器发现

- 未进行新的视觉变更。

---

_每执行2次查看/浏览器/搜索操作后更新此文件_
