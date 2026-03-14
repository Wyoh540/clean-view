# 渐进式目录扫描设计（方案 B）

**日期**: 2025-03-14  
**状态**: 已确认

## 目标

解决超大文件夹一次性全量扫描速度慢的问题：初次只扫描 5 层，层级更深的目录在用户「进入」时再以该目录为根扫描 5 层，并将子树挂载到当前树中。

## 行为约定

- **初次扫描**：以用户选择的目录为根，`maxDepth = 5`（根为深度 0，共 5 层）。深度 4 的目录不再递归子节点，仅生成占位节点（无子内容），并标记为未展开。
- **进入未展开目录**：用户双击进入某个「未展开」目录时，以该目录为根、再执行一次最大深度为 5 的扫描；将返回的子树挂到当前树中该节点下，并执行现有导航逻辑（进入该目录视图）。
- **已展开目录**：已有子节点数据的目录，双击仅做导航，不再发起扫描。

## 架构要点

### 1. 数据模型

- **FileNode** 增加可选字段：`childrenLoaded?: boolean`。
  - 仅对目录有效。
  - 初次扫描时，因 `depth >= maxDepth` 而未读取内容的目录设为 `childrenLoaded: false`。
  - 已读取过内容的目录（全量或展开）设为 `true`。未传时按 `true` 处理以兼容旧数据。
- 未展开目录：`type === 'directory'` 且 `childrenLoaded === false`（或 `children` 为空且深度为 4）。进入时触发展开逻辑。

### 2. 后端

- **初次扫描**：保持现有 `SCAN_DIRECTORY`，由前端传入 `maxDepth: 5`。在 `scanDirectory` 中，当 `depth >= maxDepth` 时返回的目录节点增加 `childrenLoaded: false`，且不调用 `readdir`。
- **展开目录**：新增 IPC `EXPAND_DIRECTORY`（或 `fs:expand-directory`）。
  - 请求：`{ path: string; excludePatterns?: string[] }`。
  - 行为：以 `path` 为根目录，执行与当前扫描相同的递归逻辑，`maxDepth = 5`，使用相同排除规则与取消/进度机制（可选复用或简化）。
  - 响应：与 `ScanDirectoryResponse` 一致（`success`, `root?: FileNode`），`root` 即该目录节点（含其下 5 层子树）。

### 3. 前端

- **发起初次扫描**：调用现有 `scanDirectory` 时固定传入 `maxDepth: 5`。
- **导航与展开**：在「双击进入目录」处（如 `handleNodeDoubleClick`）：
  - 若目录已展开（`childrenLoaded !== false` 或已有 `children` 且非占位），仅执行现有 `navigation.navigateTo(node)`。
  - 若目录未展开（`childrenLoaded === false` 或约定下的未展开状态），则：
    1. 调用 `expandDirectory(path)`（或等价 API），可选显示该节点 loading。
    2. 将返回的 `root` 与当前树中同 path 的节点合并：替换该节点的 `children` 为 `root.children`，`size` 为 `root.size`，并设 `childrenLoaded: true`。
    3. 再执行 `navigation.navigateTo(node)`。
- 合并时以 `path` 在现有 `rootNode` 树中查找节点并就地更新，避免整树替换。

### 4. 错误与边界

- 展开失败（无权限、路径不存在、IO 错误）：提示用户，不切换当前导航；该目录保持未展开状态。
- 展开过程中可防重复请求（例如该 path 的展开请求未完成前不再次发起）。
- 取消扫描：若展开使用与全量扫描相同的取消机制，则取消时仅影响当前展开任务，不影响已加载的树。

### 5. 测试与验收

- 选一个层级深、体积大的目录，验证初次扫描仅 5 层且耗时明显低于全量扫描。
- 进入第 5 层中未展开目录，验证会请求 `EXPAND_DIRECTORY` 并正确挂载子树，且导航到该目录后展示正确。
- 再进入新挂载子树中的深层未展开目录，验证可再次展开并导航。
- 空目录、无权限目录展开时行为符合预期（提示或不挂载子节点）。

## 实现顺序建议

1. 数据模型：`FileNode.childrenLoaded` 与初次扫描中设置 `childrenLoaded: false`。
2. 后端：新增 `EXPAND_DIRECTORY` 及实现（复用 `scanDirectory` 逻辑，根路径与 maxDepth 参数化）。
3. 前端：初次扫描传 `maxDepth: 5`；双击进入时判断未展开并调展开 API，合并子树后导航。
4. 错误处理与 loading/防重复请求。
5. 验收与回归测试。

---

下一步：由 writing-plans 根据本文档生成具体实现计划（任务列表与步骤）。
