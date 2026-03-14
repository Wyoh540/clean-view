# README 简要说明 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在仓库根目录新增简要 README.md，包含首页图 image/main.png，并同时面向用户与开发者。

**Architecture:** 单文件 README，采用双块结构：上半部分为产品介绍与功能概览（配图），下半部分为开发者的安装、运行与打包说明。

**Tech Stack:** Markdown，无额外工具。图片路径：`image/main.png`（相对仓库根目录）。

**设计依据:** `docs/plans/2025-03-14-readme-design.md`

---

### Task 1: 新增 README.md

**Files:**
- Create: `README.md`（仓库根目录）

**Step 1: 确认首页图存在**

确认仓库根目录下存在 `image/main.png`。若不存在，将设计中的图片路径改为实际存在的路径或先添加图片再继续。

**Step 2: 创建 README.md**

在仓库根目录创建 `README.md`，内容如下（可根据实际功能微调功能列表）：

```markdown
# CleanView - 磁盘空间分析器

用树状图可视化磁盘占用的 Electron 桌面应用，支持选择目录、钻取子目录、查看详情与删除文件/夹。

![CleanView 界面](image/main.png)

## 功能

- 选择文件夹进行磁盘空间分析
- 树状图展示各目录/文件占比，块大小与占用成正比
- 悬停或点击查看详情（大小、占比、层级、路径）
- 双击进入子目录
- 支持删除选中的文件或文件夹

## 开发与运行

**环境:** Node.js 18+

**安装与运行:**（以下为 README 中的代码块内容，需用 \`\`\`bash 与 \`\`\` 包裹）

    git clone <仓库地址>
    cd clean-view
    npm install
    npm run start

**打包:** 代码块内容为 `npm run make`

**技术栈:** Electron + React + Vite + D3/Recharts 树状图

## License

MIT
```

**Step 3: 检查与提交**

- 在本地或 GitHub 预览 README，确认图片与排版正常。
- 提交：`git add README.md && git commit -m "docs: add README with screenshot and dev instructions"`
```
