import { NextResponse } from 'next/server';
import { getPostBySlug } from '@/server/content';

/**
 * G3 popover preview endpoint.
 * Returns lightweight post metadata for wikilink hover cards.
 * Body MDX is intentionally excluded to keep payload small.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json(
    {
      slug: post.slug,
      title: post.title,
      description: post.description,
      date: post.date,
      category: post.category ?? null,
      tags: post.tags,
    },
    {
      headers: {
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
      },
    },
  );
}
