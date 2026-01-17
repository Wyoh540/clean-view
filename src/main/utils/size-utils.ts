/**
 * Size Utilities
 * 文件大小处理工具函数
 */

/**
 * 格式化字节大小为人类可读的字符串
 * @param bytes 字节数
 * @param decimals 小数位数
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 将人类可读的大小字符串转换为字节数
 * @param sizeStr 大小字符串，如 "1.5 GB"
 */
export function parseBytes(sizeStr: string): number {
  const units: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
    TB: 1024 ** 4,
    PB: 1024 ** 5,
  };

  const match = sizeStr.trim().match(/^([\d.]+)\s*([A-Za-z]+)$/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  return Math.round(value * (units[unit] || 1));
}

/**
 * 计算百分比
 * @param part 部分值
 * @param total 总值
 */
export function calculatePercent(part: number, total: number): number {
  if (total === 0) return 0;
  return (part / total) * 100;
}

/**
 * 格式化百分比
 * @param percent 百分比值
 * @param decimals 小数位数
 */
export function formatPercent(percent: number, decimals = 1): string {
  return percent.toFixed(decimals) + '%';
}

/**
 * 比较两个大小，用于排序
 */
export function compareSize(a: number, b: number): number {
  return b - a; // 降序排列
}

/**
 * 获取大小等级（用于颜色映射）
 * @param size 文件大小
 * @param totalSize 总大小
 */
export function getSizeLevel(
  size: number,
  totalSize: number
): 'tiny' | 'small' | 'medium' | 'large' | 'huge' {
  const percent = calculatePercent(size, totalSize);

  if (percent >= 50) return 'huge';
  if (percent >= 25) return 'large';
  if (percent >= 10) return 'medium';
  if (percent >= 1) return 'small';
  return 'tiny';
}

/**
 * 判断是否为大文件（默认阈值 100MB）
 */
export function isLargeFile(size: number, thresholdMB = 100): boolean {
  return size >= thresholdMB * 1024 * 1024;
}
