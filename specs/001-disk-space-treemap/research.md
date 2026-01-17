# Research: 磁盘空间可视化分析器

**Branch**: `001-disk-space-treemap` | **Date**: 2026-01-12

## 技术选型研究

### 1. 桌面应用框架

**Decision**: Electron Forge + Vite + TypeScript

**Rationale**:
- Electron Forge 是官方推荐的 Electron 应用构建工具，提供完整的打包和分发流程
- Vite 提供极快的开发服务器启动和热模块替换（HMR）
- TypeScript 提供类型安全，符合宪法中"禁止使用 any 类型"的要求
- 官方提供 `vite-typescript` 模板，开箱即用

**Alternatives considered**:
- electron-vite: 专门为 Electron 优化的 Vite 工具，但社区规模较小
- Webpack + Electron Forge: 成熟但配置复杂，构建速度较慢
- Tauri: 更轻量但需要 Rust 知识，Windows 支持相对较新

**Implementation**:
```bash
npx create-electron-app@latest clean-view --template=vite-typescript
```

### 2. UI 组件库

**Decision**: shadcn/ui + Tailwind CSS

**Rationale**:
- shadcn/ui 提供美观、可访问的 UI 组件，符合宪法中 WCAG 2.1 AA 标准要求
- 组件可复制到项目中，完全可控，避免外部依赖
- 与 Tailwind CSS 紧密集成，使用设计令牌（Design Tokens）
- 支持 Vite 开发环境

**Alternatives considered**:
- Ant Design: 功能丰富但体积大，样式定制困难
- Chakra UI: 良好的可访问性但与 Tailwind 集成度低
- Material UI: 学习曲线陡峭，打包体积大

**Key Components Needed**:
- Button: 操作按钮
- Dialog: 确认对话框
- Card: 文件信息卡片
- Tooltip: 悬停提示
- Progress: 扫描进度
- Breadcrumb: 路径导航

### 3. 树图可视化库

**Decision**: Recharts Treemap 组件

**Rationale**:
- 基于 React 和 D3，声明式 API 易于使用
- 内置 Treemap 组件，支持层级数据
- 支持自定义内容渲染、Tooltip 和交互事件
- 响应式容器适配不同窗口大小
- 社区活跃，文档完善

**Alternatives considered**:
- D3.js 直接使用: 灵活但需要大量手动编码
- ECharts: 功能强大但打包体积较大
- Nivo: 美观但 Treemap 定制性较低

**Implementation Pattern**:
```tsx
<Treemap
  data={hierarchicalData}
  dataKey="size"
  content={<CustomizedContent />}
  onClick={handleItemClick}
>
  <Tooltip content={<FileTooltip />} />
</Treemap>
```

### 4. 文件系统操作

**Decision**: Node.js fs 模块 + Electron IPC

**Rationale**:
- Electron 主进程可直接访问 Node.js fs 模块
- 使用 IPC（进程间通信）在主进程和渲染进程之间传递数据
- 异步操作保持 UI 响应性
- 原生支持 Windows 文件系统操作

**Key APIs**:
- `fs.promises.readdir()`: 读取目录内容
- `fs.promises.stat()`: 获取文件/文件夹大小
- `shell.trashItem()`: 移动到回收站（Electron API）
- `dialog.showOpenDialog()`: 文件夹选择对话框

### 5. 应用程序识别策略

**Decision**: 路径模式匹配 + 常见目录映射

**Rationale**:
- 无需外部数据库或注册表查询
- 基于 Windows 常见目录结构（Program Files、AppData 等）
- 可通过配置文件扩展识别规则
- 简单可靠，维护成本低

**识别规则**:
| 路径模式 | 应用类型 |
|---------|---------|
| `C:\Program Files\*\` | 已安装应用 |
| `C:\Program Files (x86)\*\` | 已安装应用（32位） |
| `%AppData%\*\` | 应用数据 |
| `%LocalAppData%\*\` | 本地应用数据 |
| `%Temp%\*` | 临时文件 |
| `%UserProfile%\Downloads\*` | 下载文件 |
| `%UserProfile%\Documents\*` | 个人文档 |

### 6. 删除安全性评估策略

**Decision**: 基于规则的评估引擎

**Rationale**:
- 可预测且可解释的评估结果
- 用户可理解评估原因
- 规则可扩展和自定义

**评估规则**:

| 安全等级 | 文件类型/位置 |
|---------|--------------|
| 安全删除 | 临时文件 (*.tmp, *.temp)、缓存目录、日志文件 (*.log)、下载目录中的安装包 |
| 谨慎删除 | 个人文档、未知类型文件、应用数据目录 |
| 不建议删除 | 系统文件 (Windows\*, System32\*)、应用核心文件 (*.exe, *.dll in Program Files) |

## 性能优化研究

### 大目录扫描策略

**Decision**: 分层渐进式扫描 + Worker 线程

**Rationale**:
- 首次只扫描第一层目录，快速显示初始视图
- 后台 Worker 线程继续深度扫描
- 流式更新 UI，保持响应性

**Implementation**:
1. 主线程发起扫描请求
2. Worker 线程执行递归扫描
3. 通过消息传递增量更新数据
4. 使用 `requestAnimationFrame` 节流 UI 更新

### 内存管理

**Decision**: 虚拟化 + 懒加载

**Rationale**:
- 只渲染可见区域的树图节点
- 深层目录数据懒加载
- 符合宪法中"单页面内存使用 ≤ 100MB"要求

## 安全考虑

### 文件系统访问

- 使用 Electron Context Isolation
- 通过 preload 脚本暴露安全的 IPC 接口
- 不直接在渲染进程中访问 Node.js API

### 删除操作

- 所有删除操作使用 `shell.trashItem()` 移至回收站
- 删除前必须用户确认
- 记录删除操作日志以便追溯
