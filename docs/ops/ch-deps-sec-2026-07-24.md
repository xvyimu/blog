# CH-DEPS-SEC · 依赖安全分类与门闩 · 2026-07-24

> Worktree: `ch-deps-sec` · Branch: `xvyimu/ch-deps-sec` · **local only（未 push）**  
> 钉 commit：本文件证据链 HEAD **`19f486d`**（`docs(ops): CH-DEPS-SEC scan classification 2026-07-24`；后续卫生 commit 见文末 Git）  
> Base: `origin/master` @ **`fbcf270`**（`docs(ops): CH-DAY hardening evidence 2026-07-24`）

## 环境

| Item              | Value                                                                   |
| ----------------- | ----------------------------------------------------------------------- |
| Worktree path     | `C:\Users\yuanjia\orca\workspaces\Chronicle\ch-deps-sec`                |
| Base tip at start | `fbcf270`                                                               |
| Tip at finish     | 见文末 Git（扫描证据钉 `19f486d`；可叠加 docs 卫生 commit；无依赖升级） |
| Node              | v24.16.0（engines 声明 22.x；仅 engine warn）                           |
| pnpm              | 11.8.0                                                                  |
| Install           | `pnpm install --frozen-lockfile` → **exit 0**                           |
| next / SRI        | `next@16.2.11` · `eslint-config-next@16.2.11` · `ENABLE_SRI` gate 仍在  |

## P0 继承

| Check               | Result                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| Base / HEAD         | `fbcf270`（含 WAVE-1 next 16.2.11 + CH-DAY 硬化证据）                                                    |
| WAVE-1 证据         | [ch-w1-sri-2026-07-23.md](./ch-w1-sri-2026-07-23.md) 可读                                                |
| CH-DAY 证据         | [ch-day-hardening-2026-07-24.md](./ch-day-hardening-2026-07-24.md) 可读                                  |
| `package.json`      | `next`/`eslint-config-next`/`@next/bundle-analyzer` = 16.2.11；`js-yaml` 钉 `4.3.0`；`@types/node` `^20` |
| CSP / SRI 生产 flip | 未触碰；未放宽 CSP；`ENABLE_SRI` 仍为 owner gate                                                         |

**结论：** 安全基线（next 16.2.11 + SRI 证据）完整继承，无需回补 next 升级。

## P1 扫描（scan-first）

| #   | Command                                                               | Exit  | Notes                                                                                                  |
| --- | --------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------ |
| 1   | `pnpm install --frozen-lockfile`                                      | **0** | 837 packages                                                                                           |
| 2   | `pnpm audit --registry=https://registry.npmjs.org --audit-level=high` | **0** | No known vulnerabilities found                                                                         |
| 3   | `pnpm audit --registry=https://registry.npmjs.org`（全级别）          | **0** | advisories `{}`；info/low/moderate/high/critical 全 **0**                                              |
| 4   | `gh api …/dependabot/alerts` open                                     | **0** | open count = **0**                                                                                     |
| 5   | Dependabot 全量历史                                                   | —     | 18 条（去重 ~9 GHSA）全部 **`state=fixed`** @ 2026-07-23；package 全是 `next`，`first_patched=16.2.11` |
| 6   | `pnpm outdated`                                                       | **1** | 有落后包（预期）；无 audit 命中                                                                        |

**「audit 0」边界：** 本文的 **0** = `pnpm audit` 在 high+（及本波全级别复核）无 known advisory，且 GitHub Dependabot **open** = 0。**不等于** 零安全债：仍有 major 落后包、卫生债 patch/minor、以及未扫到的供应链/配置面风险；只表示当前扫描门闩通过。

**Registry 备注：** 默认镜像（npmmirror）历史已知无 audit bulk endpoint；本波 audit 一律 `registry.npmjs.org`。

### Dependabot 代表 GHSA（已 fixed，代码侧已 patched）

| Severity | GHSA                  | Package | First patched |
| -------- | --------------------- | ------- | ------------- |
| high     | `GHSA-6gpp-xcg3-4w24` | next    | 16.2.11       |
| high     | `GHSA-m99w-x7hq-7vfj` | next    | 16.2.11       |
| high     | `GHSA-89xv-2m56-2m9x` | next    | 16.2.11       |
| high     | `GHSA-p9j2-gv94-2wf4` | next    | 16.2.11       |
| medium   | `GHSA-68g3-v927-f742` | next    | 16.2.11       |
| medium   | `GHSA-4633-3j49-mh5q` | next    | 16.2.11       |
| medium   | `GHSA-4c39-4ccg-62r3` | next    | 16.2.11       |
| medium   | `GHSA-q8wf-6r8g-63ch` | next    | 16.2.11       |
| medium   | `GHSA-955p-x3mx-jcvp` | next    | 16.2.11       |

**处置：** 代码侧 WAVE-1 已升到 16.2.11；GitHub 侧 18 条 alert 已全部 `fixed`（master 已含该 tip）。本波无新增 open alert。

## P2 分类

### 2.1 security-now

| Item                    | Status             | Evidence                  |
| ----------------------- | ------------------ | ------------------------- |
| `pnpm audit` high / all | **0** vulns        | exit 0 · advisories empty |
| Dependabot open         | **0**              | `gh api` open count 0     |
| next 线 CVE             | **done（WAVE-1）** | 16.2.11                   |

**本波 security-now 可合项：无。**

### 2.2 ignore-with-reason（卫生债 · 无 advisory）

| Package                 | Current | Latest | Reason                         |
| ----------------------- | ------- | ------ | ------------------------------ |
| `@tailwindcss/postcss`  | 4.3.1   | 4.3.3  | patch；无 advisory；本波不扫荡 |
| `vitest` / `@vitest/ui` | 4.1.9   | 4.1.10 | patch；716 测已绿，无安全驱动  |
| `prettier`              | 3.9.3   | 3.9.6  | 格式工具；非 runtime           |
| `radix-ui`              | 1.6.1   | 1.6.4  | minor；无 audit 命中           |
| `fuse.js`               | 7.4.2   | 7.5.0  | minor 搜索库；无 audit         |
| `lint-staged`           | 17.0.8  | 17.1.1 | git hook 工具链                |
| `shiki`                 | 4.2.0   | 4.3.1  | 高亮；无 audit                 |
| `tsx`                   | 4.22.4  | 4.23.1 | 脚本 runner                    |
| `rehype-pretty-code`    | 0.14.3  | 0.14.4 | patch                          |

### 2.3 major-later（只列债 · 不硬升）

| Package                     | Current      | Latest / Target | Why deferred                                                                 |
| --------------------------- | ------------ | --------------- | ---------------------------------------------------------------------------- |
| **`js-yaml`**               | **4.3.0**    | **5.2.1**       | 本波约束：major 只列不升；直接依赖钉 4.3.0                                   |
| **`@types/node`**           | **20.19.43** | **26.1.1**      | 本波约束：major 只列不升；engines 仍 22.x 线；types major 可能动 Node API 面 |
| `@testing-library/jest-dom` | 6.10.0       | 7.0.0           | 测试工具 major                                                               |
| `eslint`                    | 9.39.4       | 10.7.0          | ESLint 10 破坏面大                                                           |
| `feed`                      | 5.2.1        | 6.0.0           | RSS 生成 major                                                               |
| `typescript`                | 5.9.3        | 7.0.2           | TS major 不在本波                                                            |

#### major 债细节 · `js-yaml@5`

| Field               | Value                                               |
| ------------------- | --------------------------------------------------- |
| Current pin         | `js-yaml@4.3.0`（direct dep）                       |
| Latest              | `5.2.1`                                             |
| Types               | `@types/js-yaml@4.0.9`（yaml5 若自带 types 需另评） |
| Audit hit this wave | **无**                                              |
| Action              | **不升**；保留 4.3.0 钉；后续独立 breaking 评估     |

#### major 债细节 · `@types/node@26`

| Field               | Value                                                       |
| ------------------- | ----------------------------------------------------------- |
| Current             | `^20` → resolved `20.19.43`                                 |
| Latest              | `26.1.1`                                                    |
| engines             | `node: 22.x`（types 26 对齐 Node 26 面，与 engines 不一致） |
| Audit hit this wave | **无**                                                      |
| Action              | **不升**；继续 `^20` 线直至 engines / runtime 策略同步      |

## P3 最小升级 + 验证

**升级动作：无**（无 security-now patch/minor 可合；major 按红线只列）。

| #   | Command          | Exit  | Notes                                    |
| --- | ---------------- | ----- | ---------------------------------------- |
| 1   | `pnpm typecheck` | **0** | `tsc --noEmit`                           |
| 2   | `pnpm test:sri`  | **0** | 6/6 pass                                 |
| 3   | `pnpm check:seo` | **0** | SEO/content check passed                 |
| 4   | `pnpm test`      | **0** | vitest **95** files / **716** tests pass |

未跑：`build` / `check:sri` 生产 flip / e2e —— 非本波强制；CH-DAY 证据已覆盖同 tip 上的完整门闩。本波红线内未改 CSP、未写密钥、未触其它产品。

## P4 收工

| Item         | Value                                                              |
| ------------ | ------------------------------------------------------------------ |
| 证据文件     | [ch-deps-sec-2026-07-24.md](./ch-deps-sec-2026-07-24.md)（本文件） |
| Local commit | 扫描证据钉 `19f486d` + 可选 docs 卫生（见下 Git）                  |
| `git push`   | **未执行**（红线）                                                 |
| CSP          | 未放宽                                                             |
| 密钥         | 未写入 git                                                         |
| 依赖变更     | **无**（package.json / lockfile 未改）                             |

## 总评

| 维度         | 结果                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| P0 继承      | next 16.2.11 + SRI/CH-DAY 证据完整                                                    |
| scan-first   | audit high/all **0**；Dependabot open **0**（18 历史条全 fixed；边界见上「audit 0」） |
| security-now | **无待修**                                                                            |
| major 债     | `js-yaml@5` · `@types/node@26` 等 **只列不升**（本波不硬升 major）                    |
| 门闩         | typecheck / test:sri / check:seo / test **全绿**                                      |
| 推送         | **未 push**                                                                           |

**总评：绿 · 可 review（local only）· 无依赖 diff**

## 复现

```bash
pnpm install --frozen-lockfile
pnpm audit --registry=https://registry.npmjs.org --audit-level=high
pnpm audit --registry=https://registry.npmjs.org
pnpm outdated
gh api repos/xvyimu/Chronicle/dependabot/alerts --jq '[.[] | select(.state=="open")] | length'
pnpm typecheck
pnpm test:sri
pnpm check:seo
pnpm test
```

## Git

- 扫描证据 commit：`19f486d`（`docs(ops): CH-DEPS-SEC scan classification 2026-07-24`）
- 可叠加：docs 卫生 commit（页眉 / 链接 / 基线；见该 commit message）
- **未** `git push`
- **未** 改 `package.json` / lockfile
