/**
 * App Detector
 * 应用程序检测器 - 注册 IPC 处理器，逻辑见 app-association.ts
 */

import { ipcMain } from 'electron';

import type {
  GetAppAssociationRequest,
  GetAppAssociationResponse,
  GetDeletionAssessmentRequest,
  GetDeletionAssessmentResponse,
} from '../../renderer/types';

import { getAppAssociation, getDeletionAssessment } from './app-association';
import { IPC_CHANNELS } from './channels';

export { getAppAssociation, getDeletionAssessment } from './app-association';

/**
 * 注册应用检测相关的 IPC 处理器
 */
export function registerAppDetectorHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.GET_APP_ASSOCIATION,
    async (_event, request: GetAppAssociationRequest): Promise<GetAppAssociationResponse> => {
      try {
        const association = getAppAssociation(request.path);
        return { success: true, association };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.GET_DELETION_ASSESSMENT,
    async (
      _event,
      request: GetDeletionAssessmentRequest
    ): Promise<GetDeletionAssessmentResponse> => {
      try {
        const assessment = getDeletionAssessment(request.path);
        return { success: true, assessment };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
}
