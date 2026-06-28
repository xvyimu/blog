import fs from 'fs';
import path from 'path';

/**
 * ContentSource — 抽象内容读取接口。
 * 将文件系统操作从数据解析逻辑中分离，便于测试注入和未来迁移到 CMS/HTTP 源。
 */
export interface ContentSource {
  /** 读取文件为 UTF-8 字符串。文件不存在返回 null。 */
  readFile(relativePath: string): string | null;
  /** 列出目录中的文件名。目录不存在返回 null。 */
  readDir(relativePath: string): string[] | null;
  /** 获取文件/目录的修改时间（ms）。不存在返回 null。 */
  getMtime(relativePath: string): number | null;
}

/** 基于文件系统的 ContentSource 实现，以 process.cwd() 为根。 */
export const filesystemSource: ContentSource = {
  readFile(relativePath: string): string | null {
    const fullPath = path.join(/* turbopackIgnore: true */ process.cwd(), relativePath);
    try {
      return fs.readFileSync(fullPath, 'utf-8');
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw e;
    }
  },

  readDir(relativePath: string): string[] | null {
    const fullPath = path.join(/* turbopackIgnore: true */ process.cwd(), relativePath);
    try {
      return fs.readdirSync(fullPath);
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      if (code === 'ENOENT' || code === 'ENOTDIR') return null;
      throw e;
    }
  },

  getMtime(relativePath: string): number | null {
    const fullPath = path.join(/* turbopackIgnore: true */ process.cwd(), relativePath);
    try {
      return fs.statSync(fullPath).mtimeMs;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw e;
    }
  },
};

/** 当前活跃的 ContentSource，默认为文件系统实现。测试中可替换为内存实现。 */
let _activeSource: ContentSource = filesystemSource;

/** 获取当前活跃的 ContentSource */
export function getContentSource(): ContentSource {
  return _activeSource;
}

/** 设置 ContentSource（测试用），返回上一个 source 便于恢复 */
export function setContentSource(source: ContentSource): ContentSource {
  const prev = _activeSource;
  _activeSource = source;
  return prev;
}
