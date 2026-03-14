import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  parseBytes,
  calculatePercent,
  formatPercent,
  compareSize,
  getSizeLevel,
  isLargeFile,
} from '../../../../src/main/utils/size-utils';

describe('size-utils', () => {
  describe('formatBytes', () => {
    it('given zero bytes when formatting then returns "0 B"', () => {
      expect(formatBytes(0)).toBe('0 B');
    });
    it('given bytes when formatting then returns value with correct unit', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
    });
  });

  describe('parseBytes', () => {
    it('given valid size string when parsing then returns bytes', () => {
      expect(parseBytes('1 KB')).toBe(1024);
      expect(parseBytes('1.5 GB')).toBe(Math.round(1.5 * 1024 ** 3));
    });
    it('given invalid string when parsing then returns 0', () => {
      expect(parseBytes('invalid')).toBe(0);
    });
  });

  describe('calculatePercent', () => {
    it('given part and total when calculating then returns percentage', () => {
      expect(calculatePercent(25, 100)).toBe(25);
    });
    it('given zero total when calculating then returns 0', () => {
      expect(calculatePercent(10, 0)).toBe(0);
    });
  });

  describe('formatPercent', () => {
    it('given percent value when formatting then returns string with %', () => {
      expect(formatPercent(33.5)).toBe('33.5%');
    });
  });

  describe('compareSize', () => {
    it('given two sizes when comparing then returns negative when first is larger for descending order', () => {
      expect(compareSize(100, 50)).toBeLessThan(0);
      expect(compareSize(50, 100)).toBeGreaterThan(0);
    });
  });

  describe('getSizeLevel', () => {
    it('given size and total when getting level then returns tiny/small/medium/large/huge by percent', () => {
      expect(getSizeLevel(0.5, 100)).toBe('tiny'); // < 1%
      expect(getSizeLevel(5, 100)).toBe('small');
      expect(getSizeLevel(15, 100)).toBe('medium');
      expect(getSizeLevel(30, 100)).toBe('large');
      expect(getSizeLevel(60, 100)).toBe('huge');
    });
  });

  describe('isLargeFile', () => {
    it('given size above threshold when checking then returns true', () => {
      expect(isLargeFile(101 * 1024 * 1024)).toBe(true);
    });
    it('given size below threshold when checking then returns false', () => {
      expect(isLargeFile(50 * 1024 * 1024)).toBe(false);
    });
  });
});
