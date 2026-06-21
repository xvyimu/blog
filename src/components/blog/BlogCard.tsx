import Link from 'next/link';
import TagLink from './TagLink';
import { PostMeta } from '@/types';
import { formatDate, slugifyTag } from '@/lib/utils';

export default function BlogCard({ post }: { post: PostMeta }) {
  return (
    <article className="group flex flex-col gap-2 rounded-lg border border-zinc-200 p-5 transition-colors hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600">
      <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
        <h2 className="text-lg font-semibold leading-snug text-[var(--color-text)] group-hover:text-primary transition-colors">
          {post.title}
        </h2>
      </Link>
      <p className="line-clamp-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        {post.description}
      </p>
      <div className="mt-auto flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span>{post.readingTime}</span>
      </div>
      {post.tags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <TagLink key={tag} tag={tag} slug={slugifyTag(tag)} />
          ))}
        </div>
      )}
    </article>
  );
}