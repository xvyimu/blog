import { SITE_CONFIG } from '@/lib/constants';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-700">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 text-sm text-[var(--color-text-muted)] sm:px-6 lg:px-8">
        <span>&copy; {year} {SITE_CONFIG.author.name}</span>
        <div className="flex items-center gap-4">
          {SITE_CONFIG.social.github && (
            <a href={SITE_CONFIG.social.github} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              GitHub
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}