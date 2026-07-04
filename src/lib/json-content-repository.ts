import { createCache } from './cache';
import type { ContentSource } from './content-source';

export interface JsonContentRepository<T> {
  /** 获取解析后的 JSON 内容，带缓存。 */
  getAll(): T;
}

interface CreateJsonContentRepositoryOptions<T> {
  source: ContentSource;
  path: string;
  label: string;
  fallback: () => T;
  parse(raw: unknown): T;
}

export function createJsonContentRepository<T>({
  source,
  path,
  label,
  fallback,
  parse,
}: CreateJsonContentRepositoryOptions<T>): JsonContentRepository<T> {
  const cache = createCache<T>({
    watchPath: path,
    source,
  });

  function getAll(): T {
    return cache.getOrCompute(() => {
      const raw = source.readFile(path);
      if (raw === null) {
        console.warn(`[${label}] 数据文件不存在: ${path}`);
        return fallback();
      }

      let data: unknown;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        console.error(`[${label}] JSON 解析失败: ${path}`, e);
        return fallback();
      }

      return parse(data);
    });
  }

  return { getAll };
}
