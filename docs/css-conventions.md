# CSS 范式统一规范

## 架构概览

本项目采用 **双层 CSS 策略**：BEM 自定义类用于结构性组件，Tailwind 工具类用于原子化调整。

```
globals.css                   ← Tailwind v4 入口，不承载 @import 链
src/app/layout.tsx            ← 仅真正全局语义 CSS
├── styles/tokens.css         ← 设计令牌、明暗主题变量、滚动条
├── styles/base.css           ← 全局基础、skip-link、Header、Footer、not-found
├── styles/components.css     ← Section / Card 等通用布局组件
├── styles/controls.css       ← CTA Button / Pagination / TagLink / 项目卡控件
├── styles/backdrop.css       ← Paper Gallery 背景层
├── styles/animations.css     ← reveal / fade motion
└── styles/responsive.css     ← 响应式断点覆盖，最后加载
src/app/page.tsx              ← home.css / home-hero.css / home-sections.css
src/app/blog/layout.tsx       ← search-ui.css + blog-ui.css
src/app/blog/[slug]/layout.tsx ← article-ui.css + prose.css
src/app/about/layout.tsx      ← prose.css
src/app/tags/layout.tsx       ← blog-ui.css
src/app/categories/layout.tsx ← archive.css + blog-ui.css
src/app/series/layout.tsx     ← archive.css
src/app/links/layout.tsx      ← links.css
src/app/projects/[id]/layout.tsx ← project-detail.css
```

不要在 `globals.css` 里写 `@import "./styles/xxx.css"`。Tailwind v4 的
`@tailwindcss/postcss` 可能静默丢弃这些导入；CSS 模块必须由根/segment
`layout.tsx` 或所属页面显式 import。

## 决策树：BEM 还是 Tailwind？

```
这个样式是否跨页面/组件复用？
├── 是 → 写 BEM 自定义类，放入对应的 .css 文件
└── 否 → 这个样式是否超过 3 个工具类组合？
    ├── 是 → 考虑写 BEM 类（避免 className 过长）
    └── 否 → 直接用 Tailwind 工具类
```

### 使用 BEM 自定义类的场景

- **结构性布局**：`.section`、`.header`、`.hero`、`.cards`
- **跨页面复用组件**：`.card`、`.blog__item`、`.tag-link`、`.pagination`
- **需要 `:hover`/`:focus`/状态变化的复杂交互**：`.header--scrolled`、`.header__nav.is-open`
- **全局响应式覆盖**：放入 `responsive.css`；路由专属组件的媒体查询留在所属 route CSS

### 使用 Tailwind 工具类的场景

- **一次性布局微调**：`flex items-center gap-3`
- **间距/尺寸**：`mt-4`、`px-6`、`max-w-3xl`
- **响应式工具**：`md:flex`、`lg:grid-cols-3`
- **颜色引用令牌**：`text-[var(--text-dim)]`、`bg-[var(--surface)]`

### 禁止混用的场景

```tsx
// ❌ 不要在 BEM 类上叠加重复的 Tailwind
<div className="section p-64px max-w-1200px">

// ✅ BEM 类已包含这些样式，不需要重复
<div className="section">

// ✅ Tailwind 用于 BEM 未覆盖的微调
<div className="section mt-8">
```

## 设计令牌系统

所有颜色、阴影、圆角必须通过 CSS 变量引用，禁止硬编码。

### 令牌清单

| 令牌                   | 用途                                        | 亮色值                     | 暗色值                      |
| ---------------------- | ------------------------------------------- | -------------------------- | --------------------------- |
| `--bg`                 | 页面背景                                    | `#f1f0eb`                  | `#141716`                   |
| `--bg-soft`            | 次级背景                                    | `#e7e7df`                  | `#1c211f`                   |
| `--surface`            | 卡片表面                                    | `#f8f7f2`                  | `#1a1f1d`                   |
| `--surface-raised`     | 抬升表面                                    | `var(--bg-elevated)`       | `var(--bg-elevated)`        |
| `--surface-muted`      | 弱化表面                                    | `var(--bg-soft)`           | `var(--bg-soft)`            |
| `--text`               | 主文字                                      | `#242827`                  | `#eceee8`                   |
| `--text-soft`          | 次级文字                                    | `#4d5652`                  | `#c4cbc3`                   |
| `--text-dim`           | 弱化文字                                    | `#737b72`                  | `#8e978f`                   |
| `--border`             | 默认边框                                    | `rgba(36, 40, 39, 0.13)`   | `rgba(236, 238, 232, 0.12)` |
| `--brand`              | 品牌色（鼠尾草）                            | `#59756d`                  | `#9db6ad`                   |
| `--brand-soft`         | 品牌色浅底                                  | `rgba(89, 117, 109, 0.12)` | `rgba(157, 182, 173, 0.14)` |
| `--cta`                | Atelier 附加强调（稀有 · 默认交互仍 brand） | `#f97316`                  | 同左                        |
| `--atelier-panel-blur` | 顶栏等 chrome 霜                            | `12px`                     | `12px`                      |
| `--shadow-sm/md/lg`    | 阴影层级                                    | —                          | —                           |
| `--radius`             | 默认圆角（V1a）                             | `8px`                      | `8px`                       |
| `--radius-sm`          | 卡/控件                                     | `8px`                      | `8px`                       |
| `--radius-xs`          | 紧凑圆角                                    | `4px`                      | `4px`                       |

> **V1a Atelier（2026-07-23）：** 矩阵见 [`docs/design/atelier-v1a-matrix.md`](./design/atelier-v1a-matrix.md)。新间距优先 4/8/16/24/32；组合 SSOT 在 orca `portfolio-visual-fluent-glass-2026-07-23/atelier-token-ssot.md`。

### 引用规则

```css
/* ✅ 正确：使用令牌 */
color: var(--text-dim);
background: var(--surface);
border: 1px solid var(--border);

/* ❌ 禁止：硬编码颜色 */
color: #8e8ea0;
background: #ffffff;
```

```tsx
// ✅ Tailwind 中引用令牌
<span className="text-[var(--text-dim)]">
<div className="bg-[var(--surface)]">

// ❌ 禁止：硬编码
<span className="text-gray-400">
<div className="bg-white">
```

## BEM 命名规范

遵循 `block__element--modifier` 模式：

```css
/* Block：独立组件 */
.card {
}

/* Element：组件内部部件 */
.card__title {
}
.card__desc {
}
.card__foot {
}

/* Modifier：状态或变体 */
.card--project {
} /* 项目卡片变体 */
.card--featured {
} /* 精选状态 */

/* 状态类：用 .is- 前缀 */
.header__nav.is-open {
}
```

### 命名规则

1. **Block 名**：使用语义化名称，不用表现性名称（`.card` 不用 `.rounded-box`）
2. **Element 名**：描述角色，不用位置（`.card__title` 不用 `.card__top`）
3. **Modifier 名**：描述状态或变体，不用值（`.card--featured` 不用 `.card--gold`）
4. **状态类**：用 `.is-` 前缀表示运行时状态（`.is-open`、`.is-active`、`.is-loading`）

## 文件归属规则

| 文件                 | 内容                                        | 示例                                               |
| -------------------- | ------------------------------------------- | -------------------------------------------------- |
| `tokens.css`         | CSS 变量、reset、主题切换、滚动条、选中样式 | `:root`、`.dark`、`::selection`                    |
| `base.css`           | 页面骨架和全局基础                          | `.header`、`.footer`、`.skip-link`                 |
| `components.css`     | 可复用布局和基础卡片                        | `.section`、`.card`、`.cards`                      |
| `archive.css`        | 归档页和 ArchiveCard                        | `.archive-grid`、`.archive-card`                   |
| `controls.css`       | shadcn Button 外观、分页、标签和轻量控制    | `[data-slot='button']`、`.pagination`、`.tag-link` |
| `links.css`          | 收藏导航目录                                | `.links-directory`                                 |
| `blog-ui.css`        | 博客列表、目录和辅助界面                    | `.blog__item`、`.toc`、`.tag-cloud`                |
| `search-ui.css`      | 搜索输入与结果列表                          | `.search-bar`、`.search-results`                   |
| `article-ui.css`     | 文章详情布局和阅读面板                      | `.article-layout`、`.article-panel`                |
| `backdrop.css`       | 背景视觉层                                  | `body::before`、`.site-backdrop__stage`            |
| `home.css`           | 首页主题覆盖、共享样式和响应式              | `.home-paper`、`body:has(.home-paper)`             |
| `home-hero.css`      | 首页首屏                                    | `.editorial-hero`                                  |
| `home-sections.css`  | 首页内容区块                                | `.home-manifesto`、`.home-article-rail`            |
| `prose.css`          | MDX 渲染的文章排版                          | `.prose h2`、`.prose code`、`.code-toolbar`        |
| `project-detail.css` | 项目详情页                                  | `.project-detail`                                  |
| `animations.css`     | 动画关键帧和动效类                          | `.reveal-on-scroll`、`.animate-fade-in`            |
| `responsive.css`     | 媒体查询覆盖                                | `@media (max-width: 768px)`                        |

**规则**：新组件的 CSS 放入最接近语义归属的模块。跨页面通用组件放入
`components.css` / `archive.css` / `controls.css`；博客专属放入 `blog-ui.css` /
`search-ui.css` / `article-ui.css`；首页专属放入 `home.css` / `home-hero.css` /
`home-sections.css`；
由最近的根/segment `layout.tsx` 或所属页面显式导入新 CSS 文件；全局模块仍由根 layout 管理顺序。

## shadcn 与本地 BEM 的分工

- shadcn 组件负责可访问性、语义 slot、基础 variant。
- BEM 类负责本站 Paper Gallery 视觉语言。
- 小型元信息 chip 使用 `src/components/ui/MetaBadge.tsx`，不要再手写裸
  `span` 加边框圆角。
- 分类/专题归档卡片使用 `src/components/layout/ArchiveCard.tsx`。
- 标准 section 外壳使用 `src/components/layout/PageSection.tsx`。
- 迁移时优先保留旧 BEM 类名，避免扩大 CSS 和测试变更面。

## 响应式设计

### 断点

| 断点        | 宽度       | 用途                 |
| ----------- | ---------- | -------------------- |
| 窄屏        | `≤ 374px`  | 极窄设备微调         |
| 移动端      | `≤ 767px`  | 单列布局、Sheet 菜单 |
| 平板/窄桌面 | `≤ 1023px` | 两列与间距调整       |
| 桌面端      | `≥ 1024px` | 完整导航与多列布局   |

### 实现方式

1. **Tailwind 响应式工具**（优先）：`md:flex`、`lg:grid-cols-3`
2. **route CSS 媒体查询**：只影响 home、links、search 或 project-detail 时，留在对应文件
3. **`responsive.css` 媒体查询**：只放跨路由的最终覆盖，并保持根 layout 最后加载

```css
/* responsive.css 中覆盖 BEM 类的响应式样式 */
@media (max-width: 767px) {
  .section {
    padding: 40px 16px;
  }
  .cards--2,
  .cards--3 {
    grid-template-columns: 1fr;
  }
}
```

## 暗色主题

通过 `<html>` 上的 `.dark` 类切换。所有颜色通过 CSS 变量自动适配。

```tsx
// ✅ 正确：使用令牌，暗色自动适配
<div className="bg-[var(--surface)] text-[var(--text)]">

// ❌ 禁止：手动写暗色覆盖
<div className="bg-white dark:bg-gray-900">
```

## 反模式

| 反模式                  | 问题               | 正确做法                          |
| ----------------------- | ------------------ | --------------------------------- |
| 硬编码颜色              | 暗色主题失效       | 使用 `var(--*)` 令牌              |
| BEM + Tailwind 重复     | 样式冲突、维护困难 | BEM 类负责结构，Tailwind 负责微调 |
| 内联 style 写颜色       | 无法主题切换       | 用 CSS 变量或 Tailwind 令牌引用   |
| 在 JSX 中写 media query | 无法实现           | 放入 `responsive.css`             |
| 用 `!important` 覆盖    | 特异性战争         | 提高选择器精度或调整顺序          |
| 组件 CSS 散落多个文件   | 难以查找           | 按文件归属规则集中管理            |
