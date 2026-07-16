import { createCache } from './cache';
import type { ContentSource } from './content-source';

export interface JsonContentRepository<T> {
  /** 获取解析后的 JSON 内容，带缓存。 */
  getAll(): T;
}

export type JsonContentMode = 'strict' | 'lenient';

interface CreateJsonContentRepositoryOptions<T> {
  source: ContentSource;
  path: string;
  label: string;
  fallback: () => T;
  parse(raw: unknown): T;
  /**
   * `strict` (default in production): missing file / JSON syntax errors throw.
   * `lenient` (default outside production, and for tests): return fallback().
   * Explicit value always wins.
   */
  mode?: JsonContentMode;
}

function resolveMode(mode: JsonContentMode | undefined): JsonContentMode {
  if (mode) return mode;
  return process.env.NODE_ENV === 'production' ? 'strict' : 'lenient';
}

export function createJsonContentRepository<T>({
  source,
  path,
  label,
  fallback,
  parse,
  mode,
}: CreateJsonContentRepositoryOptions<T>): JsonContentRepository<T> {
  const resolvedMode = resolveMode(mode);
  const cache = createCache<T>({
    watchPath: path,
    source,
  });

  function getAll(): T {
    return cache.getOrCompute(() => {
      const raw = source.readFile(path);
      if (raw === null) {
        const message = `[${label}] 数据文件不存在: ${path}`;
        if (resolvedMode === 'strict') {
          throw new Error(message);
        }
        console.warn(message);
        return fallback();
      }

      let data: unknown;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        const message = `[${label}] JSON 解析失败: ${path}`;
        if (resolvedMode === 'strict') {
          throw new Error(`${message}: ${e instanceof Error ? e.message : String(e)}`);
        }
        console.error(message, e);
        return fallback();
      }

      return parse(data);
    });
  }

  return { getAll };
}
