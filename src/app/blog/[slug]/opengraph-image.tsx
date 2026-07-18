import { ImageResponse } from 'next/og';
import { getPostBySlug, getAllPostSlugs } from '@/server/content';
import { SITE_CONFIG } from '@/lib/site';

export const alt = SITE_CONFIG.name;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    return new ImageResponse(
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: '#f1f0eb',
          color: '#242827',
          padding: '60px',
          justifyContent: 'center',
        }}
      >
        <h1 style={{ fontSize: 48, fontWeight: 700 }}>{SITE_CONFIG.name}</h1>
      </div>,
      { ...size },
    );
  }

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#f1f0eb',
        color: '#242827',
        padding: '60px',
        justifyContent: 'space-between',
        fontFamily: 'sans-serif',
      }}
    >
      {/* 顶部：站点名 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#425c55' }}>
          {SITE_CONFIG.name}
        </div>
        <div style={{ fontSize: 22, color: '#727970' }}>{SITE_CONFIG.description}</div>
      </div>

      {/* 中间：文章标题 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          flex: 1,
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.2, maxWidth: 1000 }}>
          {post.title}
        </div>
        <div style={{ fontSize: 26, color: '#4d5652', maxWidth: 900 }}>
          {post.description}
        </div>
      </div>

      {/* 底部：日期 + 标签 */}
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div style={{ display: 'flex', gap: '12px', fontSize: 22, color: '#727970' }}>
          <span>{post.date}</span>
          <span>·</span>
          <span>{post.readingTime}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {post.tags.slice(0, 3).map((tag) => (
            <div
              key={tag}
              style={{
                display: 'flex',
                padding: '4px 16px',
                borderRadius: 8,
                background: 'rgba(89,117,109,0.12)',
                color: '#425c55',
                fontSize: 20,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    </div>,
    { ...size },
  );
}
