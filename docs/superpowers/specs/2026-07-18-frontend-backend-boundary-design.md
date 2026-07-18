# 前后端逻辑分层优化设计

> 状态：已确认（2026-07-18）  
> 日期：2026-07-18

## 1. 背景与决策

项目是单一 Next.js App Router 应用，生产内容来自本地 MDX/JSON，无运行时数据库。现有全栈审查明确认为 `ContentSource -> repository/cache -> query/search -> route/component` 边界健康，不建议在当前 14 篇文章规模下引入独立后端、CMS、数据库或搜索集群。

本轮采用**同仓、同部署的逻辑前后端分层**：保留 Next.js Server Components、Route Handler 与 Vercel 部署模型，通过显式服务端入口和依赖测试阻止客户端代码直接引用文件系统、仓库、限流等服务端实现。

不拆分为两个应用，不新增网络跳转、CORS、鉴权、数据库、环境变量或云资源。

## 2. 目标与非目标

### 目标

1. 前端组件只依赖 UI、Hook、共享类型和共享纯函数。
2. App Router 页面和 Route Handler 通过 `src/server` 入口访问内容与服务端搜索能力。
3. 搜索 API 的请求、响应、缓存、限流和错误码保持兼容。
4. 用自动化测试守住“客户端不得依赖 `src/server`”的边界。
5. 公共函数、跨层接口、复杂逻辑和本次修改的函数使用中文 JSDoc 或必要的中文行内注释。

### 非目标

- 不建立独立后端仓库或独立部署。
- 不引入数据库、ORM、Redis、CMS、Meilisearch 或 Elasticsearch。
- 不修改页面视觉、路由 URL、内容模型、SEO 结构或生产配置。
- 不为所有调用表达式逐条添加注释；当前生产代码约有 499 个函数体和 1098 个调用表达式，这会制造重复且易漂移的说明。
- 不批量重写无关文件中的历史英文注释。

## 3. 方案比较

| 方案 | 说明                                   | 收益                                   | 代价                                          | 结论           |
| ---- | -------------------------------------- | -------------------------------------- | --------------------------------------------- | -------------- |
| A    | 同一 Next 应用内建立 `src/server` 边界 | 与现有架构一致；无额外运行成本；可测试 | 需要迁移 import 与 mock 路径                  | **采用**       |
| B    | 前端与后端拆为两个独立应用/部署        | 物理隔离更强                           | 增加 CORS、部署、网络故障、内容同步与运维成本 | 当前规模不采用 |
| C    | 只补文档，不加可执行门禁               | 改动最小                               | 无法阻止后续客户端误引服务端模块              | 不采用         |

## 4. 目录与依赖方向

```text
src/components + src/hooks
  -> src/lib/search（共享契约、常量、DTO 投影纯函数）
  -> HTTP GET /api/search

src/app（Server Components / Route Handlers）
  -> src/server/content（内容访问统一入口）
  -> src/server/search（搜索用例、引擎、限流）

src/server
  -> src/lib repositories / schemas / cache / shared search contract
  -> content/ + data/
```

依赖规则：

1. 标记为 `'use client'` 的模块不得导入 `@/server/*`。
2. `src/server` 可以依赖 `src/lib`，`src/lib` 不反向依赖 `src/server`。
3. `src/lib/search/index.ts` 只暴露前后端共享契约、常量和 DTO 投影；服务端引擎与限流从 `src/server/search` 暴露。
4. 文件系统内容实现继续复用现有 repository/cache，不做大规模搬迁。

## 5. 组件与文件变化

### 5.1 服务端内容入口

新增 `src/server/content/index.ts`，统一导出页面需要的文章、项目、链接、关于页及聚合查询。App Router 页面从该入口读取内容；底层现有 `src/lib` repository API 保持不变，避免无收益重构。

### 5.2 服务端搜索入口

新增 `src/server/search/`：

- `engine.ts`：Fuse 服务端搜索与按文章数组引用缓存。
- `rate-limit.ts`：进程内 origin best-effort 限流。
- `service.ts`：组合内容读取与搜索引擎，返回共享 `SearchHit[]`。
- `index.ts`：服务端公共 API。

`src/app/api/search/route.ts` 只保留 HTTP 参数解析、状态码、响应头和异常映射，调用服务端搜索用例。

### 5.3 共享搜索契约

`src/lib/search/` 保留：

- `types.ts`：请求响应 DTO 与错误类型。
- `options.ts`：查询长度、结果数量与 Fuse 权重。
- `project.ts`：`PostMeta -> SearchResultItem` 纯投影。

客户端 `useFuseSearch` 的测试/嵌入索引兼容路径继续使用共享契约，但不能访问服务端限流或内容仓库。

### 5.4 边界测试

新增源代码边界测试，扫描生产 TypeScript/TSX：

- `'use client'` 文件导入 `@/server` 时失败；
- `src/lib` 导入 `@/server` 时失败；
- 扫描文件数必须大于 0，避免测试空跑。

测试使用 Node/TypeScript 现有能力，不新增第三方依赖，不修改 ESLint 配置。

## 6. 中文注释规则

本轮统一以下范围：

1. `src/server` 所有导出函数和接口：中文 JSDoc，说明职责、输入、输出及关键错误语义。
2. Route Handler、repository facade、跨层 DTO：中文注释说明边界与不变量。
3. 复杂分支、缓存、限流和异常映射：仅在意图无法从代码直接看出时使用中文行内注释。
4. React/Next 固定导出等显然函数无需重复描述每一行；调用点不写“调用某函数”式注释。

注释描述原因、约束和契约，不复述语法。

## 7. 数据流与错误处理

```text
SearchBar
  -> GET /api/search?q=&limit=
  -> route 参数校验 + origin 限流
  -> server/search service
  -> server/content -> post repository/cache -> MDX
  -> Fuse engine -> 共享 DTO 投影
  -> JSON SearchResponse
```

- 空查询仍返回 `200` 与空结果。
- 超长查询仍返回 `400 QUERY_TOO_LONG`。
- origin 限流仍返回 `429 RATE_LIMITED` 与 `Retry-After`。
- 内容或搜索异常仍返回不泄露路径的 `500 SERVER_ERROR`。
- 成功缓存仍为 `s-maxage=60, stale-while-revalidate=300`。
- 内容缺失/损坏继续沿用生产 fail-fast、开发/测试 lenient 策略。

## 8. 实施顺序

1. 新增边界测试并确认其能识别非法 client -> server import。
2. 建立 `src/server/content` 入口，迁移 App Router 内容 import 与相关 mock。
3. 将搜索引擎、限流及测试迁移到 `src/server/search`，新增搜索服务。
4. 收窄 `src/lib/search` 公共导出并改造 Route Handler。
5. 补齐本次范围内中文注释，更新架构、API 和接手文档。
6. 运行定向测试、全量质量门禁、构建和搜索相关 E2E。

## 9. 风险、回滚与验证

### 风险

- 测试 mock 仍指向旧模块，导致假失败或未拦截真实依赖。
- barrel 重导出产生循环依赖或意外进入客户端 bundle。
- Route Handler 拆分时改变缓存头、限流顺序或错误响应。

### 控制与回滚

- 保持 DTO 和外部 API 不变，用现有 Route Handler 测试锁定行为。
- 每阶段先跑定向测试，失败时只回退该阶段 import 和新增入口。
- 无数据迁移、环境变量、CI/云配置变化；回滚不需要生产数据操作。

### 验证命令

```bash
pnpm check:docs
pnpm test
pnpm format:check
pnpm format:docs:check
pnpm lint
pnpm typecheck
pnpm check:seo
pnpm build
pnpm test:e2e -- e2e/blog.spec.ts
git diff --check
```

验收时还需确认：

- 客户端边界测试真实扫描且能阻断 `@/server` 导入；
- 搜索 API 既有成功、参数错误、限流和内部错误测试全部通过；
- 页面路由、响应 DTO、样式和内容没有行为变化；
- 无新增依赖、环境变量、数据库、独立服务或部署配置。
