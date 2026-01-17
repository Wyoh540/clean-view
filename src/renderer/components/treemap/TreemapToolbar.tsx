/**
 * TreemapToolbar Component
 * 矩形树图底部工具栏，显示选中节点信息和快捷操作
 */

import React, { useState } from 'react';
import { Folder, File, FolderOpen, Trash2, Loader2, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatBytes } from '@/lib/format';

import type { FileNode, DeleteResult, DeletionAssessment } from '@/types';

interface TreemapToolbarProps {
  /** 选中的节点 */
  selectedNode: FileNode | null;
  /** 删除评估 */
  deletionAssessment?: DeletionAssessment | null;
  /** 删除后回调 */
  onDeleted?: (result: DeleteResult) => void;
}

export function TreemapToolbar({
  selectedNode,
  deletionAssessment,
  onDeleted,
}: TreemapToolbarProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  // 打开所在文件夹
  const handleOpenInExplorer = async () => {
    if (!selectedNode) return;

    setIsOpening(true);
    try {
      await window.cleanViewAPI.openInExplorer({ path: selectedNode.path });
    } catch (error) {
      console.error('Failed to open in explorer:', error);
    } finally {
      setIsOpening(false);
    }
  };

  // 删除文件
  const handleDelete = async () => {
    if (!selectedNode || !selectedNode.accessible) return;

    const confirmed = window.confirm(
      `确定要删除"${selectedNode.name}"吗？\n此操作会将文件移至回收站。`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await window.cleanViewAPI.deleteFiles({
        paths: [selectedNode.path],
        useTrash: true,
      });

      if (response.success && response.result) {
        onDeleted?.(response.result);
      } else {
        alert(`删除失败: ${response.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('删除操作出错');
    } finally {
      setIsDeleting(false);
    }
  };

  // 未选中节点时显示提示
  if (!selectedNode) {
    return (
      <div className="flex items-center justify-center h-12 px-4 border-t bg-muted/20 text-sm text-muted-foreground">
        点击节点选择文件或文件夹
      </div>
    );
  }

  const isDangerous = deletionAssessment?.safetyLevel === 'danger';
  const isCaution = deletionAssessment?.safetyLevel === 'caution';

  return (
    <div className="flex items-center h-12 px-4 border-t bg-muted/30 gap-4">
      {/* 节点图标和名称 */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {!selectedNode.accessible ? (
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
        ) : selectedNode.type === 'directory' ? (
          <Folder className="w-4 h-4 text-primary shrink-0" />
        ) : (
          <File className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
        <span className="truncate font-medium text-sm">{selectedNode.name}</span>
        <span className="text-xs text-muted-foreground shrink-0">
          {selectedNode.type === 'directory' ? '文件夹' : '文件'}
        </span>
      </div>

      {/* 大小信息 */}
      <div className="text-sm font-medium shrink-0 px-3 py-1 bg-background/50 rounded">
        {formatBytes(selectedNode.size)}
      </div>

      {/* 安全等级标识 */}
      {deletionAssessment && (
        <div
          className={`text-xs px-2 py-1 rounded shrink-0 ${
            isDangerous
              ? 'bg-destructive/10 text-destructive'
              : isCaution
              ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500'
              : 'bg-green-500/10 text-green-600 dark:text-green-500'
          }`}
        >
          {isDangerous ? '危险' : isCaution ? '谨慎' : '安全'}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center gap-2 shrink-0">
        {/* 打开所在文件夹 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenInExplorer}
              disabled={isOpening}
              className="h-8 w-8 p-0"
            >
              {isOpening ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FolderOpen className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>在资源管理器中打开</p>
          </TooltipContent>
        </Tooltip>

        {/* 删除按钮 */}
        {selectedNode.accessible && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isDangerous ? 'destructive' : 'ghost'}
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 w-8 p-0"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>删除（移至回收站）</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
