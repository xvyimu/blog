import { describe, expect, it } from 'vitest';
import { CONTENT_DIR, CONTENT_TRACE_INCLUDES } from './content-dirs';

function firstPathSegment(relativePath: string): string {
  return relativePath.split('/')[0] ?? relativePath;
}

describe('content deployment paths', () => {
  it('keeps every local content source covered by Next file tracing', () => {
    const tracedRoots = new Set(
      Object.values(CONTENT_TRACE_INCLUDES)
        .flat()
        .map((glob) => glob.replace(/\/\*\*\/\*$/, '').replace(/\/\*\*$/, '')),
    );

    expect(CONTENT_TRACE_INCLUDES['/**']).toBeDefined();

    for (const relativePath of Object.values(CONTENT_DIR)) {
      expect(tracedRoots).toContain(firstPathSegment(relativePath));
    }
  });
});
