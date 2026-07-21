# Chronicle

**GitHub：** [xvyimu/Chronicle](https://github.com/xvyimu/Chronicle)  
**产品 / 目录惯称：** 西江月博客 · `blog`  
**线上：** https://blog-aijiai520.vercel.app  
**许可：** [MIT](./LICENSE)

> 仓库由 `blog` **改名**为 Chronicle。本地路径可仍为 `D:\blog`。

## 它是什么

基于 **Next.js 16 App Router** 的个人博客 + 作品集：MDX 内容、严格 CSP nonce、花园/专题页、Giscus 评论。

## 技术栈

Next.js 16 · React 19 · TypeScript strict · Tailwind CSS v4 · MDX · Shiki · Giscus · fuse.js · Vitest · Playwright · ESLint 9

## 目录（摘要）

```text
content/                 MDX 与内容源
src/app                  路由与页面
src/components           UI
scripts/                 RSS / SEO / 内容检查
docs/                    架构与 ADR
e2e/                     Playwright
```

## 快速开始

```bash
pnpm install
# .env.local — 见 .env.example
pnpm dev                 # http://localhost:3000
pnpm test
pnpm build
pnpm check:seo
pnpm check:docs
```

## 常用命令

| 命令                            | 作用           |
| ------------------------------- | -------------- |
| `pnpm dev`                      | 本地开发       |
| `pnpm build`                    | RSS + 生产构建 |
| `pnpm test` / `pnpm test:e2e`   | 单测 / E2E     |
| `pnpm check:seo`                | SEO 完整性     |
| `pnpm check:production-content` | 生产内容烟测   |

## 许可

MIT — 见 [LICENSE](./LICENSE)。
