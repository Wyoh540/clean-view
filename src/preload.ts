/**
 * Preload Script
 * 通过 contextBridge 向渲染进程暴露安全的 API
 */

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

import { IPC_CHANNELS } from './main/ipc/channels';

import type {
  SelectDirectoryRequest,
  SelectDirectoryResponse,
  ScanDirectoryRequest,
  ScanDirectoryResponse,
  CancelScanRequest,
  CancelScanResponse,
  GetFileDetailsRequest,
  GetFileDetailsResponse,
  GetAppAssociationRequest,
  GetAppAssociationResponse,
  GetDeletionAssessmentRequest,
  GetDeletionAssessmentResponse,
  DeleteFilesRequest,
  DeleteFilesResponse,
  OpenInExplorerRequest,
  OpenInExplorerResponse,
  ScanProgress,
} from './renderer/types';

// 暴露 cleanViewAPI 到 window 对象
contextBridge.exposeInMainWorld('cleanViewAPI', {
  // 文件系统操作
  selectDirectory: (request?: SelectDirectoryRequest): Promise<SelectDirectoryResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.SELECT_DIRECTORY, request),

  scanDirectory: (request: ScanDirectoryRequest): Promise<ScanDirectoryResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.SCAN_DIRECTORY, request),

  cancelScan: (request: CancelScanRequest): Promise<CancelScanResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.CANCEL_SCAN, request),

  // 文件信息
  getFileDetails: (request: GetFileDetailsRequest): Promise<GetFileDetailsResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_FILE_DETAILS, request),

  getAppAssociation: (request: GetAppAssociationRequest): Promise<GetAppAssociationResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_APP_ASSOCIATION, request),

  getDeletionAssessment: (
    request: GetDeletionAssessmentRequest
  ): Promise<GetDeletionAssessmentResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_DELETION_ASSESSMENT, request),

  // 删除操作
  deleteFiles: (request: DeleteFilesRequest): Promise<DeleteFilesResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.DELETE_FILES, request),

  // 系统操作
  openInExplorer: (request: OpenInExplorerRequest): Promise<OpenInExplorerResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.OPEN_IN_EXPLORER, request),

  // 事件监听
  onScanProgress: (callback: (progress: ScanProgress) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, progress: ScanProgress) => callback(progress);
    ipcRenderer.on(IPC_CHANNELS.SCAN_PROGRESS, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.SCAN_PROGRESS, handler);
    };
  },
});
