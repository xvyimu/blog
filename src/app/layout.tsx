import type { Metadata } from 'next';
import { Cormorant_Garamond, Noto_Sans_SC, JetBrains_Mono } from 'next/font/google';
import './globals.css';
// CSS 语义模块按顺序显式 import (Tailwind v4 下 postcss-import 失效,
// 详见 docs/specs/2026-06-29-css-import-fix-design.md)
// 路由专属样式下沉到 segment layout / page（home / links / project-detail / search-ui）。
import './styles/tokens.css'; // 设计令牌 (CSS 变量定义)
import './styles/base.css'; // 全局基础 (skip-link, header, footer)
import './styles/components.css'; // 通用布局与基础卡片
import './styles/archive.css'; // 归档网格与 ArchiveCard
import './styles/controls.css'; // 按钮、分页、标签与轻量控制
import './styles/blog-ui.css'; // 博客列表、目录与辅助界面
import './styles/article-ui.css'; // 文章详情布局与阅读面板
import './styles/backdrop.css'; // 背景层 (body::before/after + stage)
import './styles/prose.css'; // 文章排版 (.prose, code block)
import './styles/animations.css'; // 动画 (reveal, fade-in-up)
import './styles/responsive.css'; // 响应式断点 (最后,覆盖前面)
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SiteBackdropStage from '@/components/layout/SiteBackdropStage';
import SiteBackdropParallax from '@/components/layout/SiteBackdropParallax';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { SITE_CONFIG } from '@/lib/site';
import { shouldRenderVercelInsights } from '@/lib/observability';
import BackToTop from '@/components/ui/BackToTop';
import DarkModeScript from '@/components/ui/DarkModeScript';
import { getCspNonce } from '@/lib/csp';

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  // Two weights cover body + emphasis without the 500 face cost
  weight: ['400', '700'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  preload: false,
  // Code blocks and mono UI share the same face; keep metric fallback tight for CLS.
  adjustFontFallback: true,
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-display',
  display: 'swap',
  preload: true,
  // Article titles use clamp(2.7rem, 6vw, 5.2rem); unadjusted Georgia fallback
  // was a primary CLS driver on /blog/nextjs-app-router in Lighthouse CI.
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: SITE_CONFIG.name,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: SITE_CONFIG.name,
    images: [{ url: '/icon.svg', width: 512, height: 512, alt: SITE_CONFIG.name }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const renderVercelInsights = shouldRenderVercelInsights();
  const nonce = await getCspNonce();

  return (
    <html
      lang="zh-CN"
      className={`h-full antialiased ${notoSansSC.variable} ${jetbrainsMono.variable} ${cormorantGaramond.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta
          name="theme-color"
          content="#f1f0eb"
          media="(prefers-color-scheme: light)"
        />
        <meta name="theme-color" content="#141716" media="(prefers-color-scheme: dark)" />
        <DarkModeScript nonce={nonce} />
      </head>
      <body
        className="flex min-h-full flex-col text-[var(--text)]"
        style={{ fontFamily: 'var(--font-noto-sans-sc), system-ui, sans-serif' }}
      >
        <SiteBackdropStage />
        <SiteBackdropParallax />
        <a href="#main-content" className="skip-link">
          跳到主要内容
        </a>
        <Header />
        <main id="main-content" className="flex-1 animate-fade-in">
          {children}
        </main>
        <BackToTop />
        {renderVercelInsights ? (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        ) : null}
        <Footer />
      </body>
    </html>
  );
}
