/**
 * Treemap Component
 * 嵌套矩形树图容器组件 - 使用 D3 treemap 布局
 * 清晰展示文件夹层次结构和空间占用关系
 */

import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy';

import type { FileNode } from '@/types';
import { TreemapNode } from './TreemapNode';
import { TreemapTooltip } from './TreemapTooltip';
import type { TreemapNodeData, LayoutNode } from './types';

interface TreemapProps {
  /** 文件节点数据 */
  data: FileNode | null;
  /** 点击节点 */
  onNodeClick?: (node: FileNode) => void;
  /** 双击节点（进入目录） */
  onNodeDoubleClick?: (node: FileNode) => void;
  /** 选中的节点路径 */
  selectedPath?: string | null;
}

/** 目录头部高度 */
const HEADER_HEIGHT = 22;
/** 内边距 */
const PADDING = 2;
/** 最小可见尺寸 */
const MIN_SIZE = 4;

/**
 * 将 FileNode 转换为 D3 hierarchy 数据格式
 * @param node 文件节点
 * @param colorIndex 颜色索引，从一级子节点传递下来，同一子树共享相同颜色
 */
function toHierarchyData(node: FileNode, colorIndex?: number): TreemapNodeData {
  if (node.type === 'file') {
    return {
      name: node.name,
      size: node.size,
      path: node.path,
      type: 'file',
      accessible: node.accessible,
      colorIndex,
    };
  }

  // 目录：递归处理子节点，继承父级的颜色索引
  // 过滤掉空文件（size === 0 的文件），但保留目录（即使是空的）
  const children = node.children
    ?.filter((child) => child.type === 'directory' || child.size > 0)
    .map((child) => toHierarchyData(child, colorIndex));

  return {
    name: node.name,
    size: node.size,
    path: node.path,
    type: 'directory',
    accessible: node.accessible,
    colorIndex,
    children: children && children.length > 0 ? children : undefined,
  };
}

/**
 * 计算 treemap 布局
 */
function computeLayout(
  data: TreemapNodeData,
  width: number,
  height: number
): LayoutNode {
  const root = hierarchy(data)
    .sum((d) => (d.type === 'file' ? d.size : 0))
    .sort((a, b) => (b.value || 0) - (a.value || 0));

  const treemapLayout = treemap<TreemapNodeData>()
    .size([width, height])
    .tile(treemapSquarify.ratio(1))
    .paddingOuter(PADDING)
    .paddingTop((node) => (node.depth > 0 ? HEADER_HEIGHT : PADDING))
    .paddingInner(PADDING)
    .round(true);

  return treemapLayout(root);
}

export function Treemap({
  data,
  onNodeClick,
  onNodeDoubleClick,
  selectedPath,
}: TreemapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredNode, setHoveredNode] = useState<LayoutNode | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // 监听容器尺寸变化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 立即获取初始尺寸，避免首次渲染时 ResizeObserver 回调延迟导致的空白
    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    // 立即读取一次
    updateDimensions();

    // 监听后续尺寸变化
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // 转换并计算布局
  const layoutRoot = useMemo(() => {
    if (!data || dimensions.width === 0 || dimensions.height === 0) {
      return null;
    }

    // 准备数据：使用当前目录的子节点作为一级
    let hierarchyData: TreemapNodeData;

    if (data.type === 'directory' && data.children && data.children.length > 0) {
      // 创建虚拟根节点包装当前目录的子节点
      // 过滤掉空文件（size === 0 的文件），但保留目录
      const filteredChildren = data.children.filter(
        (child) => child.type === 'directory' || child.size > 0
      );

      hierarchyData = {
        name: data.name,
        size: data.size,
        path: data.path,
        type: 'directory',
        accessible: data.accessible,
        // 以当前目录为基准，每个一级子节点分配唯一颜色索引
        // 该颜色索引会向下传递给所有后代节点
        children: filteredChildren.map((child, idx) =>
          toHierarchyData(child, idx)
        ),
      };
    } else {
      hierarchyData = toHierarchyData(data, 0);
    }

    return computeLayout(hierarchyData, dimensions.width, dimensions.height);
  }, [data, dimensions]);

  // 处理鼠标移动（用于 tooltip）
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, []);

  // 处理节点悬停
  const handleNodeHover = useCallback((node: LayoutNode | null) => {
    setHoveredNode(node);
  }, []);

  // 处理节点点击
  const handleNodeClick = useCallback(
    (node: LayoutNode) => {
      if (onNodeClick) {
        const fileNode = findNodeByPath(data, node.data.path);
        if (fileNode) {
          onNodeClick(fileNode);
        }
      }
    },
    [data, onNodeClick]
  );

  // 处理节点双击
  const handleNodeDoubleClick = useCallback(
    (node: LayoutNode) => {
      if (
        onNodeDoubleClick &&
        node.data.type === 'directory' &&
        node.data.accessible
      ) {
        const fileNode = findNodeByPath(data, node.data.path);
        if (fileNode) {
          onNodeDoubleClick(fileNode);
        }
      }
    },
    [data, onNodeDoubleClick]
  );

  // 检查是否有可显示的内容
  // 目录为空，或者所有子节点都是空文件
  const hasDisplayableContent = (() => {
    if (!data) return false;
    if (data.type !== 'directory') return data.size > 0;
    if (!data.children || data.children.length === 0) return false;
    // 检查是否有任何可显示的子节点（目录或有大小的文件）
    return data.children.some(
      (child) => child.type === 'directory' || child.size > 0
    );
  })();

  // 容器尺寸还未测量完成，或者布局尚未计算
  // 只要有子节点就认为布局已准备好（即使 value 为 0）
  const isLayoutReady =
    layoutRoot !== null &&
    dimensions.width > 0 &&
    dimensions.height > 0;

  // 决定显示什么内容
  const renderContent = () => {
    if (!data) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>选择一个文件夹开始分析</p>
        </div>
      );
    }

    if (!hasDisplayableContent) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>此文件夹为空或没有占用空间的内容</p>
        </div>
      );
    }

    if (!isLayoutReady) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>正在加载...</p>
        </div>
      );
    }

    return (
      <>
        <svg
          width={dimensions.width}
          height={dimensions.height}
          className="block"
        >
          {/* 定义弹出动画 */}
          <defs>
            <style>
              {`
                @keyframes treemap-pop-in {
                  0% {
                    opacity: 0;
                    transform: scale(0.3);
                  }
                  60% {
                    opacity: 1;
                    transform: scale(1.05);
                  }
                  100% {
                    opacity: 1;
                    transform: scale(1);
                  }
                }
              `}
            </style>
          </defs>
          {/* 广度优先渲染所有节点 */}
          <TreemapNodes
            node={layoutRoot!}
            selectedPath={selectedPath}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            onNodeHover={handleNodeHover}
          />
        </svg>

        {/* Tooltip */}
        {hoveredNode && (
          <TreemapTooltip
            node={hoveredNode}
            x={mousePos.x}
            y={mousePos.y}
            containerWidth={dimensions.width}
            containerHeight={dimensions.height}
          />
        )}
      </>
    );
  };

  // 始终渲染带有 containerRef 的容器，确保 ResizeObserver 能正常工作
  return (
    <div
      ref={containerRef}
      className="w-full h-full relative bg-background rounded-lg overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredNode(null)}
    >
      {renderContent()}
    </div>
  );
}

/**
 * 广度优先遍历收集所有可见节点
 * 返回按 BFS 顺序排列的节点数组
 */
function collectNodesBFS(root: LayoutNode): LayoutNode[] {
  const result: LayoutNode[] = [];
  const queue: LayoutNode[] = [root];

  while (queue.length > 0) {
    const node = queue.shift()!;

    // 跳过根节点（depth === 0），但要处理其子节点
    if (node.depth > 0) {
      // 过滤掉太小的节点
      const width = node.x1 - node.x0;
      const height = node.y1 - node.y0;
      if (width >= MIN_SIZE && height >= MIN_SIZE) {
        result.push(node);
      }
    }

    // 将可见的子节点加入队列
    if (node.children) {
      for (const child of node.children) {
        const width = child.x1 - child.x0;
        const height = child.y1 - child.y0;
        if (width >= MIN_SIZE && height >= MIN_SIZE) {
          queue.push(child);
        }
      }
    }
  }

  return result;
}

/**
 * 广度优先渲染 treemap 节点
 * 同一层级的节点会先渲染完毕，再渲染下一层级
 */
interface TreemapNodesProps {
  node: LayoutNode;
  selectedPath?: string | null;
  onNodeClick: (node: LayoutNode) => void;
  onNodeDoubleClick: (node: LayoutNode) => void;
  onNodeHover: (node: LayoutNode | null) => void;
}

function TreemapNodes({
  node,
  selectedPath,
  onNodeClick,
  onNodeDoubleClick,
  onNodeHover,
}: TreemapNodesProps) {
  // 使用广度优先遍历收集所有可见节点
  const visibleNodes = useMemo(() => collectNodesBFS(node), [node]);

  return (
    <g>
      {visibleNodes.map((visibleNode, index) => (
        <TreemapNode
          key={visibleNode.data.path}
          node={visibleNode}
          isSelected={selectedPath === visibleNode.data.path}
          onClick={() => onNodeClick(visibleNode)}
          onDoubleClick={() => onNodeDoubleClick(visibleNode)}
          onMouseEnter={() => onNodeHover(visibleNode)}
          onMouseLeave={() => onNodeHover(null)}
          nodeIndex={index}
        />
      ))}
    </g>
  );
}

/**
 * 根据路径查找节点
 */
function findNodeByPath(
  root: FileNode | null,
  targetPath: string
): FileNode | null {
  if (!root) return null;

  if (root.path === targetPath) {
    return root;
  }

  if (root.children) {
    for (const child of root.children) {
      const found = findNodeByPath(child, targetPath);
      if (found) return found;
    }
  }

  return null;
}
