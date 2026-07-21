# 内容维护与发布流程

这份文档面向两类协作者：

- 需要新增或修改博客内容的人
- 需要维护作品集、站点信息和发布链路的人

## 1. 内容入口一览

当前项目的主要内容源有四类：

| 位置               | 类型 | 用途               |
| ------------------ | ---- | ------------------ |
| content/blog/*.mdx | MDX  | 博客文章           |
| content/about.mdx  | MDX  | 关于页             |
| data/projects.json | JSON | 作品集结构化数据   |
| data/links.json    | JSON | 导航收藏结构化数据 |

## 2. 新增博客文章

### 文件命名建议

建议采用：

```
YYYY-MM-主题名.mdx
```

例如：

```
2026-06-cloudflare-workers-guide.mdx
```

当前代码中的 slug 规则会去掉 YYYY-MM- 前缀，再去掉 .mdx 后缀，所以最终链接会是：

```
/blog/cloudflare-workers-guide
```

### frontmatter 最低要求

根据 src/lib/schemas/post-frontmatter.ts 当前 schema，这三个字段属于必填：

- title
- description
- date

推荐完整示例：

```mdx
---
title: Cloudflare Workers 实践笔记
description: 从部署方式到常见坑位的一次整理
date: 2026-06-23
updatedAt: 2026-06-28
category: 云服务
series: Cloudflare 实战
tags:
  - Cloudflare
  - Workers
published: true
featured: true
image: /images/blog/cloudflare-workers-cover.jpg
source: https://github.com/yuanjia1314/domain-check
license: MIT
---

正文从这里开始。
```

### 字段说明

| 字段        | 类型     | 是否必填 | 说明                                                 |
| ----------- | -------- | -------- | ---------------------------------------------------- |
| title       | string   | 是       | 文章标题                                             |
| description | string   | 是       | 摘要，用于列表与 SEO                                 |
| date        | string   | 是       | 必须是有效的 YYYY-MM-DD 日期                         |
| updatedAt   | string   | 否       | 文章有实质更新时填写，格式 YYYY-MM-DD，不应早于 date |
| tags        | string[] | 否       | 标签列表，默认空数组                                 |
| category    | string   | 否       | 显式分类；不填时会根据标签映射自动推断               |
| series      | string   | 否       | 系列名，用于文章页展示和相关文章排序                 |
| seriesOrder | number   | 否       | 系列内顺序，必须是正整数                             |
| published   | boolean  | 否       | false 时表示草稿                                     |
| featured    | boolean  | 否       | true 时可在首页等位置突出展示                        |
| image       | string   | 否       | `http(s)://` URL 或 `/` 开头的 public 路径           |
| source      | string   | 否       | 参考项目、原始资料或来源说明                         |
| license     | string   | 否       | 内容或示例代码许可，例如 MIT、CC-BY-4.0、Original    |

### 自动生成的内容索引

构建期会从 MDX 正文自动推导这些派生信息：

- `excerpt`：用于搜索结果和内容发现的正文摘录
- `headings`：文章内 h2/h3 小标题列表
- `searchText`：融合标题、摘要、标签、分类、系列、小标题和正文摘录的本地搜索文本
- 相关文章：根据共享标签、分类和系列自动排序

因此新增文章时不需要手写这些字段，但要保证标题层级清晰、标签命名稳定。

### 内容快照（生产读取）

生产默认从 **`generated/content-snapshot/`** 读文章与花园图（`CONTENT_BACKEND=snapshot`），不再在请求路径扫 MDX。

修改 `content/blog/*.mdx` 后必须：

```bash
pnpm content:build
# 将 generated/content-snapshot/* 的 diff 一并提交（与 public/feed.* 同模式）
```

- 开发默认 `CONTENT_BACKEND=fs`：改 MDX 即时生效，无需每次重建快照。
- 快照只含 **published !== false** 的文章；草稿不会进入生产快照。
- 回滚：`CONTENT_BACKEND=fs` 或非 production `NODE_ENV`。
- CI 会在 quality job 中重跑 `content:build` 并对 `generated/content-snapshot` 做 `git diff --exit-code`。

### 草稿机制

当前逻辑是：

- 开发环境：草稿默认可见，便于预览
- 生产环境：published: false 的文章会被过滤掉

因此发布前要特别检查，避免把计划中的草稿误改为 published: true。

## 3. 修改关于页

关于页内容来自：

- content/about.mdx

适合放：

- 个人介绍
- 技术方向
- 联系方式
- 工作经历摘要
- 站点说明

如果这里新增了社交信息或身份介绍，建议同时回头检查：

- src/lib/site.ts（站点配置单一来源）

这是站点名称、描述、作者、评论仓库等信息的主要影响点。

## 4. 维护作品集

作品集基础数据存放在：

- data/projects.json

GitHub 仓库身份（2026-07-21 改名后）：

| 作品 id         | GitHub                                 |
| --------------- | -------------------------------------- |
| `chronicle`     | https://github.com/xvyimu/Chronicle    |
| `chrono-portal` | https://github.com/xvyimu/ChronoPortal |
| `chrono-relay`  | https://github.com/xvyimu/ChronoRelay  |

`id` 变化会改变 `/projects/[id]` 路由；封面图路径（`/images/projects/*.png`）可保持文件名不变。

根据 src/lib/projects.ts 当前校验逻辑，可用字段包括：

| 字段        | 类型     | 是否必填 | 说明              |
| ----------- | -------- | -------- | ----------------- |
| id          | string   | 是       | 唯一标识          |
| title       | string   | 是       | 项目名称          |
| description | string   | 是       | 简介              |
| tags        | string[] | 是       | 技术标签          |
| url         | string   | 否       | 在线地址          |
| github      | string   | 否       | 仓库地址          |
| image       | string   | 否       | public 封面图路径 |
| featured    | boolean  | 是       | 是否精选          |
| year        | number   | 是       | 项目年份          |

### 适合 JSON 的内容

- 卡片标题
- 简介
- 标签
- 跳转链接
- 封面地址
- 是否精选

### 不适合 JSON 的内容

- 很长的案例复盘
- 多段排版说明
- 富文本内容
- 图片和正文交错的项目叙述

如果后续项目介绍越来越长，建议增补 content/projects/ 目录，让 JSON 只保留摘要与索引字段。

## 5. 维护导航收藏

导航收藏基础数据存放在：

- data/links.json

根据 src/lib/links.ts 当前校验逻辑，每个分类包含：

| 字段        | 类型       | 是否必填 | 说明         |
| ----------- | ---------- | -------- | ------------ |
| id          | string     | 是       | 唯一分类标识 |
| title       | string     | 是       | 分类展示名   |
| description | string     | 是       | 分类说明     |
| items       | LinkItem[] | 是       | 链接列表     |

每个链接条目包含：

| 字段        | 类型     | 是否必填 | 说明                                 |
| ----------- | -------- | -------- | ------------------------------------ |
| title       | string   | 是       | 链接名称                             |
| url         | string   | 是       | 官网或原始页面 URL                   |
| description | string   | 是       | 收藏理由或用途说明                   |
| tags        | string[] | 否       | 1-6 个短标签，用于卡片 metadata 展示 |
| official    | boolean  | 否       | 是否为官网或原始权威入口             |
| priority    | string   | 否       | `primary`、`reference`、`watchlist`  |
| useCase     | string   | 否       | 使用场景或收藏理由，建议一句话       |
| lastChecked | string   | 否       | 最近人工核对日期，格式 YYYY-MM-DD    |

维护规则：

- VPS、云服务、工具类收藏优先放官网链接
- 不写 aff、ref、utm、coupon、partner 等追踪参数
- 同一个 URL 不重复收录
- `tags` 只写稳定语义，例如 `vps`、`open-source`、`template`，不要写临时营销词
- `priority` 用于运营优先级：`primary` 表示重点入口，`reference` 表示长期参考，`watchlist` 表示观察清单
- `useCase` 写给未来的自己看，说明“为什么收藏”和“什么时候打开”
- `lastChecked` 只在人工确认官网、入口和用途仍然有效后更新
- 新增分类后同步检查首页预览是否需要调整

`pnpm check:seo` 会额外检查：

- `data/links.json` 是否能解析并通过 schema
- 分类 id 是否重复
- 分类是否为空
- URL 是否重复（忽略末尾 `/`）
- URL 是否包含 aff、ref、utm、coupon、partner 等追踪或推广参数

## 6. 图片与静态资源

当前项目的静态资源放在 public/ 下，因此：

- 文内图片可以优先使用 /images/... 这样的路径
- 作品图、头像、封面图也应尽量统一放在 public/images/ 下的清晰子目录中

建议做法：

- 文章图片：public/images/blog/（当前尚无正文图片资产）
- 项目封面：public/images/projects/
- 站点级资源：public/images/site/

这样后续排查资源缺失会更容易。

## 7. 构建和发布前检查

### 博客内容发布前

建议至少检查：

1. frontmatter 是否完整
2. 标题、摘要、日期是否正确
3. published 是否符合预期
4. 图片路径是否真实存在
5. 标签拼写是否统一
6. 小标题是否重复，避免生成重复锚点
7. `updatedAt` 是否不早于 `date`
8. 本地页面是否能正常打开

### 作品集发布前

建议至少检查：

1. projects.json 是否满足 zod 结构要求
2. 封面图路径是否存在
3. url 和 github 是否可访问
4. featured 是否符合首页展示预期
5. year 是否正确

### 导航收藏发布前

建议至少检查：

1. links.json 是否满足 zod 结构要求
2. URL 是否为官网或原始页面
3. 是否没有 aff、ref、utm、coupon、partner 等追踪参数
4. 是否没有重复 URL
5. 首页 4 个预览分类是否仍然存在

## 8. RSS 与内容发布关系

RSS 由 `scripts/generate-rss.ts` 在构建前生成（`tsx scripts/generate-rss.ts && next build`，对应 `pnpm build`），因此以下变更会直接影响订阅输出：

- 新增文章
- 修改文章标题、摘要、日期
- 修改文章 slug 规则相关文件名
- 将文章设为草稿或从草稿改为发布
- 修改站点 URL

如果你发现 RSS 链接、标题或描述不对，优先检查：

- content/blog 文件命名
- frontmatter
- scripts/generate-rss.ts
- src/lib/site.ts
- 环境变量 NEXT_PUBLIC_SITE_URL

Feed 先按文件名倒序取最近 20 个 MDX 候选，再过滤 `published: false`，因此最终最多 20 篇，候选中有草稿时会少于 20 篇。非法 frontmatter 会让生成失败；生产环境缺少内容目录或使用 localhost 站点 URL 时也会 fail-fast。

## 9. 建议的维护习惯

### 写文章时

- 先写 frontmatter，再写正文
- 标签命名尽量统一，例如不要混用 Next.js、NextJS
- 有系列关系的文章填写相同的 series，相关文章排序会优先考虑它
- 大幅修订正文时补 updatedAt，小改错别字通常不需要
- 如果文章会被首页推荐，再显式加上 featured: true

### 改站点信息时

站点名称、描述、作者如果发生变化，最好一次性联查这些位置：

- src/lib/site.ts（站点配置唯一来源）
- src/lib/content-dirs.ts（内容数据路径）
- src/app/manifest.ts（由 site.ts 生成 PWA manifest）

### 合并前

建议至少运行：

```bash
pnpm format:docs:check
pnpm format:check
pnpm lint
pnpm typecheck
pnpm check:seo
pnpm check:blur
pnpm test
pnpm exec cross-env NEXT_PUBLIC_SITE_URL=https://incca.ccwu.cc pnpm build
```

构建会重写 `public/feed.xml` 和 `public/feed.json`。完成后检查这两个文件的 diff，避免把 localhost URL 或无关生成差异提交。涉及页面交互、移动端或路由行为时再运行 `pnpm test:e2e`。

如果 build 通过，通常也能顺便验证：

- RSS 是否成功生成
- 页面路由是否能完成生产构建
- 内容格式是否存在明显问题

## 10. 何时需要同步更新文档

当出现以下变化时，建议同步更新本文件：

- frontmatter 字段新增或删减
- projects.json 结构调整
- links.json 结构调整
- 新增内容目录，例如 content/projects
- 新增搜索索引、文章摘要生成、图片处理等构建流程
- 内容发布流程从纯本地文件改为接 CMS
- 上线运营基线变化，例如 CI 门禁、生产域名、Speed Insights 指标记录方式调整
