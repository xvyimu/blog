import Link from 'next/link';
import Container from '@/components/ui/Container';

export default function NotFound() {
  return (
    <Container className="flex flex-1 flex-col items-center justify-center py-24">
      <h1 className="text-6xl font-bold text-[var(--color-text-muted)]">404</h1>
      <p className="mt-4 text-lg text-[var(--color-text-secondary)]">页面不存在</p>
      <Link href="/" className="mt-8 text-sm text-primary hover:underline">
        回到首页 →
      </Link>
    </Container>
  );
}