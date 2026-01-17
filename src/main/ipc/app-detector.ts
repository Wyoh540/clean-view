/**
 * App Detector
 * 应用程序检测器 - 根据文件路径识别所属应用程序
 */

import { ipcMain } from 'electron';
import path from 'path';
import os from 'os';

import { IPC_CHANNELS } from './channels';
import {
  GetAppAssociationRequest,
  GetAppAssociationResponse,
  GetDeletionAssessmentRequest,
  GetDeletionAssessmentResponse,
  AppAssociation,
  DeletionAssessment,
} from '../../renderer/types';

// 环境变量
const HOME_DIR = os.homedir();
const APPDATA = process.env.APPDATA || path.join(HOME_DIR, 'AppData', 'Roaming');
const LOCAL_APPDATA = process.env.LOCALAPPDATA || path.join(HOME_DIR, 'AppData', 'Local');
const TEMP_DIR = os.tmpdir();

// 已知应用程序模式映射
const APP_PATTERNS: Array<{
  pattern: RegExp;
  appName: string;
  associationType: AppAssociation['associationType'];
}> = [
  // 浏览器
  { pattern: /\\Google\\Chrome\\/i, appName: 'Google Chrome', associationType: 'appData' },
  { pattern: /\\Mozilla\\Firefox\\/i, appName: 'Mozilla Firefox', associationType: 'appData' },
  { pattern: /\\Microsoft\\Edge\\/i, appName: 'Microsoft Edge', associationType: 'appData' },

  // 开发工具
  { pattern: /\\Microsoft\\VSCode\\/i, appName: 'Visual Studio Code', associationType: 'appData' },
  { pattern: /\\Code\\/i, appName: 'Visual Studio Code', associationType: 'appData' },
  { pattern: /\\JetBrains\\/i, appName: 'JetBrains IDE', associationType: 'appData' },
  { pattern: /\\npm\\/i, appName: 'npm', associationType: 'cache' },
  { pattern: /\\node_modules\\/i, appName: 'Node.js', associationType: 'appData' },
  { pattern: /\\\.nuget\\/i, appName: 'NuGet', associationType: 'cache' },
  { pattern: /\\\.gradle\\/i, appName: 'Gradle', associationType: 'cache' },
  { pattern: /\\\.m2\\/i, appName: 'Maven', associationType: 'cache' },

  // 游戏平台
  { pattern: /\\Steam\\/i, appName: 'Steam', associationType: 'appData' },
  { pattern: /\\Epic Games\\/i, appName: 'Epic Games', associationType: 'installed' },
  { pattern: /\\Riot Games\\/i, appName: 'Riot Games', associationType: 'installed' },

  // 通讯软件
  { pattern: /\\WeChat\\/i, appName: '微信', associationType: 'appData' },
  { pattern: /\\Tencent\\QQ\\/i, appName: 'QQ', associationType: 'appData' },
  { pattern: /\\Discord\\/i, appName: 'Discord', associationType: 'appData' },
  { pattern: /\\Slack\\/i, appName: 'Slack', associationType: 'appData' },
  { pattern: /\\Zoom\\/i, appName: 'Zoom', associationType: 'appData' },

  // 办公软件
  { pattern: /\\Microsoft\\Office\\/i, appName: 'Microsoft Office', associationType: 'appData' },
  { pattern: /\\Adobe\\/i, appName: 'Adobe', associationType: 'appData' },

  // 系统
  { pattern: /\\Windows\\/i, appName: 'Windows System', associationType: 'system' },
  { pattern: /\\System32\\/i, appName: 'Windows System', associationType: 'system' },
  { pattern: /\\SysWOW64\\/i, appName: 'Windows System', associationType: 'system' },
  { pattern: /\\Program Files\\/i, appName: 'Installed App', associationType: 'installed' },
  { pattern: /\\Program Files \(x86\)\\/i, appName: 'Installed App (32-bit)', associationType: 'installed' },
];

// 个人文件夹模式
const PERSONAL_PATTERNS = [
  /\\Documents\\/i,
  /\\Downloads\\/i,
  /\\Desktop\\/i,
  /\\Pictures\\/i,
  /\\Videos\\/i,
  /\\Music\\/i,
];

// 缓存/临时文件模式
const CACHE_PATTERNS = [
  /\\Temp\\/i,
  /\\Cache\\/i,
  /\\cache\\/i,
  /\\tmp\\/i,
  /\\.cache\\/i,
  /\\Temporary Internet Files\\/i,
];

/**
 * 注册应用检测相关的 IPC 处理器
 */
export function registerAppDetectorHandlers(): void {
  // 获取应用程序关联
  ipcMain.handle(
    IPC_CHANNELS.GET_APP_ASSOCIATION,
    async (_event, request: GetAppAssociationRequest): Promise<GetAppAssociationResponse> => {
      try {
        const association = getAppAssociation(request.path);
        return {
          success: true,
          association,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // 获取删除评估
  ipcMain.handle(
    IPC_CHANNELS.GET_DELETION_ASSESSMENT,
    async (
      _event,
      request: GetDeletionAssessmentRequest
    ): Promise<GetDeletionAssessmentResponse> => {
      try {
        const assessment = getDeletionAssessment(request.path);
        return {
          success: true,
          assessment,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
}

/**
 * 获取文件的应用程序关联
 */
export function getAppAssociation(filePath: string): AppAssociation {
  const normalizedPath = path.normalize(filePath);

  // 检查已知应用程序模式
  for (const { pattern, appName, associationType } of APP_PATTERNS) {
    if (pattern.test(normalizedPath)) {
      return {
        appName,
        associationType,
        confidence: 90,
      };
    }
  }

  // 检查个人文件夹
  for (const pattern of PERSONAL_PATTERNS) {
    if (pattern.test(normalizedPath)) {
      return {
        appName: '个人文件',
        associationType: 'personal',
        confidence: 85,
      };
    }
  }

  // 检查缓存/临时文件
  for (const pattern of CACHE_PATTERNS) {
    if (pattern.test(normalizedPath)) {
      return {
        appName: '缓存文件',
        associationType: 'cache',
        confidence: 80,
      };
    }
  }

  // 检查是否在 AppData 目录下
  if (normalizedPath.toLowerCase().startsWith(APPDATA.toLowerCase())) {
    // 尝试从路径中提取应用名称
    const relativePath = normalizedPath.substring(APPDATA.length);
    const parts = relativePath.split(path.sep).filter(Boolean);
    if (parts.length > 0) {
      return {
        appName: parts[0],
        associationType: 'appData',
        confidence: 70,
      };
    }
  }

  if (normalizedPath.toLowerCase().startsWith(LOCAL_APPDATA.toLowerCase())) {
    const relativePath = normalizedPath.substring(LOCAL_APPDATA.length);
    const parts = relativePath.split(path.sep).filter(Boolean);
    if (parts.length > 0) {
      return {
        appName: parts[0],
        associationType: 'appData',
        confidence: 70,
      };
    }
  }

  // 未知
  return {
    appName: '未知',
    associationType: 'unknown',
    confidence: 10,
  };
}

/**
 * 获取删除安全评估
 */
export function getDeletionAssessment(filePath: string): DeletionAssessment {
  const normalizedPath = path.normalize(filePath).toLowerCase();
  const association = getAppAssociation(filePath);
  const ext = path.extname(filePath).toLowerCase();

  // 系统文件 - 危险
  if (association.associationType === 'system') {
    return {
      safetyLevel: 'danger',
      reason: '系统文件，删除可能导致系统不稳定',
      impact: '可能影响 Windows 正常运行',
      associatedApp: association,
    };
  }

  // 已安装应用核心文件 - 危险
  if (association.associationType === 'installed') {
    if (['.exe', '.dll', '.sys', '.msi'].includes(ext)) {
      return {
        safetyLevel: 'danger',
        reason: '应用程序核心文件',
        impact: `可能导致 ${association.appName} 无法正常运行`,
        associatedApp: association,
      };
    }
    return {
      safetyLevel: 'caution',
      reason: '应用程序文件',
      impact: `可能影响 ${association.appName}`,
      associatedApp: association,
    };
  }

  // 缓存文件 - 安全
  if (association.associationType === 'cache') {
    return {
      safetyLevel: 'safe',
      reason: '缓存/临时文件，可安全删除',
      impact: '应用程序会在需要时重新创建',
      associatedApp: association,
    };
  }

  // 个人文件 - 谨慎
  if (association.associationType === 'personal') {
    return {
      safetyLevel: 'caution',
      reason: '个人文件，请确认不再需要',
      associatedApp: association,
    };
  }

  // 应用数据 - 根据文件类型判断
  if (association.associationType === 'appData') {
    // 日志文件 - 安全
    if (['.log', '.tmp', '.temp'].includes(ext)) {
      return {
        safetyLevel: 'safe',
        reason: '日志/临时文件',
        impact: '不影响应用程序功能',
        associatedApp: association,
      };
    }

    // 配置文件 - 谨慎
    if (['.json', '.xml', '.ini', '.config', '.cfg'].includes(ext)) {
      return {
        safetyLevel: 'caution',
        reason: '配置文件',
        impact: `可能需要重新配置 ${association.appName}`,
        associatedApp: association,
      };
    }

    // 数据库文件 - 谨慎
    if (['.db', '.sqlite', '.sqlite3', '.ldb'].includes(ext)) {
      return {
        safetyLevel: 'caution',
        reason: '数据库文件',
        impact: `可能丢失 ${association.appName} 的数据`,
        associatedApp: association,
      };
    }

    return {
      safetyLevel: 'caution',
      reason: '应用程序数据',
      impact: `可能影响 ${association.appName}`,
      associatedApp: association,
    };
  }

  // 未知 - 谨慎
  return {
    safetyLevel: 'caution',
    reason: '未知文件类型',
    associatedApp: association,
  };
}
