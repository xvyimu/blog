/**
 * 标签 slug 化：转小写、空格转连字符、去除非字母数字字符
 */
export function slugifyTag(tag: string): string {
  const result = tag
    .trim()
    .toLowerCase()
    .replace(/\./g, '-')        // "Next.js" → "next-js"
    .replace(/[^\p{L}\p{N}\s-]/gu, '') // 去除特殊字符
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return result || tag; // 防止纯特殊字符标签产生空 slug
}

/** 解码 URL path segment；非法转义保持原值，交给调用方按未匹配处理。 */
export function decodeRouteSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** 日期格式化：2026-06-21 → 2026年6月21日
 *  追加 T00:00:00 确保 Date 解析不因客户端时区而偏移到前一天（UTC-区域）。 */
export function formatDate(dateStr: string, locale: string = 'zh-CN'): string {
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return dateStr; // 非法日期返回原始字符串
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
