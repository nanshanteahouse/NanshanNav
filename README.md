# 南山驿 (NanshanNav) — 家庭网络服务导航页

一个面向家庭内网的自部署服务导航页，聚合 NAS、智能家居、监控、下载、媒体等各类服务的入口，并提供搜索引擎快捷搜索、主题切换、服务状态监控、Markdown 文本卡片等实用功能。

## 功能特性

- **服务导航** — 宫格卡片展示所有家庭服务，一键直达，支持分类管理
- **文本框卡片** — 支持 Markdown 渲染（GFM），可放置公告、说明、快捷链接，与服务卡片混排
- **搜索引擎** — 顶部搜索框，支持 Google / 百度 / Bing / DuckDuckGo / 自定义引擎快速切换
- **内网过滤** — 搜索框切换为过滤模式，实时筛选当前页面卡片，支持自动补全
- **服务状态监控** — 后端代理 HTTP 检测，卡片状态指示灯（在线/离线/检测中），后台标签页自动暂停轮询
- **PVE 节点概览** — 代理 PVE API，实时展示 CPU、内存、运行时间
- **主题切换** — 亮色 / 暗色 / 跟随系统，FOUC 防闪
- **精确调色** — 每个可视部件均支持 `#RRGGBB` 精确调色，管理页提供可视化色盘 + 实时预览
- **拖拽排序** — 分类和卡片均支持拖拽排序（@dnd-kit），移动端支持上下箭头
- **图标系统** — 优先级链：Favicon 自动抓取 → Lucide 图标库 → 自定义上传 → 首字母兜底
- **管理页** — 服务/分类 CRUD、搜索引擎设置、状态监控开关、外观调色、通用设置，渐进式披露编辑表单 + 实时预览
- **移动端适配** — 响应式宫格（1-5 列），触控优化，管理页折叠导航

## 技术栈

| 层级 | 选型 | 备注 |
|------|------|------|
| 前端框架 | React 19 + TypeScript | 严格模式 |
| 构建工具 | Vite 8 | |
| 样式方案 | Tailwind CSS 3.4 | class 策略暗色模式，CSS 变量调色 |
| 状态管理 | Zustand 5 | 含 persist 中间件 |
| 拖拽排序 | @dnd-kit/core + sortable | Grid 布局排序 |
| Markdown 渲染 | react-markdown + remark-gfm + rehype-sanitize | XSS 防护 |
| 图标 | Lucide React | 线性图标，风格统一 |
| 后端 | Fastify 5 | 单文件 `server.ts` |
| 数据存储 | JSON 配置文件 | 人类可读可编辑，无需数据库 |
| 部署 | Node.js 20+ | PVE LXC 容器 / 任意 Linux |

## 项目结构

```
nanshan-nav/
├── index.html                 # Vite 入口 HTML（含 FOUC 防闪脚本）
├── server.ts                  # 后端：Fastify + REST API + 静态托管
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── package.json
│
├── src/
│   ├── main.tsx               # React 入口
│   ├── App.tsx                # 根组件 + 路由（/ → 主页，/admin → 管理页）
│   ├── store.ts               # Zustand 单 store
│   ├── api.ts                 # 后端 API 请求封装
│   ├── types.ts               # TypeScript 类型定义 + 默认值
│   ├── icon-utils.ts          # 图标工具函数
│   │
│   ├── components/
│   │   ├── header.tsx         # 顶部栏（时钟/搜索/主题/设置入口）
│   │   ├── service-card.tsx   # 服务卡片
│   │   ├── category-section.tsx # 分类区块
│   │   ├── card-grid.tsx      # 响应式宫格容器
│   │   ├── sortable-card.tsx  # dnd-kit 可排序卡片包装
│   │   ├── search-bar.tsx     # 搜索框 + 引擎切换
│   │   ├── clock-widget.tsx   # 时钟/日期组件
│   │   ├── status-indicator.tsx # 状态指示灯
│   │   ├── icon-display.tsx   # 统一图标渲染
│   │   ├── theme-provider.tsx # 主题上下文
│   │   ├── color-picker.tsx   # 可视化色盘
│   │   └── pve-status-bar.tsx # PVE 资源状态条
│   │
│   ├── pages/
│   │   ├── HomePage.tsx       # 主页
│   │   └── AdminPage.tsx      # 管理页（懒加载）
│   │
│   └── styles/
│       └── index.css          # Tailwind 入口 + CSS 变量 + 全局样式
│
├── data/                      # 运行时数据（git-ignored，服务启动自动初始化）
│   ├── services.json          # 分类 + 卡片配置
│   ├── settings.json          # 全局设置
│   └── favicons/              # Favicon 本地缓存
│
└── public/
    ├── favicon.svg
    └── icons.svg
```

## 快速开始

### 环境要求

- Node.js 20+ LTS
- npm

### 安装与运行

```bash
# 克隆项目
git clone <repo-url> /opt/nanshan-nav
cd /opt/nanshan-nav

# 安装依赖
npm install

# 开发模式（前端 + 后端同时启动）
npm run dev:all

# 或分别启动
npm run dev          # 前端开发服务器 (Vite, 默认 5173)
npm run dev:server   # 后端开发服务器 (tsx watch, 默认 3000)
```

开发模式下，Vite 会自动将 `/api` 请求代理到后端 `localhost:3000`。

### 生产构建与部署

```bash
# 构建（仅首次部署或更新代码时执行）
npm run build

# 生产运行（默认端口 3000）
npm start

# 自定义端口运行
PORT=8080 npm start
```

生产模式下，Fastify 同时托管前端静态资源（从 `dist/` 目录），单端口即可运行。

### systemd 守护进程（推荐）

```ini
[Unit]
Description=NanshanNav
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/opt/nanshan-nav
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
# 首次部署时构建
npm run build

# 安装并启动服务
sudo cp nanshan-nav.service /etc/systemd/system/
sudo systemctl enable --now nanshan-nav
```

**环境变量说明：**
- `PORT` — 后端服务端口（默认 3000）
- `FRONTEND_PORT` — 前端开发服务器端口（默认 5173，仅开发模式生效）

### Nginx 反向代理

内网访问：

```nginx
server {
    listen 80;
    server_name home.local;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

外网访问（配合 Authelia 鉴权）：

```nginx
server {
    listen 443 ssl;
    server_name home.example.com;

    location / {
        include /etc/nginx/snippets/authelia.conf;
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> **认证说明**：本项目不实现身份认证。外网访问场景下，由 Nginx + Authelia 反代处理鉴权，本项目仅接收已认证的请求。

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/config` | 获取全量配置（分类 + 卡片 + 设置），敏感字段脱敏 |
| PUT | `/api/config` | 保存全量配置 |
| PUT | `/api/config/categories` | 仅更新分类（拖拽排序后局部保存） |
| PUT | `/api/config/services` | 仅更新卡片 |
| PUT | `/api/config/settings` | 仅更新设置 |
| GET | `/api/status` | 获取所有服务当前状态 |
| GET | `/api/favicon?url=xxx` | 代理抓取 favicon，返回缓存或实时抓取结果 |
| POST | `/api/icon/upload` | 上传自定义图标（multipart/form-data，≤100KB） |
| GET | `/api/pve/status` | 代理获取 PVE 节点状态 |

## 配置文件

运行时数据存储在 `data/` 目录，服务首次启动时自动初始化默认配置。

### `data/services.json`

分类和卡片配置，卡片直接嵌套在分类的 `cards` 数组内，数组顺序即为展示顺序。

```jsonc
{
  "categories": [
    {
      "id": "cat_nas",
      "name": "NAS 管理",
      "icon": "hard-drive",
      "color": "#3B82F6",
      "cards": [
        {
          "id": "svc_dsm",
          "type": "service",
          "name": "群晖 DSM",
          "url": "https://192.168.1.100:5001",
          "description": "NAS 管理面板",
          "iconSource": "favicon",
          "iconValue": null,
          "enableStatusCheck": true,
          "openInNewTab": true
        },
        {
          "id": "txt_announce",
          "type": "text",
          "title": "家庭公告",
          "content": "## 通知\n\n本周六维护",
          "icon": "megaphone"
        }
      ]
    }
  ]
}
```

### `data/settings.json`

全局设置，包含页面标题、搜索引擎、状态监控、PVE 集成、主题与配色等。

## 搜索框快捷键

| 快捷键 | 行为 |
|--------|------|
| `/` | 聚焦搜索框，自动切换至内网过滤模式 |
| `Ctrl+K` / `⌘+K` | 聚焦搜索框，保持当前引擎 |
| `Escape` | 清空搜索内容并失焦，恢复全部卡片显示 |

## 图标优先级

卡片图标按以下优先级展示：

1. **Favicon** — 后端代理抓取服务 favicon + 本地缓存（7 天过期）
2. **Lucide 图标** — 管理页手动指定 Lucide 图标名
3. **自定义上传** — 上传 PNG / ICO / SVG（≤100KB），存入 `data/favicons/`
4. **首字母** — 以上均无时，取服务名首字母大写，背景色取分类色

## PVE 节点概览配置

1. PVE Web UI → Datacenter → Permissions → API Tokens → Add
2. 选择 User（如 `root@pam`），输入 Token ID（如 `homepage-monitor`）
3. 勾选「Privilege Separation」→ 分配 `PVEAuditor` 角色
4. 立即复制 Token 值（仅显示一次）
5. 在管理页 → 通用设置 → PVE 节点概览中填入：主机地址、节点名、Token

## NPM Scripts

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run dev:server` | 启动后端开发服务器（tsx watch 热重载） |
| `npm run dev:all` | 同时启动前端和后端开发服务器 |
| `npm run build` | TypeScript 编译 + Vite 生产构建 |
| `npm run preview` | 预览生产构建产物 |
| `npm run lint` | ESLint 检查 |
| `npm start` | 生产模式运行（NODE_ENV=production） |

## License

MIT
