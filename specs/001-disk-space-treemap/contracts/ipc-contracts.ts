/**
 * IPC Contracts: 磁盘空间可视化分析器
 * 
 * 定义 Electron 主进程和渲染进程之间的通信接口
 * Branch: 001-disk-space-treemap | Date: 2026-01-12
 */

// ============================================
// 共享类型定义
// ============================================

export interface FileNode {
  id: string;
  name: string;
  path: string;
  size: number;
  type: 'file' | 'directory';
  children?: FileNode[];
  parentPath: string | null;
  accessible: boolean;
  modifiedAt: string; // ISO 日期字符串
  depth: number;
}

export interface AppAssociation {
  appName: string;
  iconPath?: string;
  associationType: 'installed' | 'appData' | 'cache' | 'personal' | 'system' | 'unknown';
  confidence: number;
}

export interface DeletionAssessment {
  safetyLevel: 'safe' | 'caution' | 'danger';
  reason: string;
  impact?: string;
  associatedApp?: AppAssociation;
}

export interface ScanProgress {
  status: 'idle' | 'scanning' | 'completed' | 'error';
  scannedCount: number;
  scannedSize: number;
  currentPath: string;
  error?: string;
  startTime: string; // ISO 日期字符串
  estimatedTimeRemaining?: number;
}

export interface DeleteResult {
  success: boolean;
  deletedPaths: string[];
  freedSize: number;
  failedPaths?: Array<{
    path: string;
    reason: string;
  }>;
}

// ============================================
// IPC 通道名称常量
// ============================================

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
} as const;

// ============================================
// 请求/响应接口定义
// ============================================

/**
 * 选择目录
 * Channel: fs:select-directory
 */
export interface SelectDirectoryRequest {
  title?: string;
  defaultPath?: string;
}

export interface SelectDirectoryResponse {
  canceled: boolean;
  path?: string;
}

/**
 * 扫描目录
 * Channel: fs:scan-directory
 */
export interface ScanDirectoryRequest {
  path: string;
  maxDepth?: number; // 默认无限制
  excludePatterns?: string[]; // 排除的路径模式
}

export interface ScanDirectoryResponse {
  success: boolean;
  root?: FileNode;
  error?: string;
}

/**
 * 扫描进度更新
 * Channel: fs:scan-progress (事件)
 */
export type ScanProgressEvent = ScanProgress;

/**
 * 取消扫描
 * Channel: fs:cancel-scan
 */
export interface CancelScanRequest {
  path: string;
}

export interface CancelScanResponse {
  success: boolean;
}

/**
 * 获取文件详情
 * Channel: fs:get-file-details
 */
export interface GetFileDetailsRequest {
  path: string;
}

export interface GetFileDetailsResponse {
  success: boolean;
  details?: {
    name: string;
    path: string;
    size: number;
    type: 'file' | 'directory';
    createdAt: string;
    modifiedAt: string;
    accessedAt: string;
    extension?: string;
    isHidden: boolean;
    isSystem: boolean;
    isReadOnly: boolean;
  };
  error?: string;
}

/**
 * 获取应用程序关联
 * Channel: fs:get-app-association
 */
export interface GetAppAssociationRequest {
  path: string;
}

export interface GetAppAssociationResponse {
  success: boolean;
  association?: AppAssociation;
  error?: string;
}

/**
 * 获取删除评估
 * Channel: fs:get-deletion-assessment
 */
export interface GetDeletionAssessmentRequest {
  path: string;
}

export interface GetDeletionAssessmentResponse {
  success: boolean;
  assessment?: DeletionAssessment;
  error?: string;
}

/**
 * 删除文件
 * Channel: fs:delete-files
 */
export interface DeleteFilesRequest {
  paths: string[];
  useTrash: boolean; // 始终应为 true，使用回收站
}

export interface DeleteFilesResponse {
  success: boolean;
  result?: DeleteResult;
  error?: string;
}

// ============================================
// Preload API 类型定义
// ============================================

/**
 * 暴露给渲染进程的 API 接口
 * 通过 contextBridge 注入到 window 对象
 */
export interface CleanViewAPI {
  // 文件系统操作
  selectDirectory: (request?: SelectDirectoryRequest) => Promise<SelectDirectoryResponse>;
  scanDirectory: (request: ScanDirectoryRequest) => Promise<ScanDirectoryResponse>;
  cancelScan: (request: CancelScanRequest) => Promise<CancelScanResponse>;
  
  // 文件信息
  getFileDetails: (request: GetFileDetailsRequest) => Promise<GetFileDetailsResponse>;
  getAppAssociation: (request: GetAppAssociationRequest) => Promise<GetAppAssociationResponse>;
  getDeletionAssessment: (request: GetDeletionAssessmentRequest) => Promise<GetDeletionAssessmentResponse>;
  
  // 删除操作
  deleteFiles: (request: DeleteFilesRequest) => Promise<DeleteFilesResponse>;
  
  // 事件监听
  onScanProgress: (callback: (progress: ScanProgressEvent) => void) => () => void;
}

// ============================================
// 全局类型声明
// ============================================

declare global {
  interface Window {
    cleanViewAPI: CleanViewAPI;
  }
}
