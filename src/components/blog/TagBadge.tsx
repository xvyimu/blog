export default function TagBadge({ tag, className = '' }: { tag: string; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full bg-[var(--color-bg-secondary)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-secondary)] ${className}`}>
      {tag}
    </span>
  );
}