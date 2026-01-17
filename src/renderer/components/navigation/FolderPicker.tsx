/**
 * FolderPicker Component
 * 文件夹选择组件
 */

import React from 'react';
import { FolderOpen, RefreshCw, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatBytes } from '@/lib/format';

interface FolderPickerProps {
  /** 当前选中的路径 */
  currentPath: string | null;
  /** 是否正在扫描 */
  isScanning: boolean;
  /** 扫描进度 (0-100) */
  scanProgress?: number;
  /** 已扫描文件数 */
  scannedCount?: number;
  /** 已扫描大小 */
  scannedSize?: number;
  /** 点击选择文件夹 */
  onSelectFolder: () => void;
  /** 刷新当前目录 */
  onRefresh: () => void;
  /** 取消扫描 */
  onCancelScan: () => void;
}

export function FolderPicker({
  currentPath,
  isScanning,
  scanProgress,
  scannedCount,
  scannedSize,
  onSelectFolder,
  onRefresh,
  onCancelScan,
}: FolderPickerProps) {
  return (
    <div className="flex flex-col gap-4 p-4 border-b bg-card">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button onClick={onSelectFolder} disabled={isScanning} variant="default">
            <FolderOpen className="w-4 h-4 mr-2" />
            选择文件夹
          </Button>

          {currentPath && (
            <Button onClick={onRefresh} disabled={isScanning} variant="outline" size="icon">
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            </Button>
          )}

          {isScanning && (
            <Button onClick={onCancelScan} variant="ghost" size="icon">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {currentPath && (
          <div className="flex-1 text-sm text-muted-foreground truncate text-right">
            {currentPath}
          </div>
        )}
      </div>

      {isScanning && (
        <div className="space-y-2">
          <Progress value={scanProgress ?? 0} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>已扫描 {scannedCount?.toLocaleString() ?? 0} 个文件</span>
            <span>{formatBytes(scannedSize ?? 0)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
