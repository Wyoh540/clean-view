/**
 * Path Utilities
 * Windows 路径处理工具函数
 */

import path from 'path';
import os from 'os';

/**
 * 获取用户主目录
 */
export function getHomeDir(): string {
  return os.homedir();
}

/**
 * 获取 AppData 目录路径
 */
export function getAppDataPath(): string {
  return process.env.APPDATA || path.join(getHomeDir(), 'AppData', 'Roaming');
}

/**
 * 获取 LocalAppData 目录路径
 */
export function getLocalAppDataPath(): string {
  return process.env.LOCALAPPDATA || path.join(getHomeDir(), 'AppData', 'Local');
}

/**
 * 获取临时文件目录
 */
export function getTempPath(): string {
  return os.tmpdir();
}

/**
 * 规范化 Windows 路径
 */
export function normalizePath(filePath: string): string {
  return path.normalize(filePath);
}

/**
 * 获取文件扩展名（不含点）
 */
export function getExtension(filePath: string): string {
  const ext = path.extname(filePath);
  return ext.startsWith('.') ? ext.slice(1).toLowerCase() : ext.toLowerCase();
}

/**
 * 获取文件名（不含扩展名）
 */
export function getBaseName(filePath: string): string {
  return path.basename(filePath, path.extname(filePath));
}

/**
 * 获取父目录路径
 */
export function getParentPath(filePath: string): string {
  return path.dirname(filePath);
}

/**
 * 检查路径是否在指定目录下
 */
export function isSubPath(parentPath: string, childPath: string): boolean {
  const normalizedParent = normalizePath(parentPath).toLowerCase();
  const normalizedChild = normalizePath(childPath).toLowerCase();
  return normalizedChild.startsWith(normalizedParent);
}

/**
 * 从完整路径中获取相对于根目录的路径段
 */
export function getPathSegments(fullPath: string, rootPath: string): string[] {
  const relativePath = path.relative(rootPath, fullPath);
  if (!relativePath || relativePath.startsWith('..')) {
    return [];
  }
  return relativePath.split(path.sep).filter(Boolean);
}

/**
 * 检查是否为系统路径
 */
export function isSystemPath(filePath: string): boolean {
  const normalized = normalizePath(filePath).toLowerCase();
  const systemDirs = [
    'c:\\windows',
    'c:\\program files',
    'c:\\program files (x86)',
    'c:\\programdata',
  ];

  return systemDirs.some(dir => normalized.startsWith(dir));
}

/**
 * 检查是否为用户数据路径
 */
export function isUserDataPath(filePath: string): boolean {
  const normalized = normalizePath(filePath).toLowerCase();
  const userDataDirs = [
    getHomeDir().toLowerCase(),
    getAppDataPath().toLowerCase(),
    getLocalAppDataPath().toLowerCase(),
  ];

  return userDataDirs.some(dir => normalized.startsWith(dir));
}
