/**
 * IPC Channel Constants
 * 定义主进程和渲染进程之间的通信通道名称
 */

export const IPC_CHANNELS = {
  // 文件系统操作
  SELECT_DIRECTORY: 'fs:select-directory',
  SCAN_DIRECTORY: 'fs:scan-directory',
  SCAN_PROGRESS: 'fs:scan-progress',
  CANCEL_SCAN: 'fs:cancel-scan',

  // 文件信息
  GET_FILE_DETAILS: 'fs:get-file-details',
  GET_APP_ASSOCIATION: 'fs:get-app-association',
  GET_DELETION_ASSESSMENT: 'fs:get-deletion-assessment',

  // 删除操作
  DELETE_FILES: 'fs:delete-files',
  DELETE_RESULT: 'fs:delete-result',

  // 系统操作
  OPEN_IN_EXPLORER: 'shell:open-in-explorer',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
