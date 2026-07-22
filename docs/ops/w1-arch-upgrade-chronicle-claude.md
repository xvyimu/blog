# W1 · Chronicle · Claude 实现报告

| Field                | Value                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------- |
| Agent                | **claude**（solo）                                                                            |
| Wave                 | **W1** · `portfolio-arch-upgrade-2026h2`                                                      |
| Product              | Chronicle                                                                                     |
| Worktree（绝对路径） | `C:\Users\yuanjia\orca\workspaces\Chronicle\w1-ch-claude`                                     |
| Branch               | `xvyimu/w1-ch-claude`                                                                         |
| Tip（开工 / HEAD）   | `24506a2997ddc070ec7b68b5963f699dd761d0d3` · `24506a2` docs: wave8 link check:sri / test:sri… |
| 报告路径             | `docs/ops/w1-arch-upgrade-chronicle-claude.md`（本文件）                                      |
| 共享题单             | `D:\orca\.planning\portfolio-arch-upgrade-2026h2\prompts\w1-shared.md` · `w1-ch.md`           |
| 分仓卡               | `repos/ch.md` · 横切 `crosscut.md`                                                            |

---

## 1. 做了什么

### 1.1 stack-matrix

- 新：[`docs/ops/stack-matrix-2026-07.md`](./stack-matrix-2026-07.md)
- 覆盖：Next **16.2.9** / React **19.2.4** / Node engines **22.x** / CI Node 22 / MDX（next-mdx-remote 6）/ Tailwind **4.3.x** / SRI 门闩 / pnpm **11.8** / audit 纪律
- 当前→目标→本波已做 表齐；明确不 bump 主框架（W1 硬化+文档）

### 1.2 SRI 回归 + audit high

| #   | Command                                                               | Exit  | Result                                       |
| --- | --------------------------------------------------------------------- | ----- | -------------------------------------------- |
| 1   | `pnpm test:sri`                                                       | **0** | 6 pass · 0 fail                              |
| 2   | `pnpm check:sri-smoke`                                                | **0** | offline gate PASS；无 `.next` skip artifacts |
| 3   | `pnpm audit --registry=https://registry.npmjs.org --audit-level=high` | **0** | `No known vulnerabilities found`             |

未改 `next.config` SRI 默认；未触碰生产 / Vercel `ENABLE_SRI`。

### 1.3 内容 IA 草案

- 新：[`docs/ops/content-ia-draft-2026-07.md`](./content-ia-draft-2026-07.md)
- 专题 / 花园 / 标签·分类·专题契约 / 路由表 / 作者 frontmatter / W2 演进点
- **无** App Router 或 MDX 大改

### 1.4 可选检查

| #   | Command                            | Exit  | Result |
| --- | ---------------------------------- | ----- | ------ |
| 4   | `pnpm typecheck`（`tsc --noEmit`） | **0** | 全绿   |

---

## 2. 没做什么（题单 + 共享禁止）

| 项                                | 原因                       |
| --------------------------------- | -------------------------- |
| 换 Astro / Vue / 其它框架         | 红线 · 半年不做            |
| 生产 `ENABLE_SRI` flip            | W1 禁 · 人 gate            |
| 代登录 GSC / Bing                 | blocked-human · 非工程可关 |
| `git push` / 合 master / 开 PR    | 总控 · 用户要求 no push    |
| stack rewrite / monorepo 合并     | 禁止                       |
| W2 IA 落地（显式 series slug 等） | 留给 W2                    |
| 性能预算表 / RUM 扩               | W3                         |
| 主依赖大 bump                     | W1 只矩阵+回归             |

---

## 3. 验证摘录

### 3.1 `pnpm test:sri`

```text
✔ extracts only next-static script and stylesheet link tags
✔ expect on passes when at least one sha384 integrity present
✔ expect on fails when no integrity
✔ expect off passes with zero integrity attrs
✔ expect off fails when integrity present
✔ absolute next static urls are in scope
ℹ tests 6
ℹ pass 6
ℹ fail 0
TEST_SRI_EXIT=0
```

### 3.2 `pnpm check:sri-smoke`

```text
Chronicle SRI smoke
mode: offline
PASS  next-config-sri-gate: ENABLE_SRI=1 gate + sha384 + sriExperiment present
PASS  local-build-artifacts: skip (no .next); offline gate-only mode
SRI_SMOKE_EXIT=0
```

### 3.3 audit

```text
No known vulnerabilities found
AUDIT_EXIT=0
```

（权威 registry：`https://registry.npmjs.org`；npmmirror 无 audit endpoint 时勿当漏洞。）

### 3.4 环境注记

| 项                       | 值                                          |
| ------------------------ | ------------------------------------------- |
| 本机 Node                | **v24.16.0** → engines `22.x` **WARN only** |
| pnpm                     | **11.8.0**                                  |
| CI 目标 Node             | **22**（`ci.yml`）                          |
| 工作树状态（报告撰写前） | clean @ `24506a2`；本波仅新增 docs          |

---

## 4. 变更文件清单（相对 tip `24506a2`）

```text
docs/ops/stack-matrix-2026-07.md           (new)
docs/ops/content-ia-draft-2026-07.md       (new)
docs/ops/w1-arch-upgrade-chronicle-claude.md (new · 本报告)
```

无 `src/` / `package.json` / lock 变更。

---

## 5. 验收对照（w1-ch.md）

| 验收项                     | 状态                             |
| -------------------------- | -------------------------------- |
| `stack-matrix` 落盘        | ✓                                |
| SRI 命令 exit 0            | ✓ `test:sri` · `check:sri-smoke` |
| audit high = 0             | ✓（npmjs）                       |
| IA 草案存在                | ✓                                |
| 报告在本 worktree          | ✓                                |
| 无 push / 无 stack rewrite | ✓                                |

---

## 6. 总控合入提示

- 分支：`xvyimu/w1-ch-claude`
- 仅 docs 三文件；与 wave7/8 SRI 资产正交
- 可本地 commit；**本 agent 不 push** · dirty/缺 commit 由总控补
- 建议 commit message（若总控代提）：

```text
docs(ops): W1 arch upgrade — stack-matrix, content IA draft, report
```
