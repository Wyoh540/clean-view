/**
 * useFileSystem Hook
 * 文件系统操作 Hook
 */

import { useState, useCallback } from 'react';

import type { FileNode, ScanDirectoryRequest } from '../types';

interface UseFileSystemReturn {
  /** 根文件节点 */
  rootNode: FileNode | null;
  /** 是否正在扫描 */
  isScanning: boolean;
  /** 错误信息 */
  error: string | null;
  /** 选择并扫描目录 */
  selectAndScanDirectory: () => Promise<void>;
  /** 扫描指定目录 */
  scanDirectory: (path: string, options?: Partial<ScanDirectoryRequest>) => Promise<void>;
  /** 取消扫描 */
  cancelScan: () => Promise<void>;
  /** 刷新当前目录 */
  refresh: () => Promise<void>;
}

export function useFileSystem(): UseFileSystemReturn {
  const [rootNode, setRootNode] = useState<FileNode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string | null>(null);

  const scanDirectory = useCallback(
    async (path: string, options?: Partial<ScanDirectoryRequest>) => {
      setIsScanning(true);
      setError(null);
      setCurrentPath(path);

      try {
        const response = await window.cleanViewAPI.scanDirectory({
          path,
          maxDepth: options?.maxDepth,
          excludePatterns: options?.excludePatterns,
        });

        if (response.success && response.root) {
          setRootNode(response.root);
        } else {
          setError(response.error || '扫描失败');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误');
      } finally {
        setIsScanning(false);
      }
    },
    []
  );

  const selectAndScanDirectory = useCallback(async () => {
    try {
      const response = await window.cleanViewAPI.selectDirectory({
        title: '选择要分析的文件夹',
      });

      if (!response.canceled && response.path) {
        await scanDirectory(response.path);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '选择目录失败');
    }
  }, [scanDirectory]);

  const cancelScan = useCallback(async () => {
    if (currentPath) {
      try {
        await window.cleanViewAPI.cancelScan({ path: currentPath });
      } catch (err) {
        console.error('Failed to cancel scan:', err);
      }
    }
    setIsScanning(false);
  }, [currentPath]);

  const refresh = useCallback(async () => {
    if (currentPath) {
      await scanDirectory(currentPath);
    }
  }, [currentPath, scanDirectory]);

  return {
    rootNode,
    isScanning,
    error,
    selectAndScanDirectory,
    scanDirectory,
    cancelScan,
    refresh,
  };
}
