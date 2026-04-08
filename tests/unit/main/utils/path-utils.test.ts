import path from 'path';

import { describe, it, expect } from 'vitest';

import {
  normalizePath,
  getExtension,
  getBaseName,
  getParentPath,
  isSubPath,
  getPathSegments,
  isSystemPath,
} from '../../../../src/main/utils/path-utils';

describe('path-utils', () => {
  describe('normalizePath', () => {
    it('given a path with mixed slashes when normalizing then returns platform-normalized path', () => {
      expect(normalizePath('C:\\foo/bar\\baz')).toBe(path.normalize('C:\\foo/bar\\baz'));
    });
  });

  describe('getExtension', () => {
    it('given a file path with extension when getting extension then returns extension without dot and lowercased', () => {
      expect(getExtension('file.TXT')).toBe('txt');
      expect(getExtension(path.join('dir', 'file.js'))).toBe('js');
    });
    it('given a path without extension when getting extension then returns empty string', () => {
      expect(getExtension('noext')).toBe('');
    });
  });

  describe('getBaseName', () => {
    it('given a file path when getting base name then returns filename without extension', () => {
      expect(getBaseName(path.join('a', 'b', 'file.txt'))).toBe('file');
    });
  });

  describe('getParentPath', () => {
    it('given a file path when getting parent then returns directory path', () => {
      expect(getParentPath(path.join('a', 'b', 'file.txt'))).toBe(path.join('a', 'b'));
    });
  });

  describe('isSubPath', () => {
    it('given child path under parent when checking then returns true', () => {
      const parent = path.join('C:', 'parent');
      const child = path.join('C:', 'parent', 'sub', 'file');
      expect(isSubPath(parent, child)).toBe(true);
    });
    it('given path not under parent when checking then returns false', () => {
      expect(isSubPath('C:\\a', 'C:\\b')).toBe(false);
    });
  });

  describe('getPathSegments', () => {
    it('given full path and root when getting segments then returns relative path segments', () => {
      const root = path.join('C:', 'root');
      const full = path.join('C:', 'root', 'a', 'b');
      expect(getPathSegments(full, root)).toEqual(['a', 'b']);
    });
    it('given path outside root when getting segments then returns empty array', () => {
      expect(getPathSegments('C:\\other', 'C:\\root')).toEqual([]);
    });
  });

  describe('isSystemPath', () => {
    it('given path under Windows system dir when checking then returns true', () => {
      expect(isSystemPath('C:\\Windows\\System32\\foo')).toBe(true);
      expect(isSystemPath('c:\\program files\\app')).toBe(true);
    });
    it('given path not under system dir when checking then returns false', () => {
      expect(isSystemPath('C:\\Users\\foo')).toBe(false);
    });
  });
});
