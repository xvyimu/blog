# Chronicle · W3 images/MDX residual（ch-images-mdx-residual）

- **日期：** 2026-07-24
- **分支 / wt：** `xvyimu/ch-images-mdx-residual` · Orca checkout `ch-images-mdx-residual`
- **基线 tip：** `1f52af9`（master · CH-PERF-001..009 已合）
- **范围：** MDX 正文图 / CodeBlock* / ImageZoom / blur 读路径再增量；**禁** home hero、links schema、search API、CSP、换 fuse
- **栈锁：** Next16+React19+TW+MDX snapshot · CSP nonce 不放宽

---

## 1) 相对 CH-PERF-005/009 的再增量

`791cf29` 已交付：CodeBlock server shell + copy `useInView` 懒挂载；ImageZoom 显式 width/height/sizes/lazy + blur map。

本 wt **下一刀（可验证）：**

| 点               | 改动                                                            | 路径                                                      |
| ---------------- | --------------------------------------------------------------- | --------------------------------------------------------- |
| 正文图编码器质量 | 默认 `quality=70`（可 prop 覆盖）；thumb + overlay 同质         | `ImageZoom.tsx`                                           |
| 解码策略         | `decoding="async"`（与 W2 home 模式对齐，正文非 LCP）           | `ImageZoom.tsx`                                           |
| 常量导出         | `DEFAULT_WIDTH/HEIGHT/SIZES/QUALITY` 供测与文档                 | `ImageZoom.tsx`                                           |
| 复制 a11y        | `aria-label`：`复制[ lang ]代码` / 成功失败态                   | `CodeBlockCopyButton.tsx` · `CodeBlock.tsx` 传 `language` |
| 测试 mock        | next/image mock 透传 `data-quality` / `data-sizes` / `decoding` | `src/test/mocks/next-image.tsx`                           |

**未改（已够 / 无资产）：**

- blur map：`public/images/blog` 仍空；`pnpm check:blur` projects 全覆盖
- MDX / snapshot / rehype 主题
- home/**（W2 边界）

---

## 2) 门闩（本机 Node 24 → engines 22 WARN）

| 命令                 | exit                                     |
| -------------------- | ---------------------------------------- |
| `pnpm typecheck`     | **0**                                    |
| `pnpm test`（全量）  | **0**（见根 `evidence.md` 条数）         |
| `pnpm check:blur`    | **0**                                    |
| `pnpm content:build` | 未动 MDX/snapshot → **跳过**             |
| `pnpm build`         | 未跑（推荐 Node 22 CI；本机 24 仅 WARN） |

---

## 3) 风险 / 后续

- 正文当前无真实 `/images/blog/*` 资产；quality/sizes 在 lab 上难形成 LCP 对比，收益在「将来上图」与编码体积。
- 复制按钮可见文案仍为「复制 / 已复制 ✓」；可访问名更长，屏幕阅读器优先读 `aria-label`。
- W4+：RSC client 边界、search payload 等不在本边界。

---

## 4) 完成定义对照

- [x] 边界内最小 diff + 测试绿
- [x] typecheck / test exit 写入 evidence
- [x] docs/ops + evidence
- [x] 本地 commit · **不 push master**
- [ ] orca worktree comment DONE · in-review（交付时写）
