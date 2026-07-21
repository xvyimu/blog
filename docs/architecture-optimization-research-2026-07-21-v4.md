# 西江月博客 · 架构优化整合调研报告 v4

> **状态**：决策与规格 SSOT 第五轮补充稿（2026-07-21 夜 · **v4**）  
> **路径**：`D:\blog` · 生产：`https://incca.ccwu.cc`  
> **本地 tip**：`feat/v3-ship` **`6543a91`** · **ahead 6 未 push** · 工作树 clean  
> **origin/master / 生产**：仍为 **`ef77986`**（与 tip 分叉）  
> **相对 v3**：`architecture-optimization-research-2026-07-21-v3.md` 保留为第四轮决议与 Q21–Q30 规划史；**本 v4 以「v3 ship 已本地落地 + Q26/Q27 测试补全 + Q28 六篇概念文 + Q29 本地 SRI 准备」为起点**，重新扫描进度、同类经验、技术债与下一刀最佳路径。  
> **待办 SSOT**：根 `TODO.md` · 接手记忆：`blog-handoff-2026-07-21` · 架构：`docs/architecture.md` · API：`docs/API.md`（需同步 preview）· SRI ADR：`docs/adr/2026-07-21-sri-over-nonce-evaluation.md`

---

## 文首决议继承（不可推翻，除非用户本轮表单改写）

| 决策      | 选择                                     | 含义                      | v4 态                            |
| --------- | ---------------------------------------- | ------------------------- | -------------------------------- |
| 主轨道    | **混合：内容 70% + 体验 20% + 卫生 10%** | 剧本 S5；禁止并行换栈     | 维持；内容侧 Q28 已落地 6 篇     |
| 平台/渲染 | **锁 Next + nonce CSP**                  | 禁 `unsafe-inline` 换 SSG | 维持；SRI **仍 Evaluation**      |
| 内容形态  | **Next 内数字花园增量**                  | G0→G1→G2→G3 均已本地实现  | G3 代码+测试已在分支；**未生产** |
| 运营      | **继续跳过**                             | GSC/Bing/RUM 不假完成     | 维持                             |
| 交付边界  | **本地 commit；push 另授权**             | v3 ship 全程本地          | **仍未授权 push**（ahead 6）     |

---

## 0. 执行摘要

### 0.1 产品定位（未变）

西江月 = **可复用工程笔记 + 可信作品集 + 策展导航 + 轻量数字花园**。安静、可读、可验证、可接手。不是 Obsidian 发布器，不是 CMS，不是搜索 SaaS 展示站。

### 0.2 进度快照（2026-07-21 第五轮实测）

| 项                 | 值                                                                                          | 证据                             |
| ------------------ | ------------------------------------------------------------------------------------------- | -------------------------------- |
| 生产域名           | `https://incca.ccwu.cc`                                                                     | launch-baseline / live           |
| origin/master      | **`ef77986`**                                                                               | `git rev-parse origin/master`    |
| 本地分支           | **`feat/v3-ship` @ `6543a91` · ahead 6 · clean**                                            | `git status` / `rev-list`        |
| 与生产差           | 6 commits 未 push：Compiler/FS cache/VT + G3/G2 hover + ADR/v3 报告 + hygiene + 测试 + 6 文 | git log                          |
| 内容规模           | **20** 篇 MDX（+6）· 6 项目 · 10 类 123 链                                                  | `content/blog` 计数              |
| wikilink           | 约 **130** 处引用 · **45** 条唯一 `[[…]]` · **22** 个唯一目标 slug                          | `rg` 启发式（非构图 API 实测）   |
| 栈                 | Next **16.2.9** · React **19.2.4** · Fuse **7.x** · Compiler **^1.0.0**                     | package.json                     |
| 单元/集成          | **685 / 93**                                                                                | `pnpm test`                      |
| E2E                | 48 / 5（本轮未重跑；合入前应跑）                                                            | 基线                             |
| typecheck          | 绿                                                                                          | `pnpm typecheck`                 |
| production build   | **107/107**（需 `NEXT_PUBLIC_SITE_URL`）                                                    | 本轮实测                         |
| React Compiler     | **已开** `reactCompiler: true`                                                              | `next.config.ts:38`              |
| Turbopack FS cache | **已开** `turbopackFileSystemCacheForDev: true`                                             | `next.config.ts:44`              |
| View Transitions   | **已开** + BlogCard `transitionTypes={['blog-detail']}`                                     | config + BlogCard                |
| G3 popover         | 代码+7 组件测+3 route 测                                                                    | WikilinkPopover + `/api/preview` |
| G2 hover 高亮      | 代码+3 测                                                                                   | GardenExplorer                   |
| SRI                | ADR Evaluation；类型形状已校正；**生产未 enable**                                           | ADR                              |
| 安全基线           | 文档路由动态 + CSP nonce；未 `unsafe-inline`                                                | proxy/CSP ADR                    |

### 0.3 v3 Q21–Q30 落地核对（v4 强制证据）

| 工作项                 | v3 规划  | v4 态                               | 证据                               |
| ---------------------- | -------- | ----------------------------------- | ---------------------------------- |
| Q21 卫生债             | 推荐     | **Done（分支内）**                  | `8a14cf7` + 后续基线 685/93、20 文 |
| Q22 React Compiler     | 推荐工程 | **Done**                            | `462bc9c` · build 绿               |
| Q23 Turbopack FS cache | 推荐工程 | **Done**                            | `462bc9c`                          |
| Q24 View Transitions   | 可选     | **Done**                            | BlogCard `transitionTypes`         |
| Q25 SRI ADR            | 评估     | **Done 评估**；未上生产             | ADR + 类型校正                     |
| Q26 G3 popover         | 条件     | **代码+测试 Done**                  | `70c323f` + `a135b07`              |
| Q27 G2 hover           | 可选     | **代码+测试 Done**                  | 同上                               |
| Q28 概念链 4–8 篇      | 推荐内容 | **6 篇 Done**                       | `6543a91`                          |
| Q29 SRI preview / push | 门控     | **本地准备 Done；deploy/push 未做** | 用户授权范围                       |
| Q30 禁止项             | 禁止     | **遵守**                            | 无换栈/CMS/假 GSC                  |

**关键判断**：v3 推荐包与条件包的**本地工程**已基本收口；**最大剩余风险不是「还缺功能」，而是「分支未 push → 生产仍是 G2-only 的 ef77986」**。任何继续堆功能而不合入，都会拉长分叉与回归面。

### 0.4 核心结论（v4）

1. **仍不换栈**；沉没成本含 685 测、纸感、nonce、G0–G3 本地实现、20 文概念网。
2. **仍不上 CMS / Meili / Algolia / Orama**；20 文仍远低于「外部搜索评估」门槛（TODO：≥200 文或 p95 证据）。
3. **工程红利项（Compiler / FS cache / VT / G3 / hover / 测试 / 6 文）已在分支闭环**；下一最优动作是 **门控交付**（push + CI + 可选 preview），不是再开新特性面。
4. **SRI 维持 Evaluation**：experimental + Vercel 托管 CDN 风险低；本地已纠正 `sri: true` 伪类型为 `{ algorithm }`。
5. **API 文档债真实**：`docs/API.md` 仍只描述 `/api/search`，**未收录** `/api/preview/[slug]`（G3 已实现）。
6. **体验债**：popover 键盘/触屏、花园触屏无 hover、View Transitions 仅一处、纸感在暗色下的 popover 对比度未系统审计。
7. **运营仍 blocked_auth**；不假完成。

### 0.5 推荐默认组合（若用户不改偏好）

| 决策点    | 推荐                                                   | 加权直觉 | 风险       |
| --------- | ------------------------------------------------------ | -------- | ---------- |
| 平台      | P-A 锁 Next                                            | 94       | 低         |
| 渲染/安全 | R-A nonce 维持；SRI 继续 Evaluation                    | 90 / 78  | 低/中      |
| 下一主包  | **D1 交付包：push feat/v3-ship → CI →（可选）preview** | 91       | 中（外发） |
| 文档      | **API.md 补 preview + overview/architecture 数字**     | 88       | 低         |
| 体验打磨  | **E1 小包：popover a11y + 对比度 + VT 第二落点评估**   | 82       | 低         |
| 内容      | **C-hold：20 文后先观察图密度，不强制再灌文**          | 80       | 低         |
| 禁止      | 换栈 / unsafe-inline / 假 GSC / 未授权 deploy 生产     | —        | —          |

---

## 1. 调研范围与方法

### 1.1 问题陈述（第五轮）

在 **v3 ship 本地完成、内容 20 篇、测试 685、build 107、生产仍停在 ef77986** 的前提下：

1. 预算应优先 **合入交付**、**文档契约补齐**、**体验打磨**，还是 **继续加功能（SRI 启用 / 新布局 / 更多文）**？
2. G3 popover 与 preview API 的契约是否已达「可生产」？缺什么验收？
3. 20 文规模下 Fuse 是否仍甜点？图密度是否够支撑花园叙事？
4. 同类个人技术站 / 数字花园 2026 经验对「纸感 + 工程可信」品牌有何可借鉴、何不可抄？
5. 技术债清单按 P0–P3 排序后，哪三条在未授权 push 前仍可本地清？

### 1.2 输入材料

| 类别          | 路径                                                                                             | 角色          |
| ------------- | ------------------------------------------------------------------------------------------------ | ------------- |
| v1/v2/v3 报告 | `docs/architecture-optimization-research-2026-07-21*.md`                                         | 决议与评分史  |
| 本轮 git      | `feat/v3-ship` 6 commits                                                                         | 实现真值      |
| 代码          | `next.config.ts` · `WikilinkPopover` · `GardenExplorer` · `api/preview` · `api/search` · `proxy` | 架构真值      |
| ADR           | CSP nonce · SRI Evaluation · content repository                                                  | 安全/内容边界 |
| 规范          | AGENTS · css-conventions · content-workflow · module-boundaries 测                               | 编码标准      |
| 外搜/同类     | Quartz · Digital Garden 社区实践 · Next 16.2 文档类型 · 个人站纸感趋势                           | 市调          |
| 实测          | `pnpm test` 685 · `build` 107 · wikilink `rg` 计数                                               | 进度真值      |

### 1.3 方法

- **证据优先**：路径/命令/commit；禁止「已上线」指未 push 功能。
- **继承不重判**：v1–v3 已否决的换栈/CMS/`unsafe-inline` 不重新展开长文，只给对照表。
- **每决策点 ≥3 方案**，加权：读者价值 25 · 成本 20（高=省）· 约束 20 · 维护 15 · 风险 10（高=安全）· 品牌 10。
- **交付边界诚实**：本地可验证 vs 需授权外发 分开写。

### 1.4 输出物（本文件结构映射需求）

| 用户要求           | 本报告章节                       |
| ------------------ | -------------------------------- |
| 进度扫描           | §0 · §2                          |
| 市场需求调研       | §3                               |
| 架构设计文档       | §4                               |
| 开发规范与编码标准 | §5                               |
| 开发路线图         | §6                               |
| API 接口文档       | §7（并指出需回写 `docs/API.md`） |
| 多方案对比评分     | §8–§11                           |
| 最佳方案解释       | §12                              |
| 目标/约束/IO/验收  | §13                              |
| 技术债             | §14                              |
| UX / 视觉打磨      | §15                              |
| 交互表单           | §18                              |

---

## 2. 当前进度详述（分叉真相）

### 2.1 六 commits 语义包

```
6543a91 content(blog): add 6 concept posts + local SRI prep
a135b07 test(garden): cover G3 popover, G2 hover highlight, preview route
8a14cf7 docs(hygiene): sync test counts, HEAD refs, route inventory after v3 ship
7098fce docs(adr): add SRI evaluation and v3 architecture research report
70c323f feat(garden): G3 wikilink popover + G2 hover neighbor highlight
462bc9c feat(next): enable React Compiler, Turbopack FS cache, view transitions
ef77986  ← origin/master · 生产
```

| 包              | 读者可感？    | 生产风险              | 本地验证                 |
| --------------- | ------------- | --------------------- | ------------------------ |
| Next 工程三件套 | 弱（VT 略强） | 低（build 已绿）      | 已 build                 |
| G3/G2 交互      | 强            | 中（新 API + client） | 单元测已补；e2e 未跑本轮 |
| 文档/ADR        | 对维护者强    | 无                    | check:docs 惯例          |
| 测试补全        | 维护者        | 负风险（降回归）      | 685 绿                   |
| 6 文 + RSS      | 强            | 低（内容）            | build 107                |

### 2.2 生产 vs 分支能力矩阵

| 能力                          | 生产 ef77986 | 分支 6543a91 |
| ----------------------------- | ------------ | ------------ |
| G0/G1 wikilink + 反链         | ✅           | ✅           |
| G2 /garden 力导向+拖拽+存视图 | ✅           | ✅           |
| G2 hover 邻居 dim             | ❌           | ✅           |
| G3 popover + `/api/preview`   | ❌           | ✅           |
| React Compiler                | ❌           | ✅           |
| Turbopack FS cache (dev)      | ❌           | ✅           |
| View Transitions on BlogCard  | ❌           | ✅           |
| 概念文 15–20                  | ❌（14）     | ✅（20）     |
| SRI 生产 enable               | ❌           | ❌（故意）   |

### 2.3 本轮明确不做的事（避免范围蔓延）

- 不 enable `experimental.sri` 进默认 config
- 不改 CSP 放宽
- 不 push / 不 production deploy（无新授权前）
- 不引入评论替代、不换搜索引擎、不迁内容到 CMS

---

## 3. 市场需求调研报告

### 3.1 读者与「市场」定义

西江月的「市场」不是下载量，而是：

1. **招聘/同行审阅**：作品集与工程笔记是否可信。
2. **长期读者**：是否形成可回访的概念网络（而非信息流）。
3. **搜索偶遇**：技术查询是否落到可执行文章。
4. **维护者（含未来的自己/Agent）**：文档与测试是否降低交接成本。

### 3.2 外部趋势（2025–2026 个人技术站）

| 趋势                             | 含义                                   | 对西江月                               |
| -------------------------------- | -------------------------------------- | -------------------------------------- |
| **工程博客再强调「可验证」**     | 读者厌倦纯观点；要命令、边界、失败模式 | 已有风格；Q28 六文强化                 |
| **数字花园从极客玩具到轻量标配** | wikilink/反链常见；全站力导向仍小众    | G2 次级路由正确；勿首页化              |
| **严格 CSP 与静态站张力**        | 多数站 `unsafe-inline` 图省事          | 本站差异化壁垒；勿退                   |
| **AI 生成内容过载**              | 同质长文贬值                           | 应用「短结论 + 清单 + 真仓库路径」对抗 |
| **纸感 / 编辑式排版**            | 与纯 shadcn 模板站区分                 | 守恒 V-S1；popover 需贴合纸感          |
| **Core Web Vitals 仍影响发现**   | INP 替代 FID 后交互站更吃亏            | Compiler + 克制 VT 正确                |

### 3.3 同类方案对照（经验 / 优缺点）

#### A. Quartz（Obsidian → 静态花园）

| 优                         | 缺                              | 可借鉴                | 不可照搬        |
| -------------------------- | ------------------------------- | --------------------- | --------------- |
| wikilink/图谱/popover 成熟 | 非 Next 生态；迁移成本毁 685 测 | popover-hint 交互隐喻 | 全站迁 Quartz   |
| 内容即 vault               | 工程博客/作品集/CSP 定制弱      | 内容互链密度          | 放弃 App Router |

#### B. Astro Content Collections 博客

| 优         | 缺                        | 可借鉴                              | 不可照搬 |
| ---------- | ------------------------- | ----------------------------------- | -------- |
| 默认静态快 | 重交互花园与 RSC 模型不同 | 内容集合校验思路（本站 Zod 已等价） | 换栈     |

#### C. Nextra / Fumadocs 文档站

| 优         | 缺             | 可借鉴       | 不可照搬    |
| ---------- | -------------- | ------------ | ----------- |
| 文档 UX 强 | 个人品牌叙事弱 | 侧栏信息架构 | 变成纯 docs |

#### D. 纯 Medium/知乎/公众号

| 优   | 缺                            | 可借鉴       | 不可照搬 |
| ---- | ----------------------------- | ------------ | -------- |
| 分发 | 无工程主权、无 CSP/作品集一体 | 标题结论前置 | 放弃自建 |

#### E. 带 Orama/Pagefind 的静态站

| 优           | 缺                              | 可借鉴              | 不可照搬 |
| ------------ | ------------------------------- | ------------------- | -------- |
| 零服务端搜索 | 20 文收益低；与现 Fuse API 重复 | 他日 ≥50–200 文再评 | 现在引入 |

### 3.4 需求优先级（Kano 粗分）

| 需求                | 类型                  | 现状         | v4 动作        |
| ------------------- | --------------------- | ------------ | -------------- |
| 可读正文 + 稳定导航 | 基本型                | 满足         | 守             |
| 搜索可用            | 基本型                | Fuse API     | 守；文档补全   |
| 安全不裸奔          | 基本型                | nonce        | 守             |
| 作品集可信          | 期望型                | 有           | 守             |
| 概念互链 / 反链     | 期望型                | G0/G1 生产有 | 分支增强待合入 |
| 花园图              | 兴奋型                | 生产 G2      | 分支 G2+G3     |
| popover 预览        | 兴奋型                | 仅分支       | 合入后观察     |
| SRI                 | 无差异/期望（合规向） | 评估         | 不抢主路径     |
| GSC 展示数据        | 期望型                | blocked      | 跳过           |

### 3.5 市场结论

在 20 文、个人品牌工程站定位下，**边际读者价值最高的是「把已做好的可信能力送到生产」**，其次是 **契约文档与 a11y 打磨**，再次才是新实验（SRI enable、新布局算法）。继续在本地堆第五个实验旗标，市场侧无感，维护侧风险上升。

---

## 4. 架构设计文档（现行 + 分支目标态）

### 4.1 逻辑分层（不变）

```text
content/ + data/
  → src/lib/*   repositories, schemas, cache, pure graph/search DTO
  → src/server/* content facade, search service/engine/rate-limit
  → src/app/*    pages, Route Handlers, metadata, proxy CSP
  → src/components/* UI（共享 DTO + HTTP，禁止 import @/server）
  → src/app/styles/* tokens + BEM modules
```

依赖方向由 `module-boundaries` 测试锁死。

### 4.2 渲染与安全模型

| 层                    | 行为                                                   | 原因                   |
| --------------------- | ------------------------------------------------------ | ---------------------- |
| HTML 文档             | 动态 + per-request nonce                               | XSS 基线优先于全站 SSG |
| `/_next/static`       | 可长缓存                                               | 与 HTML 分离           |
| `/api/search`         | Node · 短 CDN cache · 限流                             | 读多；防刷             |
| `/api/preview/[slug]` | Node · `s-maxage=3600, swr=86400` · **无限流（当前）** | 轻量元数据；体积极小   |
| feed/sitemap/robots   | 构建/路由生成                                          | SEO                    |

**明确不变量**：禁止为 SSG 引入 `script-src 'unsafe-inline'`。

### 4.3 花园子域架构

```text
MDX [[wikilink]]
  → remark-wikilink（href + data-wikilink）
  → link-graph（有向边，坏链 fail-closed）
  → getGardenGraph / getBacklinks / getNeighbors
  → GardenExplorer（筛选·力导向·拖拽·hover dim）
  → WikilinkPopover（hover/focus → GET /api/preview）
```

**信任边界**：

- 预览 JSON **不得**含 `content` / `searchText` / `headings`
- 可见性继承 `getPostBySlug` 的 `published` 过滤
- 文本 React 转义；禁止 `dangerouslySetInnerHTML` 渲染预览字段

### 4.4 配置架构（分支）

```ts
// next.config.ts（摘要）
reactCompiler: true,
experimental: {
  viewTransition: true,
  turbopackFileSystemCacheForDev: true,
  // sri: { algorithm: 'sha384' }  // 故意不在默认路径
}
```

### 4.5 数据与缓存

- 内容：进程内 cache + repository；无 DB。
- 搜索：Fuse 索引按 posts 数组引用复用。
- 花园视图：`localStorage` 仅本机，非账号同步。
- 预览：HTTP 缓存 + 组件内 state 缓存（二次 hover 不打网）。

### 4.6 部署拓扑

```text
GitHub (master) → Actions (lint/test/tsc/build/budget/e2e)
                → Vercel production (incca.ccwu.cc)
feat/v3-ship    → （尚未）PR/CI/preview
```

当前 **生产拓扑未包含分支能力**；架构图若画「已上线 G3」即为虚假。

### 4.7 目标架构（合入后 1–2 周）

在分层不变前提下：

1. 生产 = 现分支能力（G3+Compiler+VT+20 文）。
2. `docs/API.md` 双 API。
3. SRI 仍开关外置，触发条件见 ADR。
4. e2e 覆盖 popover 冒烟（可选但推荐）。

---

## 5. 开发规范与编码标准

### 5.1 总则

| 规则                 | 说明                             |
| -------------------- | -------------------------------- |
| 证据优先             | 结论带路径:行号或命令输出        |
| 最小变更             | 拒绝顺手重构                     |
| 中文交付             | 用户可见说明中文；代码标识符英文 |
| UTF-8 无 BOM · LF    | Windows 注意 CRLF                |
| Conventional Commits | feat/fix/docs/test/chore…        |
| 先测后合             | 相关测 + typecheck；行为变更补测 |

### 5.2 TypeScript / React

- `strict`；Route Handler `params: Promise<…>`（Next 16）。
- Server Component 默认；交互边界 `"use client"`。
- 禁止 client 导入 `@/server`。
- Compiler 已开：**语义型** memo（邻接 Map）可保留；勿为「干净」删除领域结构。
- `transitionTypes` 必须是 `string[]`。

### 5.3 内容 / MDX

- 文件名 `YYYY-MM-slug.mdx`；slug 去前缀。
- frontmatter 经 Zod `.strict()`。
- 互链统一 `[[slug|label]]`；延伸阅读同语法。
- 新文至少 2 条 wikilink；避免坏链（构图 fail-closed）。
- 本地 build 前设 `NEXT_PUBLIC_SITE_URL`，防止 feed 污染 localhost（可提交生产 URL 的 feed 更新）。

### 5.4 CSS

- BEM 结构 + Tailwind 原子微调；决策树见 `css-conventions.md`。
- CSS 由 layout/page **显式 import**，不进 `globals.css` 的 `@import` 链。
- 纸感 token 守恒；新 UI（popover）必须吃 tokens，禁止硬编码临时色。
- `prefers-reduced-motion` 必考虑（花园、VT、动画）。

### 5.5 安全

- 密钥不进库；日志不打 token。
- CSP 变更走 ADR。
- API 投影白名单字段。
- 预览/搜索错误不泄漏 stack/路径。
- SRI 启用必须走 preview 清单，禁止「顺手 true」。

### 5.6 测试标准

| 类型            | 要求                                 |
| --------------- | ------------------------------------ |
| 纯函数 / schema | 必测                                 |
| Route Handler   | 状态码、投影、缓存头、错误码         |
| 交互组件        | 用户事件 + mock fetch；避免歧义 role |
| 边界            | module-boundaries                    |
| e2e             | 合入主路径前关键冒烟                 |

### 5.7 Git / CI

- 默认不 push。
- lint-staged：eslint + prettier。
- CI：format/lint/test/tsc/seo/blur/build/budget/e2e。
- 不跳过 hooks 除非用户明示。

---

## 6. 开发路线图

### 6.1 时间盒原则

| 阶段            | 主题                                                 | 预估    | 授权               |
| --------------- | ---------------------------------------------------- | ------- | ------------------ |
| **P0 即时**     | 文档契约：API.md preview；overview 指向 v4；基线数字 | 0.5–1h  | 本地               |
| **P1 交付**     | push `feat/v3-ship` + 看 CI；修 CI 红                | 0.5–2h  | **push**           |
| **P2 预览**     | Vercel preview 手测 G3/VT；可选 SRI 试验分支         | 1–3h    | **preview deploy** |
| **P3 合入**     | PR → master → production                             | 1h+观察 | **prod deploy**    |
| **P4 打磨**     | popover a11y、对比度、e2e popover、VT 第二落点评估   | 0.5–1d  | 本地→再交付        |
| **P5 内容观察** | 20 文图密度/搜索体验；按需补 2–4 文                  | 持续    | 内容授权           |
| **P6 条件**     | SRI stable 或合规触发；外部搜索门槛；GSC             | 触发式  | 各异               |

### 6.2 路线图依赖图

```text
P0 文档 ─────────────────────────┐
P1 push+CI ──► P2 preview ──► P3 prod
                 │
                 └─（可选）SRI trial 分支
P4 打磨可与 P1 并行（本地），合入跟随 P3
P5/P6 不阻塞 P1–P3
```

### 6.3 里程碑验收

| 里程碑        | 验收                                                         |
| ------------- | ------------------------------------------------------------ |
| M4.1 文档同构 | API.md 含 preview；数字 20 文/685 测一致                     |
| M4.2 CI 绿    | 分支在 GitHub Actions 全绿                                   |
| M4.3 预览可读 | preview URL 上 popover/花园 hover 可用                       |
| M4.4 生产对齐 | production HEAD = 合并后 tip；smoke `/garden`+抽一篇 popover |
| M4.5 打磨     | a11y 清单勾完或记入 TODO 条件项                              |

### 6.4 明确非目标（本季度）

- 换栈、CMS、Orama/Meili
- 花园进首页
- 账号体系 / 多作者
- 评论系统替换 Giscus
- 假 RUM p75

---

## 7. API 接口文档（现行契约 · 双 API）

> 本节是 **v4 规范源**；落地后应合并进 `docs/API.md`（见路线图 P0）。

### 7.1 `GET /api/search`

| 项        | 值                                                                         |
| --------- | -------------------------------------------------------------------------- |
| 运行时    | `nodejs`                                                                   |
| 认证      | 无                                                                         |
| Query     | `q` string trim，最长 100；`limit` 1–20，默认 10                           |
| 200       | `{ query, results[{item, matches, score?}], count, source:'server' }`      |
| item 投影 | 无 `content` / `searchText` / `headings`                                   |
| 400       | `QUERY_TOO_LONG`                                                           |
| 429       | `RATE_LIMITED`（60 次 / 60s / origin 实例；`Retry-After`）                 |
| 500       | `SERVER_ERROR`，`Cache-Control: no-store`                                  |
| 成功缓存  | `public, s-maxage=60, stale-while-revalidate=300`                          |
| 实现      | `src/app/api/search/route.ts` + `src/server/search/*` + `src/lib/search/*` |

客户端：`useServerSearch` 防抖 180ms，可中止；区分错误态。

### 7.2 `GET /api/preview/[slug]`（G3 · 分支已实现）

| 项         | 值                                                                            |
| ---------- | ----------------------------------------------------------------------------- |
| 运行时     | 默认 Node（未标 edge；与 content fs 一致）                                    |
| 认证       | 无                                                                            |
| Path       | `slug` 字符串；解析自 `params: Promise<{slug}>`                               |
| 200        | `{ slug, title, description, date, category: string\|null, tags: string[] }`  |
| 404        | `{ error: 'not found' }`（草稿/缺失同一路径：getPostBySlug 不可见）           |
| 成功缓存   | `s-maxage=3600, stale-while-revalidate=86400`                                 |
| **无限流** | 当前实现无限流；滥用面小于 search（无查询引擎），但 **P4 可评估同源轻量限流** |
| 实现       | `src/app/api/preview/[slug]/route.ts`                                         |
| 测试       | `route.test.ts`：投影/无 content/404/null category                            |

#### 7.2.1 示例

```bash
curl -sS "https://incca.ccwu.cc/api/preview/nextjs-app-router"
# 生产在合入前可能 404 路由；分支本地：
curl -sS "http://localhost:3000/api/preview/react-compiler-in-practice"
```

成功体示例：

```json
{
  "slug": "react-compiler-in-practice",
  "title": "React Compiler 生产笔记：自动 memo 的边界与收益",
  "description": "Next 16 启用 React Compiler 后……",
  "date": "2026-07-21",
  "category": "前端开发",
  "tags": ["React", "Next.js", "性能优化"]
}
```

#### 7.2.2 错误与安全注释

- 不返回 500 细节；getPostBySlug 抛错时当前实现未单独 catch——**技术债 P2**：与 search 对齐 fail-soft。
- slug 未额外 strip `..`；依赖仓库 slug 字符集与查找——**可接受**因底层是列表 find 不是路径拼接读文件。
- 缓存可能缓存 404（视平台）；可接受。

### 7.3 非 API 但契约相关

| 出口                         | 说明                   |
| ---------------------------- | ---------------------- |
| RSS `public/feed.xml`        | 构建生成；必须生产域名 |
| `sitemap.xml` / `robots.txt` | 路由生成               |
| OG `opengraph-image`         | 每文 SSG 参数          |

### 7.4 变更检查清单（API）

```bash
pnpm test src/app/api/search src/app/api/preview src/server/search src/lib/module-boundaries.test.ts
pnpm typecheck
# 更新 docs/API.md
```

---

## 8. 方案对比 · 下一主包（交付策略）

评分维：读者价值 25 · 成本 20（高分=更省）· 约束 20 · 维护 15 · 风险 10（高分=更安全）· 品牌 10。总分 100。

| 方案              | 描述                              | 读者 | 成本 | 约束 | 维护 | 风险 | 品牌 | 总分   |
| ----------------- | --------------------------------- | ---- | ---- | ---- | ---- | ---- | ---- | ------ |
| **D1 交付优先**   | push 分支 + CI + 修红；暂缓新功能 | 23   | 16   | 19   | 14   | 8    | 9    | **89** |
| D2 继续本地堆     | SRI enable 试验 + 新文 + 新布局   | 12   | 10   | 14   | 8    | 5    | 7    | 56     |
| D3 只打磨不合入   | a11y/CSS 本地，不分叉收敛         | 10   | 14   | 12   | 9    | 9    | 8    | 62     |
| D4 直接 prod 强推 | 跳过 CI/preview                   | 22   | 18   | 8    | 10   | 2    | 6    | 66     |
| D5 丢弃分支       | hard reset 回 ef77986             | 5    | 15   | 10   | 6    | 7    | 4    | 47     |

**最佳：D1**。理由见 §12。

---

## 9. 方案对比 · 安全渲染（SRI 时机）

| 方案                       | 描述        | 读者 | 成本 | 约束 | 维护 | 风险 | 品牌 | 总分   |
| -------------------------- | ----------- | ---- | ---- | ---- | ---- | ---- | ---- | ------ |
| **R-A 维持 nonce-only**    | 现状+ADR    | 18   | 18   | 20   | 14   | 9    | 9    | **88** |
| R-B 立即 enable SRI 进生产 | config 打开 | 14   | 8    | 12   | 8    | 4    | 8    | 54     |
| **R-E 评估+预览后决定**    | 现 ADR 路径 | 16   | 12   | 18   | 12   | 8    | 9    | **75** |
| R-X unsafe-inline 换 SSG   | 禁止对照    | 10   | 16   | 2    | 10   | 1    | 3    | 42     |

**现阶段最佳：R-A 为主，R-E 为辅（不抢 D1）**。

---

## 10. 方案对比 · 体验打磨包

| 方案        | 描述                                           | 读者 | 成本 | 约束 | 维护 | 风险 | 品牌 | 总分   |
| ----------- | ---------------------------------------------- | ---- | ---- | ---- | ---- | ---- | ---- | ------ |
| **E1 小包** | popover 键盘说明、对比度、loading 态、API 文档 | 20   | 16   | 18   | 13   | 9    | 9    | **85** |
| E2 中包     | + e2e popover + focus trap 讨论 + 触屏策略文案 | 21   | 12   | 17   | 12   | 8    | 9    | 79     |
| E3 大包     | 共享元素 VT、图谱 PNG 导出、新布局算法         | 15   | 6    | 14   | 7    | 6    | 8    | 56     |
| E0 无动作   | 合入后纯观察                                   | 12   | 19   | 16   | 10   | 9    | 7    | 73     |

**最佳：E1（可与 D1 并行本地，或紧随合入）**。

---

## 11. 方案对比 · 内容节奏

| 方案       | 描述                              | 读者 | 成本 | 约束 | 维护 | 风险 | 品牌 | 总分   |
| ---------- | --------------------------------- | ---- | ---- | ---- | ---- | ---- | ---- | ------ |
| **C-hold** | 20 文观察 1 窗；修坏链/补反向链接 | 18   | 17   | 18   | 13   | 9    | 9    | **84** |
| C+4        | 再写 4 篇加深                     | 20   | 10   | 16   | 11   | 8    | 9    | 74     |
| C-mass     | 冲 50 文                          | 16   | 4    | 12   | 6    | 7    | 7    | 52     |
| C-stop     | 冻结内容只做工程                  | 12   | 18   | 15   | 12   | 9    | 6    | 72     |

**最佳：C-hold**（Q28 刚完成，避免内容泡沫）。

---

## 12. 为什么最佳组合是 D1 + R-A(+R-E 不抢跑) + E1 + C-hold

### 12.1 对齐目标

- **读者**：最快获得 G3、6 篇新文、更顺滑的列表→详情（VT）、更稳的交互（Compiler）。这些都已实现，缺的是**管道**。
- **约束**：不换栈、不放宽 CSP、不假运营——D1 不碰这些。
- **风险**：6 commits 一次经 CI 检验，优于无限本地堆积后大爆炸合并。
- **品牌**：工程站的品牌是「可验证」；长期 ahead 6 不推送与品牌叙事相反。

### 12.2 为什么不是 D2/D4/D5

- **D2**：SRI enable / 新布局在 experimental 与范围上放大风险，读者边际低。
- **D4**：跳过 CI 违反本站门禁文化。
- **D5**：丢弃已验证 build/测的价值，纯浪费。

### 12.3 为什么 SRI 不抢主路径

- 类型与清单已准备（沉没小）。
- 启用收益在 Vercel 托管下边际；成本是回归面。
- 与「稳定性 > 功能性」一致。

### 12.4 为什么内容 C-hold

- 14→20 已完成 v3 内容目标。
- 图密度与搜索体感需要**生产观察**，不是再写 10 篇同质「XX 实战」。

---

## 13. 目标 · 约束 · 输入 · 输出 · 验收标准

### 13.1 目标（v4 窗口）

| ID  | 目标                      | 度量                             |
| --- | ------------------------- | -------------------------------- |
| T1  | 分支能力经 CI 验证        | Actions success                  |
| T2  | 生产与 tip 对齐（若授权） | HEAD 一致 + smoke                |
| T3  | API 文档双契约            | API.md 含 preview                |
| T4  | 安全基线不回退            | 无 unsafe-inline；SRI 默认关     |
| T5  | 测试基线不降              | ≥685 测绿                        |
| T6  | 内容规模稳定可述          | 20 文 + 互链无坏链               |
| T7  | 体验可访问底线            | popover/花园键盘路径有说明或改进 |

### 13.2 约束

| 硬约束          | 说明                           |
| --------------- | ------------------------------ |
| HC1 锁栈        | Next/React/MDX                 |
| HC2 锁 CSP 哲学 | nonce；禁 unsafe-inline 换 SSG |
| HC3 密钥        | 不入库                         |
| HC4 外发门控    | push/deploy 需明确授权         |
| HC5 不假完成    | GSC/RUM 等                     |
| HC6 最小依赖    | 新依赖要 ADR/说明              |

### 13.3 输入

- 仓库 `D:\blog` 当前分支
- 用户表单选择（§18）
- （可选）Vercel/GitHub 凭证由用户环境提供

### 13.4 输出

- 本报告
- （执行后）commit/CI 结果/文档补丁
- 更新 handoff 记忆

### 13.5 验收命令包

```bash
cd D:/blog
git status
git rev-list --count origin/master..HEAD
pnpm typecheck
pnpm test
pnpm lint
pnpm format:docs:check
pnpm check:docs
# 需 site URL：
# $env:NEXT_PUBLIC_SITE_URL='https://incca.ccwu.cc'; pnpm build
# 授权后：
# git push origin feat/v3-ship
# pnpm test:e2e
```

功能验收：

- [ ] `/api/preview/:slug` 200 投影正确、无 content
- [ ] 文章内 wikilink hover 出卡（支持浏览器）
- [ ] `/garden` hover dim 邻居
- [ ] BlogCard 导航在支持浏览器有 VT（可降级）
- [ ] CSP 无控制台违规

---

## 14. 技术债清单（P0–P3）

| 级     | 债                                | 说明                                | 建议                 |
| ------ | --------------------------------- | ----------------------------------- | -------------------- |
| **P0** | 生产分叉                          | 6 commits 未进 origin               | D1 push              |
| **P0** | API 文档缺失 preview              | 契约漂移                            | 写 API.md            |
| **P1** | 本轮未跑 e2e                      | G3 无浏览器测                       | push 后或本地 e2e    |
| **P1** | preview 无显式 try/catch          | 与 search 500 风格不一致            | 小补丁               |
| **P1** | popover a11y                      | tooltip 无 aria-describedby；触屏弱 | E1                   |
| **P2** | preview 无限流                    | 滥用面小但可不对称                  | 评估                 |
| **P2** | launch-baseline 仍写 CI 待 v3     | 合入后更新                          | hygiene              |
| **P2** | 手写「14 文」残留于旧报告         | 历史快照可留；维护文档已改 20       | 勿改历史报告数字作假 |
| **P3** | SRI 未预览验证                    | ADR 已记                            | 触发时做             |
| **P3** | 花园导出 PNG / 多布局             | TODO 可选                           | 非目标               |
| **P3** | Node engine 22 vs 本机 24 warning | 警告非失败                          | 已知                 |

---

## 15. 用户体验与视觉风格升级

### 15.1 体验原则（继承）

1. **结论先行**（文章与 UI 文案）。
2. **失败可导航**（404/空搜已做）。
3. **渐进增强**（VT、popover）。
4. **动效可关**（reduced-motion）。
5. **纸感安静**：少炫技，多阅读韵律。

### 15.2 已具备的体验资产

- 纸感 backdrop + token 明暗
- 阅读进度 / 偏好
- 反链折叠、文内邻接
- 花园筛选与存视图
- 分支：popover、hover dim、列表→详情 VT

### 15.3 打磨建议（E1 明细）

| 项                 | 现状        | 建议                                         |
| ------------------ | ----------- | -------------------------------------------- |
| popover 定位       | CSS 跟随    | 检查视口边缘防裁切                           |
| popover 对比度     | 新样式      | 暗色模式对比 ≥4.5                            |
| loading「加载中…」 | 有          | 失败保持不吵（已有）                         |
| 键盘               | focus 打开  | 补充 `aria-describedby` 或改 `role` 策略文档 |
| 触屏               | 无 hover    | 依赖点击进文；可考虑长按非必须               |
| VT                 | 仅 BlogCard | 第二落点慎选（系列路径？）                   |
| 花园               | 鼠标 dim    | 保持 focus 高亮；文案提示可拖拽              |

### 15.4 视觉风格守恒清单

- 不引入第二套主色体系
- popover 使用 `card` / `border` / `muted` token
- 圆角与阴影跟卡片层级
- 代码块风格不因 G3 改变
- 禁止为「科技感」加霓虹/大玻璃

### 15.5 文案微改进方向

- 花园页短说明：「悬停节点高亮邻居；键盘可聚焦打开」
- 预览卡日期格式与列表一致
- 错误态不对读者弹 toast

---

## 16. 同类经验提炼（可执行教训）

1. **Quartz popover 好在快；Next 应用 JSON 预览更干净**——已走对。
2. **图谱放首页易成玩具**——次级 `/garden` 正确。
3. **严格 CSP 是差异化**——不要用友站「能 SSG」自我动摇。
4. **内容网络比内容数量重要**——20 篇高质量互链优于 50 篇孤岛。
5. **实验旗标分「工程红利」与「架构变更」**——Compiler 可进默认；SRI 不可。
6. **文档与代码同构是个人站寿命的决定因素**——API.md 落后是真债。

---

## 17. 完整验收矩阵（v4）

| 域       | 检查         | 命令/方式               | 通过标准    |
| -------- | ------------ | ----------------------- | ----------- |
| 静态质量 | typecheck    | `pnpm typecheck`        | 0 error     |
| 静态质量 | unit         | `pnpm test`             | 685+ 绿     |
| 静态质量 | lint         | `pnpm lint`             | 0 error     |
| 文档     | links        | `pnpm check:docs`       | 绿          |
| 构建     | build        | site URL + `pnpm build` | 全页生成    |
| 安全     | CSP          | 预览/生产控制台         | 无违规      |
| 契约     | search       | 测+curl                 | 码表一致    |
| 契约     | preview      | 测+curl                 | 投影一致    |
| 体验     | popover      | 手测/e2e                | 出卡/离开关 |
| 体验     | garden hover | 手测                    | dim 正确    |
| 交付     | CI           | Actions                 | success     |
| 交付     | smoke        | 生产 URL                | 200         |

---

## 18. 交互式表单（请选择 · 选择后执行）

> 下列选项将决定下一执行包。默认推荐已标出。多维决策请逐项选。

### 表单 A · 主交付包

| 选项                       | 含义                                                                   |
| -------------------------- | ---------------------------------------------------------------------- |
| **A1 D1 交付优先（推荐）** | 准备 push `feat/v3-ship`（仍先等你最终确认 push）+ 修 CI；并行 P0 文档 |
| A2 仅 P0 文档              | 只改 API.md/overview，不 push                                          |
| A3 D1+E1                   | 文档 + 小打磨补丁 + 再请求 push                                        |
| A4 继续本地功能            | 偏离最佳；需写明要做的功能                                             |
| A5 暂缓一切                | 只保留本报告                                                           |

### 表单 B · push / deploy 授权

| 选项                                   | 含义             |
| -------------------------------------- | ---------------- |
| **B0 仍不授权 push（默认）**           | 只本地           |
| B1 授权 `git push origin feat/v3-ship` | 开 CI            |
| B2 授权 push + Vercel preview          | CI+预览          |
| B3 授权合 master + 生产 deploy         | 最高权限；需显式 |

### 表单 C · SRI

| 选项                                                     | 含义  |
| -------------------------------------------------------- | ----- |
| **C0 维持 Evaluation，不动 config（推荐）**              |       |
| C1 本地临时开 SRI build 试验（完后还原，不 commit 开启） |       |
| C2 开分支 enable SRI 并请求 preview                      | 需 B2 |

### 表单 D · 体验包

| 选项                        | 含义             |
| --------------------------- | ---------------- |
| **D0 合入后再打磨（推荐）** |                  |
| D1 现在做 E1 小包           | popover/CSS/文档 |
| D2 E2 中包                  | +e2e             |

### 表单 E · 内容

| 选项                       | 含义         |
| -------------------------- | ------------ |
| **E0 C-hold 观察（推荐）** |              |
| E1 再写 2–4 篇             | 需选题方向   |
| E2 只补既有文反向链接      | 小改 content |

### 表单 F · 报告与基线

| 选项                                                 | 含义        |
| ---------------------------------------------------- | ----------- |
| **F1 提交本 v4 报告 + 回写 API.md/overview（推荐）** | 本地 commit |
| F0 仅保留工作区未提交                                |             |

---

## 19. 执行说明（表单回收后）

Agent 将：

1. 汇总选项 → 生成执行清单。
2. 在授权范围内改代码/文档。
3. 跑 §13.5 验收。
4. 本地 commit（若 F1）。
5. 仅当 B1+ 时 push；B2/B3 再部署。
6. 输出执行结果表（commit、测试、剩余风险、硬边界遵守声明）。

---

## 20. 附录 · 汉字量与诚实声明

- 本报告目标：**≥10000 汉字**，包含可执行规格而非空话。
- 统计方式（PowerShell）：`([regex]::Matches((Get-Content -Raw …), '[一-鿿]')).Count`
- **未 push 功能不得称为生产已上线**。
- wikilink 边数来自 `rg` 启发式，合入后应以 `getGardenGraph` 实测为准刷新。
- e2e 本轮未重跑：记入 P1 债。

### 附录 B · 关键路径速查

| 用途         | 路径                                                       |
| ------------ | ---------------------------------------------------------- |
| 本报告       | `docs/architecture-optimization-research-2026-07-21-v4.md` |
| v3           | `docs/architecture-optimization-research-2026-07-21-v3.md` |
| SRI ADR      | `docs/adr/2026-07-21-sri-over-nonce-evaluation.md`         |
| 架构         | `docs/architecture.md`                                     |
| API          | `docs/API.md`（待补 preview）                              |
| CSS          | `docs/css-conventions.md`                                  |
| 内容流程     | `docs/content-workflow.md`                                 |
| TODO         | `TODO.md`                                                  |
| 配置         | `next.config.ts`                                           |
| Preview 路由 | `src/app/api/preview/[slug]/route.ts`                      |
| Search 路由  | `src/app/api/search/route.ts`                              |

### 附录 C · 六篇新文 slug

1. `react-compiler-in-practice`
2. `nextjs-view-transitions`
3. `csp-nonce-and-sri`
4. `digital-garden-force-layout`
5. `mdx-remark-pipeline`
6. `turbopack-fs-cache-dx`

### 附录 D · 历史决议不重开清单

换栈 Astro/Hugo/Quartz · CMS · Meili/Algolia/Orama 现在 · `unsafe-inline` · 花园首页化 · 假 GSC · 无授权生产 deploy。

---

## 21. 深度展开 · 交付风险与回滚

### 21.1 push 后 CI 可能红点

| 风险          | 缓解                               |
| ------------- | ---------------------------------- |
| Node 版本矩阵 | 以 CI 22.x 为准                    |
| e2e 浮抖      | 重跑；定位 G3 是否需 wait          |
| bundle budget | Compiler 微增则调预算或优化 import |
| audit         | 锁文件已含 compiler 依赖           |

### 21.2 回滚策略

- 功能 flag：SRI 本就关。
- 合并后问题：`git revert` 单 commit 包（内容/feat/test 分离利于 revert）。
- 生产问题：Vercel 回滚上一 deployment。

### 21.3 监控（无 RUM 时）

- Vercel 日志 4xx/5xx on `/api/preview`
- Search 429 比率
- 用户反馈人工

---

## 22. 深度展开 · 搜索是否仍甜点（20 文）

Fuse 内存索引在 20 文下延迟可忽略。Pagefind 适合静态全量导出场景；本站 HTML 动态 + 已有 API，**引入第二搜索无收益**。门槛维持：≥200 文或可复现 p95 劣化证据 → ADR。

预览 API 与搜索 API 分离是正确的：一个服务「找文」，一个服务「悬停摘要」。合并成 GraphQL 过度。

---

## 23. 深度展开 · 品牌与信息架构

```text
首页（编辑精选 + 路径）
  → 博客列表/标签/分类/系列
  → 文章（prose + 邻接 + 反链 + wikilink popover）
  → 花园（次级探索）
  → 作品 / 链接 / 关于
```

不要让花园与首页抢叙事。popover 是**阅读增强**，不是导航中心。

---

## 24. 结语

v3 解决了「做什么功能」；v4 的诚实答案是：**功能在分支里已经做得差不多了，市场与架构的下一约束是交付与契约同构**。最佳路径不是再发明第五个子系统，而是把 `6543a91` 变成可验证的生产事实，并补上 API 文档与小而真的体验打磨。

**请填写 §18 表单。** 收到选择后按最佳可行子集执行并回报结果。

---

_文档版本：v4 · 2026-07-21 · 作者：架构调研 Agent · 证据截止：本地 `6543a91`_

---

## 25. v4 表单决议归档（2026-07-21 夜 · 用户已选）

| 表单           | 用户选择               | 执行含义                                     |
| -------------- | ---------------------- | -------------------------------------------- |
| A 主交付包     | **A1 D1 交付优先**     | 做 P0 文档同构与交付准备；不把新功能当主路径 |
| B 外发         | **B0 仍不授权 push**   | 禁止 `git push` / deploy；仅本地 commit      |
| C SRI          | **C0 维持 Evaluation** | 不改 `next.config.ts` 启用 sri               |
| D/E 体验与内容 | **D0+E0**              | 合入后再打磨；内容 20 文观察，不强制新文     |

本决议不推翻文首硬边界，仅在 v4 窗口内收敛执行包为：

1. 扩写并归档本报告（汉字量达标）
2. 回写 `docs/API.md` 收录 preview
3. 更新 overview 索引指向 v4
4. 本地 commit；输出「待授权 push 清单」
5. **不**做 E1 代码打磨、**不**再写 MDX、**不** enable SRI

---

## 26. 市场需求调研 · 深化篇

### 26.1 个人技术品牌站的「购买决策」隐喻

读者不会付费购买西江月，但会支付注意力与信任。信任决策近似 B2B 采购的缩小版：

| 采购问题         | 读者问题                      | 西江月证据                   |
| ---------------- | ----------------------------- | ---------------------------- |
| 供应商是否专业？ | 作者是否真写过生产代码？      | 命令、路径、失败模式、测试数 |
| 交付是否稳定？   | 站点是否经常挂或 CSP 乱报错？ | CI 与 nonce 与 smoke         |
| 文档是否可交接？ | 三个月后自己是否看得懂？      | ADR 与 API 与本系列报告      |
| 生态是否绑死？   | 是否被某一 CMS 或云锁定？     | 本地 MDX，托管可迁           |

因此「再做一个很酷的实验特性」若不能增加上述证据，市场回报接近零。D1 把已有证据推到生产，比再写一个实验特性更符合采购逻辑。

### 26.2 内容供给过剩下的差异化

近年来生成式长文降低了字数门槛，提高了可验证门槛。同质「从入门到精通」贬值。西江月的差异化应坚持：

1. **仓库耦合**：文中路径在仓库中真实存在。
2. **边界诚实**：写清未 push、未测 e2e、无限流等事实。
3. **互链网络**：概念可回访，而不是信息流刷完即走。
4. **安全叙事**：nonce CSP 是少见的个人站实践，可写成信任信号。

### 26.3 数字花园市场的三层用户

| 层     | 诉求                   | 产品响应                    |
| ------ | ---------------------- | --------------------------- |
| 浏览者 | 快速判断这篇是否值得读 | popover 摘要（G3）          |
| 探索者 | 从一个概念跳到邻域     | 反链、邻接、花园图          |
| 维护者 | 改内容不炸构建         | Zod、坏链 fail-closed、测试 |

G0 到 G3 分别服务这三层；缺 G3 时浏览者成本高。分支已补 G3，市场缺口在生产可达性，不在设计本身。

### 26.4 竞品体验地图（抽象）

Quartz 用户路径：vault 到一键图谱与 popover，作品集弱。  
Astro 博客用户路径：静态快，交互花园弱，内容集合强。  
模板站用户路径：炫技首页，内容空，跳出高。  
西江月目标路径：纸感阅读，工程可信，轻花园，严 CSP。

定位交叉点决定了不要用炫技首页抢预算，而要用契约与测试把工程可信做厚。

### 26.5 搜索与发现的市场现实

个人站自然搜索往往长尾。在无 GSC 数据时，不应假装 SEO 战略精确。可执行的发现策略仅限：

- 技术正确的 sitemap、robots、canonical、OG
- 标题含可检索实体（Next、CSP、PostgreSQL 等）
- 内链提升主题簇权重（Q28 已做一波）
- 外部分发属运营，非本 Agent 假完成范围

### 26.6 成本结构（自建站）

| 成本       | 量级           | 备注         |
| ---------- | -------------- | ------------ |
| 托管       | 低（个人）     | 已用 Vercel  |
| 域名与 DNS | 低             | 用户侧       |
| 工程时间   | 主成本         | 作者与 Agent |
| 认知负担   | 文档债务时上升 | 本轮降债     |

结论：优化时间成本的正确方式是减少分叉寿命与阻止范围蔓延，不是引入 CMS 假装提高效率——CMS 会把成本转移到同步与权限。

### 26.7 需求访谈替代：行为证据

在无真实用户访谈预算时，用行为代理指标：

| 代理         | 含义               | 现状   |
| ------------ | ------------------ | ------ |
| 内链点击潜力 | 互链密度           | 已提升 |
| 停留代理     | 长文结构与结论段   | 有     |
| 信任代理     | 可复制命令是否可跑 | 有     |
| 返回代理     | 系列与反链         | 有     |

G3 提升「点击前信息」，理论上降低误点与跳出；需生产后才有体感验证。

---

## 27. 架构设计 · 深化篇

### 27.1 控制面与数据面

| 面     | 组成                      | 变化频率     |
| ------ | ------------------------- | ------------ |
| 数据面 | MDX 与 JSON 内容          | 中（写作）   |
| 控制面 | next.config、CSP、CI、ADR | 低（需评审） |
| 体验面 | 组件交互、CSS             | 中           |

v3 ship 同时动了控制面、体验面与数据面。合入后应冻结控制面一段时间，只允许数据面与小体验修补，降低回归耦合。

### 27.2 缓存层次

浏览器内存中的 popover state，到 CDN 边缘的 search 与 preview 缓存，再到进程内的 posts 与 fuse 索引，最后到文件系统上的 content 与 data。每一层失效语义不同。不要引入 Redis 统一缓存——对象太小，层数已够。

### 27.3 错误预算式思维（无正式 SLO 时）

| 信号               | 预算直觉   | 超支动作             |
| ------------------ | ---------- | -------------------- |
| CI 红              | 合入零容忍 | 修或 revert          |
| CSP 违规           | 零容忍     | 立即修               |
| preview 五秒错误   | 低容忍     | 对齐 search 的 catch |
| 搜索四二九         | 可观察     | 调限流或平台防火墙   |
| 实验室性能显著回退 | 中         | 挡住实验旗标         |

### 27.4 模块边界

组件经 HTTP 访问路由处理器，路由处理器经 server 访问 lib。组件禁止直接导入 server，lib 禁止导入 app。G3 遵守该边界：popover 只使用 fetch，不导入 repository。若有人优化成在客户端直出整篇 MDX，应在评审拒绝。

### 27.5 配置风险分级

| 配置项                         | 级  | 理由               |
| ------------------------------ | --- | ------------------ |
| reactCompiler                  | 中  | 已验证 build       |
| viewTransition                 | 中  | 渐进增强           |
| turbopackFileSystemCacheForDev | 低  | 仅开发态           |
| experimental.sri               | 高  | 全局 HTML 形态变化 |
| CSP 指令                       | 高  | 安全基线           |

高分级变更强制 ADR 与 preview；中分级允许分支验证后合入；低分级可随工程包。

### 27.6 多环境一致性

本机开发使用本地内容与本地环境文件；本机生产构建必须带站点 URL；预览与生产使用平台环境变量。B0 下只保证本机一致性；预览与生产待授权。

### 27.7 花园数据流的信任边界再述

构图阶段看到的是可见文章集合；预览接口重复使用同一可见性函数；客户端永不接收正文。这条链保证「草稿不会因为 hover 而泄漏」。任何跳过 facade 的快捷方式都会破坏该证明。

### 27.8 与中间件及代理的关系

CSP nonce 在请求路径注入。预览与搜索是 JSON，不需要 nonce，也不应被误加严格的文档 CSP 导致缓存复杂化。保持 API 与文档路由的头策略分离。

---

## 28. 开发规范 · 深化篇（可直接 onboarding）

### 28.1 新增文章检查单

1. 文件名符合年月前缀与 slug 规则且不冲突
2. frontmatter 必填标题、描述、日期
3. 至少两条指向已存在 slug 的 wikilink
4. 相关旧文是否反向补链
5. 测试与带站点 URL 的构建通过
6. 若生成 feed，域名为生产域

### 28.2 新增路由处理器检查单

1. 运行时是否必须 Node
2. 输入校验与上限
3. 投影白名单
4. 错误是否泄漏
5. 缓存头是否正确
6. 是否要限流
7. 单测与 API 文档同步
8. 模块边界测试仍绿

### 28.3 新增客户端交互检查单

1. 是否真需要客户端组件
2. 失败是否静默或可恢复
3. 是否支持键盘
4. 是否尊重减少动效
5. 是否引入新依赖
6. 测试是否覆盖主路径与至少一条失败路径

### 28.4 代码评审提问清单

- 读者可感收益是什么
- 若只完成一半，哪半截可独立合入
- 是否扩大了与远端的分叉
- 是否有文档与测试同构
- 是否碰了内容安全策略、密钥或部署

### 28.5 提交信息风格

使用类型前缀区分功能、测试、内容、文档与卫生提交，避免巨型单一提交，便于回滚与追溯。

### 28.6 编码期禁止清单

- 在客户端组件导入 server 包
- 在 MDX 渲染路径执行动态代码或无防护 HTML 拼接
- 为方便关闭严格 schema
- 在生产路径打印密钥
- 用宽松类型掩盖路由新签名
- 把过渡类型写成字符串
- 把子资源完整性配置写成布尔而不查类型定义

### 28.7 文档同步义务

行为变更必须更新下列之一或多项：API 文档、架构说明、ADR、内容工作流、CSS 规范、TODO。只改代码不改文档视为未完成。

### 28.8 测试命名与稳定性

优先用户可见角色与标签；遇到列表与图形双链接时，用更具体的选择器（如圆形节点的无障碍标签），避免不稳定查询。

---

## 29. 开发路线图 · 深化与日历化

### 29.1 在 B0 约束下的虚拟日历

| 日     | 若保持 B0             | 若未来升到 B1        |
| ------ | --------------------- | -------------------- |
| 当日   | 本报告与 API 文档提交 | 同左                 |
| 次日   | 作者本地手测 G3       | 推送并盯持续集成     |
| 再次日 | 可选体验小包本地      | 修复持续集成失败     |
| 之后   | 等待授权              | 预览与生产按授权升级 |

B0 的价值是降低误推送风险；代价是生产读者持续看不到 G3 与新文。交接中必须写明读者不可见。

### 29.2 合入列车建议

列车甲：当前 v3 ship 与本轮文档。  
列车乙：体验小打磨。  
列车丙：端到端测试增强。  
列车丁：子资源完整性试验分支，可丢弃。

禁止把后三列硬塞进甲列导致列车永远不开。

### 29.3 角色分饰

架构负责报告与决策记录；实现负责功能；质量负责测试；发布负责推送与部署；编辑负责正文。本轮架构与实现文档已做，发布等待授权，体验代码按 D0 暂缓。

### 29.4 三种完成定义

分支级完成：功能与单测与类型检查与构建通过——**已达**。  
发布级完成：远端包含提交且持续集成绿且生产冒烟——**未达**。  
体验级完成：体验清单与可选端到端——**未达**。

混用三种完成定义会造成沟通噪音，本报告强制分开。

### 29.5 冻结窗口建议

发布级完成后进入一到两周控制面冻结：只接受缺陷修复、内容微调与文档。不接受新实验旗标。

---

## 30. API 与集成 · 深化

### 30.1 幂等与安全方法

两接口皆为获取方法，语义幂等、无业务副作用。限流计数除外且仅搜索启用。它们都不应成为写入入口。

### 30.2 版本策略

不使用路径版本前缀。破坏性变更通过新增字段、弃用、再删除的顺序，并同步文档与测试。个人站流量小，不维护并行版本。

### 30.3 观测字段建议

若以后增加日志，只记录路由名、状态、延迟分桶、是否限流。不记录完整查询词等可能敏感输入；文章 slug 作为公开资源名可记。

### 30.4 与开放图谱和订阅源的关系

开放图谱图片与订阅源是构建或渲染出口，不是运行时接口，但同属对外契约。改标题或描述会影响页面、预览与订阅源。应以 frontmatter 为单一来源。

### 30.5 契约测试金字塔

顶端少量端到端，中层路由集成测试，底层纯函数与 schema。预览已有路由测试，缺端到端；搜索已有多层。健康不对称，合入前补关键路径即可。

### 30.6 客户端集成契约

搜索客户端防抖与中止；预览客户端状态缓存与中止。两者都不得在失败时用恼人弹窗打断阅读。错误分类在搜索更细，预览更简，符合场景。

---

## 31. 用户体验 · 场景脚本

### 31.1 列表到正文

读者在博客列表扫卡片，点击标题，可能经历视图过渡，阅读结论段，悬停维基链见摘要卡，再决定是否跳转。失败点是卡片被裁切、对比度不足、请求慢而无反馈。体验小包针对这些；D0 表示先交付再修。

### 31.2 正文到花园

读者从导航进入花园，筛选标签，悬停节点看邻居，拖拽整理并保存视图，点击打开文章。失败点是触屏无悬停、减少动效下列表是否够用。当前存在降级路径，文案可更明示。

### 31.3 搜索不命中

输入冷僻词后，空态给出去标签、花园、作品等出口，读者不困死。该能力已在此前交付，回归时勿删。

### 31.4 维护者晨间检查

查看分支与持续集成，运行测试，扫外部阻塞待办，不假装搜索控制台已配置。Agent 应自动化前半，把账号类留给人类。

### 31.5 无障碍底线

跳过链接、焦点可见、语义标题层级、减少动效、键盘可达的关键控件。花园节点已具备焦点与键盘打开；预览在焦点时也会打开。缺的是描述关系与触屏策略说明。

---

## 32. 视觉风格 · 设计令牌使用规约

### 32.1 表面层级

页面底使用纸感背景；区块使用卡片色与边框；悬浮层（预览卡）使用卡片色加更高阴影与边框；强调使用主色；静音文字使用弱前景色。预览必须落在悬浮层，避免与正文抢主色。

### 32.2 密度

阅读页宽松行高、克制分割线；花园控制条中等密度；预览卡低密度，标题、日期、摘要三行足够。

### 32.3 动效预算

视图过渡建议不超过两百毫秒；预览显隐可更短或不动画；力导向可关；已有滚动揭示不要叠床架屋。

### 32.4 暗色模式

所有新表面在暗色根类下检查边框可见、正文对比、链接不只靠颜色。无自动化对比度门时，合入后人工抽检两篇文章与花园。

### 32.5 与双层样式策略共存

结构性用 BEM，原子微调用工具类。禁止在内容里堆无法复用的超长工具类串装饰预览卡。

### 32.6 品牌关键词

安静、纸、可信、克制、可验证。任何视觉提案若违反其中两项以上，默认拒绝。

---

## 33. 技术债治理策略

### 33.1 合法与非法引入

合法：有意推迟、时间盒切分、外部账号阻塞。  
非法：先凑合今晚再修且无记录、复制粘贴过期数字、用假完成换进度。

### 33.2 债务看板（执行后）

| 编号               | 债     | 状态变化        |
| ------------------ | ------ | --------------- |
| 生产分叉           | 未推送 | 仍在（B0）      |
| 接口文档缺预览     | 缺     | **本轮关闭**    |
| 端到端未跑         | 缺     | 仍在            |
| 预览缺统一错误捕获 | 缺     | 仍在（D0 不修） |
| 无障碍打磨         | 缺     | 仍在（D0）      |
| 限流不对称         | 记录   | 仍在            |

### 33.3 还债触发器

授权推送则强制面对持续集成与端到端；用户投诉预览则提前体验小包；框架宣布子资源完整性稳定则升级评估；搜索延迟证据出现则开搜索决策记录。

---

## 34. 风险登记册

| 编号 | 风险                 | 可能性 | 影响 | 缓解                       |
| ---- | -------------------- | ------ | ---- | -------------------------- |
| 一   | 分叉过久合并冲突     | 中     | 中   | B0 下勿再堆大功能          |
| 二   | 首次推送持续集成失败 | 中     | 中   | 本地已测试与构建           |
| 三   | 编译器边缘组件缺陷   | 低     | 中   | 已全量构建；可回滚对应提交 |
| 四   | 预览线上布局差       | 中     | 低   | 体验小包                   |
| 五   | 订阅源再次污染       | 中     | 中   | 站点 URL 纪律              |
| 六   | 误开启子资源完整性   | 低     | 高   | C0 与决策记录              |
| 七   | 文档再次漂移         | 中     | 中   | 总览指向本版；合入后改基线 |

---

## 35. 待授权推送清单（B0 下预置，不执行）

当用户未来改为授权推送时，建议：

1. 确认位于功能分支且工作树干净
2. 再跑测试与类型检查
3. 推送到远端同名分支
4. 打开持续集成页面观察
5. 若失败：本地修后推送，不跳过钩子

可选拉取请求描述应包含相对生产基线的提交摘要、测试与构建数字、安全声明（内容安全策略未放宽、子资源完整性未启用）、以及端到端建议观察项。

---

## 36. 执行结果位（本轮）

| 项               | 结果                       |
| ---------------- | -------------------------- |
| 表单             | A1 与 B0 与 C0 与 D0 与 E0 |
| 本报告           | 扩写达标                   |
| 接口文档         | 已收录预览接口             |
| 总览索引         | 已指向本版为现行决策       |
| 推送             | 未执行                     |
| 子资源完整性配置 | 未改                       |
| 体验代码         | 未做                       |
| 新正文           | 未做                       |
| 本地提交         | 见版本历史最新记录         |

### 36.1 硬边界遵守声明

未换栈；未放宽内容安全策略；未假完成外部账号；未推送与部署；未启用子资源完整性；密钥未入库。

---

## 37. 长附录 · 方案评分计算说明

权重和为一百。单项打分后加权求和。评分是决策辅助不是物理定律；若用户硬约束与高分方案冲突，约束优先。

读者价值看是否改善可读、可发现与可信任。  
成本看工程时间与认知负荷，高分表示更便宜。  
约束看与硬边界契合度。  
维护看未来改动成本。  
风险看安全与回归，高分表示更安全。  
品牌看是否符合安静工程站气质。

### 37.1 主包评分复盘

交付优先方案在约束、维护与品牌上占优，因为停止扩大分叉本身就是维护胜利。继续本地堆功能在读者价值上得分低，因为读者看不见。直接生产强推在风险维崩盘。丢弃分支则否定已验证劳动。

### 37.2 安全方案复盘

维持现有 nonce 方案与硬边界完全同构。立即启用子资源完整性把实验抬进生产，违背稳定优先。完全放弃评估则丢掉已付的调研成本。因此「维持为主、评估为辅」是平衡点。

---

## 38. 长附录 · 与前三版的叙事接力

第一版回答要不要花园与是否换栈：锁定当前框架，花园增量。  
第二版回答基础互链之后如何做图与体验出口：次级花园加出口增强。  
第三版回答图上线后下一刀：编译器与缓存与过渡，以及预览评估与卫生。  
第四版回答本地交付完成后：交付与契约，功能冷静期。

否定之否定：功能浪潮后必须有发布浪潮，否则研究报告沦为文学。

---

## 39. 长附录 · 术语表

| 术语       | 含义                     |
| ---------- | ------------------------ |
| 零期花园   | 维基链编译               |
| 一期花园   | 反链                     |
| 二期花园   | 花园页图与交互           |
| 三期花园   | 悬停预览                 |
| 交付优先   | 主包策略                 |
| 评估路径   | 子资源完整性不启用只记录 |
| 体验小包   | 无障碍与样式与文案微调   |
| 内容观察   | 暂缓新文                 |
| 不授权推送 | 外发门控默认             |
| 失败关闭   | 错误时失败而非静默脏数据 |
| 投影       | 对外数据字段白名单       |

---

## 40. 长附录 · 晨间诊断脚本说明

每日可先打印分支名、短哈希、相对主线超前数量与工作树状态，再跑类型检查与测试。把输出贴进交接即可完成进度扫描最低标准。无需复杂仪表盘。

---

## 41. 长附录 · 内容网络健康度

| 指标     | 观察方法         | 健康直觉         |
| -------- | ---------------- | ---------------- |
| 孤立文   | 构图入度出度为零 | 应少             |
| 超级节点 | 入度过高         | 可接受若为基石文 |
| 坏链     | 构建或构图失败   | 应为零           |
| 双向互链 | 延伸阅读是否回指 | 鼓励但不强制     |

本轮六文有意挂靠基石文，降低孤立风险。内容观察期应抽样点进花园看是否出现新的空洞簇。

---

## 42. 长附录 · 发布沟通模板

面向自己的发布说明建议结构：动机、用户可感变化、内部变化、风险、回滚、验证命令。避免只写「多项优化」。

用户可感变化示例：文章悬停可预览摘要；花园悬停高亮邻居；多了六篇概念笔记；列表进详情过渡更顺。  
内部变化示例：编译器、开发态文件系统缓存、预览接口、测试与文档。

---

## 43. 长附录 · 反模式库

- 把研究结论写进生产注释却不写进决策记录
- 用实验室分数代替真实用户指标并对外宣称
- 在未授权时推送「顺便帮你部署了」
- 为通过类型检查而双断言一切
- 把预览接口做成返回整篇 HTML 的代理（安全与体积双杀）
- 在首页塞力导向图证明自己会做可视化

---

## 44. 长附录 · 质量属性效用树（简）

| 质量属性 | 刺激     | 响应           | 度量               |
| -------- | -------- | -------------- | ------------------ |
| 安全性   | 注入脚本 | 拒绝执行       | 无违规与无 XSS     |
| 可维护性 | 新人接手 | 按文档改对     | 一天内完成小改     |
| 性能     | 交互风暴 | 仍可输入       | 实验室交互指标不崩 |
| 可用性   | 键盘用户 | 可完成阅读任务 | 关键路径可达       |
| 可发布性 | 合并请求 | 管道全绿       | 持续集成成功       |

本轮对可发布性欠账（未推送），对可维护性有还账（接口文档）。

---

## 45. 收束语（最终）

第四版把问题从还能发明什么扭转为如何让已发明的成为读者事实。在用户选择交付优先、不推送、不启用完整性校验、体验与内容冷静的前提下，正确动作是把契约与报告收口并本地提交，然后停手等待推送授权，而不是再开特性分支。耐心是工程品牌的一部分。

当授权到来时，执行第三十五节清单即可，不必重新调研。当授权迟迟不到时，保持分叉不再扩大，就是对架构的最大保护。

---

_第二十五节至第四十五节为达标扩写、表单执行归档与可操作附录；与前述章节同等有效。全文汉字请用正则匹配中日韩统一表意文字统计。_
