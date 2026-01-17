/**
 * Directory Scanner
 * 目录扫描器 - 递归扫描目录并返回文件树
 */

import { ipcMain, BrowserWindow } from 'electron';
import fs from 'fs/promises';
import path from 'path';

import { IPC_CHANNELS } from './channels';
import {
  ScanDirectoryRequest,
  ScanDirectoryResponse,
  FileNode,
  ScanProgress,
  CancelScanRequest,
  CancelScanResponse,
} from '../../renderer/types';

// 活跃扫描任务的取消标志
const activeScanCancelled = new Map<string, boolean>();

// 扫描进度状态
const scanProgressMap = new Map<string, ScanProgress>();

/**
 * 注册扫描相关的 IPC 处理器
 */
export function registerScannerHandlers(): void {
  // 扫描目录
  ipcMain.handle(
    IPC_CHANNELS.SCAN_DIRECTORY,
    async (_event, request: ScanDirectoryRequest): Promise<ScanDirectoryResponse> => {
      const { path: scanPath, maxDepth, excludePatterns } = request;

      // 初始化取消标志
      activeScanCancelled.set(scanPath, false);

      // 初始化进度
      const progress: ScanProgress = {
        status: 'scanning',
        scannedCount: 0,
        scannedSize: 0,
        currentPath: scanPath,
        startTime: new Date().toISOString(),
      };
      scanProgressMap.set(scanPath, progress);

      try {
        const root = await scanDirectory(
          scanPath,
          null,
          0,
          maxDepth ?? Infinity,
          excludePatterns ?? [],
          scanPath
        );

        // 检查是否被取消
        if (activeScanCancelled.get(scanPath)) {
          return {
            success: false,
            error: 'Scan cancelled',
          };
        }

        // 更新完成状态
        progress.status = 'completed';
        sendScanProgress(progress);

        return {
          success: true,
          root,
        };
      } catch (error) {
        progress.status = 'error';
        progress.error = error instanceof Error ? error.message : 'Unknown error';
        sendScanProgress(progress);

        return {
          success: false,
          error: progress.error,
        };
      } finally {
        // 清理
        activeScanCancelled.delete(scanPath);
        scanProgressMap.delete(scanPath);
      }
    }
  );

  // 取消扫描
  ipcMain.handle(
    IPC_CHANNELS.CANCEL_SCAN,
    async (_event, request: CancelScanRequest): Promise<CancelScanResponse> => {
      activeScanCancelled.set(request.path, true);
      
      // 发送取消状态的进度事件给前端
      const progress = scanProgressMap.get(request.path);
      if (progress) {
        progress.status = 'cancelled';
        sendScanProgress(progress);
      } else {
        // 如果没有找到进度状态，创建一个新的取消状态
        sendScanProgress({
          status: 'cancelled',
          scannedCount: 0,
          scannedSize: 0,
          currentPath: request.path,
          startTime: new Date().toISOString(),
        });
      }
      
      return { success: true };
    }
  );
}

/**
 * 递归扫描目录
 */
async function scanDirectory(
  dirPath: string,
  parentPath: string | null,
  depth: number,
  maxDepth: number,
  excludePatterns: string[],
  rootPath: string
): Promise<FileNode> {
  const name = path.basename(dirPath);
  let stats;
  let accessible = true;

  try {
    stats = await fs.stat(dirPath);
  } catch (error) {
    // 无法访问
    accessible = false;
    return {
      id: dirPath,
      name,
      path: dirPath,
      size: 0,
      type: 'directory',
      parentPath,
      accessible: false,
      modifiedAt: new Date().toISOString(),
      depth,
    };
  }

  // 检查是否为目录
  if (!stats.isDirectory()) {
    return {
      id: dirPath,
      name,
      path: dirPath,
      size: stats.size,
      type: 'file',
      parentPath,
      accessible: true,
      modifiedAt: stats.mtime.toISOString(),
      depth,
    };
  }

  // 目录节点
  const node: FileNode = {
    id: dirPath,
    name,
    path: dirPath,
    size: 0,
    type: 'directory',
    children: [],
    parentPath,
    accessible,
    modifiedAt: stats.mtime.toISOString(),
    depth,
  };

  // 检查深度限制
  if (depth >= maxDepth) {
    return node;
  }

  // 检查是否被取消
  if (activeScanCancelled.get(rootPath)) {
    return node;
  }

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      // 检查是否被排除
      if (shouldExclude(fullPath, excludePatterns)) {
        continue;
      }

      // 更新进度
      const progress = scanProgressMap.get(rootPath);
      if (progress) {
        progress.scannedCount++;
        progress.currentPath = fullPath;
        // 每 100 个文件发送一次进度更新
        if (progress.scannedCount % 100 === 0) {
          sendScanProgress(progress);
        }
      }

      // 跳过符号链接避免循环引用
      if (entry.isSymbolicLink()) {
        continue;
      }

      if (entry.isDirectory()) {
        const childNode = await scanDirectory(
          fullPath,
          dirPath,
          depth + 1,
          maxDepth,
          excludePatterns,
          rootPath
        );
        node.children?.push(childNode);
        node.size += childNode.size;
      } else if (entry.isFile()) {
        try {
          const fileStats = await fs.stat(fullPath);
          const fileNode: FileNode = {
            id: fullPath,
            name: entry.name,
            path: fullPath,
            size: fileStats.size,
            type: 'file',
            parentPath: dirPath,
            accessible: true,
            modifiedAt: fileStats.mtime.toISOString(),
            depth: depth + 1,
          };
          node.children?.push(fileNode);
          node.size += fileStats.size;

          // 更新进度中的总大小
          if (progress) {
            progress.scannedSize += fileStats.size;
          }
        } catch {
          // 无法访问的文件
          const inaccessibleNode: FileNode = {
            id: fullPath,
            name: entry.name,
            path: fullPath,
            size: 0,
            type: 'file',
            parentPath: dirPath,
            accessible: false,
            modifiedAt: new Date().toISOString(),
            depth: depth + 1,
          };
          node.children?.push(inaccessibleNode);
        }
      }
      // 跳过符号链接和其他类型
    }

    // 按大小排序子节点（降序）
    node.children?.sort((a, b) => b.size - a.size);
  } catch (error) {
    // 无法读取目录内容
    node.accessible = false;
  }

  return node;
}

/**
 * 检查路径是否应该被排除
 */
function shouldExclude(filePath: string, patterns: string[]): boolean {
  const normalizedPath = filePath.toLowerCase();

  for (const pattern of patterns) {
    // 简单的模式匹配
    if (pattern.startsWith('*')) {
      const suffix = pattern.slice(1).toLowerCase();
      if (normalizedPath.endsWith(suffix)) {
        return true;
      }
    } else if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1).toLowerCase();
      if (normalizedPath.includes(prefix)) {
        return true;
      }
    } else if (normalizedPath.includes(pattern.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * 发送扫描进度到所有窗口
 */
function sendScanProgress(progress: ScanProgress): void {
  const windows = BrowserWindow.getAllWindows();
  windows.forEach(window => {
    window.webContents.send(IPC_CHANNELS.SCAN_PROGRESS, progress);
  });
}
