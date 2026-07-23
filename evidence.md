# Evidence · ch-perf-scout 2026-07-24

| 命令 | 环境 | Exit code | 备注 |
|------|------|-----------|------|
| `pnpm install --frozen-lockfile` | Node v24.16.0 / pnpm 11.8.0 | **0** | WARN engines wanted 22.x |
| `pnpm typecheck` | 同上 | **0** | `tsc --noEmit` |
| `pnpm test` | 同上 | **0** | Vitest 4.1.9 · **716 tests / 95 files** · ~27.5s |
| `pnpm content:build` | 同上 | **0** | `[content:build] unchanged (hash=ec03c7dabca8…)` |
| `pnpm build` | — | **未跑** | scout 优先 typecheck+vitest；prod build 重 |
| `pnpm test:e2e` | — | **未跑** | Playwright + Chromium + prod server 过重 |
| Lighthouse / bundle-budget | — | **未跑** | 引用 `docs/performance-baseline.md` 既有数字 |

**Git：** branch `xvyimu/ch-perf-scout` · tip `83085a7`  
**产物：** 根 `findings.md`（存在但 **`.gitignore` 忽略**）· 可提交 `docs/ops/ch-perf-scout-2026-07-24.md`（全文同步）· `evidence.md`  
**Orca：** `worktree set` comment=`scout done · findings ready` · workspace-status=`in-review` · ok
