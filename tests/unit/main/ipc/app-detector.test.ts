import { describe, it, expect } from 'vitest';
import path from 'path';
import { getAppAssociation, getDeletionAssessment } from '../../../../src/main/ipc/app-association';

describe('app-detector', () => {
  describe('getAppAssociation', () => {
    it('given path containing Windows System when resolving then returns system association', () => {
      const r = getAppAssociation('C:\\Windows\\System32\\drivers\\foo.sys');
      expect(r.associationType).toBe('system');
      expect(r.appName).toBe('Windows System');
    });
    it('given path containing Program Files when resolving then returns installed association', () => {
      const r = getAppAssociation('C:\\Program Files\\MyApp\\bin\\app.exe');
      expect(r.associationType).toBe('installed');
    });
    it('given path containing Documents when resolving then returns personal association', () => {
      const r = getAppAssociation(path.join('C:', 'Users', 'x', 'Documents', 'file.txt'));
      expect(r.associationType).toBe('personal');
      expect(r.appName).toBe('个人文件');
    });
    it('given path containing Cache when resolving then returns cache association', () => {
      const r = getAppAssociation('C:\\Some\\App\\Cache\\file.tmp');
      expect(r.associationType).toBe('cache');
      expect(r.appName).toBe('缓存文件');
    });
    it('given path matching no known pattern when resolving then returns unknown association', () => {
      const r = getAppAssociation('C:\\Unknown\\Random\\file.dat');
      expect(r.associationType).toBe('unknown');
      expect(r.appName).toBe('未知');
    });
  });

  describe('getDeletionAssessment', () => {
    it('given system path when assessing then returns danger', () => {
      const a = getDeletionAssessment('C:\\Windows\\System32\\kernel32.dll');
      expect(a.safetyLevel).toBe('danger');
      expect(a.reason).toContain('系统');
    });
    it('given cache path when assessing then returns safe', () => {
      const a = getDeletionAssessment('C:\\App\\Cache\\temp.tmp');
      expect(a.safetyLevel).toBe('safe');
    });
    it('given installed app exe when assessing then returns danger', () => {
      const a = getDeletionAssessment('C:\\Program Files\\App\\app.exe');
      expect(a.safetyLevel).toBe('danger');
    });
    it('given appData log file when assessing then returns safe', () => {
      const appData = process.env.APPDATA || path.join(process.env.USERPROFILE || 'C:\\Users\\x', 'AppData', 'Roaming');
      const a = getDeletionAssessment(path.join(appData, 'SomeApp', 'app.log'));
      expect(a.safetyLevel).toBe('safe');
    });
  });
});
