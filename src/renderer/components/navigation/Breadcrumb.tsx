/**
 * Breadcrumb Component
 * 面包屑导航组件
 */

import React from 'react';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface BreadcrumbProps {
  /** 面包屑项目 */
  items: BreadcrumbItem[];
  /** 是否可以返回 */
  canGoBack: boolean;
  /** 点击项目 */
  onItemClick: (path: string) => void;
  /** 点击返回 */
  onBack: () => void;
  /** 点击主页 */
  onHome: () => void;
  /** 自定义类名 */
  className?: string;
}

export function Breadcrumb({
  items,
  canGoBack,
  onItemClick,
  onBack,
  onHome,
  className,
}: BreadcrumbProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      className={cn(
        'flex items-center gap-1 px-4 py-2 border-b bg-muted/50 overflow-x-auto',
        className
      )}
      aria-label="面包屑导航"
    >
      {/* 返回按钮 */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={onBack}
        disabled={!canGoBack}
        title="返回上级"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      {/* 主页按钮 */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={onHome}
        title="返回根目录"
      >
        <Home className="h-4 w-4" />
      </Button>

      <div className="h-4 w-px bg-border mx-1" />

      {/* 面包屑项目 */}
      <ol className="flex items-center gap-1 min-w-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.path} className="flex items-center min-w-0">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mx-1" />
              )}

              {isLast ? (
                <span
                  className="text-sm font-medium text-foreground truncate max-w-[200px]"
                  title={item.path}
                >
                  {item.name}
                </span>
              ) : (
                <button
                  onClick={() => onItemClick(item.path)}
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline truncate max-w-[150px] transition-colors"
                  title={item.path}
                >
                  {item.name}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
