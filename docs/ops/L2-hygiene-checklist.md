# Chronicle L2 安全 / 运维 Hygiene 清单

> **状态**：2026-07-22 侧线盘点（只读 + 清单；**不换栈**，维持 Next 16）  
> **产品标签**：L2 内容遗留（见组合 ADR / portfolio-side-track）  
> **生产**：https://incca.ccwu.cc · 仓库 [xvyimu/Chronicle](https://github.com/xvyimu/Chronicle)  
> **本轮约束**：禁止 GardenExplorer 大重构、禁止迁 Vue、不 push、不改计费/生产破坏  
> **相关手册**：[ops-deferred-work-plan.md](../ops-deferred-work-plan.md) · [launch-baseline.md](../launch-baseline.md) · [handoff-to-agent.md](../handoff-to-agent.md) · [TODO.md](../../TODO.md)

本文是 **L2 运维/安全 hygiene 索引**，不是旗舰重写方案。工程侧可自动事项大多已关闭；剩余多为账号授权或条件触发。

---

## 0. 一分钟结论

| 面           | 结论                                                             | 证据（本轮）                                                   |
| ------------ | ---------------------------------------------------------------- | -------------------------------------------------------------- |
| 依赖审计     | **绿**（`pnpm audit --audit-level=high` → no known vulns）       | 本地 2026-07-22；CI quality 同级门禁                           |
| CSP / 安全头 | **生产到位**（nonce + strict-dynamic + report-to/uri + HSTS 等） | `HEAD https://incca.ccwu.cc/` 实测                             |
| SRI          | **生产开**（`ENABLE_SRI=1`，sha384）                             | ADR Accepted · launch-baseline                                 |
| CI           | quality → e2e → deploy(master) + 并行 bundle-analyze             | `.github/workflows/ci.yml`                                     |
| 生产冒烟     | 脚本化入口已就绪                                                 | `pnpm check:production-content` / `check:ops-readiness --live` |
| 运维债       | **无阻塞级代码债**；P0 为人账（GSC/Bing），P1 为 RUM 只读回填    | TODO + ops-deferred                                            |

**禁止本轮做**：换栈、Garden 大重构、为“看起来更现代”放宽 CSP、伪造 GSC/p75。

---

## 1. 依赖 / 审计

### 1.1 现状

| 项             | 值                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 包管理         | pnpm `11.8.0`（`packageManager` 字段钉死）                                                                                                        |
| Node           | engines `22.x`；CI setup-node 22；本机 24 仅 warning                                                                                              |
| 运行时主栈     | `next@16.2.9` · `react@19.2.4` · `react-dom@19.2.4`                                                                                               |
| 审计门禁       | CI：`pnpm audit --registry=https://registry.npmjs.org --audit-level=high`                                                                         |
| Dependabot     | weekly npm + github-actions；分组 next / react / playwright；PR 上限 5                                                                            |
| 覆盖 overrides | `pnpm-workspace.yaml`：`sharp>=0.35`、`fast-uri>=3.1.4`、`postcss`/`qs`/`tmp`/`uuid`、`brace-expansion@1–5` 等（audit 修复，见 commit `3111acc`） |
| 本轮实测       | `pnpm audit --audit-level=high` → **No known vulnerabilities found** · exit 0                                                                     |

### 1.2 检查清单（接手 / 发版前）

```bash
# 高危及以上必须 0
pnpm audit --registry=https://registry.npmjs.org --audit-level=high

# 锁定安装（与 CI / Vercel 一致）
pnpm install --frozen-lockfile
```

- [ ] CI quality 的 audit 步骤绿
- [ ] 新依赖有明确用途；**不**为“将来可能用”装 Meili/ES 等（搜索门槛见 §5）
- [ ] 改 overrides 须写清 GHSA/CVE 与回滚条件；禁止 silent drop
- [ ] Dependabot PR：先 audit + quality，再考虑合

### 1.3 已知债务（依赖）

| ID    | 级别 | 说明                                                    | 动作                                                 |
| ----- | ---- | ------------------------------------------------------- | ---------------------------------------------------- |
| DEP-1 | P2   | Stryker 等 dev 工具链可能再次带入 ajv/fast-uri 类传递洞 | 保持 overrides；升级时重跑 audit                     |
| DEP-2 | P2   | Next 间接 `sharp` 版本漂移                              | 保持 `sharp>=0.35` override；大版本升级 Next 时复验  |
| DEP-3 | P2   | `experimental.sri` 仍属实验 API                         | 跟 Next 发布说明；稳定后可去掉“实验”标注（ADR 已记） |

---

## 2. CSP / SRI / 安全响应头

### 2.1 代码落点

| 能力               | 文件                                                                  | 行为                                                                                           |
| ------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 每请求 CSP + nonce | `src/proxy.ts`（Next 16 Proxy/Middleware）                            | 生产生成 `btoa(crypto.randomUUID())`；`script-src 'nonce-…' 'strict-dynamic'`；开发跳过（HMR） |
| 静态安全头         | `next.config.ts` → `headers()`                                        | XFO / XCTO / Referrer-Policy / Permissions-Policy / HSTS                                       |
| nonce 读取         | `src/lib/csp.ts` → layout / DarkModeScript                            | `headers().get('x-nonce')`                                                                     |
| CSP 上报           | `POST /api/csp-report`                                                | collect-only；限流 30/min/key；不落库、不回显；204                                             |
| SRI 门控           | `next.config.ts` `ENABLE_SRI=1` → `experimental.sri.algorithm=sha384` | **未设则完全不启用**；生产 env 已开                                                            |

### 2.2 生产实测（2026-07-22 `HEAD /`）

| Header                      | 值（摘要）                                                                                                                                                                                                                                                          | 判定 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| `Content-Security-Policy`   | `default-src 'self'`；`script-src 'self' 'nonce-…' 'strict-dynamic' https://giscus.app https://va.vercel-scripts.com`；`style-src 'self' 'unsafe-inline'`；`object-src 'none'`；`upgrade-insecure-requests`；`report-uri /api/csp-report`；`report-to csp-endpoint` | OK   |
| `Reporting-Endpoints`       | `csp-endpoint="/api/csp-report"`                                                                                                                                                                                                                                    | OK   |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains`                                                                                                                                                                                                                               | OK   |
| `X-Content-Type-Options`    | `nosniff`                                                                                                                                                                                                                                                           | OK   |
| `X-Frame-Options`           | `SAMEORIGIN`                                                                                                                                                                                                                                                        | OK   |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`                                                                                                                                                                                                                                   | OK   |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=()`                                                                                                                                                                                                                          | OK   |

**CSP 设计要点（勿破坏）**

1. HTML 因 `headers()` + nonce **动态渲染**；**禁止**为 SSG 把 `script-src` 放成 `'unsafe-inline'`。
2. `style-src 'unsafe-inline'` 有意保留（Tailwind v4 注入）；脚本面不放宽。
3. 第三方白名单仅 Giscus + Vercel Analytics 脚本域；`img-src` 本地 + `data:`；`remotePatterns: []`。
4. SRI 与 nonce **互补**（静态 chunk 完整性 vs 内联脚本）；回滚 SRI = 去掉 Production `ENABLE_SRI` 再 deploy，无需 revert 代码。

### 2.3 检查清单

```bash
# 生产头 + 内容 + CSP 形状（首页含 CSP/HSTS/XCTO）
pnpm check:production-content -- --base-url=https://incca.ccwu.cc

# 快速肉眼确认
# curl -sI https://incca.ccwu.cc/ | findstr /I "content-security strict-transport x-frame x-content permissions referrer reporting"
```

- [ ] 首页 CSP 含 nonce + `strict-dynamic`，**无** `script-src 'unsafe-inline'`
- [ ] 生产 HTML 中 `/_next/static` 资源带 `integrity="sha384-…"`（SRI 开时）
- [ ] `/api/csp-report` 对畸形 body 仍 204；超配额 429
- [ ] 新增第三方脚本/iframe 必须同步改 `proxy.ts` 指令 + 文档 + 测试

### 2.4 相关 ADR

| ADR                                                | 状态                              |
| -------------------------------------------------- | --------------------------------- |
| `docs/adr/2026-07-17-csp-nonce-over-ssg.md`        | 接受动态 HTML + nonce             |
| `docs/adr/2026-07-21-sri-over-nonce-evaluation.md` | **Accepted**；生产 `ENABLE_SRI=1` |
| `docs/adr/0001-csp-nonce-vs-ssg.md`                | Superseded                        |

---

## 3. CI

### 3.1 流水线（`.github/workflows/ci.yml`）

```text
push/PR → master
  quality ──┬── e2e ──┬── deploy   (仅 push master)
            │         │
            └── (e2e needs quality)
  bundle-analyze  (并行，不阻塞 deploy)
```

| Job                | 关键内容                                                                                                                                                                        | 超时 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| **quality**        | install frozen → **audit high** → format/format:docs → **check:docs** → lint → vitest → tsc → check:seo → check:blur → build → RSS diff → content snapshot diff → bundle budget | 10m  |
| **bundle-analyze** | `pnpm analyze` + artifact `.next/analyze/`                                                                                                                                      | 10m  |
| **e2e**            | Playwright chromium + 同机 production build + Lighthouse CI (`treosh/lighthouse-ci-action@v12`)                                                                                 | 25m  |
| **deploy**         | `npx vercel@56.2.1 deploy --prod` + `pnpm check:production-content`                                                                                                             | 10m  |

其它：

- `permissions: contents: read`；concurrency cancel-in-progress
- `NEXT_PUBLIC_SITE_URL` 默认 `https://incca.ccwu.cc`（vars 可覆盖）
- Dependabot：`.github/dependabot.yml`

### 3.2 检查清单

- [ ] PR 必须 quality + e2e 绿才合 master
- [ ] master push 后 deploy + 生产 smoke 绿
- [ ] RSS（`public/feed.*`）与 `generated/content-snapshot/` **已提交**且 CI diff 为空
- [ ] 不随意把 Vercel CLI 从 `56.2.1` 改成 `@latest`（CFG 防漂移）
- [ ] Secret：`VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` 仅 Actions；不入库

### 3.3 CI 债务

| ID   | 级别 | 说明                                 | 动作                                      |
| ---- | ---- | ------------------------------------ | ----------------------------------------- |
| CI-1 | P2   | Lighthouse 在 e2e job 内，总时长偏长 | 可接受；勿为加速拆掉共享 production build |
| CI-2 | P2   | audit 仅 high+；moderate 不拦        | 有意；升级时人工扫 moderate 趋势          |
| CI-3 | P1   | deploy 仅 master；侧线分支不部署     | 正确；preview 走 Vercel 集成即可          |

---

## 4. 生产冒烟入口

### 4.1 标准命令

| 目的                            | 命令                                                                |
| ------------------------------- | ------------------------------------------------------------------- |
| 生产内容 + 安全头               | `pnpm check:production-content -- --base-url=https://incca.ccwu.cc` |
| 运维就绪（本地不变量）          | `pnpm check:ops-readiness`                                          |
| 运维就绪 + 公开 SEO 面          | `pnpm check:ops-readiness -- --live`                                |
| SEO / 内容完整性                | `pnpm check:seo`                                                    |
| 文档相对链接                    | `pnpm check:docs`                                                   |
| 全量门禁（本地近似 CI quality） | 见 `docs/launch-baseline.md` §6                                     |

### 4.2 `check:production-content` 覆盖（脚本契约）

- 首页 / 博客 / 文章 / about / projects / links / search API / RSS / sitemap 等路径与内容标志
- 首页强制头：`content-security-policy`（nonce + strict-dynamic，禁 script unsafe-inline）、`strict-transport-security`（max-age=31536000）、`x-content-type-options: nosniff`
- 失败分层：部署未生效 → env → tracing → 内容回归（见 launch-baseline §4）

### 4.3 发布后最短路径

```bash
pnpm check:production-content -- --base-url=https://incca.ccwu.cc
pnpm check:ops-readiness -- --live
# 可选：浏览器 Network 确认 integrity= / CSP report 通道
```

### 4.4 回滚（运维）

| 故障   | 动作                                                  |
| ------ | ----------------------------------------------------- |
| 部署坏 | Vercel 回滚上一成功 deployment（需授权）              |
| 代码坏 | revert commit + 完整 CI；**禁止** force push 共享历史 |
| 内容坏 | 修 MDX/JSON → seo + build + smoke                     |
| CSP 坏 | 恢复已验证 proxy/config；**禁止**临时 `unsafe-inline` |
| SRI 坏 | 去掉 Production `ENABLE_SRI` 再 deploy                |

---

## 5. 运维债分级（P0 / P1 / P2）

> 与根 `TODO.md`、`docs/ops-deferred-work-plan.md` 对齐。  
> **`blocked_auth` / `not_triggered` / `engineering_ready_waiting_samples` 不是工程失败。**

### P0 — 影响发现/合规面，需人在场

| ID   | 项                                                                   | 状态                            | 入口                         |
| ---- | -------------------------------------------------------------------- | ------------------------------- | ---------------------------- |
| P0-1 | Google Search Console：域名 `incca.ccwu.cc` + DNS TXT + 提交 sitemap | `blocked_auth`                  | ops-deferred §3 / §10        |
| P0-2 | 生产公开 SEO 面回归（sitemap/robots/home）                           | **工程已守门**；发版后必跑 live | `check:ops-readiness --live` |

说明：P0-2 自动化已绿；P0-1 无 Google 登录 / CF DNS 写权限时 Agent 不可代完成。

### P1 — 可观测与双引擎收录

| ID   | 项                                            | 状态                                                            | 入口                                   |
| ---- | --------------------------------------------- | --------------------------------------------------------------- | -------------------------------------- |
| P1-1 | Bing Webmaster：从 GSC **导入**（勿重复 DNS） | 依赖 P0-1                                                       | ops-deferred §4                        |
| P1-2 | Speed Insights 六页 p75 只读回填              | `engineering_ready_waiting_samples`（hasData=true，CLI 无明细） | performance-baseline + ops-deferred §5 |
| P1-3 | 生产冒烟纳入例行（发版后 / 周扫）             | 流程债，脚本已有                                                | §4 本文件                              |

**禁止**用 Lighthouse 分数代填 RUM p75。

### P2 — 条件触发 / 卫生 / 体验余量

| ID   | 项                        | 触发或说明                                                           |
| ---- | ------------------------- | -------------------------------------------------------------------- |
| P2-1 | 外部搜索（Meili/ES）评估  | ≥200 文 **或** 搜索 p95 证据；当前 ~20 文 Fuse（ADR keep-Fuse）      |
| P2-2 | 正文图 LQIP               | `public/images/blog/**` 出现图 → `gen:blur` + `check:blur`           |
| P2-3 | prose/article-ui CSS 下沉 | Coverage + 层叠方案 + ADR                                            |
| P2-4 | Cache Components          | 外部数据/ISR 需求；nonce 动态 HTML 下默认关                          |
| P2-5 | Garden G2/T7 兴奋型余量   | Worker / 径向时间线 / 导出；**非本侧线**                             |
| P2-6 | CSP report 持久化/告警    | 当前 console.warn only；有量再考虑采样落库                           |
| P2-7 | 限流跨 isolate            | search/preview/csp-report 进程内 Map；硬配额靠平台 WAF（代码已注释） |
| P2-8 | 依赖 overrides 收敛       | 上游修复后逐步去掉 pin（§1.3）                                       |

### 已关闭（勿再当债开重构）

- SRI 生产启用（2026-07-22）
- Giscus 生产 env → `xvyimu/Chronicle`
- T1 preview 契约 / T2 content snapshot / T3 CSP report
- 文档 archive + format:docs 门禁
- audit overrides（sharp / fast-uri 等）

---

## 6. 月度 / 发版 Hygiene 速查

### 每次发版前（工程）

```bash
pnpm audit --registry=https://registry.npmjs.org --audit-level=high
pnpm format:check && pnpm format:docs:check && pnpm check:docs
pnpm lint && pnpm typecheck && pnpm test
pnpm check:seo && pnpm check:blur
pnpm exec cross-env NEXT_PUBLIC_SITE_URL=https://incca.ccwu.cc pnpm build
pnpm exec tsx scripts/check-bundle-budget.ts
# 有交互/路由变更时：
pnpm test:e2e
```

### 每次发版后（生产）

```bash
pnpm check:production-content -- --base-url=https://incca.ccwu.cc
pnpm check:ops-readiness -- --live
```

### 有账号授权时（人工 15 分钟）

1. GSC 域名验证 + sitemap
2. Bing 从 GSC 导入
3. Speed Insights 六页 p75 → 写 `performance-baseline.md`（不足则 `pending`）

### 明确不做（L2 / 本侧线）

- 换 Vue / 重写框架
- GardenExplorer 大重构
- 未触发门槛上外部搜索
- 放宽 CSP 换静态化
- 伪造收录或 RUM
- 默认 `git push` / 生产 env 乱改

---

## 7. 文档索引（运维相关）

| 文档                                                      | 用途                          |
| --------------------------------------------------------- | ----------------------------- |
| 本文件 `docs/ops/L2-hygiene-checklist.md`                 | L2 安全/运维 hygiene 总清单   |
| [ops-deferred-work-plan.md](../ops-deferred-work-plan.md) | GSC/Bing/RUM 执行剧本         |
| [launch-baseline.md](../launch-baseline.md)               | 生产基线与门禁数字            |
| [performance-baseline.md](../performance-baseline.md)     | 性能/RUM 记录                 |
| [handoff-to-agent.md](../handoff-to-agent.md)             | Agent 接手与边界              |
| [architecture.md](../architecture.md)                     | 分层与安全模型摘要            |
| [API.md](../API.md)                                       | search / preview / csp-report |
| 根 [TODO.md](../../TODO.md)                               | 未完成事项 SSOT               |

---

## 8. 本轮盘点元数据

| 项           | 值                                                                   |
| ------------ | -------------------------------------------------------------------- |
| 日期         | 2026-07-22                                                           |
| 分支上下文   | `xvyimu/ch-2`（侧线文档产出）                                        |
| 栈决议       | 维持 Next（内容站适配证据）；Better-wins 不强制换栈                  |
| 本轮代码改动 | **无**（仅本清单文档）                                               |
| 本轮验证     | `pnpm audit --audit-level=high` exit 0；生产 `HEAD /` 安全头抽样 200 |

更新本文件时：同步 commit/CI/smoke 证据；账号事项完成后只改状态行，不重开架构讨论。
