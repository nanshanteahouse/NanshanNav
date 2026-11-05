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

- **Node.js** ≥ 22.x
- **npm** ≥ 9.x

### 安装与运行

```bash
# 1. 克隆项目
git clone <repository-url>
cd NanshanNav

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 无需登录或令牌；仅展示时可设置 NAV_READ_ONLY=true

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

应用不内置认证或用户权限。`/` 用于公开展示，`/admin` 和 `/api/admin/*` 提供管理功能；可直接在局域网使用，需要访问控制时由反向代理同时保护管理页面和管理 API。`NAV_READ_ONLY=true` 会关闭两类管理入口及子路径。

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

默认只启动一个后端容器，同时提供前端和 API。无需域名或认证服务，可通过局域网 IP 直接访问：

```bash
cp deploy/docker/.env.example .env
docker compose --env-file .env -f deploy/docker/docker-compose.yml up -d --build
```

访问 `http://服务器IP:3001/`，管理入口为 `/admin`。Authelia 是单独的可选 Compose 示例；依赖代理认证时必须避免直接访问后端端口。完整指南 → [DOCKER.md](./DOCKER.md)

### systemd 服务

项目提供 systemd 服务示例，参见 `deploy/systemd/`。

### Nginx 反向代理

可选 Authelia 示例见 `deploy/nginx/nginx.conf.example`。代理需要同时保护 `/admin`、`/api/admin` 及全部子路径，并把静态资源和上传图片交给后端提供，以保留 CSP 和图片校验。

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
2. 在服务端 `NAV_PVE_HOSTS_JSON` 登记 HTTPS 主机和固定 IP，内部证书通过 `NODE_EXTRA_CA_CERTS` 信任
3. 打开 `/admin` 管理页；如部署了代理认证，先通过代理登录
4. 在 PVE 组件设置中选择已登记主机、配置节点并保存对应令牌；默认令牌回退已移除

### 如何备份仪表盘配置？

- **保存与草稿**：保存成功才退出编辑；失败保留本机草稿，服务器保存使用版本冲突检测
- **完整备份**：工具栏导出 JSON 包含本地上传图片，可在另一实例恢复；外部图片保留 URL
- **版本回滚**：工具栏可查看并恢复最近 10 个已保存版本

### 文件上传位置？

默认存储在项目根目录的 `uploads/` 文件夹，可通过 `UPLOAD_DIR` 环境变量自定义。

---

## 许可证

本项目为私有项目，保留所有权利。

## 本轮改进

- 部署边界：展示与管理路径分离，可选代理认证；PVE 凭据绑定登记主机、内网检查白名单、上传和 favicon 安全重编码。旧管理 API 已迁到 `/api/admin/*`，迁移步骤见 [DOCKER.md](./DOCKER.md)。
- 编辑：手机尺寸/移动控件、布局撤销、键盘焦点管理、明确保存状态和失败重试。
- 快速开始：侧栏提供家庭/工作/极简模板，以及浏览器书签 HTML 导入、预览与去重。
- 搜索：Ctrl/⌘+K 统一搜索链接名称、描述、网址及标签，Ctrl/⌘+Enter 新标签打开。
- 状态：登记服务可查看最近 20 次可达性检查，重启后清空；HTTP 响应不等同于应用健康。

验证命令：`npm test`、`npm run test:server`、`npm run lint`、`npm run build`、`npm run typecheck:server`。
