# Character Relationship Navigation (交互式人物关系图谱)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个基于 Next.js 和 React Flow 构建的高性能交互式人物关系可视化引擎。本项目最初用于展示《奥古斯都》一书中的复杂人物网络，旨在提供清晰、直观且富有探索性的阅读辅助体验。

[在线演示 / Demo](https://jmocoder.github.io/character_relationship_navigation/)

## ✨ 核心特性

- **🚀 高性能可视化**
  - 结合 **React Flow** 的灵活性与 **D3.js** 物理引擎的强大计算能力。
  - 支持 **5500+** 像素的物理斥力模拟，确保大规模节点展开时布局依然清晰（v1.0.0）。

- **🔍 深度交互体验**
  - **点击展开**：点击人物节点动态展开/收起关联人物，支持多级关系探索。
  - **无缝上下文切换**：右键菜单支持 "设为主节点" (Set as Main)，一键重构视图中心，物理引擎自动以新主角为核心重新计算布局。
  - **智能视图控制**：内置智能缩放 (MaxZoom) 与防漂移逻辑，无论是查看单人关系还是宏大网络，都能自动获得最佳视角。

- **🎨 现代视觉设计**
  - **层级化样式**：主线关系（琥珀色）与支线关系（蓝色）自动分层渲染。
  - **流体动画**：基于 Framer Motion 的平滑过渡效果。
  - **响应式布局**：完美适配桌面端与移动端操作。

## 🛠️ 技术栈

- **框架**: [Next.js](https://nextjs.org/) (React)
- **图表库**: [React Flow](https://reactflow.dev/)
- **算法**: [D3-Force](https://github.com/d3/d3-force) (力导向布局)
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **动画**: [Framer Motion](https://www.framer.com/motion/)

## 📦 快速开始

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 启动开发服务器

```bash
npm run dev
```

浏览器访问 `http://localhost:3000` 即可开始探索。

### 部署 (GitHub Pages)

本项目已配置 GitHub Actions 自动部署工作流。只需将代码推送到 GitHub 并在 Settings -> Pages 中开启 Actions Source，即可自动部署静态站点。

## 📝 变更日志

详细更新记录请查看 [CHANGELOG.md](./CHANGELOG.md)。

## 📄 开源协议

本项目采用 [MIT 协议](./LICENSE) 开源。
