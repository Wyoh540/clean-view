/**
 * Shared Type Definitions: 磁盘空间可视化分析器
 *
 * 定义渲染进程使用的类型
 * 与 contracts/ipc-contracts.ts 保持同步
 */

// ============================================
// 核心实体类型
// ============================================

export interface FileNode {
  /** 唯一标识符 (使用完整路径) */
  id: string;
  /** 文件/文件夹名称 */
  name: string;
  /** 完整路径 */
  path: string;
  /** 大小（字节） */
  size: number;
  /** 节点类型 */
  type: 'file' | 'directory';
  /** 子节点列表（仅目录有效） */
  children?: FileNode[];
  /** 父节点路径 */
  parentPath: string | null;
  /** 是否可访问 */
  accessible: boolean;
  /** 最后修改时间 (ISO 日期字符串) */
  modifiedAt: string;
  /** 扫描深度 */
  depth: number;
}

export interface AppAssociation {
  /** 应用程序名称 */
  appName: string;
  /** 应用程序图标路径 */
  iconPath?: string;
  /** 关联类型 */
  associationType: 'installed' | 'appData' | 'cache' | 'personal' | 'system' | 'unknown';
  /** 置信度 (0-100) */
  confidence: number;
}

export interface DeletionAssessment {
  /** 安全等级 */
  safetyLevel: 'safe' | 'caution' | 'danger';
  /** 评估原因 */
  reason: string;
  /** 潜在影响描述 */
  impact?: string;
  /** 关联的应用程序 */
  associatedApp?: AppAssociation;
}

export interface ScanProgress {
  /** 扫描状态 */
  status: 'idle' | 'scanning' | 'completed' | 'error' | 'cancelled';
  /** 已扫描文件数 */
  scannedCount: number;
  /** 已扫描总大小 */
  scannedSize: number;
  /** 当前扫描路径 */
  currentPath: string;
  /** 错误信息（如有） */
  error?: string;
  /** 开始时间 (ISO 日期字符串) */
  startTime: string;
  /** 预估剩余时间（毫秒） */
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
// 导航状态
// ============================================

export interface NavigationState {
  /** 当前查看的目录路径 */
  currentPath: string;
  /** 根目录路径（用户选择的目录） */
  rootPath: string;
  /** 路径历史（用于面包屑导航） */
  pathHistory: string[];
  /** 选中的文件/文件夹 */
  selectedItems: string[];
}

// ============================================
// Treemap 数据格式
// ============================================

export interface TreemapData {
  name: string;
  size?: number;
  children?: TreemapData[];
  path?: string;
  type?: 'file' | 'directory';
  safetyLevel?: 'safe' | 'caution' | 'danger';
  accessible?: boolean;
  /** 颜色索引，基于一级子目录分配 */
  colorIndex?: number;
  /** 节点深度 */
  depth?: number;
  /** 索引签名，兼容 Recharts TreemapDataType */
  [key: string]: unknown;
}

/**
 * D3 Treemap 节点数据
 * 用于 D3 hierarchy 和 treemap 布局
 */
export interface TreemapNodeData {
  name: string;
  size: number;
  path: string;
  type: 'file' | 'directory';
  accessible: boolean;
  children?: TreemapNodeData[];
  /** 一级子目录的颜色索引 */
  colorIndex?: number;
}

// ============================================
// IPC 请求/响应类型
// ============================================

export interface SelectDirectoryRequest {
  title?: string;
  defaultPath?: string;
}

export interface SelectDirectoryResponse {
  canceled: boolean;
  path?: string;
}

export interface ScanDirectoryRequest {
  path: string;
  maxDepth?: number;
  excludePatterns?: string[];
}

export interface ScanDirectoryResponse {
  success: boolean;
  root?: FileNode;
  error?: string;
}

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

export interface GetAppAssociationRequest {
  path: string;
}

export interface GetAppAssociationResponse {
  success: boolean;
  association?: AppAssociation;
  error?: string;
}

export interface GetDeletionAssessmentRequest {
  path: string;
}

export interface GetDeletionAssessmentResponse {
  success: boolean;
  assessment?: DeletionAssessment;
  error?: string;
}

export interface DeleteFilesRequest {
  paths: string[];
  useTrash: boolean;
}

export interface DeleteFilesResponse {
  success: boolean;
  result?: DeleteResult;
  error?: string;
}

export interface CancelScanRequest {
  path: string;
}

export interface CancelScanResponse {
  success: boolean;
}

export interface OpenInExplorerRequest {
  path: string;
}

export interface OpenInExplorerResponse {
  success: boolean;
  error?: string;
}

// ============================================
// CleanView API 类型
// ============================================

export interface CleanViewAPI {
  selectDirectory: (request?: SelectDirectoryRequest) => Promise<SelectDirectoryResponse>;
  scanDirectory: (request: ScanDirectoryRequest) => Promise<ScanDirectoryResponse>;
  cancelScan: (request: CancelScanRequest) => Promise<CancelScanResponse>;
  getFileDetails: (request: GetFileDetailsRequest) => Promise<GetFileDetailsResponse>;
  getAppAssociation: (request: GetAppAssociationRequest) => Promise<GetAppAssociationResponse>;
  getDeletionAssessment: (
    request: GetDeletionAssessmentRequest
  ) => Promise<GetDeletionAssessmentResponse>;
  deleteFiles: (request: DeleteFilesRequest) => Promise<DeleteFilesResponse>;
  openInExplorer: (request: OpenInExplorerRequest) => Promise<OpenInExplorerResponse>;
  onScanProgress: (callback: (progress: ScanProgress) => void) => () => void;
}

// ============================================
// 全局类型声明
// ============================================

declare global {
  interface Window {
    cleanViewAPI: CleanViewAPI;
  }
}
