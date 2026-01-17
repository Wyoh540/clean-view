/**
 * Renderer Process Entry
 * 渲染进程入口文件
 */

import './renderer/index.css';

import React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './renderer/App';

// 获取根容器
const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container not found');
}

// 创建 React 根并渲染应用
const root = createRoot(container);
root.render(React.createElement(App));

console.log('[Renderer] App initialized');
