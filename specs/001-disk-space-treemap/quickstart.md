# Quickstart: 磁盘空间可视化分析器

**Branch**: `001-disk-space-treemap` | **Date**: 2026-01-12

## 前置条件

- Node.js 20.x 或更高版本
- npm 10.x 或更高版本
- Windows 10/11 操作系统
- Git

## 快速开始

### 1. 创建项目

```bash
# 使用 Electron Forge 创建项目（Vite + TypeScript 模板）
npx create-electron-app@latest clean-view --template=vite-typescript

# 进入项目目录
cd clean-view
```

### 2. 安装核心依赖

```bash
# 安装 Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 安装 shadcn/ui 依赖
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge
npm install lucide-react
npm install @radix-ui/react-dialog @radix-ui/react-tooltip @radix-ui/react-progress

# 安装图表库
npm install recharts

# 安装路径别名支持
npm install -D @types/node
```

### 3. 配置 Tailwind CSS

更新 `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 4. 配置路径别名

更新 `vite.renderer.config.mjs`:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
    },
  },
});
```

更新 `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/renderer/*"]
    }
  }
}
```

### 5. 添加 shadcn/ui 组件

```bash
# 初始化 shadcn/ui
npx shadcn@latest init

# 添加需要的组件
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add card
npx shadcn@latest add tooltip
npx shadcn@latest add progress
```

### 6. 项目结构

```
clean-view/
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── main.ts             # 主进程入口
│   │   ├── preload.ts          # 预加载脚本
│   │   ├── ipc/                # IPC 处理器
│   │   │   ├── file-system.ts  # 文件系统操作
│   │   │   ├── scanner.ts      # 目录扫描器
│   │   │   └── app-detector.ts # 应用检测
│   │   └── utils/
│   │       └── path-utils.ts   # 路径工具
│   │
│   └── renderer/                # 渲染进程 (React)
│       ├── App.tsx             # 应用根组件
│       ├── index.tsx           # 入口文件
│       ├── index.css           # 全局样式
│       ├── components/
│       │   ├── ui/             # shadcn/ui 组件
│       │   ├── treemap/        # 树图组件
│       │   │   ├── Treemap.tsx
│       │   │   ├── TreemapCell.tsx
│       │   │   └── TreemapTooltip.tsx
│       │   ├── navigation/     # 导航组件
│       │   │   ├── Breadcrumb.tsx
│       │   │   └── FolderPicker.tsx
│       │   └── details/        # 详情组件
│       │       ├── FileDetails.tsx
│       │       └── DeleteConfirm.tsx
│       ├── hooks/
│       │   ├── useFileSystem.ts
│       │   ├── useScanProgress.ts
│       │   └── useNavigation.ts
│       ├── lib/
│       │   └── utils.ts        # 工具函数
│       └── types/
│           └── index.ts        # 类型定义
│
├── specs/                       # 规格文档
│   └── 001-disk-space-treemap/
│       ├── spec.md
│       ├── plan.md
│       ├── research.md
│       ├── data-model.md
│       ├── quickstart.md
│       └── contracts/
│
├── forge.config.ts             # Electron Forge 配置
├── vite.main.config.mjs        # 主进程 Vite 配置
├── vite.preload.config.mjs     # 预加载 Vite 配置
├── vite.renderer.config.mjs    # 渲染进程 Vite 配置
├── tailwind.config.js          # Tailwind 配置
├── tsconfig.json               # TypeScript 配置
└── package.json
```

### 7. 运行开发服务器

```bash
npm start
```

### 8. 构建生产版本

```bash
# 打包应用
npm run package

# 创建安装包
npm run make
```

## 开发指南

### IPC 通信模式

主进程和渲染进程之间使用 IPC 通信：

```typescript
// preload.ts - 暴露安全的 API
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('cleanViewAPI', {
  selectDirectory: () => ipcRenderer.invoke('fs:select-directory'),
  scanDirectory: (path: string) => ipcRenderer.invoke('fs:scan-directory', { path }),
  onScanProgress: (callback: (progress: ScanProgress) => void) => {
    const handler = (_event: IpcRendererEvent, progress: ScanProgress) => callback(progress);
    ipcRenderer.on('fs:scan-progress', handler);
    return () => ipcRenderer.removeListener('fs:scan-progress', handler);
  },
});
```

```typescript
// 渲染进程使用
const { path } = await window.cleanViewAPI.selectDirectory();
const { root } = await window.cleanViewAPI.scanDirectory(path);
```

### 样式规范

使用 Tailwind CSS 和 shadcn/ui 组件：

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function FileCard({ file }: { file: FileNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{file.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {formatBytes(file.size)}
        </p>
      </CardContent>
    </Card>
  );
}
```

## 测试

```bash
# 运行单元测试
npm test

# 运行 E2E 测试
npm run test:e2e
```

## 常见问题

### Q: 如何处理大目录扫描性能问题？

使用渐进式扫描和 Worker 线程：
1. 首次只扫描一层目录
2. 后台 Worker 继续深度扫描
3. 通过 IPC 增量更新数据

### Q: 如何安全地删除文件？

始终使用 `shell.trashItem()` 将文件移至回收站，而非 `fs.unlink()` 永久删除。

### Q: 如何处理无权限访问的目录？

使用 try-catch 捕获权限错误，将该目录标记为 `accessible: false`，继续扫描其他目录。
