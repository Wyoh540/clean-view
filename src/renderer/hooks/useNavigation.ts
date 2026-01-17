/**
 * useNavigation Hook
 * 目录导航状态管理 Hook
 */

import { useState, useCallback, useMemo } from 'react';

import type { FileNode, NavigationState } from '../types';

interface UseNavigationReturn {
  /** 导航状态 */
  state: NavigationState;
  /** 当前显示的节点 */
  currentNode: FileNode | null;
  /** 是否可以返回上级 */
  canGoBack: boolean;
  /** 是否在根目录 */
  isAtRoot: boolean;
  /** 进入子目录 */
  navigateTo: (node: FileNode) => void;
  /** 返回上级目录 */
  goBack: () => void;
  /** 跳转到指定路径 */
  jumpTo: (path: string) => void;
  /** 跳转到根目录 */
  goToRoot: () => void;
  /** 设置根节点 */
  setRoot: (node: FileNode | null) => void;
  /** 选中节点 */
  selectItem: (path: string) => void;
  /** 清除选中 */
  clearSelection: () => void;
  /** 获取面包屑路径 */
  breadcrumbs: Array<{ name: string; path: string }>;
}

export function useNavigation(initialRoot: FileNode | null = null): UseNavigationReturn {
  const [rootNode, setRootNode] = useState<FileNode | null>(initialRoot);
  const [state, setState] = useState<NavigationState>({
    currentPath: initialRoot?.path ?? '',
    rootPath: initialRoot?.path ?? '',
    pathHistory: initialRoot ? [initialRoot.path] : [],
    selectedItems: [],
  });

  // 根据路径查找节点
  const findNodeByPath = useCallback(
    (targetPath: string): FileNode | null => {
      if (!rootNode) return null;

      const search = (node: FileNode): FileNode | null => {
        if (node.path === targetPath) return node;
        if (node.children) {
          for (const child of node.children) {
            const found = search(child);
            if (found) return found;
          }
        }
        return null;
      };

      return search(rootNode);
    },
    [rootNode]
  );

  // 当前显示的节点
  const currentNode = useMemo(() => {
    if (!state.currentPath) return rootNode;
    return findNodeByPath(state.currentPath);
  }, [state.currentPath, findNodeByPath, rootNode]);

  // 是否可以返回上级
  const canGoBack = state.pathHistory.length > 1;

  // 是否在根目录
  const isAtRoot = state.currentPath === state.rootPath;

  // 面包屑导航
  const breadcrumbs = useMemo(() => {
    if (!rootNode) return [];

    const crumbs: Array<{ name: string; path: string }> = [];

    // 从当前路径回溯到根路径
    let path = state.currentPath;
    while (path && path.length >= state.rootPath.length) {
      const node = findNodeByPath(path);
      if (node) {
        crumbs.unshift({ name: node.name, path: node.path });
      }

      // 获取父路径
      const lastSep = path.lastIndexOf('\\');
      if (lastSep === -1 || lastSep < state.rootPath.length) break;
      path = path.substring(0, lastSep);
    }

    return crumbs;
  }, [state.currentPath, state.rootPath, findNodeByPath, rootNode]);

  // 进入子目录
  const navigateTo = useCallback((node: FileNode) => {
    if (node.type !== 'directory') return;

    setState(prev => ({
      ...prev,
      currentPath: node.path,
      pathHistory: [...prev.pathHistory, node.path],
      selectedItems: [],
    }));
  }, []);

  // 返回上级目录
  const goBack = useCallback(() => {
    setState(prev => {
      if (prev.pathHistory.length <= 1) return prev;

      const newHistory = prev.pathHistory.slice(0, -1);
      return {
        ...prev,
        currentPath: newHistory[newHistory.length - 1],
        pathHistory: newHistory,
        selectedItems: [],
      };
    });
  }, []);

  // 跳转到指定路径
  const jumpTo = useCallback((path: string) => {
    setState(prev => {
      // 找到该路径在历史中的位置
      const index = prev.pathHistory.indexOf(path);
      if (index !== -1) {
        // 截断历史到该位置
        return {
          ...prev,
          currentPath: path,
          pathHistory: prev.pathHistory.slice(0, index + 1),
          selectedItems: [],
        };
      }

      // 如果不在历史中，添加到历史
      return {
        ...prev,
        currentPath: path,
        pathHistory: [...prev.pathHistory, path],
        selectedItems: [],
      };
    });
  }, []);

  // 跳转到根目录
  const goToRoot = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentPath: prev.rootPath,
      pathHistory: [prev.rootPath],
      selectedItems: [],
    }));
  }, []);

  // 设置根节点
  const setRoot = useCallback((node: FileNode | null) => {
    setRootNode(node);
    if (node) {
      setState({
        currentPath: node.path,
        rootPath: node.path,
        pathHistory: [node.path],
        selectedItems: [],
      });
    } else {
      setState({
        currentPath: '',
        rootPath: '',
        pathHistory: [],
        selectedItems: [],
      });
    }
  }, []);

  // 选中节点
  const selectItem = useCallback((path: string) => {
    setState(prev => ({
      ...prev,
      selectedItems: [path],
    }));
  }, []);

  // 清除选中
  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedItems: [],
    }));
  }, []);

  return {
    state,
    currentNode,
    canGoBack,
    isAtRoot,
    navigateTo,
    goBack,
    jumpTo,
    goToRoot,
    setRoot,
    selectItem,
    clearSelection,
    breadcrumbs,
  };
}
