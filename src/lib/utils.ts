/**
 * 标签 slug 化：转小写、空格转连字符、去除非字母数字字符
 */
export function slugifyTag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/\./g, '-')        // "Next.js" → "next-js"
    .replace(/[^\p{L}\p{N}\s-]/gu, '') // 去除特殊字符
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** 日期格式化：2026-06-21 → 2026年6月21日 */
export function formatDate(dateStr: string, locale: string = 'zh-CN'): string {
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/** 安全获取 frontmatter 字段，缺失必填字段时在构建期直接抛错 */
export function assertRequiredFields(
  data: Record<string, unknown>,
  fields: string[],
  filePath: string
): void {
  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw new Error(
        `[内容校验失败] ${filePath} 缺少必填字段 "${field}"，请检查 frontmatter`
      );
    }
  }
}
