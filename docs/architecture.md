# 项目架构说明

> ⚠️ **状态：部分过时**（2026-06-30）
> 本文档写于 `src/lib/posts.ts` 单文件时代，未反映以下后续重构：
>
> - `src/lib/posts.ts` 已拆分为 `src/lib/posts/` 4 子模块（schema/repository/query/search-text）
> - 新增 `src/lib/observability.ts` / `metadata.ts` / `route-adapter.ts` / `category-rules.ts` / `schemas/` / `test-utils/`
> - 新增 `src/hooks/` 目录（useInView / usePersistedEnum / usePrefersReducedMotion）
> - 新增全站三层背景架构（`SiteBackdropStage` + `SiteBackdropParallax` + `body::before/after`）
> - `src/app/globals.css` 已拆为 10 个语义 CSS 模块（见 `src/app/styles/`）
> - 新增首页 8 个组件（`src/components/home/`）
> - `src/lib/constants.ts` 已删除，现由 `src/lib/site.ts`、`src/lib/content-dirs.ts`、`src/lib/category-rules-data.ts` 分担
>
> 当前架构权威来源：[`docs/handoff-to-agent.md`](./handoff-to-agent.md) 的"三、架构速览"小节。
> 本文档保留作为历史参考，不再同步更新。

## 1. 项目定位

这是一个以内容展示为主的个人博客项目，核心目标不是复杂后台，而是通过本地文件驱动站点内容。

项目当前采用的思路是：

- 页面层使用 Next.js App Router
- 内容层使用 MDX 和 JSON 文件
- 数据准备尽量提前到构建期或服务端读取阶段完成
- 页面尽量保持无状态，复杂逻辑收敛到 src/lib 和内容层

## 2. 架构分层

```
content/ + data/
        ↓
src/lib/posts.ts / src/lib/projects.ts
        ↓
src/app/* 页面路由
        ↓
src/components/* 视图组件
        ↓
public/* + RSS + sitemap + metadata
```

可以把它理解成四层：

1. 内容源层
   content/ 和 data/ 保存博客、关于页、作品集等原始数据。
2. 数据整理层
   src/lib/ 负责读取、解析、校验、格式化这些数据。
3. 页面路由层
   src/app/ 负责按路由组织页面，并把整理后的数据交给组件。
4. 展示层
   src/components/ 负责页面结构、交互和视觉呈现。

## 3. 目录职责

### src/app

负责页面与路由，是项目对外可访问页面的入口。

当前可以从代码中确认的主要页面包括：

- src/app/page.tsx
  首页，聚合最新博客和精选作品。
- src/app/about/page.tsx
  关于页。
- src/app/blog/page.tsx
  博客列表页，接分页参数并渲染搜索入口。
- src/app/blog/[slug]/page.tsx
  博客详情页，负责 SEO 元数据、目录、阅读进度和前后篇。
- src/app/projects/page.tsx
  作品集页。
- src/app/tags/page.tsx
  标签汇总页。
- src/app/tags/[tag]/page.tsx
  标签详情页。
- src/app/sitemap.ts
  站点地图生成逻辑。
- src/app/loading.tsx、src/app/error.tsx 及各子路由 loading.tsx
  提供加载态和错误兜底。

### src/components

负责展示复用，不承担内容源读取职责。

从命名上看，大致可分为：

- components/blog/
  博客列表、文章卡片、MDX 渲染、目录、分页、搜索、阅读进度等。
- components/layout/
  站点级布局组件，例如头部和底部。
- components/projects/
  作品集卡片与相关展示。
- components/comments/
  评论系统集成，例如 Giscus。
- components/ui/
  主题切换、返回顶部等通用 UI。

原则上这里更适合放：

- 纯展示逻辑
- 与页面无强绑定的小交互
- 对 src/lib 返回数据的渲染封装

不适合放：

- 文件系统读取
- frontmatter 校验
- 站点级配置常量

### src/lib

这是当前项目最关键的一层，承接“原始内容”到“页面可消费数据”的转换。

#### src/lib/constants.ts（历史）

该文件已删除。当前替代入口：

- `src/lib/site.ts`：站点名称、描述、作者、社交链接、Giscus 配置、站点 URL 解析
- `src/lib/content-dirs.ts`：内容目录常量、Vercel trace include、分页大小
- `src/lib/json-content-repository.ts`：JSON 内容读取、解析、缓存的共享 repository factory
- `src/lib/category-rules-data.ts`：标签到分类的映射数据

下方涉及 `constants.ts` 的旧描述仅作历史背景参考。

#### src/lib/posts.ts

博客系统核心逻辑，负责：

- 读取 content/blog 中的 MDX 文件
- 解析 frontmatter 与正文
- 计算文章 slug
- 计算阅读时长
- 推导分类、正文摘录、小标题列表和搜索文本
- 根据标签、分类、系列计算相关文章
- 在生产环境中过滤草稿
- 提供文章列表、详情、分页、标签过滤、前后篇查询、相关文章查询

这意味着博客功能的大多数数据逻辑都应该优先落在这里，而不是散落到页面组件中。

#### src/lib/projects.ts

作品数据核心逻辑，负责：

- 读取 data/projects.json
- 用 zod 做结构校验
- 排序
- 提供全部项目、精选项目、单项目查询

#### src/lib/utils.ts

当前主要放一些轻量工具：

- 标签 slug 化
- 日期格式化
- frontmatter 必填字段校验

如果后续工具函数开始增多，建议按主题拆分，例如：

- date.ts
- slug.ts
- content-validation.ts

### src/types

集中放数据结构定义，例如：

- PostFrontmatter
- PostMeta
- PostFull
- Project
- TagInfo

这样做的好处是页面、组件和 lib 可以共享同一套数据契约。

## 4. 内容数据流

### 4.1 博客文章流转

```
content/blog/*.mdx
  ↓
src/lib/parse-frontmatter.ts 解析 frontmatter (js-yaml 4.x)
  ↓
src/lib/posts.ts 生成 PostFull / PostMeta
  ↓
src/app/blog/page.tsx 和 src/app/blog/[slug]/page.tsx 消费
  ↓
src/components/blog/* 渲染列表与详情
```

实际职责拆分：

- 内容文件负责表达内容本身
- posts.ts 负责把内容变成稳定数据结构，并生成搜索/发现所需的派生字段
- 页面负责选择查询方式
- 组件负责最终呈现

这是当前项目比较清晰、也值得继续保持的一条主链路。

### 4.2 作品集数据流转

```
data/projects.json
  ↓
parseProjects() + zod
  ↓
getAllProjects() / getFeaturedProjects()
  ↓
首页与作品页组件渲染
```

这个设计适合结构化信息，但如果后续作品需要更长正文、案例拆解或图文混排，建议再增加 content/projects/[id].mdx 作为扩展层，而不是把长文案全塞回 JSON。

## 5. 构建相关链路

### RSS

package.json 里 build 命令是：

```bash
npx tsx scripts/generate-rss.ts && next build
```

这表示 RSS 文件不是由页面自动生成，而是构建前脚本扫描 content/blog 后输出到 public/。

影响范围包括：

- 文章文件名与 slug 规则（已统一使用 `lib/posts.ts` 的 `filenameToSlug`）
- 文章 published 字段
- 站点 URL 配置（从 `src/lib/site.ts` 读取，无需单独维护元信息）

### sitemap

sitemap 由 src/app/sitemap.ts 负责，因此新增或删减重要路由时，最好同步检查这部分逻辑是否仍完整。

## 6. 配置入口

### next.config.ts

当前职责包括：

- 统一安全响应头
- next/image 远程图片白名单配置

### site.config.json（已合并入 site.ts）

此文件曾在站点配置模块之外承载冗余的站点名称/描述/作者信息。

当前状态：**已删除**。站点配置已全部收敛到 `src/lib/site.ts` 作为单一可信源。不再需要单独维护。

## 7. 已经形成的设计特点

从当前代码可以看出，这个项目已经形成了几条明确倾向：

- 内容优先，后台极简
- 服务端读取本地内容，而不是引入外部 CMS
- 页面层偏薄，内容逻辑集中在 lib
- 构建期生成部分派生资产，例如 RSS
- 通过类型和校验降低内容格式错误风险
- Manifest PWA 元数据由 `src/app/manifest.ts` 从 `site.ts` 动态生成

这些方向是统一的，说明项目已经具备继续工程化的基础。

## 8. 后续细化建议

### 8.1 配置收敛

站点配置已全部收敛到 `src/lib/site.ts` 作为单一可信源。`site.config.json`（已删除）、原 RSS 脚本中的 inline 常量（已迁移为从 `site.ts` 导入）、`public/manifest.json`（已替换为 `app/manifest.ts`）全部汇入。
