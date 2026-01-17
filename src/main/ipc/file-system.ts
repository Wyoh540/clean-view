/**
 * File System IPC Handlers
 * 文件系统操作相关的 IPC 处理器
 */

import { ipcMain, dialog, shell, BrowserWindow } from 'electron';
import fs from 'fs/promises';
import path from 'path';

import { IPC_CHANNELS } from './channels';
import {
  SelectDirectoryRequest,
  SelectDirectoryResponse,
  GetFileDetailsRequest,
  GetFileDetailsResponse,
  DeleteFilesRequest,
  DeleteFilesResponse,
  DeleteResult,
  OpenInExplorerRequest,
  OpenInExplorerResponse,
} from '../../renderer/types';

/**
 * 注册文件系统相关的 IPC 处理器
 */
export function registerFileSystemHandlers(): void {
  // 选择目录
  ipcMain.handle(
    IPC_CHANNELS.SELECT_DIRECTORY,
    async (_event, request?: SelectDirectoryRequest): Promise<SelectDirectoryResponse> => {
      const result = await dialog.showOpenDialog({
        title: request?.title || '选择文件夹',
        defaultPath: request?.defaultPath,
        properties: ['openDirectory'],
      });

      return {
        canceled: result.canceled,
        path: result.filePaths[0],
      };
    }
  );

  // 获取文件详情
  ipcMain.handle(
    IPC_CHANNELS.GET_FILE_DETAILS,
    async (_event, request: GetFileDetailsRequest): Promise<GetFileDetailsResponse> => {
      try {
        const stats = await fs.stat(request.path);
        const name = path.basename(request.path);
        const extension = path.extname(request.path).slice(1).toLowerCase();

        // Windows 特有属性检测
        let isHidden = false;
        let isSystem = false;
        let isReadOnly = false;

        try {
          // 在 Windows 上检查文件属性
          if (process.platform === 'win32') {
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);

            const { stdout } = await execAsync(
              `attrib "${request.path.replace(/"/g, '\\"')}"`,
              { encoding: 'utf8' }
            );

            isHidden = stdout.includes(' H ') || stdout.startsWith('H');
            isSystem = stdout.includes(' S ') || stdout.includes('S ');
            isReadOnly = stdout.includes(' R ') || stdout.includes('R ');
          }
        } catch {
          // 忽略属性检测错误
        }

        return {
          success: true,
          details: {
            name,
            path: request.path,
            size: stats.size,
            type: stats.isDirectory() ? 'directory' : 'file',
            createdAt: stats.birthtime.toISOString(),
            modifiedAt: stats.mtime.toISOString(),
            accessedAt: stats.atime.toISOString(),
            extension: stats.isFile() ? extension : undefined,
            isHidden,
            isSystem,
            isReadOnly,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // 删除文件（移至回收站）
  ipcMain.handle(
    IPC_CHANNELS.DELETE_FILES,
    async (_event, request: DeleteFilesRequest): Promise<DeleteFilesResponse> => {
      const result: DeleteResult = {
        success: true,
        deletedPaths: [],
        freedSize: 0,
        failedPaths: [],
      };

      for (const filePath of request.paths) {
        try {
          // 获取文件大小
          const stats = await fs.stat(filePath);
          const size = stats.isDirectory() ? await getDirectorySize(filePath) : stats.size;

          if (request.useTrash) {
            // 使用回收站
            await shell.trashItem(filePath);
          } else {
            // 直接删除（不推荐）
            if (stats.isDirectory()) {
              await fs.rm(filePath, { recursive: true });
            } else {
              await fs.unlink(filePath);
            }
          }

          result.deletedPaths.push(filePath);
          result.freedSize += size;
        } catch (error) {
          result.success = false;
          result.failedPaths?.push({
            path: filePath,
            reason: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // 发送删除结果事件
      const windows = BrowserWindow.getAllWindows();
      windows.forEach(window => {
        window.webContents.send(IPC_CHANNELS.DELETE_RESULT, result);
      });

      return {
        success: result.success,
        result,
      };
    }
  );

  // 在文件资源管理器中打开
  ipcMain.handle(
    IPC_CHANNELS.OPEN_IN_EXPLORER,
    async (_event, request: OpenInExplorerRequest): Promise<OpenInExplorerResponse> => {
      try {
        // 如果是文件，打开所在目录并选中文件
        // 如果是目录，直接打开该目录
        const stats = await fs.stat(request.path);
        
        if (stats.isFile()) {
          // 打开文件所在目录并选中文件
          shell.showItemInFolder(request.path);
        } else {
          // 打开目录
          await shell.openPath(request.path);
        }

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
}

/**
 * 递归计算目录大小
 */
async function getDirectorySize(dirPath: string): Promise<number> {
  let size = 0;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        size += await getDirectorySize(fullPath);
      } else {
        try {
          const stats = await fs.stat(fullPath);
          size += stats.size;
        } catch {
          // 忽略无法访问的文件
        }
      }
    }
  } catch {
    // 忽略无法访问的目录
  }

  return size;
}
