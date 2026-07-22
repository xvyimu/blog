# Chronicle · 栈矩阵 · 2026-07

> 组合包：`portfolio-arch-upgrade-2026h2` · 波次 **W1**  
> 仓：`xvyimu/Chronicle` · 产品：内容站（非 AI SaaS）  
> 冻结日：2026-07-23 · 基线 tip：`24506a2`

## 1. 当前 → 目标 → 本波

| 层                     | 当前（实测 / lock）                                                  | 半年目标                                                | W1 本波                                         | 证据                                                                  |
| ---------------------- | -------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------- |
| **Node engines**       | `package.json` `22.x` · `.nvmrc` / `.node-version` = `22`            | CI **严格 22**；本地可 22；docs 注明 mirror/engine WARN | **文档化 + 矩阵落盘**；CI 已 `node-version: 22` | `.github/workflows/ci.yml` · 本文件                                   |
| **本地 Node（本 wt）** | **v24.16.0**（engine WARN only）                                     | 不强制改本机；CI 以 22 为准                             | 记录 WARN；**不**改 engines                     | `node -v`                                                             |
| **pnpm**               | `packageManager` **11.8.0**                                          | 跟组合 **≥11.5**                                        | 已 ≥11.5；无降级                                | `package.json`                                                        |
| **Next.js**            | **16.2.9**（钉）                                                     | 补丁线（16.2.x）                                        | **不 bump**（W1 只矩阵+硬化）                   | lock / `package.json`                                                 |
| **React / react-dom**  | **19.2.4**                                                           | 跟 Next 兼容补丁线                                      | 不 bump                                         | 同上                                                                  |
| **TypeScript**         | **^5** → lock **5.9.3**                                              | 5.x 维护线                                              | 不 bump                                         | 同上                                                                  |
| **MDX**                | `next-mdx-remote` **^6.0.0** + remark/rehype（GFM/slug/pretty-code） | 维持分层管线；不换 Astro                                | 文档 IA；无实现大改                             | `content/` · `src/lib/posts`                                          |
| **Tailwind**           | **^4** → lock **4.3.1** + `@tailwindcss/postcss` / typography        | TW4 维护线                                              | 不 bump                                         | 同上                                                                  |
| **Zod**                | **^4.4.3**                                                           | 4.x                                                     | 不 bump                                         | frontmatter schema                                                    |
| **SRI**                | `ENABLE_SRI=1` 门闩 · `experimental.sri.algorithm=sha384` · 三脚本   | 保持门闩；回归绿；**生产 flip 人 gate**                 | **`test:sri` + `check:sri-smoke` = 0**          | 见 W1 报告                                                            |
| **CSP**                | per-request nonce + `strict-dynamic`（`proxy`）                      | 保持；不为 SSG 放 `unsafe-inline`                       | 不改生产策略                                    | `next.config.ts` · ASIS                                               |
| **内容后端**           | 生产默认 `CONTENT_BACKEND=snapshot` · Git-as-CMS                     | 可重复构建 + snapshot 提交门                            | 不改默认                                        | `content-dirs` · CI                                                   |
| **依赖 audit high**    | 目标 high=0                                                          | 每波门禁                                                | **npmjs registry audit high = 0**               | `pnpm audit --registry=https://registry.npmjs.org --audit-level=high` |
| **CI 质量门**          | format/lint/test/tsc/seo/blur/build/RSS/snapshot/bundle              | 保持绿                                                  | W1 可选 typecheck 本地 0                        | `ci.yml`                                                              |

## 2. 引擎与 CI 钉

| 项                 | 值                                                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| engines.node       | `22.x`                                                                                                                      |
| CI `setup-node`    | `node-version: 22`                                                                                                          |
| packageManager     | `pnpm@11.8.0+sha512…`                                                                                                       |
| audit 命令（权威） | `pnpm audit --registry=https://registry.npmjs.org --audit-level=high`                                                       |
| 镜像注意           | 默认 npmmirror **无** audit bulk → 本地 bare `pnpm audit` 可能 `ERR_PNPM_AUDIT_ENDPOINT_NOT_EXISTS`（工具假失败，非包漏洞） |

## 3. SRI / 安全工具链（W1 回归）

| Script                                             | 用途                                           | 生产副作用         |
| -------------------------------------------------- | ---------------------------------------------- | ------------------ |
| `pnpm test:sri`                                    | unit：`scripts/check-sri.test.mjs`             | 无                 |
| `pnpm check:sri-smoke`                             | offline gate：`ENABLE_SRI` 形状 + 可选 `.next` | 无                 |
| `pnpm check:sri -- --file <html> --expect on\|off` | 对构建产物 integrity                           | 无（需本地 build） |

**禁止（W1）：** 未授权切换生产 / Vercel `ENABLE_SRI`；见 ADR `docs/adr/2026-07-21-sri-over-nonce-evaluation.md`。

## 4. 架构主刀对照（半年 · 本波切片）

| 主刀       | 半年                 | W1                                     | 后续波                   |
| ---------- | -------------------- | -------------------------------------- | ------------------------ |
| 内容 IA    | 专题/花园/作品集收口 | **草案** `content-ia-draft-2026-07.md` | W2 路由/frontmatter 落地 |
| 构建可重复 | snapshot + CI diff   | 现状保持（CI 已 verify）               | W2 脚本硬化              |
| 性能预算   | LCP/路由             | 不写预算表                             | W3                       |
| 可观测     | ops-readiness / RUM  | 不扩                                   | 人账号项外部             |

## 5. 明确不做（栈侧）

- 换 **Astro / Vue** 或其它前端框架
- 大爆炸重写 MDX 管线
- monorepo 合并六仓
- 生产 SRI / CSP 策略 flip
- 无矩阵的「随便升」主依赖

## 6. 变更记录

| 日期       | 变更                                                 |
| ---------- | ---------------------------------------------------- |
| 2026-07-23 | W1 首版落盘（solo claude · worktree `w1-ch-claude`） |
