import Link from 'next/link';
import Container from '@/components/ui/Container';
import { getAllTags } from '@/lib/tags';

export default function TagsPage() {
  const tags = getAllTags();

  return (
    <Container className="py-12 sm:py-16">
      <h1 className="mb-8 text-2xl font-bold">标签</h1>
      {tags.length === 0 ? (
        <p className="text-[var(--color-text-muted)]">暂无标签</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map((t) => (
            <Link
              key={t.slug}
              href={`/tags/${t.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm transition-colors hover:border-primary hover:text-primary dark:border-zinc-700"
            >
              {t.tag}
              <span className="text-xs text-[var(--color-text-muted)]">{t.count}</span>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}