# 渐进式目录扫描（方案 B）实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 初次扫描仅 5 层，用户进入未展开的深层目录时以该目录为根再扫 5 层并挂载子树，从而加快首屏并支持按需展开。

**Architecture:** 前端初次扫描传 `maxDepth: 5`，后端在 `depth >= maxDepth` 时对目录设 `childrenLoaded: false` 并不读子项。新增 `EXPAND_DIRECTORY` IPC，以指定 path 为根、maxDepth=5 执行扫描并返回子树；前端在双击进入目录时若未展开则调用展开、将返回的 root 合并到树中对应节点（替换 children/size/childrenLoaded），再导航。

**Tech Stack:** Electron, React, TypeScript, 现有 IPC/preload/useFileSystem/useNavigation。

**参考设计:** `docs/plans/2025-03-14-progressive-scan-design.md`

---

## Task 1: 为 FileNode 增加 childrenLoaded 类型

**Files:**
- Modify: `src/renderer/types/index.ts`（FileNode 接口）

**Step 1:** 在 `FileNode` 接口中增加可选字段 `childrenLoaded?: boolean`，并加一行注释说明仅目录有效、未展开为 false。

**Step 2:** 运行类型检查确认无报错。

```bash
cd e:\clean-view && npx tsc --noEmit
```

Expected: 无错误。

**Step 3:** Commit

```bash
git add src/renderer/types/index.ts
git commit -m "feat(types): add FileNode.childrenLoaded for progressive scan"
```

---

## Task 2: 初次扫描时设置 childrenLoaded 并限制深度

**Files:**
- Modify: `src/main/ipc/scanner.ts`（scanDirectory 函数与调用处）

**Step 2.1:** 在 `scanDirectory` 中，当 `depth >= maxDepth` 时，在返回的目录节点上设置 `childrenLoaded: false`（当前为 `return node`，给 node 增加该属性后再 return）。

**Step 2.2:** 确保 SCAN_DIRECTORY 的默认 maxDepth 仍由请求决定；前端将在 Task 4 传 5。主进程若未传则保持 `maxDepth ?? Infinity` 不变。

**Step 2.3:** 运行类型检查与现有测试。

```bash
npx tsc --noEmit
npm run test -- --run
```

Expected: 通过。

**Step 2.4:** Commit

```bash
git add src/main/ipc/scanner.ts
git commit -m "feat(scanner): set childrenLoaded false when depth >= maxDepth"
```

---

## Task 3: 新增 EXPAND_DIRECTORY IPC 与类型

**Files:**
- Modify: `src/main/ipc/channels.ts`（新增通道名）
- Modify: `src/renderer/types/index.ts`（ExpandDirectoryRequest/Response，CleanViewAPI 增加 expandDirectory）
- Modify: `src/main/ipc/scanner.ts`（注册 handle EXPAND_DIRECTORY，内部调用现有 scanDirectory(path, null, 0, 5, excludePatterns ?? [], path)）
- Modify: `src/preload.ts`（暴露 expandDirectory，调用新通道）

**Step 3.1:** 在 `channels.ts` 中增加 `EXPAND_DIRECTORY: 'fs:expand-directory'`。

**Step 3.2:** 在 `src/renderer/types/index.ts` 中增加：

```ts
export interface ExpandDirectoryRequest {
  path: string;
  excludePatterns?: string[];
}

export interface ExpandDirectoryResponse {
  success: boolean;
  root?: FileNode;
  error?: string;
}
```

在 `CleanViewAPI` 中增加：  
`expandDirectory: (request: ExpandDirectoryRequest) => Promise<ExpandDirectoryResponse>;`

**Step 3.3:** 在 `scanner.ts` 的 `registerScannerHandlers` 中注册 `ipcMain.handle(IPC_CHANNELS.EXPAND_DIRECTORY, async (_event, request) => { ... })`。实现：从 request 取 `path`、`excludePatterns`，调用 `scanDirectory(path, null, 0, 5, excludePatterns ?? [], path)`，返回 `{ success: true, root }` 或 catch 返回 `{ success: false, error }`。不写入 scanProgressMap/activeScanCancelled（展开为短时任务，可选后续再加进度）。

**Step 3.4:** 在 `preload.ts` 中 import `ExpandDirectoryRequest`/`ExpandDirectoryResponse` 和 `IPC_CHANNELS.EXPAND_DIRECTORY`，在 `cleanViewAPI` 对象上添加 `expandDirectory` 调用 `ipcRenderer.invoke(IPC_CHANNELS.EXPAND_DIRECTORY, request)`。

**Step 3.5:** 运行类型检查与测试。

```bash
npx tsc --noEmit
npm run test -- --run
```

**Step 3.6:** Commit

```bash
git add src/main/ipc/channels.ts src/renderer/types/index.ts src/main/ipc/scanner.ts src/preload.ts
git commit -m "feat(ipc): add EXPAND_DIRECTORY for lazy subtree scan"
```

---

## Task 4: 前端初次扫描固定 maxDepth 5 并实现展开与合并

**Files:**
- Modify: `src/renderer/hooks/useFileSystem.ts`
- Create or Modify: `src/renderer/lib/treeUtils.ts`（可选：将“按 path 替换节点”的不可变更新放在此处）

**Step 4.1:** 在 `useFileSystem` 的 `scanDirectory` 调用处，为 request 固定传入 `maxDepth: 5`（与 options 合并：`maxDepth: options?.maxDepth ?? 5`）。

**Step 4.2:** 实现不可变“按 path 更新节点”的辅助函数。在 `src/renderer/lib/treeUtils.ts` 中实现：

```ts
export function replaceNodeAtPath(
  root: FileNode,
  targetPath: string,
  update: (node: FileNode) => FileNode
): FileNode
```

逻辑：若 `root.path === targetPath` 则 return `update(root)`；否则若 `root.children` 存在则递归子节点，若某子节点递归结果与原子节点不同则用新子节点数组克隆该层并返回新 root；未找到则 return 原 root。需克隆被修改路径上的节点以保持不可变。

**Step 4.3:** 在 `useFileSystem` 中新增 `expandDirectory: (path: string) => Promise<void>`。实现：`const res = await window.cleanViewAPI.expandDirectory({ path })`；若 `res.success && res.root`，则 `setRootNode(prev => prev ? replaceNodeAtPath(prev, path, node => ({ ...node, children: res.root!.children, size: res.root!.size, childrenLoaded: true })) : prev)`；若失败可 setError 或仅 log。`replaceNodeAtPath` 返回新树根（未找到 path 时返回原 root），合并时用 `res.root` 的 children、size 并将目标节点设 `childrenLoaded: true`。

**Step 4.4:** 在 useFileSystem 的返回值中增加 `expandDirectory`。

**Step 4.5:** 运行类型检查与测试。

```bash
npx tsc --noEmit
npm run test -- --run
```

**Step 4.6:** Commit

```bash
git add src/renderer/hooks/useFileSystem.ts src/renderer/lib/treeUtils.ts
git commit -m "feat(renderer): initial scan maxDepth 5, expandDirectory and merge subtree"
```

---

## Task 5: 双击进入未展开目录时触发展开再导航

**Files:**
- Modify: `src/renderer/App.tsx`

**Step 5.1:** 从 `useFileSystem` 解构出 `expandDirectory`。

**Step 5.2:** 修改 `handleNodeDoubleClick`：若 `node.type === 'directory' && node.accessible`，先判断是否未展开（`node.childrenLoaded === false` 或（无 childrenLoaded 且无 children 的目录也可视为未展开，为兼容可仅用 `childrenLoaded === false`））。若未展开，则 `await expandDirectory(node.path)`，再执行 `navigation.navigateTo(node)`；若已展开，则仅 `navigation.navigateTo(node)`。注意展开后树中该节点已更新，但 `node` 引用可能仍是旧的，导航时可用 `findNodeByPath(node.path)` 得到最新节点再 navigateTo，或直接 navigateTo(node) 依赖 navigation 从 rootNode 取 currentNode（rootNode 已更新则 currentNode 会更新）。为简单起见可先 `await expandDirectory(node.path)` 后仍 `navigation.navigateTo(node)`，因为 navigateTo 只改 currentPath，当前视图会从 rootNode 用 findNodeByPath(currentPath) 取 currentNode，而 rootNode 已更新故新 currentNode 会有 children。

**Step 5.3:** 可选：对正在展开的 path 做 loading 防重（如 useState expandingPath，展开前 set、完成后 clear），避免重复点击触发多次请求。

**Step 5.4:** 运行类型检查与测试，并手动验证：选大目录扫描，确认只扫 5 层；双击第 5 层某目录，确认会请求并展示子树。

**Step 5.5:** Commit

```bash
git add src/renderer/App.tsx
git commit -m "feat(app): expand directory on double-click when childrenLoaded false"
```

---

## Task 6: 错误处理与边界

**Files:**
- Modify: `src/renderer/App.tsx` 或 `src/renderer/hooks/useFileSystem.ts`

**Step 6.1:** 展开失败时（expandDirectory 返回 success: false 或抛错）：在 useFileSystem 的 expandDirectory 内 setError(response.error) 或 toast；在 App 的 handleNodeDoubleClick 中若 expand 失败则不调用 navigateTo，避免进入空视图。

**Step 6.2:** 可选：展开中禁用该节点的再次展开（用 expandingPath 或 loading 状态），防止重复请求。

**Step 6.3:** 运行测试并手动回归。

**Step 6.4:** Commit

```bash
git add src/renderer/App.tsx src/renderer/hooks/useFileSystem.ts
git commit -m "fix: expand error handling and prevent double expand"
```

---

## 验收

- 选择层级深、体积大的目录：首扫明显变快，仅 5 层。
- 双击第 5 层中未展开目录：发起展开请求，子树挂载后自动进入该目录视图。
- 再双击新子树中的未展开目录：可再次展开并进入。
- 无权限或无效路径展开时：有提示且不切换导航。

---

**Plan complete and saved to `docs/plans/2025-03-14-progressive-scan-implementation.md`.**

执行方式二选一：

1. **Subagent-Driven（本会话）** — 按任务派发子 agent，每步完成后你做 review，再继续下一任务。  
2. **Parallel Session（新会话）** — 在新会话中打开 executing-plans，在独立 worktree 中按检查点批量执行。

你更倾向哪种？
