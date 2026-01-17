/**
 * Treemap 组件共享类型定义
 */

import type { HierarchyRectangularNode } from 'd3-hierarchy';

/** D3 hierarchy 使用的节点数据 */
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

/** D3 计算后的节点类型 */
export type LayoutNode = HierarchyRectangularNode<TreemapNodeData>;
