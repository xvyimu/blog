/**
 * Lighthouse CI 配置
 *
 * 用于在 CI 中自动审计关键页面，防止性能回归。
 * 阈值基于当前站点已知的优秀指标设定。
 *
 * CI 通过 treosh/lighthouse-ci-action@v12 的 configPath 引用本文件。
 * 本地运行（按需拉取）：npx @lhci/cli autorun
 */
module.exports = {
  ci: {
    collect: {
      // 只审计关键页面，避免 CI 时间过长
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/blog',
        'http://localhost:3000/blog/nextjs-app-router',
        'http://localhost:3000/projects',
        'http://localhost:3000/about',
      ],
      startServerCommand: 'pnpm start',
      startServerReadyPattern: 'ready',
      startServerReadyTimeout: 30000,
      numberOfRuns: 2, // 跑 2 次取中位数，减少噪音
      settings: {
        preset: 'desktop', // 桌面端视角
      },
    },
    assert: {
      assertions: {
        // 性能 — 宽松阈值，基于 SSG 静态站预期
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],

        // 关键指标
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        // TBT 是 Lighthouse 10+ 中交互响应性的现代指标（替代已移除的 TTI/interactive）
        // SSG 静态站 TBT 通常 < 50ms，300ms 阈值留足余量；error 级防止回归
        'total-blocking-time': ['error', { maxNumericValue: 300 }],

        // 最佳实践 — 无阻塞
        'errors-in-console': ['error', { maxLength: 0 }],
        'valid-source-maps': ['warn'],

        // SEO — 基本要求
        'canonical': ['error'],
        'meta-description': ['error'],
        'document-title': ['error'],
        'crawlable-anchors': ['warn'],
      },
    },
    upload: {
      target: 'filesystem', // 不上传到 LHCI server，存为本地报告
      outputDir: '.lighthouse',
    },
  },
};
