# Evidence · W3 ch-images-mdx-residual

- **日期：** 2026-07-24
- **分支：** `xvyimu/ch-images-mdx-residual`
- **基线：** `1f52af9`（master · CH-PERF-001..009）
- **ops：** [`docs/ops/ch-images-mdx-residual-2026-07-24.md`](./docs/ops/ch-images-mdx-residual-2026-07-24.md)

## Diff 摘要

| 文件                                            | 变更                                                                |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| `src/components/blog/ImageZoom.tsx`             | 默认 `quality=70`、`decoding="async"`；导出 DEFAULT_*；quality prop |
| `src/components/blog/ImageZoom.test.tsx`        | 断言 quality/sizes/decoding；覆盖 prop                              |
| `src/components/blog/CodeBlock.tsx`             | 传 `language` 给 copy island                                        |
| `src/components/blog/CodeBlockCopyButton.tsx`   | 状态化 `aria-label`（含语言）                                       |
| `src/components/blog/CodeBlock.test.tsx`        | 按 aria-label 查询；语言标签用例                                    |
| `src/test/mocks/next-image.tsx`                 | 透传 `data-quality` / `data-sizes` / `decoding`                     |
| `docs/ops/ch-images-mdx-residual-2026-07-24.md` | 本波 ops                                                            |

**未动：** home/** · links schema · search · CSP · fuse · MDX 正文 · snapshot

## 门闩

| 命令                 | exit    | 备注                                                      |
| -------------------- | ------- | --------------------------------------------------------- |
| `node -v`            | —       | **v24.16.0**（engines 22.x → pnpm WARN）                  |
| `pnpm typecheck`     | **0**   |                                                           |
| `pnpm test`          | **0**   | **98 files / 750 tests**（+1 vs scout 749；本 wt 增断言） |
| `pnpm check:blur`    | **0**   | projects=6, blogImages=0                                  |
| `pnpm content:build` | skipped | 未改 content/snapshot                                     |
| `pnpm build`         | not run | 推荐 Node 22 CI                                           |

## 风险

正文尚无 `/images/blog` 资产 → quality 体积收益待上图后 lab 再证；复制可见文案未改，a11y 名更完整。
