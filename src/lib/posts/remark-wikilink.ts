import type { Plugin } from 'unified';
import type { Root, PhrasingContent } from 'mdast';
import { visit } from 'unist-util-visit';
import { extractWikilinks, wikilinkHref } from './wikilink';

/**
 * remark plugin: turn [[slug]] / [[slug|label]] in text nodes into mdast link nodes.
 * Does not resolve existence (fail-closed is graph/validator responsibility).
 * code / inlineCode hold values, not text children — visit('text') never sees them.
 *
 * Shape must be factory → (tree) => void (one level). Double nesting is ignored by unified.
 */
export const remarkWikilink: Plugin<[], Root> = function remarkWikilink() {
  return (tree: Root) => {
    visit(tree, 'text', (node, index, parent) => {
      if (parent == null || index == null) return;

      const value = node.value;
      if (!value.includes('[[')) return;

      const matches = extractWikilinks(value);
      if (matches.length === 0) return;

      const children: PhrasingContent[] = [];
      let cursor = 0;

      for (const match of matches) {
        const start = value.indexOf(match.raw, cursor);
        if (start === -1) continue;
        if (start > cursor) {
          children.push({ type: 'text', value: value.slice(cursor, start) });
        }
        children.push({
          type: 'link',
          url: wikilinkHref(match.slug),
          data: {
            hProperties: {
              'data-wikilink': match.slug,
            },
          },
          children: [{ type: 'text', value: match.label }],
        });
        cursor = start + match.raw.length;
      }

      if (cursor < value.length) {
        children.push({ type: 'text', value: value.slice(cursor) });
      }

      if (children.length === 0) return;

      const parentChildren = parent.children as PhrasingContent[];
      parentChildren.splice(index, 1, ...children);
      return index + children.length;
    });
  };
};
