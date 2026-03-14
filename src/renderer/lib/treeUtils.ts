/**
 * 文件树不可变更新工具
 */

import type { FileNode } from '../types';

/**
 * 按 path 查找节点并对其应用 update，返回新树根（不可变）。
 * 若 root.path === targetPath 则 return update(root)；
 * 否则若 root.children 存在则递归子节点，若某子节点递归结果与原子节点不同则用新子节点数组克隆该层并返回新 root；
 * 未找到则 return 原 root。
 */
export function replaceNodeAtPath(
  root: FileNode,
  targetPath: string,
  update: (node: FileNode) => FileNode
): FileNode {
  if (root.path === targetPath) {
    return update(root);
  }
  if (root.children && root.children.length > 0) {
    let changed = false;
    const newChildren = root.children.map(child => {
      const next = replaceNodeAtPath(child, targetPath, update);
      if (next !== child) changed = true;
      return next;
    });
    if (changed) {
      return { ...root, children: newChildren };
    }
  }
  return root;
}
