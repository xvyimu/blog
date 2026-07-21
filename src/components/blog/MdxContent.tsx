import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypePrettyCode, { type Options } from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { remarkWikilink } from '@/lib/posts/remark-wikilink';
import CodeBlock from './CodeBlock';
import ImageZoom from './ImageZoom';
import WikilinkPopover from './WikilinkPopover';

const prettyCodeOptions: Partial<Options> = {
  theme: {
    dark: 'vitesse-dark',
    light: 'vitesse-light',
  },
  keepBackground: false,
  onVisitLine(node: { children: Array<{ type: string; value?: string }> }) {
    if (node.children.length === 0) {
      node.children = [{ type: 'text', value: ' ' }];
    }
    if ('properties' in node && node.properties) {
      (node.properties as Record<string, string[]>).className = ['code-line'];
    }
  },
  onVisitHighlightedLine(node: { properties?: { className?: string[] } }) {
    if (node.properties) {
      node.properties.className = [...(node.properties.className || []), 'highlighted'];
    }
  },
};

export default function MdxContent({ source }: { source: string }) {
  return (
    <div className="prose max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-code:before:content-none prose-code:after:content-none">
      <MDXRemote
        source={source}
        components={{
          pre: CodeBlock,
          img: ImageZoom,
          a: WikilinkPopover,
        }}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm, remarkWikilink],
            rehypePlugins: [
              rehypeSlug,
              [rehypePrettyCode, prettyCodeOptions],
              [rehypeAutolinkHeadings, { behavior: 'wrap' }],
            ],
          },
        }}
      />
    </div>
  );
}
