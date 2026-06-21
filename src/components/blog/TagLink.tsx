import Link from 'next/link';

export default function TagLink({ tag, slug }: { tag: string; slug: string }) {
  return (
    <Link
      href={`/tags/${slug}`}
      className="inline-flex items-center rounded-full bg-[var(--color-bg-secondary)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-primary hover:text-white"
    >
      {tag}
    </Link>
  );
}