# 个人博客 · 项目设计文档

> 日期：2026-06-21
> 技术栈：Next.js 16 + Tailwind CSS v4 + TypeScript
> 部署：Vercel
> 项目路径：`D:/blog`

---

## 一、定位

> 这是一个人的技术博客兼作品集。

不是大而全的内容平台，是一个"这个人做了什么、在想什么"的窗口。

**三个目标**：
1. **写技术文章** — 项目经验、踩坑记录、技术思考
2. **展示作品** — 做过的东西，看得见摸得着
3. **认识一个人** — 关于页、联系方式、踪迹

---

## 二、技术选型

| 层 | 选型 | 理由 |
|---|---|---|
| 框架 | Next.js 16 (App Router) | 已经跑在 16 上了，对 React 最熟悉 |
| 样式 | Tailwind CSS v4 | 项目已有，轻量高效 |
| 内容 | MDX (`next-mdx-remote`) | 文章用 Markdown 写，支持嵌入 React 组件 |
| 代码高亮 | `rehype-pretty-code` + `shiki` | 技术博客必备，主题丰富 |
| 解析增强 | `remark-gfm` | GFM 支持（表格、任务列表、脚注） |
| 正文排版 | `@tailwindcss/typography` | prose 类，文章内容一键美化 |
| 构建模式 | ISR (Incremental Static Regeneration) | Vercel 上每个页面自动转为 serverless function，效果等同 SSG + 保留 API routes |
| 部署 | Vercel | 已熟悉，Git 推送即部署 |
| 域名 | 待定 | 技术博客，建议 `.dev` / `.io` / 个人域名 |

### 2.1 为什么选 next-mdx-remote 而不是 @next/mdx

- `@next/mdx` 需要 MDX 文件放在 `app/` 目录下，内容与展示耦合
- `next-mdx-remote` 从任意路径读取 `.mdx` 文件，内容与展示分离
- 未来可以轻松迁移到从 GitHub / CMS 读取内容

### 2.2 完整依赖清单

**核心（必须）**：

| 包名 | 用途 | 类型 |
|---|---|---|
| `next` | 框架本身 | dependency |
| `react` `react-dom` | UI 库 | dependency |
| `next-mdx-remote` | MDX 内容远程渲染 | dependency |
| `remark-gfm` | GFM 支持（表格/任务列表/删除线） | dependency |
| `rehype-pretty-code` | 代码块语法高亮 | dependency |
| `shiki` | 代码高亮引擎（rehype-pretty-code 依赖） | dependency |
| `@tailwindcss/typography` | Tailwind prose 排版 | devDependency |
| `@tailwindcss/postcss` | Tailwind v4 PostCSS 集成 | devDependency |
| `typescript` `@types/react` `@types/node` | 类型支持 | devDependency |

**增强（推荐）**：

| 包名 | 用途 | 类型 |
|---|---|---|
| `reading-time` | 阅读时长估算 | dependency |
| `@vercel/analytics` | 访问统计 | dependency |
| `feed` | RSS Feed 生成 | dependency |
| `@vercel/og` | OG 图片动态生成 | dependency |
| `gray-matter` | MDX frontmatter 解析（如 next-mdx-remote 方案需手动） | dependency |
| `rehype-slug` | 为标题自动添加 id（TOC 锚点） | dependency |
| `rehype-autolink-headings` | 标题悬停显示链接图标 | dependency |

**giscus（评论系统）**：
- 不需要 npm 包
- 仅需在博客详情页嵌入 `<script>` 或 React 组件
- 依赖：GitHub 公开仓库 + giscus app 安装

---

## 三、目录结构

```
D:/blog/
├── content/                        # 📝 内容层（MDX 源文件）
│   ├── blog/                       #   博客文章
│   │   ├── hello-world.mdx
│   │   └── ...
│   └── about.mdx                   #   关于页面
├── data/                           # 📊 结构化数据（非 MDX）
│   └── projects.json               #   作品列表
├── public/                         # 🖼 静态资源
│   ├── images/
│   │   ├── blog/                   #   文章配图
│   │   ├── projects/               #   作品截图
│   │   └── avatar.jpg              #   头像
│   └── favicon.ico
├── src/
│   ├── app/                        # 📄 页面路由
│   │   ├── layout.tsx              #   根布局 (header + footer)
│   │   ├── not-found.tsx           #   404 页面
│   │   ├── page.tsx                #   首页
│   │   ├── blog/
│   │   │   ├── page.tsx            #   博客列表页
│   │   │   └── [slug]/
│   │   │       └── page.tsx        #   博客详情页（含 giscus）
│   │   ├── projects/
│   │   │   ├── page.tsx            #   作品集列表页
│   │   │   └── [id]/
│   │   │       └── page.tsx        #   作品详情页（可选）
│   │   ├── tags/
│   │   │   └── [tag]/
│   │   │       └── page.tsx        #   标签筛选页
│   │   └── about/
│   │       └── page.tsx            #   关于页
│   ├── components/
│   │   ├── layout/                 # 🏗 布局组件
│   │   │   ├── Header.tsx          #     导航栏
│   │   │   ├── Footer.tsx          #     页脚
│   │   │   └── NavLink.tsx         #     导航链接（active 高亮）
│   │   ├── blog/                   # 📝 博客组件
│   │   │   ├── BlogCard.tsx        #     文章卡片（列表用）
│   │   │   ├── BlogList.tsx        #     文章列表容器
│   │   │   ├── TagBadge.tsx        #     标签徽章
│   │   │   ├── TagLink.tsx         #     可点击的标签链接
│   │   │   ├── MdxContent.tsx      #     MDX 渲染包装器
│   │   │   ├── FeaturedPost.tsx    #     首页置顶文章
│   │   │   ├── PrevNextNav.tsx     #     上一篇/下一篇
│   │   │   └── TableOfContents.tsx #     文章目录
│   │   ├── projects/              # 🛠 作品组件
│   │   │   └── ProjectCard.tsx    #     作品卡片
│   │   ├── comments/              # 💬 评论组件
│   │   │   └── Giscus.tsx         #     giscus 嵌入
│   │   └── ui/                    # 🔧 通用 UI
│   │       ├── Container.tsx      #     内容宽度容器
│   │       ├── ThemeToggle.tsx    #     暗色/亮色切换
│   │       ├── BackToTop.tsx      #     回到顶部
│   │       └── SearchDialog.tsx   #     博客搜索对话框
│   ├── lib/                        # 🔧 工具函数
│   │   ├── posts.ts               #   博客读取 + frontmatter 提取 + 排序 + 筛选
│   │   ├── projects.ts            #   作品集数据读取
│   │   ├── tags.ts                #   标签聚合（统计每标签文章数）
│   │   ├── constants.ts           #   站点元信息（站点名、描述、社交链接）
│   │   └── utils.ts               #   通用工具（日期格式化、slug 化等）
│   └── styles/
│       └── globals.css            #   全局样式 + Tailwind 自定义
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
└── package.json
```

### 设计原则

- **内容与展示分离**：MDX 放 `content/`，组件只管渲染
- **路径即路由**：`app/blog/[slug]` 对应 `content/blog/[slug].mdx`
- **数据与内容分离**：结构化数据（作品集）用 JSON 放 `data/`，叙述性内容用 MDX 放 `content/`
- **渐进增强**：先跑通纯文本 → 再加代码高亮 → 再加交互组件
- **零数据层依赖**：所有内容来自本地文件，不依赖数据库 / CMS / API（评论走 giscus，依赖 GitHub）

---

## 四、内容模型

### 4.1 博客文章 Frontmatter

```yaml
---
title: '用 Next.js 16 搭建个人博客'
description: '从项目初始化到部署上线，一份完整的踩坑记录。'
date: '2026-06-21'
tags:
  - Next.js
  - Tailwind CSS
  - MDX
published: true
featured: false
image: '/images/blog/nextjs-blog-cover.png'
---
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `title` | string | ✅ | 文章标题 |
| `description` | string | ✅ | 一句话摘要，用于列表卡片和 SEO meta |
| `date` | string (YYYY-MM-DD) | ✅ | 发布日期 |
| `tags` | string[] | ❌ | 标签列表，允许空数组 |
| `published` | boolean | ❌ | 默认 `true`。`false` 时构建和开发环境均不展示 |
| `featured` | boolean | ❌ | 默认 `false`。`true` 时出现于首页置顶区 |
| `image` | string | ❌ | 封面图路径，相对 `public/` |

### 4.2 博客内容约定

**文件名与 slug**：

- slug = **去掉日期前缀的文件名**
- 文件名格式：`YYYY-MM-DD-slug-name.mdx`
- 示例：`2026-06-21-building-blog.mdx` → `/blog/building-blog`

理由：日期在文件名中便于文件系统排序，但 URL 里不暴露日期（更干净、永久链接友好）。

> 禁止在文件名中用中文或特殊字符。slug 一律英文/数字/连字符。

**markdown 级别约定**：

- 标题从 `##`（h2）开始——`#`（h1）保留给文章 title（从 frontmatter 取）
- 代码块必须标明语言：` ```tsx `（否则 rehype-pretty-code 不染色）
- 图片优先用相对路径 `./xxx.png`（MDX 文件同级目录），其次 `public/images/blog/`
- 标签大小写不敏感：统一存为 `kebab-case`（`Next.js` → `next-js`，`Tailwind CSS` → `tailwind-css`）

**文章排序**：

- 默认按 `date` 字段倒序（最新在前）
- slug 中的日期前缀只用于文件系统排序和人类识别，程序按 frontmatter 的 `date` 排序

**置顶逻辑**：

- `featured: true` 的文章出现在首页置顶区
- 置顶文章不受数量限制，建议 ≤ 3 篇
- 置顶文章在博客列表页正常出现（不做双重置顶标记）

**草稿 / 未发布**：

- `published: false` 的文章在 `next build` 时不包含
- 开发环境（`next dev`）默认显示草稿，加 `?draft=false` 可隐藏
- 实现方式：`posts.ts` 中 `process.env.NODE_ENV === 'production'` 时过滤 `published !== false`

### 4.3 标签系统

**slug 化规则**：

```
原始标签名          → URL slug
"Next.js"          → "next-js"
"Tailwind CSS"     → "tailwind-css"
"React Native"     → "react-native"
"机器学习"         → "ji-qi-xue-xi"
"CI/CD"           → "cicd"（去除特殊字符）
```

实现函数：`lib/utils.ts` → `slugifyTag(tag: string): string`

**标签页逻辑**：

- `/tags/[tag]` 接收 URL slug，反向匹配回原始标签名
- URL slug → 遍历所有文章的 tags，找到对应 slug 的原始标签名
- 未匹配到任何文章时展示「该标签暂无文章」
- 排序：按标签内文章的日期倒序

**标签云 / 聚合**：

- 标签页（`/tags`）显示所有有文章的标签，附带文章数
- 按文章数降序排列
- `lib/tags.ts` 提供 `getAllTags()` → `{ tag: string, slug: string, count: number }[]`

### 4.4 作品集数据

用 JSON 而非 MDX，原因：
- 作品信息是结构化数据（标题、链接、截图、标签），不需要富文本
- 一个文件维护所有作品，修改成本低
- 如果某个作品需要详细介绍，再加对应的 MDX（通过 `longDescription` 字段引用）

```json
[
  {
    "id": "nav-site",
    "title": "公益API导航站",
    "description": "精心收录 AI 大模型 API 的导航站",
    "tags": ["Next.js", "Supabase", "TypeScript"],
    "url": "https://yuanjia1314.ccwu.cc",
    "github": "https://github.com/yuanjia1314/nav-site",
    "image": "/images/projects/nav-site.png",
    "featured": true,
    "year": 2026
  }
]
```

如需作品详情页 → 路由 `/projects/[id]`，读取对应 MDX `content/projects/[id].mdx`

---

## 五、路由设计

| 路由 | 类型 | 生成方式 | 说明 |
|---|---|---|---|
| `/` | SSG | 静态 | 首页：hero + 置顶文章 + 最新文章 + 精选作品 |
| `/blog` | SSG | 静态 | 博客列表：文章卡片网格，按日期倒序 |
| `/blog/[slug]` | SSG | `generateStaticParams` | 博客详情：MDX 渲染 + TOC + giscus |
| `/tags` | SSG | 静态 | 标签云：所有标签聚合展示 |
| `/tags/[tag]` | SSG | `generateStaticParams` | 标签筛选：该标签下所有文章列表 |
| `/projects` | SSG | 静态 | 作品集：网格展示，按年份倒序 |
| `/projects/[id]` | SSG | `generateStaticParams` | 作品详情：MDX 渲染（可选） |
| `/about` | SSG | 静态 | 关于页面 |
| `/*` | SSG | 通配 | 404 页面 |

所有 SSG 页面在 `next build` 时预生成。动态路由参数通过 `generateStaticParams` 导出。

---

## 六、设计体系

### 6.1 视觉风格

**关键词**：干净、克制、可读、技术感

```
主色：#2563eb → #3b82f6    蓝色系（经典技术博客）
强调色：#f59e0b            橙色（标签、高亮点缀）
亮色背景：#ffffff / #fafafa
暗色背景：#0f172a / #1e293b (slate)
正文字色：#1a1a2e（亮）/ #f1f5f9（暗）
代码背景：#1e293b
```

### 6.2 字体

**西文**：使用系统字体栈，无外部加载（性能优先）
- 正文：`-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', system-ui, sans-serif`
- 代码：`'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace`

**理由**：
- 不引入 Google Fonts — 减少外部请求、避免 FOUT、国内访问稳定（GFW 问题）
- Windows 自带 Segoe UI，macOS 自带 SF Pro，Linux 有 Noto
- JetBrains Mono 如果本地未安装，fallback 到 Consolas（Windows 自带等宽字体）

**字号阶梯**：

| 级别 | 字号 | 行高 | 字重 |
|---|---|---|---|
| 正文 (body) | 1rem (16px) | 1.8 | 400 |
| h1 | 2rem (32px) | 1.3 | 700 |
| h2 | 1.5rem (24px) | 1.4 | 600 |
| h3 | 1.25rem (20px) | 1.4 | 600 |
| h4 | 1.125rem (18px) | 1.4 | 600 |
| 小号 (caption) | 0.875rem (14px) | 1.5 | 400 |
| 代码 (code) | 0.875rem (14px) | 1.7 | 400 |

### 6.3 暗色模式

- 基于 Tailwind CSS v4 的 `dark:` 变体
- 默认跟随 `prefers-color-scheme`（系统设置）
- `ThemeToggle` 手动切换（状态持久化到 localStorage）
- 三态：系统 / 亮色 / 暗色

### 6.4 响应式断点

| 断点 | 宽度 | 布局行为 |
|---|---|---|
| `sm` | ≥640px | 单列，紧凑边距 |
| `md` | ≥768px | 博客列表 → 两列网格 |
| `lg` | ≥1024px | 文章页显示固定 TOC（右侧） |
| `xl` | ≥1280px | 页面宽度达到最大限制 |

### 6.5 FOUC 防护（主题闪烁）

暗色模式的核心问题：用户手动切了暗色，但页面在 React 加载完成前用亮色渲染，会闪一下。

**方案**：在 `<head>` 中嵌内联 `<script>`，在 React 加载前读取 `localStorage` 并设置 `<html>` 类名：

```html
<!-- 放在 layout.tsx 的 <head> 中 -->
<script dangerouslySetInnerHTML={{
  __html: `
    (function() {
      var theme = localStorage.getItem('theme');
      if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      }
    })();
  `
}} />
```

这段代码零依赖、零网络请求、执行时间 < 0.1ms，在浏览器解析 HTML 的同步阶段执行，React 加载前就已经设置好了。

### 6.6 文章页布局（桌面）

```
┌─────────────────────────────────────────────────┐
│  Header                                          │
├─────────────────────────────────────────────────┤
│                                                  │
│   ┌─────────────────────────┐   ┌──────────┐    │
│   │  文章标题                │   │ 目录     │    │
│   │  日期 · 阅读时长 · 标签   │   │ ──────── │    │
│   │  ─────────────────────── │   │ ## 引言  │    │
│   │                         │   │ ## 实现  │    │
│   │  ## 正文...             │   │ ### 步骤1 │    │
│   │  `code block`           │   │ ## 总结  │    │
│   │  ...                    │   │          │    │
│   │  ─────────────────────── │   └──────────┘    │
│   │  ← 上一篇  │  下一篇 →  │                    │
│   │  ─────────────────────── │                   │
│   │  💬 giscus 评论          │                    │
│   └─────────────────────────┘                    │
│                                                  │
├─────────────────────────────────────────────────┤
│  Footer                                          │
└─────────────────────────────────────────────────┘
```

- 文章正文区：`max-w-[720px]`
- TOC：右侧固定，`sticky top-24`，跟随滚动高亮当前章节
- 移动端 TOC 折叠到汉堡菜单或隐藏

### 6.7 首页布局

```
┌──────────────────────────────────────────────┐
│  Header                                       │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────┐      │
│  │  🟢 [头像或字母 Logo]              │      │
│  │  名字 / 一句话                     │      │
│  │  「写代码，偶尔写写东西。」           │      │
│  │  GitHub · Twitter · Email          │      │
│  └────────────────────────────────────┘      │
│                                              │
│  📌 置顶文章                                 │
│  ┌────────────────────────────────────┐      │
│  │ 标题  │ 日期          │ 标签        │      │
│  │ 摘要...                              │      │
│  └────────────────────────────────────┘      │
│  ┌────────────────────────────────────┐      │
│  │ ...置顶第二篇                       │      │
│  └────────────────────────────────────┘      │
│                                              │
│  ─── 最新文章 ───                              │
│  ┌──────┐ ┌──────┐ ┌──────┐                 │
│  │ Card │ │ Card │ │ Card │  3 列网格        │
│  └──────┘ └──────┘ └──────┘                 │
│  ┌──────┐ ┌──────┐ ┌──────┐                 │
│  │ Card │ │ Card │ │      │  ← 查看全部     │
│  └──────┘ └──────┘                          │
│                                              │
│  ─── 精选作品 ───                              │
│  ┌────────────┐ ┌────────────┐               │
│  │ 截图 + 标题  │ 截图 + 标题  │               │
│  │ 一句话       │ 一句话       │               │
│  └────────────┘ └────────────┘               │
│                                              │
├──────────────────────────────────────────────┤
│  Footer                                       │
└──────────────────────────────────────────────┘
```

---

## 七、组件计划（完整版）

### Phase 1 — 骨架（P0，必须）

| 组件 | 文件 | 说明 |
|---|---|---|
| `Container` | `src/components/ui/Container.tsx` | 内容宽度容器，居中 + max-width |
| `Header` | `src/components/layout/Header.tsx` | 导航栏：Logo + 博客/作品集/关于 + 主题切换 |
| `Footer` | `src/components/layout/Footer.tsx` | 版权 + 社交链接（GitHub/Twitter/Email） |
| `NavLink` | `src/components/layout/NavLink.tsx` | 导航链接，自动高亮当前路由 |
| `BlogCard` | `src/components/blog/BlogCard.tsx` | 文章卡片：标题 + 摘要 + 日期 + 标签 |
| `BlogList` | `src/components/blog/BlogList.tsx` | 文章列表容器（响应式网格） |
| `TagBadge` | `src/components/blog/TagBadge.tsx` | 标签徽章（纯展示） |
| `TagLink` | `src/components/blog/TagLink.tsx` | 可点击标签链接 → `/tags/[slug]` |
| `MdxContent` | `src/components/blog/MdxContent.tsx` | MDX 渲染包装器（配置 rehype/remark 插件） |
| `ProjectCard` | `src/components/projects/ProjectCard.tsx` | 作品卡片：截图 + 标题 + 标签 |
| `not-found` | `src/app/not-found.tsx` | 404 页面 |

### Phase 2 — 增强（P1，重要）

| 组件 | 文件 | 说明 |
|---|---|---|
| `ThemeToggle` | `src/components/ui/ThemeToggle.tsx` | 暗色/亮色切换（三态：系统/亮/暗） |
| `FeaturedPost` | `src/components/blog/FeaturedPost.tsx` | 首页置顶文章展示（大卡片） |
| `PrevNextNav` | `src/components/blog/PrevNextNav.tsx` | 文章底部的上一篇/下一篇 |
| `TableOfContents` | `src/components/blog/TableOfContents.tsx` | 文章目录（桌面右侧固定 + 高亮） |
| `Giscus` | `src/components/comments/Giscus.tsx` | giscus 评论嵌入组件 |
| `Pagination` | `src/components/blog/Pagination.tsx` | 分页组件（博客列表 > 12 篇时） |

### Phase 3 — 锦上添花（P2，可选）

| 组件 | 文件 | 说明 |
|---|---|---|
| `BackToTop` | `src/components/ui/BackToTop.tsx` | 回到顶部浮动按钮 |
| `SearchDialog` | `src/components/ui/SearchDialog.tsx` | ⌘K 搜索对话框（前端全文检索） |
| `ReadingTime` | 集成到 BlogCard 中 | 阅读时长显示（用 reading-time 库） |

---

## 八、颜色与排版完整规格

### 8.1 Tailwind CSS v4 自定义配置

Tailwind CSS v4 用 `@theme` 指令在 CSS 中定义主题变量，不再需要 `tailwind.config.ts`：

```css
/* src/styles/globals.css */
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  /* 品牌色 */
  --color-primary: #2563eb;
  --color-primary-light: #3b82f6;
  --color-accent: #f59e0b;

  /* 字体 */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;

  /* 阅读宽度 */
  --width-prose: 720px;

  /* 过渡 */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 8.2 暗色模式变量

```css
/* 亮色模式（默认） */
:root {
  --color-bg: #ffffff;
  --color-bg-secondary: #fafafa;
  --color-bg-code: #1e293b;
  --color-text: #1a1a2e;
  --color-text-secondary: #64748b;
  --color-text-muted: #94a3b8;
}

/* 暗色模式 */
.dark {
  --color-bg: #0f172a;
  --color-bg-secondary: #1e293b;
  --color-text: #f1f5f9;
  --color-text-secondary: #94a3b8;
}
```

---

## 九、评论系统（giscus）

### 9.1 前提条件

- 博客源码托管在 **GitHub 公开仓库**
- 在该仓库上安装 [giscus GitHub App](https://github.com/apps/giscus)
- 仓库 `discussions` 功能已开启（Settings → General → Discussions）

### 9.2 配置参数

```tsx
// src/components/comments/Giscus.tsx
const GISCUS_CONFIG = {
  repo: 'yuanjia1314/blog',           // 替换为实际仓库
  repoId: '',                          // 通过 giscus.app 获取
  category: 'Announcements',           // discussions 分类
  categoryId: '',                      // 通过 giscus.app 获取
  mapping: 'pathname',                 // 按页面路径匹配 discussion
  reactionsEnabled: '1',
  emitMetadata: '0',
  inputPosition: 'bottom',
  theme: 'preferred_color_scheme',     // 跟随系统/站点主题
  lang: 'zh-CN',
}
```

### 9.3 主题同步

- giscus 的 `theme` 设为 `preferred_color_scheme` 跟随系统
- 若站点有手动主题切换，需通过 giscus `setConfig` API 同步主题
- 在 `ThemeToggle` 切换时同步通知 giscus

---

## 十、分析与统计

**选型：Vercel Analytics**

理由：
- 已用 Vercel 部署，一行代码集成
- 轻量、隐私友好、不拖慢页面
- 不依赖第三方 Cookie

实现：
```tsx
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <>
      {children}
      <Analytics />
    </>
  )
}
```

---

## 十一、SEO 策略

### 11.1 每页面 Meta

```tsx
// 每个 page.tsx 的 generateMetadata()
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug)
  return {
    title: `${post.title} | 博客名`,
    description: post.description,
    keywords: post.tags?.join(', '),
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      images: post.image ? [{ url: post.image }] : [],
    },
  }
}
```

### 11.2 RSS Feed

库：`feed`（npm）

实现：
- 在构建时（`next build` 前）运行 `scripts/generate-rss.ts`
- 输出 `/public/feed.xml` 和 `/public/feed.json`
- 自动读取最新的 20 篇文章

### 11.3 Sitemap

- 使用 Next.js 内置的 `sitemap.ts`（App Router 原生支持）
- 自动包含所有 blog posts、projects pages、tags pages

### 11.4 OG 图片

Phase 2 实现：
- 用 `@vercel/og` + `satori` 生成动态 OG 图片
- 默认使用 `/api/og` 端点
- 每篇文章自动生成带标题+日期的 OG 图

---

## 十二、部署

```
Platform:     Vercel
Framework:    Next.js 16 (auto-detected)
Build cmd:    next build
Output dir:   .next
Install cmd:  pnpm install

域名（待定）：
  优先级：个人域名 > xxx.dev > Vercel 默认域名

环境变量（无敏感信息，无需设置）：
  NEXT_PUBLIC_SITE_URL  — 站点完整 URL
  NEXT_PUBLIC_GISCUS_REPO — giscus 仓库名
```

### 12.1 构建前钩子

RSS 生成需要在 `next build` 之前运行：

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "node scripts/generate-rss.mjs && next build",
    "start": "next start",
    "lint": "eslint"
  }
}
```

---

## 十三、CI 流程

GitHub Actions：每次 push 到 `main` 或 PR 时自动运行。

```yaml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm build
```

三个关卡：`lint` → `build`（type-check 由 tsconfig 内置）。任一失败则阻断合并。

---

## 十四、开发路线（修订版）

### Phase 1 — 骨架

1. **项目初始化** — 基础依赖安装 + 验证 dev/build 正常
2. **布局** — Header + Footer + Container + NavLink
3. **lib 层** — `posts.ts`（读取MDX+frontmatter+排序+过滤）+ `projects.ts` + `tags.ts` + `constants.ts` + `utils.ts`
4. **博客列表** — `/blog` 页面 + BlogCard + TagBadge/TagLink + 响应式
5. **博客详情** — `/blog/[slug]` 页面 + MdxContent + 代码高亮
6. **标签系统** — `/tags` 聚合页 + `/tags/[tag]` 筛选页
7. **作品集** — `/projects` 页面 + ProjectCard
8. **首页** — Hero + 最新文章 + 精选作品
9. **关于页** — `/about` 页面（MDX 渲染）
10. **404** — not-found.tsx

### Phase 2 — 丰富

1. 暗色模式切换
2. 置顶文章区域
3. 上一篇/下一篇导航
4. 文章目录（TOC）
5. giscus 评论集成
6. Vercel Analytics
7. Tailwind prose 排版微调
8. 响应式验收 + 细节打磨

### Phase 3 — 发布

1. 域名购买 + 配置
2. Vercel 项目创建 + 部署
3. GitHub 仓库创建 + giscus 配置
4. RSS Feed 生成
5. Sitemap + OG 图片
6. SEO 全面检查
7. 写第一篇博客

---

## 十五、待定事项

- [ ] 域名 —— 不急着定，先本地开发
- [ ] 首篇文章写什么 —— 等 Phase 1 跑起来再说
- [ ] 是否需要 `/projects/[id]` 详情页 —— 看作品数量，≤5 个作品不需要
- [ ] 是否需要搜索 —— Phase 3 末评估

---

## 附录 A：MDX 代码块渲染管线

```
.mdx 文件
  → gray-matter (提取 frontmatter)
  → next-mdx-remote (编译 MDX → JSX)
    → remark-gfm (GFM 扩展)
    → rehype-pretty-code (代码高亮)
    → rehype-slug (标题 id)
    → rehype-autolink-headings (标题链接)
  → MdxContent 组件 (渲染)
```

## 附录 B：标签处理流程

```
用户写 frontmatter 时：
  tags: [Next.js, Tailwind CSS]

写入数据库/文件：
  原始标签：["Next.js", "Tailwind CSS"]

URL 生成：
  "Next.js" → slugifyTag() → "next-js"
  URL: /tags/next-js

反向匹配：
  "next-js" → 遍历所有文章 tags → 找到 "Next.js"
  页面显示标签名 "Next.js"

排序：
  标签云页按文章数降序
  标签文章页按日期降序
```

## 附录 C：文件名与 slug 示例

| 文件名 | slug | 路由 |
|---|---|---|
| `2026-06-21-building-blog.mdx` | `building-blog` | `/blog/building-blog` |
| `2026-07-03-react-performance.mdx` | `react-performance` | `/blog/react-performance` |
| `2026-08-15-why-rust.mdx` | `why-rust` | `/blog/why-rust` |
