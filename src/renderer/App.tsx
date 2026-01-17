/**
 * App Component
 * 应用程序根组件
 */

import React, { useState, useCallback, useEffect } from 'react';

import { useFileSystem } from '@/hooks/useFileSystem';
import { useScanProgress } from '@/hooks/useScanProgress';
import { useNavigation } from '@/hooks/useNavigation';
import { FolderPicker } from '@/components/navigation/FolderPicker';
import { Breadcrumb } from '@/components/navigation/Breadcrumb';
import { Treemap } from '@/components/treemap/Treemap';
import { TreemapToolbar } from '@/components/treemap/TreemapToolbar';
import { FileDetails } from '@/components/details/FileDetails';
import { TooltipProvider } from '@/components/ui/tooltip';
import { formatBytes } from '@/lib/format';

import type { FileNode, DeleteResult, DeletionAssessment } from '@/types';

export function App() {
  const { rootNode, isScanning, error, selectAndScanDirectory, cancelScan, refresh } =
    useFileSystem();
  const { progress } = useScanProgress();
  const navigation = useNavigation(rootNode);
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);
  const [deletionAssessment, setDeletionAssessment] = useState<DeletionAssessment | null>(null);

  // 当根节点变化时更新导航
  useEffect(() => {
    navigation.setRoot(rootNode);
  }, [rootNode]);

  // 处理节点点击（选中）
  const handleNodeClick = useCallback(
    async (node: FileNode) => {
      setSelectedNode(node);
      setDeletionAssessment(null);
      navigation.selectItem(node.path);

      // 异步获取删除评估
      try {
        const assessRes = await window.cleanViewAPI.getDeletionAssessment({ path: node.path });
        if (assessRes.success && assessRes.assessment) {
          setDeletionAssessment(assessRes.assessment);
        }
      } catch (error) {
        console.error('Failed to get deletion assessment:', error);
      }
    },
    [navigation]
  );

  // 处理节点双击（进入目录）
  const handleNodeDoubleClick = useCallback(
    (node: FileNode) => {
      if (node.type === 'directory' && node.accessible) {
        navigation.navigateTo(node);
        setSelectedNode(null);
      }
    },
    [navigation]
  );

  // 关闭详情面板
  const handleCloseDetails = useCallback(() => {
    setSelectedNode(null);
    setDeletionAssessment(null);
    navigation.clearSelection();
  }, [navigation]);

  // 处理删除后的刷新
  const handleDeleted = useCallback(
    (result: DeleteResult) => {
      console.log('[App] File deleted, freed:', result.freedSize);
      setSelectedNode(null);
      setDeletionAssessment(null);
      // 刷新当前目录
      refresh();
    },
    [refresh]
  );

  // 计算扫描进度百分比（估算）
  const scanProgressPercent = progress?.scannedCount
    ? Math.min((progress.scannedCount / 10000) * 100, 99)
    : 0;

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background">
        {/* 顶部工具栏 */}
        <FolderPicker
          currentPath={rootNode?.path ?? null}
          isScanning={isScanning || progress?.status === 'scanning'}
          scanProgress={scanProgressPercent}
          scannedCount={progress?.scannedCount}
          scannedSize={progress?.scannedSize}
          onSelectFolder={selectAndScanDirectory}
          onRefresh={refresh}
          onCancelScan={cancelScan}
        />

        {/* 面包屑导航 */}
        {rootNode && (
          <Breadcrumb
            items={navigation.breadcrumbs}
            canGoBack={navigation.canGoBack}
            onItemClick={navigation.jumpTo}
            onBack={navigation.goBack}
            onHome={navigation.goToRoot}
          />
        )}

        {/* 错误提示 */}
        {error && (
          <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

        {/* 主内容区域 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 树图区域 + 底部工具栏 */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-4">
              <Treemap
                data={navigation.currentNode}
                onNodeClick={handleNodeClick}
                onNodeDoubleClick={handleNodeDoubleClick}
                selectedPath={selectedNode?.path}
              />
            </div>
            {/* 底部工具栏 */}
            <TreemapToolbar
              selectedNode={selectedNode}
              deletionAssessment={deletionAssessment}
              onDeleted={handleDeleted}
            />
          </div>

          {/* 侧边详情面板 */}
          {selectedNode && (
            <FileDetails
              node={selectedNode}
              onClose={handleCloseDetails}
              onDeleted={handleDeleted}
            />
          )}
        </div>

        {/* 底部状态栏 */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
          <div>
            {rootNode && (
              <span>
                总大小: <strong>{formatBytes(rootNode.size)}</strong>
                {navigation.currentNode && navigation.currentNode !== rootNode && (
                  <span className="ml-4">
                    当前目录: <strong>{formatBytes(navigation.currentNode.size)}</strong>
                  </span>
                )}
              </span>
            )}
          </div>
          <div>
            {selectedNode && (
              <span>
                已选择: {selectedNode.name} ({formatBytes(selectedNode.size)})
              </span>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
