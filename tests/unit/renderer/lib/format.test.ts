import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  formatDate,
  formatRelativeTime,
  formatPercent,
  formatDuration,
} from '../../../../src/renderer/lib/format';

describe('format (renderer)', () => {
  describe('formatBytes', () => {
    it('given zero bytes when formatting then returns "0 B"', () => {
      expect(formatBytes(0)).toBe('0 B');
    });
    it('given bytes when formatting then returns value with unit', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
    });
  });

  describe('formatDate', () => {
    it('given ISO date string when formatting then returns localized date string', () => {
      const s = formatDate('2025-03-14T12:00:00.000Z');
      expect(s).toMatch(/\d/);
      expect(s.length).toBeGreaterThan(0);
    });
  });

  describe('formatRelativeTime', () => {
    it('given recent date when formatting then returns "刚刚" or minutes/hours ago', () => {
      const now = new Date();
      const justNow = now.toISOString();
      expect(formatRelativeTime(justNow)).toBe('刚刚');
    });
    it('given date 5 minutes ago when formatting then returns "5 分钟前"', () => {
      const d = new Date();
      d.setMinutes(d.getMinutes() - 5);
      expect(formatRelativeTime(d.toISOString())).toBe('5 分钟前');
    });
  });

  describe('formatPercent', () => {
    it('given value and total when formatting then returns percentage string', () => {
      expect(formatPercent(1, 4)).toBe('25.0%');
    });
    it('given zero total when formatting then returns "0%"', () => {
      expect(formatPercent(10, 0)).toBe('0%');
    });
  });

  describe('formatDuration', () => {
    it('given ms less than 1000 when formatting then returns "Xms"', () => {
      expect(formatDuration(500)).toBe('500ms');
    });
    it('given seconds when formatting then returns "X秒"', () => {
      expect(formatDuration(3000)).toBe('3秒');
    });
    it('given minutes when formatting then returns "X分Y秒"', () => {
      expect(formatDuration(125000)).toBe('2分5秒');
    });
  });
});
