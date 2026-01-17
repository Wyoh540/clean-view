/**
 * DeleteConfirm Component
 * 删除确认对话框组件
 */

import React, { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { SafetyBadge } from './SafetyBadge';
import { formatBytes } from '@/lib/format';

import type { FileNode, DeletionAssessment, DeleteResult } from '@/types';

interface DeleteConfirmProps {
  /** 要删除的文件节点 */
  node: FileNode;
  /** 删除评估 */
  assessment?: DeletionAssessment | null;
  /** 删除成功回调 */
  onDeleted?: (result: DeleteResult) => void;
  /** 删除按钮被禁用 */
  disabled?: boolean;
}

export function DeleteConfirm({ node, assessment, onDeleted, disabled }: DeleteConfirmProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<DeleteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await window.cleanViewAPI.deleteFiles({
        paths: [node.path],
        useTrash: true, // 始终使用回收站
      });

      if (response.success && response.result) {
        setDeleteResult(response.result);
        onDeleted?.(response.result);
        // 延迟关闭以显示结果
        setTimeout(() => {
          setIsOpen(false);
          setDeleteResult(null);
        }, 2000);
      } else {
        setError(response.error || '删除失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除操作出错');
    } finally {
      setIsDeleting(false);
    }
  };

  const isDangerous = assessment?.safetyLevel === 'danger';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={isDangerous ? 'destructive' : 'outline'}
          size="sm"
          className="w-full"
          disabled={disabled}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          删除
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            确认删除
          </DialogTitle>
          <DialogDescription>
            此操作将把文件移至回收站，您可以在回收站中恢复。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 文件信息 */}
          <div className="p-3 bg-muted rounded-md">
            <div className="font-medium truncate">{node.name}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {node.type === 'directory' ? '文件夹' : '文件'} - {formatBytes(node.size)}
            </div>
            <div className="text-xs text-muted-foreground mt-1 truncate">{node.path}</div>
          </div>

          {/* 安全评估 */}
          {assessment && (
            <SafetyBadge
              safetyLevel={assessment.safetyLevel}
              reason={assessment.reason}
              impact={assessment.impact}
            />
          )}

          {/* 删除结果 */}
          {deleteResult && (
            <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md">
              <div className="font-medium">删除成功</div>
              <div className="text-sm mt-1">
                已释放空间: <strong>{formatBytes(deleteResult.freedSize)}</strong>
              </div>
            </div>
          )}

          {/* 错误信息 */}
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md">
              <div className="font-medium">删除失败</div>
              <div className="text-sm mt-1">{error}</div>
              {error.includes('正在使用') || error.includes('being used') ? (
                <div className="text-xs mt-2">
                  提示：请关闭正在使用此文件的程序后重试
                </div>
              ) : null}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isDeleting}>
              取消
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || deleteResult !== null}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                删除中...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                确认删除
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
