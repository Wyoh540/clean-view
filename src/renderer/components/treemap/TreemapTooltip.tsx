/**
 * TreemapTooltip Component
 * 矩形树图悬停提示组件
 * 显示节点详细信息、层次关系和空间占用
 */

import React from 'react';
import { Folder, File, AlertCircle, HardDrive } from 'lucide-react';

import { formatBytes } from '@/lib/format';
import type { LayoutNode } from './types';

interface TreemapTooltipProps {
  node: LayoutNode;
  x: number;
  y: number;
  containerWidth: number;
  containerHeight: number;
}

export function TreemapTooltip({
  node,
  x,
  y,
  containerWidth,
  containerHeight,
}: TreemapTooltipProps) {
  const { data, value, parent, depth } = node;
  const { name, path, type, accessible } = data;

  // 计算节点占父节点的百分比
  const parentValue = parent?.value || value || 1;
  const percentage = value ? ((value / parentValue) * 100).toFixed(1) : '0';

  // 计算占根节点的百分比
  let rootNode = node;
  while (rootNode.parent) {
    rootNode = rootNode.parent;
  }
  const rootValue = rootNode.value || 1;
  const totalPercentage = value ? ((value / rootValue) * 100).toFixed(1) : '0';

  // 获取父目录名
  const parentName = parent?.data.name || '';

  // 计算 tooltip 位置，避免超出边界
  const tooltipWidth = 280;
  const tooltipHeight = 160;
  const offset = 12;

  let left = x + offset;
  let top = y + offset;

  // 右边界检测
  if (left + tooltipWidth > containerWidth) {
    left = x - tooltipWidth - offset;
  }

  // 下边界检测
  if (top + tooltipHeight > containerHeight) {
    top = y - tooltipHeight - offset;
  }

  // 确保不超出左边界和上边界
  left = Math.max(8, left);
  top = Math.max(8, top);

  return (
    <div
      className="absolute z-50 pointer-events-none animate-in fade-in-0 zoom-in-95 duration-100"
      style={{ left, top }}
    >
      <div className="bg-popover/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 min-w-[200px] max-w-[280px]">
        {/* 标题行 */}
        <div className="flex items-center gap-2 mb-2">
          {!accessible ? (
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
          ) : type === 'directory' ? (
            <Folder className="w-4 h-4 text-primary flex-shrink-0" />
          ) : (
            <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          )}
          <span className="font-semibold text-sm truncate">{name}</span>
        </div>

        {/* 信息列表 */}
        <div className="space-y-1.5 text-xs">
          {/* 大小 */}
          {value !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                大小
              </span>
              <span className="font-medium">{formatBytes(value)}</span>
            </div>
          )}

          {/* 占比 - 父目录 */}
          {parent && depth > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">占 {parentName}</span>
              <span className="font-medium text-primary">{percentage}%</span>
            </div>
          )}

          {/* 占比 - 总体 */}
          {depth > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">占总空间</span>
              <span className="font-medium">{totalPercentage}%</span>
            </div>
          )}

          {/* 层级 */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">层级</span>
            <span className="font-medium">第 {depth} 层</span>
          </div>
        </div>

        {/* 路径 */}
        <div className="mt-2 pt-2 border-t">
          <div className="text-[10px] text-muted-foreground/70 break-all line-clamp-2">
            {path}
          </div>
        </div>

        {/* 状态提示 */}
        {!accessible && (
          <div className="mt-2 text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            无法访问此目录
          </div>
        )}

        {type === 'directory' && accessible && (
          <div className="mt-2 text-[10px] text-muted-foreground italic">
            双击进入此目录
          </div>
        )}
      </div>
    </div>
  );
}
