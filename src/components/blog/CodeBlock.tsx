import type { HTMLAttributes, ReactNode } from 'react';
import CodeBlockCopyButton from './CodeBlockCopyButton';

/**
 * CodeBlock — server shell for MDX <pre>.
 * Highlighted HTML comes from rehype-pretty-code on the server.
 * Only the copy control is a client island (lazy via useInView).
 *
 * rehype-pretty-code adds data-language on <pre>.
 */
type PreProps = HTMLAttributes<HTMLPreElement> & {
  'data-language'?: string;
  children?: ReactNode;
};

export default function CodeBlock({ children, ...props }: PreProps) {
  const language = props['data-language'];

  return (
    <div className="code-toolbar">
      {language && (
        <div className="code-block-header">
          <span className="code-block-lang">{language}</span>
        </div>
      )}
      <pre {...props}>{children}</pre>
      <CodeBlockCopyButton language={language} />
    </div>
  );
}
