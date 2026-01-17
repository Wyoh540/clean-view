/**
 * TreemapNode Component
 * 单个矩形树图节点渲染器
 * 支持目录（带标题栏）和文件（填充矩形）的不同渲染方式
 */

import React, { useRef, useCallback } from 'react';

import type { LayoutNode } from './types';

interface TreemapNodeProps {
  node: LayoutNode;
  isSelected?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  /** 节点索引，用于计算动画延迟 */
  nodeIndex?: number;
}

/** 目录颜色调色板 - 16种区分度高的颜色 */
const DIRECTORY_COLORS = [
  { h: 210, s: 70, l: 50 }, // 蓝色
  { h: 150, s: 60, l: 45 }, // 绿色
  { h: 25, s: 80, l: 50 }, // 橙色
  { h: 280, s: 65, l: 55 }, // 紫色
  { h: 45, s: 85, l: 50 }, // 黄色
  { h: 340, s: 70, l: 55 }, // 粉红
  { h: 180, s: 60, l: 45 }, // 青色
  { h: 0, s: 70, l: 50 }, // 红色
  { h: 120, s: 50, l: 40 }, // 深绿
  { h: 260, s: 60, l: 50 }, // 靛蓝
  { h: 35, s: 90, l: 55 }, // 金色
  { h: 190, s: 70, l: 50 }, // 天蓝
  { h: 320, s: 65, l: 50 }, // 品红
  { h: 80, s: 60, l: 45 }, // 草绿
  { h: 240, s: 55, l: 55 }, // 深蓝
  { h: 15, s: 75, l: 50 }, // 红橙
];

/** 不可访问目录的颜色 */
const INACCESSIBLE_COLOR = { h: 0, s: 40, l: 35 };

/** 双击检测延迟时间（毫秒） */
const DOUBLE_CLICK_DELAY = 250;

/** 目录头部高度 */
const HEADER_HEIGHT = 20;

export function TreemapNode({
  node,
  isSelected,
  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
  nodeIndex = 0,
}: TreemapNodeProps) {
  // 用于区分单击和双击的计时器
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { x0, y0, x1, y1, depth, data } = node;

  // 计算动画延迟：基于深度和节点索引
  const animationDelay = depth * 30 + nodeIndex * 8;
  const { name, type, accessible, colorIndex = 0 } = data;

  const width = x1 - x0;
  const height = y1 - y0;

  // 处理点击事件：延迟执行以区分双击
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (clickTimerRef.current) {
        return;
      }
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        onClick?.();
      }, DOUBLE_CLICK_DELAY);
    },
    [onClick]
  );

  // 处理双击事件：取消延迟的单击并执行双击
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      onDoubleClick?.();
    },
    [onDoubleClick]
  );

  /**
   * 获取节点颜色
   * 基于一级子目录的 colorIndex，深度越深颜色越浅
   */
  const getColors = () => {
    if (!accessible) {
      const { h, s, l } = INACCESSIBLE_COLOR;
      return {
        fill: `hsl(${h}, ${s}%, ${l}%)`,
        stroke: `hsl(${h}, ${s}%, ${l - 10}%)`,
        headerBg: `hsl(${h}, ${s}%, ${l - 5}%)`,
        text: '#ffffff',
      };
    }

    const baseColor = DIRECTORY_COLORS[colorIndex % DIRECTORY_COLORS.length];

    if (type === 'directory') {
      // 目录：使用较深的边框颜色，内部有明显的背景色
      const depthAdjust = Math.min((depth - 1) * 4, 12);
      // 降低最大亮度，使目录背景色更明显可见
      const bgLightness = Math.min(baseColor.l + depthAdjust + 15, 78);
      const headerLightness = Math.min(baseColor.l + depthAdjust, 60);
      const strokeLightness = Math.max(baseColor.l - 5, 30);
      // 保持适中的饱和度，让颜色更鲜明
      const bgSaturation = Math.max(baseColor.s - 25, 25);

      return {
        fill: `hsl(${baseColor.h}, ${bgSaturation}%, ${bgLightness}%)`,
        stroke: `hsl(${baseColor.h}, ${baseColor.s}%, ${strokeLightness}%)`,
        headerBg: `hsl(${baseColor.h}, ${baseColor.s - 10}%, ${headerLightness}%)`,
        text: '#ffffff',
      };
    } else {
      // 文件：使用实心填充
      const depthAdjust = Math.min((depth - 1) * 5, 15);
      const fillLightness = Math.min(baseColor.l + depthAdjust + 5, 70);
      const saturation = Math.max(baseColor.s - depthAdjust, 40);

      return {
        fill: `hsl(${baseColor.h}, ${saturation}%, ${fillLightness}%)`,
        stroke: `hsl(${baseColor.h}, ${saturation}%, ${fillLightness - 15}%)`,
        headerBg: '',
        text: fillLightness > 55 ? '#333333' : '#ffffff',
      };
    }
  };

  const colors = getColors();

  // 选中状态：保留原填充色，只修改边框颜色
  const selectedStroke = 'hsl(220, 100%, 50%)';

  const activeColors = {
    ...colors,
    stroke: isSelected ? selectedStroke : colors.stroke,
  };

  // 计算可显示内容的尺寸（降低阈值，让更多节点显示名称）
  const showHeader = type === 'directory' && height > 18 && width > 24;
  const showFileLabel = type === 'file' && height > 14 && width > 28;

  // 截断文件名
  const truncateName = (text: string, maxWidth: number): string => {
    const charWidth = 7;
    const maxChars = Math.floor(maxWidth / charWidth);
    if (text.length <= maxChars) return text;
    if (maxChars <= 3) return text.charAt(0) + '..';
    return text.substring(0, maxChars - 2) + '..';
  };

  // 计算节点中心点（用于 transform-origin）
  const centerX = x0 + width / 2;
  const centerY = y0 + height / 2;

  // 动画样式
  const animationStyle: React.CSSProperties = {
    animation: `treemap-pop-in 300ms ease-out ${animationDelay}ms both`,
    transformOrigin: `${centerX}px ${centerY}px`,
  };

  // 根据节点类型渲染不同样式
  if (type === 'directory') {
    return (
      <g
        className="cursor-pointer"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={animationStyle}
      >
        {/* 目录背景框 */}
        <rect
          x={x0}
          y={y0}
          width={width}
          height={height}
          fill={activeColors.fill}
          stroke={activeColors.stroke}
          strokeWidth={isSelected ? 2.5 : 1.5}
          className="transition-all duration-100"
        />

        {/* 目录标题栏 */}
        {showHeader && (
          <>
            <rect
              x={x0 + 1}
              y={y0 + 1}
              width={width - 2}
              height={HEADER_HEIGHT}
              fill={activeColors.headerBg}
            />
            <text
              x={x0 + 6}
              y={y0 + HEADER_HEIGHT / 2 + 4}
              fill={activeColors.text}
              fontSize={11}
              fontWeight={600}
              fontFamily="system-ui, -apple-system, sans-serif"
              className="pointer-events-none select-none"
              style={{ textShadow: '0 1px 1px rgba(0,0,0,0.3)' }}
            >
              {truncateName(name, width - 12)}
            </text>
          </>
        )}
      </g>
    );
  }

  // 文件节点
  return (
    <g
      className="cursor-pointer"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={animationStyle}
    >
      {/* 文件矩形 */}
      <rect
        x={x0}
        y={y0}
        width={width}
        height={height}
        fill={activeColors.fill}
        stroke={activeColors.stroke}
        strokeWidth={isSelected ? 2 : 1}
        className="transition-all duration-100 hover:brightness-110"
      />

      {/* 文件名标签 */}
      {showFileLabel && (
        <text
          x={x0 + width / 2}
          y={y0 + height / 2 + 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={activeColors.text}
          fontSize={10}
          fontWeight={500}
          fontFamily="system-ui, -apple-system, sans-serif"
          className="pointer-events-none select-none"
          style={{ textShadow: '0 1px 1px rgba(0,0,0,0.2)' }}
        >
          {truncateName(name, width - 8)}
        </text>
      )}
    </g>
  );
}
