import fs from 'node:fs';
import path from 'node:path';
import type { PostMeta } from '@/types';
import {
  CONTENT_SNAPSHOT_FILES,
  getContentSnapshotRoot,
  resolveContentBackend,
} from '@/lib/content-snapshot/paths';
import { getAllPosts } from '@/server/content';

/**
 * 搜索语料入口：生产 snapshot 路径只读 `search-docs.json`，
 * 避免 `readContentSnapshot` 连带解析 posts-full（~200KB+）的冷路径。
 * fs / dev 仍走 content facade 的 getAllPosts（进程内已有缓存）。
 */

let cachedSearchDocs: PostMeta[] | null = null;
let cachedRoot: string | null = null;

function readSearchDocsFile(root: string): PostMeta[] {
  const filePath = path.join(root, CONTENT_SNAPSHOT_FILES.searchDocs);
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      throw new Error(
        `[search] missing ${CONTENT_SNAPSHOT_FILES.searchDocs}. Run \`pnpm content:build\`.`,
      );
    }
    throw error;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`[search] invalid JSON: ${CONTENT_SNAPSHOT_FILES.searchDocs}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`[search] ${CONTENT_SNAPSHOT_FILES.searchDocs} must be an array`);
  }

  return parsed as PostMeta[];
}

/**
 * 返回 Fuse 索引用的文章摘要数组（稳定引用，便于 WeakMap 复用）。
 */
export function getSearchCorpus(): PostMeta[] {
  if (resolveContentBackend() !== 'snapshot') {
    return getAllPosts();
  }

  const root = getContentSnapshotRoot();
  if (cachedSearchDocs && cachedRoot === root) {
    return cachedSearchDocs;
  }

  const docs = readSearchDocsFile(root);
  cachedSearchDocs = docs;
  cachedRoot = root;
  return docs;
}

/** 测试专用：清空 search-docs 懒加载缓存。 */
export function resetSearchCorpusForTests(): void {
  cachedSearchDocs = null;
  cachedRoot = null;
}
