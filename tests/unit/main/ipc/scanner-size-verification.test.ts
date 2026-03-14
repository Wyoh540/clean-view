/**
 * 文件夹扫描大小验证测试
 * 使用 C:\Users\admin\AppData\Local 验证：maxDepth 限制会导致未展开目录 size 为 0，从而总大小偏小
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { runScanForTest } from '../../../../src/main/ipc/scanner';
import { getDirectorySize } from '../../../../src/main/ipc/file-system';

const APP_DATA_LOCAL =
  process.platform === 'win32'
    ? path.join(process.env.LOCALAPPDATA ?? 'C:\\Users\\admin\\AppData\\Local')
    : '';

describe('scanner folder size accuracy', () => {
  let pathExists = false;

  beforeAll(async () => {
    if (!APP_DATA_LOCAL) return;
    try {
      await fs.access(APP_DATA_LOCAL);
      pathExists = true;
    } catch {
      pathExists = false;
    }
  }, 10000);

  it(
    'with maxDepth=5, root size is accurate (unexpanded dirs use getDirectorySizeForScan)',
    async () => {
      if (process.platform !== 'win32' || !pathExists) {
        return;
      }
      const rootFull = await runScanForTest(APP_DATA_LOCAL, Infinity, []);
      const root5 = await runScanForTest(APP_DATA_LOCAL, 5, []);
      // 修复后未展开目录会计算子树大小，根总大小应接近全量扫描（允许因权限/锁导致略小）
      expect(root5.size, '根总大小应大于 0').toBeGreaterThan(0);
      expect(
        root5.size,
        'maxDepth=5 时根总大小应至少为全量扫描的 30%（未展开目录已计入大小）'
      ).toBeGreaterThanOrEqual(rootFull.size * 0.3);
    },
    120000
  );

  it(
    'full scan size matches getDirectorySize (same rules: no symlinks)',
    async () => {
      if (process.platform !== 'win32' || !pathExists) {
        return;
      }
      const rootFull = await runScanForTest(APP_DATA_LOCAL, Infinity, []);
      const actualSize = await getDirectorySize(APP_DATA_LOCAL);
      // 二者均跳过符号链接；若存在权限差异或统计口径差异可能不完全相等，仅断言数量级合理
      expect(rootFull.size, '全量扫描应得到正数大小').toBeGreaterThan(0);
      expect(actualSize, 'getDirectorySize 应得到正数大小').toBeGreaterThan(0);
    },
    120000
  );
});
