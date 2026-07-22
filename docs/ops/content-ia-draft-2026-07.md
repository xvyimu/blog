# Chronicle · 内容信息架构草案 · 2026-07

> **性质**：W1 **设计冻结增量** · 不要求本波改代码  
> **As-Is 路由依据**：`docs/ARCHITECTURE_ASIS.md` §2.3 · `src/lib/navigation.ts` · `src/lib/content-dirs.ts`  
> **Schema**：`src/lib/schemas/post-frontmatter.ts`  
> **产品边界**：内容与作品集站 · **不是** AI SaaS（组合宪章）

## 1. 用户面地图（现状 = 草案基线）

```text
/                 首页（编辑感入口 · 精选/近作）
├── /blog         时间线列表（分页 PAGE_SIZE=12）
│   └── /blog/[slug]
├── /garden       数字花园（wikilink 图 · 力导向 · 本机视图）
├── /series       专题索引
│   └── /series/[series]     series slug = slugify(中文名)
├── /categories   分类索引
│   └── /categories/[category]  中文 path segment
├── /tags         标签索引
│   └── /tags/[tag]
├── /projects     作品集
│   └── /projects/[id]       data/projects.json · id 唯一
├── /links        导航/收藏（data/links.json · 客户端筛选）
└── /about        content/about.mdx
```

主导航（`MAIN_NAV_ITEMS`）：首页 · 博客 · 花园 · 导航 · 分类 · 专题 · 作品 · 关于。  
**标签** 不在主导航，由列表/文内/花园筛选进入。

## 2. 内容源与权威

| 源   | 路径                          | 权威           | 备注                                                                    |
| ---- | ----------------------------- | -------------- | ----------------------------------------------------------------------- |
| 博文 | `content/blog/*.mdx`          | Git            | frontmatter Zod strict                                                  |
| 关于 | `content/about.mdx`           | Git            | 单页                                                                    |
| 作品 | `data/projects.json`          | Git            | Zod 数组 · id 唯一                                                      |
| 链接 | `data/links.json`             | Git            | 分类目录                                                                |
| 快照 | `generated/content-snapshot/` | **生产默认读** | `CONTENT_BACKEND=snapshot`；CI `content:build` + `git diff --exit-code` |

**CMS 模型**：Git-as-CMS · 无登录后台 · 无 RDBMS 内容权威。

## 3. 博文 frontmatter 约定（作者契约）

| 字段                 | 必需 | 规则                                                      |
| -------------------- | ---- | --------------------------------------------------------- |
| `title`              | ✓    | 非空                                                      |
| `description`        | ✓    | 非空 · SEO/卡片                                           |
| `date`               | ✓    | `YYYY-MM-DD` 有效日历日                                   |
| `updatedAt`          |      | 同上格式                                                  |
| `tags`               |      | string[] · 默认 `[]` · 驱动标签页 + 可选分类推断          |
| `category`           |      | 显式分类名；与 `TAG_TO_CATEGORY` 可并存                   |
| `series`             |      | 专题**显示名**（中文可）；路由 slug 由 `slugifyTag(name)` |
| `seriesOrder`        |      | 正整数；专题内排序主键，缺省靠后再按 date/slug            |
| `published`          |      | 默认 `true`                                               |
| `featured`           |      | 默认 `false`                                              |
| `image`              |      | `http(s)://` 或 `/` 绝对路径                              |
| `source` / `license` |      | 可选；本站常见 `CC-BY-4.0`                                |

文件名惯例（现状）：`YYYY-MM-<kebab-slug>.mdx` · **路由 slug** 来自文件名解析（非 title slugify），写作时保持稳定 URL。

### 3.1 分类 vs 标签 vs 专题

| 维度     | 语义                      | 路由                     | 派生                                         |
| -------- | ------------------------- | ------------------------ | -------------------------------------------- |
| **标签** | 细粒度主题词              | `/tags/[tag]`            | 文内 `tags[]` 聚合                           |
| **分类** | 粗桶（前端/后端/DevOps…） | `/categories/[category]` | 显式 `category` 和/或 `TAG_TO_CATEGORY` 映射 |
| **专题** | **有序连载**              | `/series/[series]`       | `series` + `seriesOrder`                     |

**作者指引（草案）：**

1. 每篇至少 1–3 个稳定标签；新标签需考虑是否补 `category-rules-data.ts`。
2. 连载用 **同一** `series` 字符串 + 递增 `seriesOrder`（现例：「个人服务部署路线」1–5）。
3. 专题名变更 = 新系列；避免 silent rename 导致 slug/SEO 断链（W2 若落地可加 alias 表，**W1 不实现**）。
4. 花园只消费 **已发布** 文的 wikilink 图；`[[slug|label]]` 指向稳定 slug。

## 4. 花园（Garden）

| 项         | 约定                                                               |
| ---------- | ------------------------------------------------------------------ |
| 入口       | `/garden`                                                          |
| 图数据     | `getGardenGraph()` · 节点=文 · 边=wikilink/延伸阅读                |
| 布局       | 服务端初始位置 + 客户端力导向；`prefers-reduced-motion` → 列表降级 |
| 视图       | 本机存储（非账号同步）                                             |
| 与博客关系 | 正交视图：时间线 ≠ 关系图；导航互链 blog/series                    |

**不做（半年红线内）：** 把花园做成第二套 CMS 或社交图谱产品。

## 5. 作品集 / 导航

| 面       | 数据                                                        | URL 规则         |
| -------- | ----------------------------------------------------------- | ---------------- |
| Projects | `id` 稳定主键 · `featured` · `year` · 可选 url/github/image | `/projects/[id]` |
| Links    | 分组 JSON · 客户端筛选                                      | 仅 `/links` 单页 |

作品 `id` **禁止**复用改名后换实体；外链失效用文档/运维修，不靠运行时抓取改权威。

## 6. API 面（公开 · 非管理）

| 方法 | 路径                  | 角色         |
| ---- | --------------------- | ------------ |
| GET  | `/api/search`         | 站内检索     |
| GET  | `/api/preview/[slug]` | 预览/卡片类  |
| POST | `/api/csp-report`     | CSP 上报接收 |

**禁止**：把 API 扩成多租户 CMS 写接口（产品边界）。

## 7. 路由与 SEO 约定（W1 冻结 · W2 可编码）

1. **中文 path**：categories 直接用中文 segment（Next encode）；series 用 slugify 后的 ASCII/兼容段。
2. **canonical / OG**：走 `buildPageMetadata` + `NEXT_PUBLIC_SITE_URL`（生产必填）。
3. **sitemap/robots**：App Router 生成；RSS 构建写入 `public/feed.*` 且 CI 要求已提交。
4. **未发布**（`published: false`）：不得进列表/花园/搜索/sitemap（实现以 repository 过滤为准；W2 抽查用例）。
5. **重定向**：旧 slug 迁移用 `next.config` redirects 表（按需 PR）；W1 不预置。

## 8. 目标 IA（W2+ 可选演进 · 本波仅列）

| 演进                                          | 动机          | 风险        | 建议波               |
| --------------------------------------------- | ------------- | ----------- | -------------------- |
| frontmatter `category` 必填或 CI lint         | 分类页空洞    | 存量补数据  | W2                   |
| series slug **显式**字段（与显示名分离）      | rename 不断链 | 迁移脚本    | W2                   |
| 内容类型枚举 `type: essay\|note\|project-log` | 花园/列表筛选 | 过度设计    | 仅有 ≥2 种体裁证据时 |
| 性能预算挂钩关键路由                          | LCP           | 需 RUM 样本 | W3                   |

## 9. 验收（对照 W1 题单）

| 项                        | 状态                                     |
| ------------------------- | ---------------------------------------- |
| 本草案存在                | ✓ `docs/ops/content-ia-draft-2026-07.md` |
| 与现路由一致              | ✓ 基于 ASIS + `MAIN_NAV_ITEMS`           |
| 无 Astro/Vue / 无大改代码 | ✓ 纯文档                                 |

## 10. 变更记录

| 日期       | 变更        |
| ---------- | ----------- |
| 2026-07-23 | W1 草案首版 |
