import Container from '@/components/ui/Container';
import MdxContent from '@/components/blog/MdxContent';
import { SITE_CONFIG } from '@/lib/constants';
import fs from 'fs';
import path from 'path';

function getAboutContent(): string | null {
  const filePath = path.join(process.cwd(), 'content/about.mdx');
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

export default function AboutPage() {
  const content = getAboutContent();

  return (
    <Container className="py-12 sm:py-16">
      <h1 className="mb-8 text-2xl font-bold">关于</h1>
      <article className="mx-auto max-w-prose">
        {content ? (
          <MdxContent source={content} />
        ) : (
          <div className="space-y-4 text-[var(--color-text-secondary)]">
            <p>你好，我是 {SITE_CONFIG.author.name}。</p>
            <p>{SITE_CONFIG.description}</p>
          </div>
        )}
      </article>
    </Container>
  );
}