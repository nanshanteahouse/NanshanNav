<p align="center">
  <h1 align="center">NanshanNav 🏠</h1>
  <p align="center">家庭网络导航面板 — 自托管的可定制仪表盘</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6" alt="TypeScript 6" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-38B2AC" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Hono.js-4-E36049" alt="Hono.js 4" />
  <img src="https://img.shields.io/badge/Zustand-5-7C3AED" alt="Zustand 5" />
</p>

---

## 项目简介

**NanshanNav** 是一个面向家庭网络环境的自托管导航仪表盘。它提供了一个可自由拖拽的网格化面板，让你将所有常用的网络工具、监控信息和快捷链接整合到一个页面中。

无论是管理 Proxmox 虚拟化服务器、收藏常用的 Web 工具、查看系统状态，还是快速搜索网络资源，NanshanNav 都能胜任。

### 设计理念

- **自托管优先**：所有数据存储在本地，不依赖任何第三方云服务
- **模块化组件**：通过组件注册表体系轻松扩展新功能
- **高度可定制**：自由布局、自定义主题色、多语言支持
- **家庭网络场景驱动**：专为家庭实验室、NAS 用户、自建服务爱好者设计

---

## 核心特性

### 📐 自由网格布局
基于 `react-grid-layout` 的拖拽式网格面板，5 个响应式断点（lg/md/sm/xs/xxs），布局自动适应屏幕。

### 🎨 主题系统
浅色 / 深色 / 跟随系统三种模式，16 种 CSS 颜色变量可自定义，支持玻璃态效果。

### 🌐 国际化
内置中文（zh-CN）和英文（en）语言包，支持一键切换。

### 📦 数据持久化
本地缓存（localStorage）与服务端存储双层持久化，换设备自动同步。

### 🛡️ 安全性
CSP 头配置、PVE 令牌 AES-256-GCM 加密存储、文件上传 MIME + 魔术字节双重验证。

---

## 技术栈

### 前端

| 技术 | 用途 |
|------|------|
| **React 19** | UI 框架 |
| **TypeScript 6** | 类型安全 |
| **Vite 8** | 构建工具与开发服务器 |
| **Tailwind CSS 4** | 原子化 CSS 框架 |
| **Zustand 5** | 轻量级状态管理 |
| **react-grid-layout** | 拖拽网格布局 |
| **TanStack React Query** | 服务端数据获取与缓存 |
| **react-router-dom** | 路由管理 |
| **lucide-react** | 图标库 |
| **react-markdown + remark-gfm** | Markdown 渲染 |
| **Vitest + Testing Library** | 单元测试 |

### 后端

| 技术 | 用途 |
|------|------|
| **Hono.js 4** | 轻量级 Web 框架 |
| **@hono/node-server** | Node.js 服务适配 |
| **tsx** | TypeScript 运行时 |
| **Node.js Crypto** | AES-256-GCM 加解密 |

---

## 快速开始

### 前置要求

- **Node.js** ≥ 20.x
- **npm** ≥ 9.x

### 安装与运行

```bash
# 1. 克隆项目
git clone <repository-url>
cd NanshanNav

# 2. 安装依赖
npm install

# 3. （可选）配置环境变量
cp .env.example .env

# 4. 同时启动前后端开发服务器
./deploy/scripts/start.sh

# 或分别启动：
npm run dev           # 前端 (Vite, 默认 :5173)
npm run serve:upload  # 后端 (Hono, 默认 :3001)

# 或同时启动：
npm run dev:all
```

### 访问

- **仪表盘**: `http://localhost:5173`
- **编辑模式**: `http://localhost:5173/admin`
- **后端 API**: `http://localhost:3001`

---

## 组件生态

NanshanNav 内置 **8 种组件**，采用组件注册表模式动态加载：

| 组件 | 说明 |
|------|------|
| 🕐 时钟 | 模拟/数字时钟，支持时区、日期格式 |
| 📝 标题 | h1~h4 级别，支持图标和分割线 |
| ✍️ Markdown 文本 | GFM Markdown 渲染 |
| 🔗 链接集合 | 链接收藏 + 健康检查 |
| 🌐 网页嵌入 | iframe 嵌入外部管理面板 |
| 🖥️ PVE 状态监控 | 实时监控 Proxmox VE |
| 🔍 多功能搜索框 | 多引擎切换 + 本地搜索 |
| 🖼️ 图片 | 多种显示模式和点击动作 |

各组件完整配置说明见 [WIDGETS.md](./WIDGETS.md)。

---

## 部署方式

### Docker（推荐）

一键启动 Nginx + Backend + Authelia + Redis 完整服务栈：

```bash
cp deploy/docker/.env.example .env
cd deploy/docker && docker compose up -d
```

完整指南 → [DOCKER.md](./DOCKER.md)

### systemd 服务

项目提供 systemd 服务示例，参见 `deploy/systemd/`。

### Nginx 反向代理

参考 `deploy/nginx/nginx.conf.example` 配置 SPA 路由、Authelia 认证。

---

## 文档索引

| 文档 | 内容 | 适用读者 |
|------|------|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 项目结构、状态管理、国际化、开发指南 | 开发者 / 贡献者 |
| [API.md](./API.md) | 全部 REST API 接口参考 | API 调用者 |
| [DOCKER.md](./DOCKER.md) | Docker Compose 部署、环境变量、备份恢复 | 部署运维 |
| [WIDGETS.md](./WIDGETS.md) | 组件注册表、各组件配置、添加新组件 | 开发者 |

---

## 常见问题

### 如何配置 PVE 监控？

1. 在 Proxmox VE 中创建 API 令牌（推荐 `monitor` 角色，只读权限）
2. 配置到 `server/config/pve-tokens.json` 或环境变量 `PVE_API_TOKEN`
3. 在编辑模式下添加 "PVE 状态" 组件，配置主机地址和节点名称

### 如何备份仪表盘配置？

- **自动备份**: 退出编辑模式时自动保存到 `server/config/dashboard-state.json`
- **手动备份**: 工具栏导出功能，导出为 JSON 文件

### 文件上传位置？

默认存储在项目根目录的 `uploads/` 文件夹，可通过 `UPLOAD_DIR` 环境变量自定义。

---

## 许可证

本项目为私有项目，保留所有权利。
