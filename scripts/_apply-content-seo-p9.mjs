/**
 * One-shot P9 content SEO Phase A applicator.
 * Run: node scripts/_apply-content-seo-p9.mjs
 * Idempotent: skips if "延伸阅读" already present.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const blogDir = path.join(process.cwd(), 'content/blog');
const TODAY = '2026-07-13';

/** @type {Record<string, {
 *   tags: string[],
 *   description?: string,
 *   lede: string,
 *   links: { slug: string, title: string }[]
 * }>} */
const PATCHES = {
  '2026-06-vps-initial-setup.mdx': {
    tags: ['VPS', 'Linux', '安全', 'SSH'],
    description:
      '新 VPS 上线前的安全与运维清单：SSH 加固、UFW、Fail2Ban、自动更新、Docker 与基础监控，照着做即可。',
    lede: '结论先说：新 VPS 不要急着装业务。先完成 SSH 密钥登录、禁 root 密码、防火墙与 Fail2Ban，再装 Docker——否则 22 端口的扫描会比你的应用先到。',
    links: [
      { slug: 'docker-deploy-guide', title: 'Docker 容器部署实战' },
      { slug: 'nginx-reverse-proxy', title: 'Nginx 反向代理与负载均衡' },
      { slug: 'linux-server-troubleshooting', title: 'Linux 服务器排查手册' },
    ],
  },
  '2026-06-docker-deploy-guide.mdx': {
    tags: ['Docker', 'Node.js', '部署'],
    description:
      '把 Node.js 应用从源码做到生产容器：Dockerfile 多阶段构建、Compose 编排与镜像体积优化。',
    lede: '结论先说：用多阶段 Dockerfile + Compose 把 Node 应用固化成「同一套镜像到处跑」；别再在服务器上裸装 Node 然后 pm2 start。',
    links: [
      { slug: 'vps-initial-setup', title: 'VPS 初始化安全与运维配置清单' },
      { slug: 'nginx-reverse-proxy', title: 'Nginx 反向代理与负载均衡' },
      { slug: 'git-hooks-github-actions', title: 'Git Hooks 与 GitHub Actions 自动化' },
    ],
  },
  '2026-06-nginx-reverse-proxy.mdx': {
    tags: ['Nginx', '反向代理', 'HTTPS'],
    description:
      '生产前端层 Nginx：反向代理、负载均衡、HTTPS 终端与静态缓存，让后端只关心业务。',
    lede: '结论先说：生产环境把 TLS、反向代理、限流和静态缓存交给 Nginx，后端只听内网端口——比每个服务各自挂证书稳得多。',
    links: [
      { slug: 'docker-deploy-guide', title: 'Docker 容器部署实战' },
      { slug: 'vps-initial-setup', title: 'VPS 初始化安全与运维配置清单' },
      { slug: 'cloudflare-workers-guide', title: 'Cloudflare Workers 实战' },
    ],
  },
  '2026-06-git-hooks-github-actions.mdx': {
    tags: ['Git', 'GitHub Actions', 'CI/CD'],
    description:
      '本地 pre-commit + 远程 GitHub Actions：把检查、构建和部署串成「提交即可上线」的双层自动化。',
    lede: '结论先说：本地 Git Hooks 挡脏提交，远程 Actions 挡脏合并；两层配齐后，部署命令不该再出现在你的日常操作里。',
    links: [
      { slug: 'cicd-pipeline-design', title: 'CI/CD 流水线设计' },
      { slug: 'docker-deploy-guide', title: 'Docker 容器部署实战' },
      { slug: 'vps-initial-setup', title: 'VPS 初始化安全与运维配置清单' },
    ],
  },
  '2026-06-cicd-pipeline-design.mdx': {
    tags: ['CI/CD', 'GitHub Actions', 'DevOps'],
    description:
      'GitHub Actions 多阶段流水线：阶段划分、并行与缓存、制品管理与部署策略，从单脚本演进到可回滚发布。',
    lede: '结论先说：流水线按 lint → test → build → deploy 快速失败；能并行就并行，依赖与镜像必须缓存，制品用 commit SHA 标识。',
    links: [
      { slug: 'git-hooks-github-actions', title: 'Git Hooks 与 GitHub Actions 自动化' },
      { slug: 'docker-deploy-guide', title: 'Docker 容器部署实战' },
      { slug: 'vps-initial-setup', title: 'VPS 初始化安全与运维配置清单' },
    ],
  },
  '2026-06-linux-server-troubleshooting.mdx': {
    tags: ['Linux', '运维', '排查'],
    description:
      '服务异常时按 CPU → 内存 → 磁盘 → 网络四维排查：常用命令、定位顺序与日常预防清单。',
    lede: '结论先说：别凭感觉乱扫日志。固定顺序 CPU → 内存 → 磁盘 → 网络，配合 top/free/df/ss，多数线上故障能在几分钟内落到根因。',
    links: [
      { slug: 'vps-initial-setup', title: 'VPS 初始化安全与运维配置清单' },
      { slug: 'docker-deploy-guide', title: 'Docker 容器部署实战' },
      { slug: 'nginx-reverse-proxy', title: 'Nginx 反向代理与负载均衡' },
    ],
  },
  '2026-06-redis-caching-strategies.mdx': {
    tags: ['Redis', '缓存'],
    description:
      '生产 Redis 用法：穿透/击穿/雪崩、热点 Key、写后删缓存与一致性策略，以及命中率监控。',
    lede: '结论先说：缓存只放读多写少的数据；过期加随机偏移，写后删而非更新；命中率长期低于 90% 先查设计，别先加机器。',
    links: [
      { slug: 'postgresql-performance', title: 'PostgreSQL 性能优化实战' },
      { slug: 'supabase-practical-guide', title: 'Supabase 实战' },
      { slug: 'nextjs-app-router', title: 'Next.js App Router 实战' },
    ],
  },
  '2026-06-postgresql-performance.mdx': {
    tags: ['PostgreSQL', '索引', '性能优化'],
    description:
      'PostgreSQL 慢查询实战：EXPLAIN、B-Tree/GIN 索引、连接池、VACUUM 与分区表，先测量再改。',
    lede: '结论先说：没有 EXPLAIN ANALYZE 的优化都是猜测。先看执行计划与索引列顺序，再谈连接池、VACUUM 和分区。',
    links: [
      { slug: 'redis-caching-strategies', title: 'Redis 缓存策略' },
      { slug: 'supabase-practical-guide', title: 'Supabase 实战' },
      { slug: 'linux-server-troubleshooting', title: 'Linux 服务器排查手册' },
    ],
  },
  '2026-06-supabase-practical-guide.mdx': {
    tags: ['Supabase', 'PostgreSQL', 'RLS'],
    description:
      'Supabase 全栈接入：表设计、Row Level Security、Realtime、Storage 与 Edge Functions 的分工边界。',
    lede: '结论先说：小项目把 Supabase 当全部后端；中等项目用 Edge Functions 扛业务；大项目只把库和认证交给它，复杂逻辑仍要独立服务。',
    links: [
      { slug: 'postgresql-performance', title: 'PostgreSQL 性能优化实战' },
      { slug: 'redis-caching-strategies', title: 'Redis 缓存策略' },
      { slug: 'nextjs-app-router', title: 'Next.js App Router 实战' },
    ],
  },
  '2026-06-web-performance-optimization.mdx': {
    tags: ['Core Web Vitals', 'Lighthouse', '性能优化'],
    description:
      'Core Web Vitals 落地：LCP/INP/CLS 优先序、资源优先级、字体与图片、代码分割，以及 Lighthouse 定位瓶颈。',
    lede: '结论先说：先测再改。优先把 LCP/INP/CLS 从 Poor 拉到 Good，再抠代码分割与字体；没有 RUM 数据时，别用假 p75 自我安慰。',
    links: [
      { slug: 'nextjs-app-router', title: 'Next.js App Router 实战' },
      { slug: 'typescript-advanced-types', title: 'TypeScript 高级类型实战' },
      { slug: 'cloudflare-workers-guide', title: 'Cloudflare Workers 实战' },
    ],
  },
  '2026-06-nextjs-app-router.mdx': {
    tags: ['Next.js', 'React', 'App Router'],
    description:
      'Next.js App Router 生产笔记：Server Component 默认、Streaming、Server Actions 与数据获取边界。',
    lede: '结论先说：默认全是服务端组件，只在交互边界加 `"use client"`；数据在服务端直接取，表单走 Server Actions，Suspense 负责流式首屏。',
    links: [
      { slug: 'web-performance-optimization', title: 'Web 性能优化实战' },
      { slug: 'typescript-advanced-types', title: 'TypeScript 高级类型实战' },
      { slug: 'supabase-practical-guide', title: 'Supabase 实战' },
    ],
  },
  '2026-06-typescript-advanced-types.mdx': {
    tags: ['TypeScript', '类型系统', '泛型'],
    description:
      'TypeScript 进阶类型：泛型约束、条件类型、映射与模板字面量，用类型把错误挡在编译期。',
    lede: '结论先说：高级类型的目标不是炫技，而是消灭 `as any`。泛型约束、条件类型与 zod+infer 能把运行时错误前移到编译期。',
    links: [
      { slug: 'nextjs-app-router', title: 'Next.js App Router 实战' },
      { slug: 'web-performance-optimization', title: 'Web 性能优化实战' },
      { slug: 'go-cli-tool', title: 'Go 语言 CLI 工具入门' },
    ],
  },
  '2026-06-cloudflare-workers-guide.mdx': {
    tags: ['Cloudflare', 'Workers', 'Serverless'],
    description:
      'Cloudflare Workers 从路由到 KV、Cron 与部署：边缘无服务器应用的可运行骨架与适用边界。',
    lede: '结论先说：适合放在边缘的短逻辑（网关、定时探针、Webhook）优先 Workers；需要长连接或重 CPU 时再回传统容器。',
    links: [
      { slug: 'nginx-reverse-proxy', title: 'Nginx 反向代理与负载均衡' },
      { slug: 'go-cli-tool', title: 'Go 语言 CLI 工具入门' },
      { slug: 'nextjs-app-router', title: 'Next.js App Router 实战' },
    ],
  },
  '2026-06-go-cli-tool.mdx': {
    tags: ['Go', 'CLI'],
    description:
      '用 Go 从零写可分发 CLI：flag、文件 IO、JSON 输出、错误处理与交叉编译成单二进制。',
    lede: '结论先说：需要丢到多台服务器、零运行时依赖的工具，优先 Go 编译成单二进制；脚本语言适合原型，不适合当运维标配。',
    links: [
      { slug: 'cloudflare-workers-guide', title: 'Cloudflare Workers 实战' },
      { slug: 'cicd-pipeline-design', title: 'CI/CD 流水线设计' },
      { slug: 'linux-server-troubleshooting', title: 'Linux 服务器排查手册' },
    ],
  },
};

function formatTags(tags) {
  return `[${tags.map((t) => `'${t}'`).join(', ')}]`;
}

function buildRelatedSection(links) {
  const items = links.map((l) => `- [${l.title}](/blog/${l.slug})`).join('\n');
  return `\n## 延伸阅读\n\n${items}\n`;
}

function patchFrontmatter(raw, patch) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) throw new Error('missing frontmatter');
  let fm = m[1];

  // tags
  if (!/^tags:/m.test(fm)) {
    fm += `\ntags: ${formatTags(patch.tags)}`;
  } else {
    fm = fm.replace(/^tags:\s*\[[^\]]*\]/m, `tags: ${formatTags(patch.tags)}`);
  }

  // description
  if (patch.description) {
    const desc = patch.description.replace(/'/g, "\\'");
    if (/^description:/m.test(fm)) {
      fm = fm.replace(/^description:\s*'[^']*'/m, `description: '${desc}'`);
    } else {
      fm += `\ndescription: '${desc}'`;
    }
  }

  // updatedAt
  if (/^updatedAt:/m.test(fm)) {
    fm = fm.replace(/^updatedAt:\s*'[^']*'/m, `updatedAt: '${TODAY}'`);
  } else {
    // insert after date line
    if (/^date:\s*'[^']*'/m.test(fm)) {
      fm = fm.replace(/^(date:\s*'[^']*')/m, `$1\nupdatedAt: '${TODAY}'`);
    } else {
      fm += `\nupdatedAt: '${TODAY}'`;
    }
  }

  return `---\n${fm}\n---\n` + raw.slice(m[0].length);
}

function replaceOpeningLede(body, lede) {
  // Replace leading blockquote block(s) right after frontmatter
  const trimmedStart = body.replace(/^\r?\n+/, '\n');
  const bq = trimmedStart.match(/^(?:\r?\n)(?:>[^\n]*(?:\r?\n|$))+/);
  if (bq) {
    return `\n> ${lede}\n` + trimmedStart.slice(bq[0].length);
  }
  // No blockquote: insert before first ##
  const idx = trimmedStart.search(/^## /m);
  if (idx >= 0) {
    return `\n> ${lede}\n\n` + trimmedStart.slice(idx === 0 ? 0 : 1);
  }
  return `\n> ${lede}\n` + trimmedStart;
}

function ensureRelated(body, links) {
  if (/^## 延伸阅读\s*$/m.test(body)) {
    // Replace existing section content until next ## or EOF
    return body.replace(
      /\n## 延伸阅读\n[\s\S]*?(?=\n## |\s*$)/,
      buildRelatedSection(links).replace(/^\n/, '\n'),
    );
  }
  // Append before trailing whitespace
  return body.replace(/\s*$/, '') + '\n' + buildRelatedSection(links);
}

const files = readdirSync(blogDir).filter((f) => f.endsWith('.mdx'));
let changed = 0;
for (const file of files) {
  const patch = PATCHES[file];
  if (!patch) {
    console.log(`skip (no patch): ${file}`);
    continue;
  }
  const full = path.join(blogDir, file);
  let raw = readFileSync(full, 'utf8');
  raw = patchFrontmatter(raw, patch);
  const m = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  if (!m) throw new Error(`${file}: fm lost`);
  let body = raw.slice(m[0].length);
  body = replaceOpeningLede(body, patch.lede);
  body = ensureRelated(body, patch.links);
  const next = m[0] + body;
  writeFileSync(full, next, 'utf8');
  changed += 1;
  console.log(`ok ${file}`);
}
console.log(`done: ${changed}/${files.length}`);
