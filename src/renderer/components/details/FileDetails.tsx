/**
 * FileDetails Component
 * 文件详情面板组件
 */

import React, { useEffect, useState } from 'react';
import { Folder, File, AlertCircle, Loader2 } from 'lucide-react';

import { formatBytes, formatDate } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SafetyBadge } from './SafetyBadge';
import { DeleteConfirm } from './DeleteConfirm';

import type { FileNode, AppAssociation, DeletionAssessment, DeleteResult } from '@/types';

interface FileDetailsProps {
  /** 选中的文件节点 */
  node: FileNode | null;
  /** 关闭详情面板 */
  onClose?: () => void;
  /** 删除后回调 */
  onDeleted?: (result: DeleteResult) => void;
}

export function FileDetails({ node, onClose, onDeleted }: FileDetailsProps) {
  const [appAssociation, setAppAssociation] = useState<AppAssociation | null>(null);
  const [deletionAssessment, setDeletionAssessment] = useState<DeletionAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 加载文件详细信息
  useEffect(() => {
    if (!node) {
      setAppAssociation(null);
      setDeletionAssessment(null);
      return;
    }

    const loadDetails = async () => {
      setIsLoading(true);
      try {
        // 并行获取应用关联和删除评估
        const [appRes, assessRes] = await Promise.all([
          window.cleanViewAPI.getAppAssociation({ path: node.path }),
          window.cleanViewAPI.getDeletionAssessment({ path: node.path }),
        ]);

        if (appRes.success && appRes.association) {
          setAppAssociation(appRes.association);
        }
        if (assessRes.success && assessRes.assessment) {
          setDeletionAssessment(assessRes.assessment);
        }
      } catch (error) {
        console.error('Failed to load file details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDetails();
  }, [node?.path]);

  if (!node) {
    return (
      <div className="w-80 border-l bg-card p-4 flex items-center justify-center text-muted-foreground">
        <p>选择文件查看详情</p>
      </div>
    );
  }

  return (
    <div className="w-80 border-l bg-card overflow-auto">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          {!node.accessible ? (
            <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          ) : node.type === 'directory' ? (
            <Folder className="w-5 h-5 text-primary shrink-0" />
          ) : (
            <File className="w-5 h-5 text-muted-foreground shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 安全等级徽章 */}
        {deletionAssessment && (
          <SafetyBadge
            safetyLevel={deletionAssessment.safetyLevel}
            reason={deletionAssessment.reason}
            impact={deletionAssessment.impact}
          />
        )}

        {/* 加载状态 */}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>加载中...</span>
          </div>
        )}

        {/* 基本信息 */}
        <div className="space-y-3">
          <DetailItem label="类型" value={node.type === 'directory' ? '文件夹' : '文件'} />
          <DetailItem label="大小" value={formatBytes(node.size)} highlight />
          <DetailItem label="最后修改" value={formatDate(node.modifiedAt)} />
        </div>

        {/* 应用程序关联 */}
        {appAssociation && (
          <div className="pt-2 border-t">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">应用程序关联</h4>
            <div className="space-y-2">
              <DetailItem label="应用" value={appAssociation.appName} />
              <DetailItem label="类型" value={getAssociationTypeLabel(appAssociation.associationType)} />
              <DetailItem label="置信度" value={`${appAssociation.confidence}%`} />
            </div>
          </div>
        )}

        {/* 路径 */}
        <div className="pt-2 border-t">
          <h4 className="text-xs font-medium text-muted-foreground mb-1">完整路径</h4>
          <p className="text-xs break-all text-muted-foreground">{node.path}</p>
        </div>

        {/* 无法访问提示 */}
        {!node.accessible && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
            <p className="font-medium">无法访问</p>
            <p className="text-xs mt-1">此目录可能需要管理员权限或已被其他程序占用</p>
          </div>
        )}

        {/* 删除按钮 */}
        {node.accessible && (
          <div className="pt-4 border-t">
            <DeleteConfirm
              node={node}
              assessment={deletionAssessment}
              onDeleted={onDeleted}
            />
          </div>
        )}
      </CardContent>
    </div>
  );
}

// 详情项组件
function DetailItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={highlight ? 'font-medium' : ''}>{value}</div>
    </div>
  );
}

// 获取关联类型的中文标签
function getAssociationTypeLabel(type: AppAssociation['associationType']): string {
  const labels: Record<AppAssociation['associationType'], string> = {
    installed: '已安装应用',
    appData: '应用数据',
    cache: '缓存文件',
    personal: '个人文件',
    system: '系统文件',
    unknown: '未知',
  };
  return labels[type] || type;
}
