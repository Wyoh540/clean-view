# Tasks: 磁盘空间可视化分析器

**Input**: Design documents from `/specs/001-disk-space-treemap/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/ipc-contracts.ts

**Tests**: 按需添加，核心业务逻辑覆盖

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 使用 Electron Forge + Vite + TypeScript 初始化项目

- [X] T001 使用 Electron Forge 创建项目 `npx create-electron-app@latest . --template=vite-typescript`
- [X] T002 安装核心依赖 (Tailwind CSS, shadcn/ui, Recharts, Radix UI)
- [X] T003 [P] 配置 Tailwind CSS 在 tailwind.config.js
- [X] T004 [P] 配置路径别名在 vite.renderer.config.mjs 和 tsconfig.json
- [X] T005 初始化 shadcn/ui 并添加组件 (button, dialog, card, tooltip, progress)
- [X] T006 [P] 创建全局样式和 CSS 变量在 src/renderer/index.css
- [X] T007 [P] 配置 ESLint 和 Prettier 在项目根目录

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 核心基础设施，所有用户故事的前置条件

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 创建共享类型定义在 src/renderer/types/index.ts (从 contracts/ipc-contracts.ts 复制)
- [X] T009 [P] 创建 IPC 通道常量在 src/main/ipc/channels.ts
- [X] T010 [P] 创建 preload 脚本在 src/main/preload.ts (暴露 cleanViewAPI)
- [X] T011 配置主进程入口在 src/main/main.ts (启用 contextIsolation)
- [X] T012 [P] 创建 IPC 处理器注册入口在 src/main/ipc/index.ts
- [X] T013 [P] 创建工具函数在 src/renderer/lib/utils.ts (cn 函数, 格式化工具)
- [X] T014 [P] 创建格式化工具在 src/renderer/lib/format.ts (formatBytes, formatDate)
- [X] T015 [P] 创建路径工具在 src/main/utils/path-utils.ts
- [X] T016 [P] 创建大小工具在 src/main/utils/size-utils.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 查看文件夹空间分布 (Priority: P1) 🎯 MVP

**Goal**: 用户可以选择文件夹并通过矩形树图查看空间分布

**Independent Test**: 选择任意文件夹，验证树图正确显示所有子项的大小比例关系

### Implementation for User Story 1

- [X] T017 [US1] 实现文件夹选择对话框 IPC 处理器在 src/main/ipc/file-system.ts
- [X] T018 [US1] 实现目录扫描器在 src/main/ipc/scanner.ts (递归扫描，渐进式更新)
- [X] T019 [P] [US1] 创建 FolderPicker 组件在 src/renderer/components/navigation/FolderPicker.tsx
- [X] T020 [P] [US1] 创建 useFileSystem hook 在 src/renderer/hooks/useFileSystem.ts
- [X] T021 [P] [US1] 创建 useScanProgress hook 在 src/renderer/hooks/useScanProgress.ts
- [X] T022 [US1] 创建 Treemap 容器组件在 src/renderer/components/treemap/Treemap.tsx (使用 Recharts)
- [X] T023 [P] [US1] 创建 TreemapCell 自定义渲染器在 src/renderer/components/treemap/TreemapCell.tsx
- [X] T024 [P] [US1] 创建 TreemapTooltip 组件在 src/renderer/components/treemap/TreemapTooltip.tsx
- [X] T025 [US1] 创建 App 根组件在 src/renderer/App.tsx (集成 FolderPicker + Treemap)
- [X] T026 [US1] 添加扫描进度指示器 (Progress 组件) 在 App.tsx
- [X] T027 [US1] 处理无权限访问目录 (标记为 accessible: false) 在 scanner.ts

**Checkpoint**: User Story 1 完成 - 可以选择文件夹并查看树图

---

## Phase 4: User Story 2 - 深入浏览子目录 (Priority: P2)

**Goal**: 用户可以双击进入子文件夹，并通过导航返回上级

**Independent Test**: 点击进入子文件夹，验证视图更新，并能通过返回按钮/面包屑回到上级

### Implementation for User Story 2

- [X] T028 [P] [US2] 创建 useNavigation hook 在 src/renderer/hooks/useNavigation.ts (管理导航状态)
- [X] T029 [US2] 在 TreemapCell 添加双击事件处理在 src/renderer/components/treemap/TreemapCell.tsx
- [X] T030 [US2] 创建 Breadcrumb 导航组件在 src/renderer/components/navigation/Breadcrumb.tsx
- [X] T031 [US2] 在 App.tsx 集成 Breadcrumb 和导航逻辑
- [X] T032 [US2] 实现返回上级目录功能 (返回按钮) 在 App.tsx
- [X] T033 [US2] 实现面包屑快速跳转到任意上级目录

**Checkpoint**: User Story 2 完成 - 可以导航浏览目录结构

---

## Phase 5: User Story 3 - 识别文件所属应用程序 (Priority: P3)

**Goal**: 系统根据文件路径识别其所属的应用程序

**Independent Test**: 查看已知应用目录中的文件，验证正确识别其所属应用

### Implementation for User Story 3

- [X] T034 [US3] 创建应用程序检测器在 src/main/ipc/app-detector.ts (路径模式匹配)
- [X] T035 [US3] 实现 getAppAssociation IPC 处理器在 src/main/ipc/app-detector.ts
- [X] T036 [P] [US3] 创建 FileDetails 组件在 src/renderer/components/details/FileDetails.tsx
- [X] T037 [US3] 在 FileDetails 中显示应用程序关联信息
- [X] T038 [US3] 在 App.tsx 添加文件选中状态和详情面板

**Checkpoint**: User Story 3 完成 - 可以查看文件的应用程序关联

---

## Phase 6: User Story 4 - 评估文件可删除性 (Priority: P4)

**Goal**: 系统对每个文件提供删除安全性评估

**Independent Test**: 查看系统文件、应用文件和个人文件的删除建议，验证评估逻辑合理

### Implementation for User Story 4

- [X] T039 [US4] 实现删除评估逻辑在 src/main/ipc/app-detector.ts (getDeletionAssessment)
- [X] T040 [P] [US4] 创建 SafetyBadge 组件在 src/renderer/components/details/SafetyBadge.tsx
- [X] T041 [US4] 在 FileDetails 中集成 SafetyBadge 显示删除评估
- [X] T042 [US4] 在 TreemapCell 中通过颜色编码显示安全等级

**Checkpoint**: User Story 4 完成 - 可以查看文件的删除安全评估

---

## Phase 7: User Story 5 - 删除选中的文件 (Priority: P5)

**Goal**: 用户可以在应用中删除不需要的文件（移至回收站）

**Independent Test**: 选择并删除测试文件，验证文件被正确移至回收站

### Implementation for User Story 5

- [X] T043 [US5] 实现 deleteFiles IPC 处理器在 src/main/ipc/file-system.ts (使用 shell.trashItem)
- [X] T044 [P] [US5] 创建 DeleteConfirm 对话框组件在 src/renderer/components/details/DeleteConfirm.tsx
- [X] T045 [US5] 在 FileDetails 中添加删除按钮，触发确认对话框
- [X] T046 [US5] 实现删除后刷新树图数据
- [X] T047 [US5] 显示已释放的空间大小
- [X] T048 [US5] 处理文件被占用无法删除的情况

**Checkpoint**: User Story 5 完成 - 完整的删除工作流

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 跨用户故事的优化和改进

- [X] T049 [P] 性能优化：实现懒加载和虚拟化 (大目录)
- [X] T050 [P] 处理符号链接和快捷方式避免循环引用
- [X] T051 [P] 处理扫描过程中文件被外部修改的情况
- [X] T052 [P] 添加结构化日志记录
- [X] T053 代码清理和重构
- [X] T054 运行 quickstart.md 验证

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - 独立，无依赖
- **User Story 2 (P2)**: 依赖 US1 的 Treemap 组件已完成
- **User Story 3 (P3)**: 依赖 US1 的文件扫描功能
- **User Story 4 (P4)**: 依赖 US3 的应用检测功能
- **User Story 5 (P5)**: 依赖 US4 的删除评估功能

### Within Each User Story

- Models/Types before services
- Services before UI components
- IPC handlers before React hooks
- Core implementation before integration

### Parallel Opportunities

**Setup Phase:**
```
T003 (Tailwind) || T004 (Path Alias) || T006 (CSS) || T007 (ESLint)
```

**Foundational Phase:**
```
T009 (Channels) || T010 (Preload) || T012 (IPC Registry) || T013-T016 (Utils)
```

**User Story 1:**
```
T019 (FolderPicker) || T020 (useFileSystem) || T021 (useScanProgress)
T023 (TreemapCell) || T024 (TreemapTooltip)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: 验证可以选择文件夹并显示树图
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → 基础架构就绪
2. User Story 1 → 核心可视化 (MVP!)
3. User Story 2 → 导航浏览
4. User Story 3 → 应用识别
5. User Story 4 → 删除评估
6. User Story 5 → 删除功能
7. Polish → 性能优化和边缘情况处理

---

## Summary

| Phase | Task Count | Focus |
|-------|------------|-------|
| Setup | 7 | 项目初始化 |
| Foundational | 9 | 核心基础设施 |
| User Story 1 | 11 | 树图可视化 |
| User Story 2 | 6 | 目录导航 |
| User Story 3 | 5 | 应用识别 |
| User Story 4 | 4 | 删除评估 |
| User Story 5 | 6 | 删除功能 |
| Polish | 6 | 优化完善 |
| **Total** | **54** | |

**Parallel Opportunities**: 约 25 个任务可并行执行

**MVP Scope**: Phase 1-3 (27 tasks) - 完成后即可演示核心功能
