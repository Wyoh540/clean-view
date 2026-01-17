/**
 * IPC Handler Registration
 * 注册所有 IPC 处理器
 */

import { registerFileSystemHandlers } from './file-system';
import { registerScannerHandlers } from './scanner';
import { registerAppDetectorHandlers } from './app-detector';

/**
 * 注册所有 IPC 处理器
 */
export function registerIpcHandlers(): void {
  registerFileSystemHandlers();
  registerScannerHandlers();
  registerAppDetectorHandlers();

  console.log('[IPC] All handlers registered');
}

export { IPC_CHANNELS } from './channels';
