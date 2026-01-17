/**
 * useScanProgress Hook
 * 扫描进度监听 Hook
 */

import { useState, useEffect, useCallback } from 'react';

import type { ScanProgress } from '../types';

interface UseScanProgressReturn {
  /** 扫描进度 */
  progress: ScanProgress | null;
  /** 是否正在扫描 */
  isScanning: boolean;
  /** 重置进度 */
  resetProgress: () => void;
}

const initialProgress: ScanProgress = {
  status: 'idle',
  scannedCount: 0,
  scannedSize: 0,
  currentPath: '',
  startTime: new Date().toISOString(),
};

export function useScanProgress(): UseScanProgressReturn {
  const [progress, setProgress] = useState<ScanProgress | null>(null);

  const resetProgress = useCallback(() => {
    setProgress(null);
  }, []);

  useEffect(() => {
    // 订阅扫描进度事件
    const unsubscribe = window.cleanViewAPI.onScanProgress(newProgress => {
      setProgress(newProgress);
    });

    // 组件卸载时取消订阅
    return () => {
      unsubscribe();
    };
  }, []);

  const isScanning = progress?.status === 'scanning';

  return {
    progress,
    isScanning,
    resetProgress,
  };
}
