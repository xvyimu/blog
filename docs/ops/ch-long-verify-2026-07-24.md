# W10 verify · ch-long-verify · 2026-07-24

> Worktree：`ch-long-verify` · Branch：`xvyimu/ch-long-verify`  
> Base / 本 tip 起点：master **`1f52af9`**（本波 feature **未** ff 进 master）  
> Planning SSOT：`D:\orca\.planning\portfolio-stack-policy-2026-07-24\ch-long-wave\`  
> 范围：**只读验证 + docs/ops** · 未 merge · 未放宽 CSP · 未改业务代码

---

## 1. 本波 feature tips（harvest / WEEK-BACKLOG）

来源：`WEEK-BACKLOG.md` + `W*-HARVEST-*.md` / `FIX-HARVEST-rate-limit-docs.md` · **勿猜**。

| #   | wt / 主题             | branch                            | tip                              | 状态                   |
| --- | --------------------- | --------------------------------- | -------------------------------- | ---------------------- |
| W1  | scout                 | `xvyimu/ch-scout-lw`              | **`020ae1a`**                    | DONE                   |
| W2  | cwv-home              | `xvyimu/ch-cwv-home`              | **`56450f1`**                    | DONE                   |
| W3  | images-mdx residual   | `xvyimu/ch-images-mdx-residual`   | **`fce2271`**                    | DONE                   |
| W4  | rsc client boundary   | `xvyimu/ch-rsc-client-boundary`   | **`254c1f6`**                    | DONE                   |
| FIX | rate-limit docs       | `xvyimu/ch-fix-rate-limit-docs`   | **`c9bbd02`**                    | DONE                   |
| W5  | search API payload    | `xvyimu/ch-search-api-payload`    | **`abd3f16`**                    | DONE                   |
| W6  | css route split       | `xvyimu/ch-css-route-split`       | **`4f8e72c`**                    | DONE                   |
| W7  | content pipeline docs | `xvyimu/ch-content-pipeline-docs` | **`679959a`**                    | DONE                   |
| W8  | a11y smoke            | `xvyimu/ch-a11y-smoke`            | **`1f52af9`**（=base · **TBD**） | live · 空转 / 最后通牒 |
| W9  | test flake guard      | `xvyimu/ch-test-flake-guard`      | **`0108740`**                    | DONE · origin          |
| W10 | long verify           | `xvyimu/ch-long-verify`           | 本支 tip（docs）                 | 本文件                 |

**说明：** W8 tip 仍等于 master base；无 a11y 增量可汇总。W11 INTEGRATE 由总控写，**不**在本 wt merge。

---

## 2. 门闩表（本 checkout @ `1f52af9` 干净 tip）

| 命令                                                                        | exit    | 备注                                             |
| --------------------------------------------------------------------------- | ------- | ------------------------------------------------ |
| `node -v`                                                                   | **0**   | **v24.16.0** · engines `22.x` → **WARN**         |
| `pnpm typecheck`                                                            | **0**   | `tsc --noEmit` · engine WARN 同上                |
| `pnpm test`                                                                 | **0**   | **749** passed / **98** files · ~20s             |
| `pnpm content:build`                                                        | **0**   | `unchanged (hash=ec03c7dabca8…)` · 工作区无 diff |
| `pnpm build`（无 env）                                                      | **1**   | 缺 `NEXT_PUBLIC_SITE_URL`（预期硬失败）          |
| `pnpm exec cross-env NEXT_PUBLIC_SITE_URL=https://incca.ccwu.cc pnpm build` | **0**   | Next **16.2.11** · 108 routes · Node24 **WARN**  |
| `pnpm content:check`                                                        | **N/A** | 脚本在 **W7** tip；**本 base 无**该 script       |

---

## 3. 残留风险（一句）

本波 feature 未叠入本 tip：门闩仅证明 **master `1f52af9`** 绿；W8 a11y 仍 base；RUM/LH/e2e 全量未重跑；生产 build 须 Node **22** + `NEXT_PUBLIC_SITE_URL`。

---

## 4. 禁项核对

| 项                | 结果                  |
| ----------------- | --------------------- |
| merge / ff master | **未做**              |
| push master       | **未做**              |
| CSP 放宽          | **未做**              |
| 业务大重构        | **未做**（docs only） |
