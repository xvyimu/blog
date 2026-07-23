# CH-DAY 硬化证据 · 2026-07-24

> Worktree 当时：`ch-day-hardening` · Branch：`xvyimu/ch-day-hardening`  
> **状态：已合 master / tip `fbcf270`**（`docs(ops): CH-DAY hardening evidence 2026-07-24`；`origin/master` 对齐）  
> Base: WAVE-1 SRI tip `7cc4b18`（`xvyimu/ch-w1-sri` 同 tip）

## 环境

| Item                    | Value                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| Worktree path（当时）   | `C:\Users\yuanjia\orca\workspaces\Chronicle\ch-day-hardening`          |
| Base tip at start       | `7cc4b18` (`fix(deps): bump next to 16.2.11 for high audit CVEs`)      |
| Tip at finish / master  | **`fbcf270`**（本证据 md 合入；代码门闩仍基于 `7cc4b18` 内容树）       |
| Node                    | v24.16.0（engines 声明 22.x；仅 engine warn，门闩可跑）                |
| pnpm                    | 11.8.0                                                                 |
| Package manager install | `pnpm install --frozen-lockfile` → **exit 0**                          |
| next / SRI inheritance  | `next@16.2.11` · `eslint-config-next@16.2.11` · `ENABLE_SRI` gate 仍在 |

## P0 继承

| Check                  | Result                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `git log -8 --oneline` | tip = `7cc4b18`；含 WAVE-1 next bump + 既有 docs/UI commits                                              |
| `git status`           | clean at start；本波仅新增本证据 md                                                                      |
| WAVE-1 证据            | [ch-w1-sri-2026-07-23.md](./ch-w1-sri-2026-07-23.md) 可读；SRI 脚本/配置仍在                             |
| `next.config.ts`       | `ENABLE_SRI === '1'` → `experimental.sri.algorithm = sha384`；生产 flip 仍 owner gate                    |
| `package.json`         | `next`/`eslint-config-next`/`@next/bundle-analyzer` = 16.2.11；`js-yaml` 钉 `4.3.0`；`@types/node` `^20` |

**结论：** WAVE-1 SRI 绿 tip 完整继承，无需回补 next 升级。

## P1 全门闩再验（命令 / exit）

| #   | Command                                                                                  | Exit  | Notes                                                             |
| --- | ---------------------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------- |
| 1   | `pnpm install --frozen-lockfile`                                                         | **0** | worktree 首次装依赖                                               |
| 2   | `pnpm test:sri`                                                                          | **0** | 6/6 pass                                                          |
| 3   | `pnpm check:sri-smoke`                                                                   | **0** | offline：gate + skip `.next`                                      |
| 4   | `pnpm audit --registry=https://registry.npmjs.org --audit-level=high`                    | **0** | No known vulnerabilities found                                    |
| 5   | `pnpm audit --registry=https://registry.npmjs.org`（全级别）                             | **0** | No known vulnerabilities found                                    |
| 6   | `pnpm typecheck`                                                                         | **0** | `tsc --noEmit`                                                    |
| 7   | `pnpm check:seo`                                                                         | **0** | SEO/content check passed                                          |
| 8   | `pnpm check:docs`                                                                        | **0** | 99 Markdown files                                                 |
| 9   | `pnpm test`                                                                              | **0** | vitest 95 files / **716** tests pass                              |
| 10  | `pnpm exec cross-env NEXT_PUBLIC_SITE_URL=https://incca.ccwu.cc ENABLE_SRI=1 pnpm build` | **0** | Next 16.2.11 · experiments.sri on · 108 routes                    |
| 11  | `pnpm check:sri -- --file .next/server/pages/500.html --expect on`                       | **0** | `total=8 protected=6 unprotected=2` · PASS（mixed 符合脚本语义）  |
| 12  | `pnpm exec cross-env ENABLE_SRI=1 pnpm check:sri-smoke -- --require-build`               | **0** | `integrityHits=14` / 2 html                                       |
| 13  | `pnpm check:blur`                                                                        | **0** | projects=6, blogImages=0                                          |
| 14  | `pnpm check:ops-readiness`                                                               | **0** | GSC/Bing 仍 blocked-human（非代码缺陷）                           |
| 15  | `pnpm check:production-content`（无 base）                                               | **1** | 预期：缺 `NEXT_PUBLIC_SITE_URL` / `--base-url`（脚本 fail-fast）  |
| 16  | `pnpm check:production-content -- --base-url=https://incca.ccwu.cc`                      | **0** | feed/sitemap/search/home/links/blog/projects/about/article 全 200 |

**红 → 修：** 无代码红。#15 为脚本对 base URL 的硬校验，补 `#16` 后绿；未改脚本、未放宽 CSP。

## P2 供应链日

### 2.1 Audit

| Source                       | Result                                                                                        |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| `pnpm audit` (npmjs, high)   | **0** known vulns                                                                             |
| `pnpm audit` (npmjs, all)    | **0** known vulns                                                                             |
| Default registry (npmmirror) | 历史已知 **无** audit bulk endpoint → 本波一律走 `registry.npmjs.org`（见 wave-hygiene-deps） |

### 2.2 Dependabot alerts（`gh api …/dependabot/alerts`）

| Metric           | Value                                          |
| ---------------- | ---------------------------------------------- |
| open count       | **18**（含 duplicate 条目；去重后 ~9 条 GHSA） |
| package          | 全部 **`next`**                                |
| vulnerable range | `>= 16.0.0, < 16.2.11`                         |
| first patched    | **16.2.11**                                    |
| 本分支 `next`    | **16.2.11**（WAVE-1 已升）                     |

代表 GHSA（与 WAVE-1 一致）：

- high: `GHSA-6gpp-xcg3-4w24` · `GHSA-m99w-x7hq-7vfj` · `GHSA-89xv-2m56-2m9x` · `GHSA-p9j2-gv94-2wf4`
- medium: `GHSA-68g3-v927-f742` · `GHSA-4633-3j49-mh5q` · `GHSA-4c39-4ccg-62r3` · `GHSA-q8wf-6r8g-63ch` · `GHSA-955p-x3mx-jcvp`

**处置（写证据当时）：** 代码侧已 patched；当时 GitHub alert 仍 open，因分支尚未合 master。  
**现状（诚实页眉）：** 本证据已合 **master @ `fbcf270`**；后续 CH-DEPS-SEC 扫描见 [ch-deps-sec-2026-07-24.md](./ch-deps-sec-2026-07-24.md)（Dependabot open = 0，历史条均 fixed）。

### 2.3 分类表（`pnpm outdated` 快照 · exit 1 = 有落后包，预期）

| Package                                           | Current      | Latest         | Bucket                  | Reason / action                              |
| ------------------------------------------------- | ------------ | -------------- | ----------------------- | -------------------------------------------- |
| next / eslint-config-next / @next/bundle-analyzer | 16.2.11      | （已 patched） | **security-now → done** | WAVE-1 已升；本波 audit 0 high               |
| @tailwindcss/postcss                              | 4.3.1        | 4.3.3          | ignore-with-reason      | patch/minor 卫生债；无 advisory；本波不扫荡  |
| vitest / @vitest/ui                               | 4.1.9        | 4.1.10         | ignore-with-reason      | patch；716 测已绿，无安全驱动                |
| prettier                                          | 3.9.3        | 3.9.6          | ignore-with-reason      | 格式工具；非 runtime                         |
| radix-ui                                          | 1.6.1        | 1.6.4          | ignore-with-reason      | minor；无 audit 命中                         |
| fuse.js                                           | 7.4.2        | 7.5.0          | ignore-with-reason      | minor 搜索库；无 audit                       |
| lint-staged                                       | 17.0.8       | 17.1.1         | ignore-with-reason      | git hook 工具链                              |
| shiki                                             | 4.2.0        | 4.3.1          | ignore-with-reason      | 高亮；无 audit                               |
| tsx                                               | 4.22.4       | 4.23.1         | ignore-with-reason      | 脚本 runner                                  |
| rehype-pretty-code                                | 0.14.3       | 0.14.4         | ignore-with-reason      | patch                                        |
| **js-yaml**                                       | **4.3.0**    | **5.2.1**      | **major-later**         | 本波约束：major 只列不升                     |
| **@types/node**                                   | **20.19.43** | **26.x**       | **major-later**         | 本波约束：major 只列不升；engines 仍 22.x 线 |
| @testing-library/jest-dom                         | 6.10.0       | 7.0.0          | major-later             | 测试工具 major                               |
| eslint                                            | 9.39.4       | 10.x           | major-later             | ESLint 10 破坏面大                           |
| feed                                              | 5.2.1        | 6.0.0          | major-later             | RSS 生成 major                               |
| typescript                                        | 5.9.3        | 7.x            | major-later             | TS major 不在本波                            |

**本波升级动作：** **无**（security-now 已由 WAVE-1 覆盖；无额外明确可修的 patch/minor **安全**项）。

## P3 内容 / SSR 卫生

| Check                                                       | Exit  | Notes                              |
| ----------------------------------------------------------- | ----- | ---------------------------------- |
| `check:seo`                                                 | **0** | 内容/SEO 门闩                      |
| `check:production-content --base-url=https://incca.ccwu.cc` | **0** | 生产 9 面全 200 + 头/结构断言      |
| `check:blur`                                                | **0** | 项目图 LQIP 覆盖 OK；blog 本地图 0 |
| `check:docs`                                                | **0** | 99 md                              |
| 用户可见文案                                                | —     | **未**大改风格/MDX                 |

## P4 收工

| Item       | Value                                                                        |
| ---------- | ---------------------------------------------------------------------------- |
| 证据文件   | [ch-day-hardening-2026-07-24.md](./ch-day-hardening-2026-07-24.md)（本文件） |
| Master tip | **`fbcf270`**（已合 master / 与 `origin/master` 对齐）                       |
| CSP        | 未放宽                                                                       |
| 密钥       | 未写入 git                                                                   |
| 其它产品   | 未触碰                                                                       |

## 总评

| 维度                | 结果                                                                              |
| ------------------- | --------------------------------------------------------------------------------- |
| WAVE-1 SRI 继承     | 完整 · tip 对齐                                                                   |
| 全门闩              | **绿**（audit high / test / typecheck / seo / docs / sri / build / prod-content） |
| 供应链 security-now | 无待修；Dependabot next 线已 patched；master 合入后 alert 清零（见 CH-DEPS-SEC）  |
| major 债            | js-yaml@5 · @types/node@26 · eslint@10 · feed@6 · TS@7 等 **只列不升**            |
| 合入状态            | **已合 master / tip `fbcf270`**                                                   |

**总评：绿 · 已合 master（`fbcf270`）**

## 复现

```bash
pnpm install --frozen-lockfile
pnpm test:sri
pnpm check:sri-smoke
pnpm audit --registry=https://registry.npmjs.org --audit-level=high
pnpm typecheck
pnpm check:seo
pnpm check:docs
pnpm test
pnpm check:blur
pnpm check:ops-readiness
pnpm exec cross-env NEXT_PUBLIC_SITE_URL=https://incca.ccwu.cc ENABLE_SRI=1 pnpm build
pnpm check:sri -- --file .next/server/pages/500.html --expect on
pnpm exec cross-env ENABLE_SRI=1 pnpm check:sri-smoke -- --require-build
pnpm check:production-content -- --base-url=https://incca.ccwu.cc
```

## Git

- 证据 commit / master tip：`fbcf270`（`docs(ops): CH-DAY hardening evidence 2026-07-24`）
- **已合 master**；`origin/master` 对齐 `fbcf270`
