# Implementation Plan: 磁盘空间可视化分析器

**Branch**: `001-disk-space-treemap` | **Date**: 2026-01-12 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-disk-space-treemap/spec.md`

## Summary

构建一款 Windows 桌面应用程序，使用矩形树图（Treemap）直观展示磁盘空间使用情况。用户可以选择文件夹进行扫描，通过可视化界面快速识别占用大量空间的文件和文件夹，并根据智能评估安全地删除不需要的文件。

**技术方案**：使用 Electron Forge + Vite + TypeScript 构建桌面应用，shadcn/ui 提供 UI 组件，Recharts 实现树图可视化。

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**:
- Electron Forge (桌面应用框架)
- Vite (构建工具)
- React 18.x (UI 框架)
- shadcn/ui + Tailwind CSS (UI 组件库)
- Recharts (树图可视化)

**Storage**: 本地文件系统（只读扫描，回收站删除）  
**Testing**: Vitest (单元测试) + Playwright (E2E 测试)  
**Target Platform**: Windows 10/11  
**Project Type**: 桌面应用（Electron）  
**Performance Goals**:
- 1万文件目录 5 秒内显示初始视图
- 10万文件目录 60 秒内完成扫描
- UI 保持 60fps 响应

**Constraints**:
- 单页面内存使用 ≤ 100MB
- 前端包体积 ≤ 300KB (gzip)
- 仅支持 Windows 操作系统

**Scale/Scope**:
- 支持扫描任意大小目录
- 支持 10 万+ 文件的目录

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality Standards ✅

| 规则 | 合规状态 | 说明 |
|------|---------|------|
| 可读性优先 | ✅ | TypeScript 强类型 + 清晰命名约定 |
| 单一职责 | ✅ | 主进程/渲染进程分离，模块化设计 |
| DRY原则 | ✅ | 共享类型定义，组件复用 |
| 静态分析 | ✅ | ESLint + Prettier 配置 |
| 类型安全 | ✅ | 严格 TypeScript，禁用 any |

### II. Testing Standards ✅

| 规则 | 合规状态 | 说明 |
|------|---------|------|
| 测试覆盖率 80% | ✅ | 核心业务逻辑全覆盖 |
| 测试金字塔 | ✅ | 单元(70%) > 集成(20%) > E2E(10%) |
| 测试可重复性 | ✅ | 独立测试，模拟文件系统 |
| 契约测试 | ✅ | IPC 接口类型定义 |

### III. User Experience Consistency ✅

| 规则 | 合规状态 | 说明 |
|------|---------|------|
| 设计系统遵从 | ✅ | shadcn/ui + Tailwind Design Tokens |
| 无障碍性 (A11Y) | ✅ | shadcn/ui 内置 WCAG 2.1 AA 支持 |
| 加载状态 | ✅ | 扫描进度显示 |
| 交互反馈 | ✅ | 100ms 内视觉反馈 |
| 错误处理 | ✅ | 用户友好错误信息 |

### IV. Performance Requirements ✅

| 规则 | 合规状态 | 说明 |
|------|---------|------|
| 响应时间 | ✅ | 渐进式扫描，即时反馈 |
| 资源限制 | ✅ | 内存 ≤ 100MB，包体积优化 |
| 监控和可观测性 | ✅ | 结构化日志记录 |

## Project Structure

### Documentation (this feature)

```text
specs/001-disk-space-treemap/
├── plan.md              # 本文件 (/speckit.plan 输出)
├── research.md          # Phase 0 研究输出
├── data-model.md        # Phase 1 数据模型
├── quickstart.md        # Phase 1 快速开始指南
├── contracts/           # Phase 1 接口契约
│   └── ipc-contracts.ts # Electron IPC 接口定义
└── tasks.md             # Phase 2 任务分解 (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── main/                    # Electron 主进程
│   ├── main.ts             # 主进程入口
│   ├── preload.ts          # 预加载脚本
│   ├── ipc/                # IPC 处理器
│   │   ├── index.ts        # IPC 注册入口
│   │   ├── file-system.ts  # 文件系统操作
│   │   ├── scanner.ts      # 目录扫描器
│   │   └── app-detector.ts # 应用程序检测
│   └── utils/
│       ├── path-utils.ts   # 路径工具函数
│       └── size-utils.ts   # 大小格式化工具
│
└── renderer/                # 渲染进程 (React)
    ├── App.tsx             # 应用根组件
    ├── index.tsx           # 入口文件
    ├── index.css           # 全局样式 + Tailwind
    ├── components/
    │   ├── ui/             # shadcn/ui 组件
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── dialog.tsx
    │   │   ├── progress.tsx
    │   │   └── tooltip.tsx
    │   ├── treemap/        # 树图组件
    │   │   ├── Treemap.tsx
    │   │   ├── TreemapCell.tsx
    │   │   └── TreemapTooltip.tsx
    │   ├── navigation/     # 导航组件
    │   │   ├── Breadcrumb.tsx
    │   │   └── FolderPicker.tsx
    │   └── details/        # 详情组件
    │       ├── FileDetails.tsx
    │       ├── DeleteConfirm.tsx
    │       └── SafetyBadge.tsx
    ├── hooks/
    │   ├── useFileSystem.ts
    │   ├── useScanProgress.ts
    │   └── useNavigation.ts
    ├── lib/
    │   ├── utils.ts        # 通用工具函数
    │   └── format.ts       # 格式化工具
    └── types/
        └── index.ts        # 共享类型定义

tests/
├── unit/                   # 单元测试
│   ├── scanner.test.ts
│   ├── app-detector.test.ts
│   └── format.test.ts
├── integration/            # 集成测试
│   └── ipc.test.ts
└── e2e/                    # 端到端测试
    └── app.spec.ts
```

**Structure Decision**: 采用 Electron 标准的 main/renderer 分离结构，主进程处理文件系统操作，渲染进程负责 UI 展示。通过 preload 脚本提供安全的 IPC 接口。

## Key Design Decisions

### 1. 进程间通信 (IPC)

采用 Electron 的 contextBridge + ipcRenderer/ipcMain 模式：
- 渲染进程通过 `window.cleanViewAPI` 调用主进程功能
- 主进程通过事件推送扫描进度
- 所有接口有明确的 TypeScript 类型定义

### 2. 扫描策略

渐进式扫描策略：
1. **第一层快速扫描**：立即显示直接子项大小
2. **后台深度扫描**：Worker 线程递归扫描
3. **增量更新**：通过 IPC 事件流式更新 UI

### 3. 树图可视化

使用 Recharts Treemap 组件：
- 自定义 Cell 渲染器显示文件/文件夹信息
- 支持双击进入子目录
- 颜色编码表示安全等级

### 4. 删除安全

所有删除操作使用 `shell.trashItem()` 移至回收站：
- 可恢复删除
- 删除前必须确认
- 显示将释放的空间大小

## Complexity Tracking

> 无需记录 - 所有设计决策符合宪法要求，无需特殊复杂性说明。

## Phase Outputs

| Phase | Output | Status |
|-------|--------|--------|
| Phase 0 | [research.md](./research.md) | ✅ 完成 |
| Phase 1 | [data-model.md](./data-model.md) | ✅ 完成 |
| Phase 1 | [contracts/ipc-contracts.ts](./contracts/ipc-contracts.ts) | ✅ 完成 |
| Phase 1 | [quickstart.md](./quickstart.md) | ✅ 完成 |
| Phase 2 | tasks.md | ⏳ 待创建 (/speckit.tasks) |

## Next Steps

运行 `/speckit.tasks` 创建详细的任务分解，开始实现阶段。
