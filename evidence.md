# Evidence · ch-long-verify (W10)

**Branch：** `xvyimu/ch-long-verify`  
**Base：** master **`1f52af9`**（本波 feature 未 ff）  
**详证：** [`docs/ops/ch-long-verify-2026-07-24.md`](./docs/ops/ch-long-verify-2026-07-24.md)  
**Planning：** `D:\orca\.planning\portfolio-stack-policy-2026-07-24\ch-long-wave\`

## 门闩（本 tip · 2026-07-24）

| 命令                                          | exit  | 备注                             |
| --------------------------------------------- | ----- | -------------------------------- |
| `node -v`                                     | **0** | v24.16.0 · engines 22 → **WARN** |
| `pnpm typecheck`                              | **0** |                                  |
| `pnpm test`                                   | **0** | 749 / 98 files                   |
| `pnpm content:build`                          | **0** | snapshot unchanged               |
| `pnpm build`（无 SITE_URL）                   | **1** | 预期                             |
| `cross-env NEXT_PUBLIC_SITE_URL=… pnpm build` | **0** | Node24 WARN                      |
| `pnpm content:check`                          | N/A   | 本 base 无脚本（W7 有）          |

## 本波 feature tips（harvest）

| 模块           | tip                        |
| -------------- | -------------------------- |
| scout          | `020ae1a`                  |
| cwv-home       | `56450f1`                  |
| images-mdx     | `fce2271`                  |
| rsc            | `254c1f6`                  |
| fix-rate-limit | `c9bbd02`                  |
| search         | `abd3f16`                  |
| css            | `4f8e72c`                  |
| content        | `679959a`                  |
| test-flake     | `0108740`                  |
| a11y           | **TBD** `1f52af9`（=base） |

**风险：** feature 未叠入本 tip；RUM/LH/e2e 未重跑；W8 空转。  
**禁：** 未 merge master · 未 push master · 未放宽 CSP。
