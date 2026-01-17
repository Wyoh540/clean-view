# Data Model: 磁盘空间可视化分析器

**Branch**: `001-disk-space-treemap` | **Date**: 2026-01-12

## 核心实体

### FileNode（文件节点）

代表文件系统中的一个文件或文件夹。

```typescript
interface FileNode {
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
  
  /** 最后修改时间 */
  modifiedAt: Date;
  
  /** 扫描深度 */
  depth: number;
}
```

**验证规则**:
- `id` 必须唯一且非空
- `size` 必须 ≥ 0
- `type` 为 `directory` 时，`children` 可为数组或 undefined（懒加载）
- `path` 必须是有效的 Windows 路径格式

### AppAssociation（应用程序关联）

描述文件与应用程序的关联关系。

```typescript
interface AppAssociation {
  /** 应用程序名称 */
  appName: string;
  
  /** 应用程序图标路径 */
  iconPath?: string;
  
  /** 关联类型 */
  associationType: 'installed' | 'appData' | 'cache' | 'personal' | 'system' | 'unknown';
  
  /** 置信度 (0-100) */
  confidence: number;
}
```

**关联类型说明**:
| 类型 | 说明 | 路径模式示例 |
|------|------|-------------|
| installed | 已安装应用的核心文件 | `Program Files\AppName\*` |
| appData | 应用数据/配置 | `AppData\*\AppName\*` |
| cache | 应用缓存 | `AppData\Local\Temp\*` |
| personal | 个人文件 | `Documents\*`, `Downloads\*` |
| system | 系统文件 | `Windows\*`, `System32\*` |
| unknown | 无法识别 | 其他路径 |

### DeletionAssessment（删除评估）

对文件可删除性的评估结果。

```typescript
interface DeletionAssessment {
  /** 安全等级 */
  safetyLevel: 'safe' | 'caution' | 'danger';
  
  /** 评估原因 */
  reason: string;
  
  /** 潜在影响描述 */
  impact?: string;
  
  /** 关联的应用程序 */
  associatedApp?: AppAssociation;
}
```

**安全等级定义**:
| 等级 | 含义 | UI 显示 |
|------|------|--------|
| safe | 安全删除，不影响系统和应用 | 绿色标识 |
| caution | 谨慎删除，建议用户确认 | 黄色标识 |
| danger | 不建议删除，可能影响系统或应用 | 红色标识 |

### ScanProgress（扫描进度）

扫描操作的进度状态。

```typescript
interface ScanProgress {
  /** 扫描状态 */
  status: 'idle' | 'scanning' | 'completed' | 'error';
  
  /** 已扫描文件数 */
  scannedCount: number;
  
  /** 已扫描总大小 */
  scannedSize: number;
  
  /** 当前扫描路径 */
  currentPath: string;
  
  /** 错误信息（如有） */
  error?: string;
  
  /** 开始时间 */
  startTime: Date;
  
  /** 预估剩余时间（毫秒） */
  estimatedTimeRemaining?: number;
}
```

### NavigationState（导航状态）

用户浏览目录的状态。

```typescript
interface NavigationState {
  /** 当前查看的目录路径 */
  currentPath: string;
  
  /** 根目录路径（用户选择的目录） */
  rootPath: string;
  
  /** 路径历史（用于面包屑导航） */
  pathHistory: string[];
  
  /** 选中的文件/文件夹 */
  selectedItems: string[];
}
```

### DeleteOperation（删除操作）

删除操作的记录。

```typescript
interface DeleteOperation {
  /** 操作 ID */
  id: string;
  
  /** 删除的文件路径列表 */
  deletedPaths: string[];
  
  /** 释放的空间大小 */
  freedSize: number;
  
  /** 操作时间 */
  timestamp: Date;
  
  /** 操作状态 */
  status: 'pending' | 'success' | 'failed';
  
  /** 失败原因（如有） */
  failureReason?: string;
}
```

## 数据关系图

```
┌─────────────────────────────────────────────────────────────────┐
│                        FileNode (Root)                          │
│  id: "C:\Users\xxx\Downloads"                                   │
│  type: "directory"                                              │
│  size: 10GB                                                     │
├─────────────────────────────────────────────────────────────────┤
│                           children[]                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   FileNode      │  │   FileNode      │  │   FileNode      │  │
│  │   (file)        │  │   (directory)   │  │   (file)        │  │
│  │   app.exe       │  │   project/      │  │   doc.pdf       │  │
│  │   500MB         │  │   2GB           │  │   50MB          │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │           │
│           ▼                    ▼                    ▼           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ AppAssociation  │  │ AppAssociation  │  │ AppAssociation  │  │
│  │ name: "Unknown" │  │ name: "VS Code" │  │ name: "Personal"│  │
│  │ type: "unknown" │  │ type: "appData" │  │ type: "personal"│  │
│  └────────┬────────┘  └─────────────────┘  └────────┬────────┘  │
│           │                                         │           │
│           ▼                                         ▼           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              DeletionAssessment                              ││
│  │  safetyLevel: "caution" | "safe"                            ││
│  │  reason: "Unknown executable" | "Personal document"         ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## 状态转换

### ScanProgress 状态机

```
     ┌──────────┐
     │   idle   │
     └────┬─────┘
          │ startScan()
          ▼
     ┌──────────┐
     │ scanning │◄────────┐
     └────┬─────┘         │
          │               │ retryPath()
          ├───────────────┘
          │
     ┌────┴─────┐
     │          │
     ▼          ▼
┌──────────┐ ┌──────────┐
│completed │ │  error   │
└──────────┘ └──────────┘
```

### DeleteOperation 状态机

```
     ┌──────────┐
     │ pending  │
     └────┬─────┘
          │ execute()
          │
     ┌────┴─────┐
     │          │
     ▼          ▼
┌──────────┐ ┌──────────┐
│ success  │ │  failed  │
└──────────┘ └──────────┘
```

## Treemap 数据格式

Recharts Treemap 组件需要的数据格式：

```typescript
interface TreemapData {
  name: string;
  size?: number;
  children?: TreemapData[];
  // 附加数据
  path?: string;
  type?: 'file' | 'directory';
  safetyLevel?: 'safe' | 'caution' | 'danger';
}
```

**FileNode 到 TreemapData 转换**:

```typescript
function toTreemapData(node: FileNode): TreemapData {
  return {
    name: node.name,
    size: node.type === 'file' ? node.size : undefined,
    children: node.children?.map(toTreemapData),
    path: node.path,
    type: node.type,
  };
}
```
