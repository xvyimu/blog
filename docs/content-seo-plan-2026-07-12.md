# 西江月博客 · 内容 SEO Phase A

**日期：** 2026-07-12 规划 · 2026-07-13 落地  
**线上：** https://incca.ccwu.cc  
**sitemap：** https://incca.ccwu.cc/sitemap.xml  
**范围：** 14 篇 `content/blog/*.mdx` 元数据 + 文首结论 + 站内链；**不含**全量 BEM rewrite / Meili·ES / 假 p75 / 正文文字 blur。

---

## 1. 术语边界（勿混）

| 说法       | 本站含义                               | 决策                                    |
| ---------- | -------------------------------------- | --------------------------------------- |
| 全量 BEM   | CSS 已是 BEM 模块                      | **不做** rewrite                        |
| 外部搜索   | 站内曾讨论 Meili/ES；SEO 侧是 GSC/Bing | 站内 Fuse 够用；**>200 文**再评估       |
| 无流量 p75 | Speed Insights **真实用户** p75        | 无流量不造数                            |
| 批量 blur  | **图片** LQIP                          | 项目图已做；MDX 无真实本地正文图 → 不扩 |

---

## 2. 工程基建（已有，不改）

- `src/app/sitemap.ts` / `robots.ts` / `buildPageMetadata`
- 文章页 canonical + OG `article` + 底部「相关文章」（tag/category/series 加权）
- `pnpm check:seo` 校验 frontmatter / 内链 public 路径 / sitemap

本 Phase **补的是正文内显式站内链 + 元数据意图**，不是再建一套 SEO 框架。

---

## 3. 主题簇（内链用）

| 簇       | slug                                                                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 运维发布 | `vps-initial-setup` · `docker-deploy-guide` · `nginx-reverse-proxy` · `git-hooks-github-actions` · `cicd-pipeline-design` · `linux-server-troubleshooting` |
| 数据缓存 | `redis-caching-strategies` · `postgresql-performance` · `supabase-practical-guide`                                                                         |
| 性能前端 | `web-performance-optimization` · `nextjs-app-router` · `typescript-advanced-types`                                                                         |
| 边缘工具 | `cloudflare-workers-guide` · `go-cli-tool`                                                                                                                 |

系列「个人服务部署路线」：`seriesOrder` 1–5 已存在（VPS → Docker → Nginx → Hooks → CI/CD）。

---

## 4. 单篇 checklist（2026-07-13 已批处理）

每篇目标：

- [x] `title` 唯一（人工复核无撞题）
- [x] `description` 意图句（≤ ~90 汉字，含对象+收益）
- [x] `updatedAt: 2026-07-13`
- [x] 文首 blockquote **结论先行**
- [x] 文末 `## 延伸阅读` ≥2 站内 `/blog/{slug}`
- [x] `tags` 去语义重叠（去掉「前端/后端/数据库/自动化/无服务器」等泛标签）

| slug                         | 簇   | 站内链目标                          |
| ---------------------------- | ---- | ----------------------------------- |
| vps-initial-setup            | 运维 | docker / nginx / linux-troubleshoot |
| docker-deploy-guide          | 运维 | vps / nginx / git-hooks             |
| nginx-reverse-proxy          | 运维 | docker / vps / workers              |
| git-hooks-github-actions     | 运维 | cicd / docker / vps                 |
| cicd-pipeline-design         | 运维 | hooks / docker / vps                |
| linux-server-troubleshooting | 运维 | vps / docker / nginx                |
| redis-caching-strategies     | 数据 | postgres / supabase / nextjs        |
| postgresql-performance       | 数据 | redis / supabase / linux            |
| supabase-practical-guide     | 数据 | postgres / redis / nextjs           |
| web-performance-optimization | 前端 | nextjs / typescript / workers       |
| nextjs-app-router            | 前端 | web-perf / typescript / supabase    |
| typescript-advanced-types    | 前端 | nextjs / web-perf / go-cli          |
| cloudflare-workers-guide     | 边缘 | nginx / go-cli / nextjs             |
| go-cli-tool                  | 边缘 | workers / cicd / linux              |

---

## 5. 搜索控制台（需账号 · 人工）

1. [Google Search Console](https://search.google.com/search-console)
   - 属性：域名 `ccwu.cc` **或** 网址前缀 `https://incca.ccwu.cc`
   - 验证：DNS TXT 或 HTML 文件（Vercel 项目可挂 public 验证文件）
   - 提交 sitemap：`https://incca.ccwu.cc/sitemap.xml`
2. [Bing Webmaster](https://www.bing.com/webmasters)
   - 可「从 GSC 导入」或单独验证
   - 同样提交 sitemap
3. 有展示数据后再用 query 反改标题钩子（禁止无数据瞎改）

---

## 6. 明确不做

- 全量 BEM → utility rewrite
- ES / Meili / Algolia（~14 文）
- 无 RUM 假 p75 列表
- MDX 正文文字「脱敏 blur」
- 为 SEO 硬塞 `source: ""` 空字段

---

## 7. 验证

```powershell
cd D:\blog
pnpm check:seo
# 抽检一篇：
# Get-Content content\blog\2026-06-vps-initial-setup.mdx -TotalCount 20
# Select-String -Path content\blog\*.mdx -Pattern '延伸阅读' | Measure-Object
```

脚本（一次性，可删）：`scripts/_apply-content-seo-p9.mjs`
