/**
 * SafetyBadge Component
 * 安全等级徽章组件
 */

import React from 'react';
import { Shield, AlertTriangle, AlertCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SafetyBadgeProps {
  /** 安全等级 */
  safetyLevel: 'safe' | 'caution' | 'danger';
  /** 评估原因 */
  reason: string;
  /** 潜在影响 */
  impact?: string;
  /** 自定义类名 */
  className?: string;
  /** 是否紧凑模式 */
  compact?: boolean;
}

const SAFETY_CONFIG = {
  safe: {
    label: '安全删除',
    icon: Shield,
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-400',
    borderClass: 'border-green-200 dark:border-green-800',
  },
  caution: {
    label: '谨慎删除',
    icon: AlertTriangle,
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
    textClass: 'text-yellow-700 dark:text-yellow-400',
    borderClass: 'border-yellow-200 dark:border-yellow-800',
  },
  danger: {
    label: '不建议删除',
    icon: AlertCircle,
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-700 dark:text-red-400',
    borderClass: 'border-red-200 dark:border-red-800',
  },
};

export function SafetyBadge({
  safetyLevel,
  reason,
  impact,
  className,
  compact = false,
}: SafetyBadgeProps) {
  const config = SAFETY_CONFIG[safetyLevel];
  const Icon = config.icon;

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center justify-center w-6 h-6 rounded-full',
              config.bgClass,
              className
            )}
          >
            <Icon className={cn('w-4 h-4', config.textClass)} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{config.label}</p>
          <p className="text-xs">{reason}</p>
          {impact && <p className="text-xs text-muted-foreground mt-1">{impact}</p>}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div
      className={cn(
        'rounded-md border p-3',
        config.bgClass,
        config.borderClass,
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn('w-5 h-5 shrink-0', config.textClass)} />
        <span className={cn('font-medium text-sm', config.textClass)}>{config.label}</span>
      </div>
      <p className={cn('text-sm mt-1', config.textClass)}>{reason}</p>
      {impact && (
        <p className={cn('text-xs mt-1 opacity-80', config.textClass)}>{impact}</p>
      )}
    </div>
  );
}
