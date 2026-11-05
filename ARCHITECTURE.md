# 架构文档

> NanshanNav 技术架构说明。适用于开发者和贡献者。

---

## 项目结构

```
NanshanNav/
├── .env.example / package.json / vite.config.ts / tsconfig*.json
├── vitest.config.ts / eslint.config.js / index.html
│
├── deploy/                   # 部署运维
│   ├── docker/               #   Dockerfile + docker-compose.yml + .env.example
│   ├── nginx/                #   nginx.conf + conf.d/nav.conf + nginx.conf.example
│   ├── systemd/              #   systemd 服务示例
│   ├── authelia/config/      #   configuration.yml + users.yml
│   └── scripts/start.sh      #   开发一键启动
│
├── server/                   # 后端源码（Hono.js）
│   ├── tsconfig.json
│   ├── index.ts / app.ts     # 启动入口 / 应用路由与静态文件
│   ├── config/               # pve-tokens.json, .pve-key
│   ├── routes/pve-proxy.ts   # PVE 代理 + 令牌管理
│   └── lib/
│       ├── crypto.ts         # AES-256-GCM
│       └── favicon.ts        # Favicon 代理缓存
│
├── src/                      # 前端源码（React 19）
│   ├── main.tsx / App.tsx
│   ├── components/
│   │   ├── layout/           # AppLayout, DashboardToolbar, Sidebar, DashboardCanvas
│   │   ├── widgets/          # WidgetCard/Shell/Palette/Settings/Error/Skeleton + 8 widgets
│   │   ├── common/           # ThemeToggle, ColorThemeEditor, ColorPicker, LanguageSelect 等
│   │   └── ui/               # button, input, modal, select, slider, switch, icon-picker
│   ├── store/                # Zustand（6 切片）
│   ├── registry/             # 组件注册表（index + loaders + 8 definitions）
│   ├── types/                # widget, dashboard, layout, pve, history
│   ├── hooks/                # 5 个自定义 Hook
│   ├── i18n/                 # zh-CN, en
│   ├── lib/                  # constants, api/, utils/
│   ├── styles/               # globals.css, widgets.css
│   └── __tests__/            # 组件、数据与交互测试
│
├── dist/ / uploads/ / public/ / node_modules/
```

---

## 后端架构

### 技术栈

| 技术 | 用途 |
|------|------|
| **Hono.js 4** | Web 框架 |
| **@hono/node-server** | Node.js 运行适配 |
| **tsx** | TypeScript 运行时 |
| **Node.js Crypto** | AES-256-GCM 加解密 |

### 路由总览

`server/index.ts` 启动监听，`server/app.ts` 组装应用，业务路由位于 `server/routes/`。应用不负责身份认证；普通展板与管理路径分离，部署反代可选择限制管理入口或整个站点。无需域名、反代或登录也可运行。

| 路径 | 方法 | 说明 |
|------|------|------|
| `/` | GET | 普通展板，不启用编辑或读取管理草稿 |
| `/admin`、`/admin/*` | GET | 管理页面，由部署者决定访问限制 |
| `/api/capabilities` | GET | `{readOnly:boolean}` |
| `/api/dashboard` | GET | 已保存面板配置及 ETag |
| `/api/admin/dashboard` | PUT | 校验文档与 If-Match 后原子保存 |
| `/api/admin/dashboard/versions` | GET | 历史版本列表 |
| `/api/admin/dashboard/rollback` | POST | 回滚并生成新版本 |
| `/api/admin/upload` | POST | 解码并重编码图片为 WebP |
| `/api/admin/pve/hosts` | GET | 已登记 PVE 主机列表 |
| `/api/admin/pve/tokens` | GET / PUT / DELETE | PVE 凭据管理，不返回明文 |
| `/api/pve/*` | GET | 限定登记目标和监控路径的公开读取 |
| `/api/favicon?url=` | GET | 安全图标代理 |
| `/api/health-check?serviceId=` | GET | 登记服务可达性检测 |
| `/uploads/*` | GET | 解码并提供图片，禁止任意静态内容 |

`server/lib/access.ts` 负责管理路径边界和跨站写入校验，不识别用户、令牌或网关身份。`NAV_READ_ONLY=true` 在后端关闭 `/admin`、`/api/admin` 及其所有子路径；前端读取 capabilities 后决定是否启用管理。其他 API 禁止写入。完整接口及迁移说明见 [API.md](./API.md)。

### Favicon 与出站请求

Favicon 只尝试同 origin 的 `/favicon.ico`、`/favicon.png`、`/assets/favicon.png`，不解析 HTML、不跟随重定向；响应为解码后重新编码的 WebP。缓存保留 7 天。出站请求校验 DNS/IP 并固定连接地址；内网服务必须登记，域名目标配置允许 IP。TLS 校验保持开启。

### 加密存储

PVE 令牌使用 **AES-256-GCM**:
- 密钥: 32 字节 hex（`PVE_ENCRYPTION_KEY` 环境变量 > `.pve-key` 文件 > 自动生成）
- IV: 16 字节
- 输出: `{ iv: hex, authTag: hex, encrypted: hex }`

---

## 状态管理

### 6 个 Zustand 切片

| 切片 | 职责 | 主要状态 |
|------|------|----------|
| **settingsSlice** | 仪表盘设置 | cellSize, themeMode, locale, colors, glass |
| **uiSlice** | UI 交互状态 | editMode, sidebarOpen, currentBreakpoint |
| **layoutSlice** | 网格布局 | 5 断点的布局数组 |
| **widgetSlice** | 组件 CRUD | 增删改查 + duplicate + paste + 历史快照 |
| **clipboardSlice** | 剪贴板 | 组件复制/粘贴缓冲区 |
| **historySlice** | 撤销/重做 | 50 步历史栈 |

### 双层持久化

管理页面使用 localStorage 保存草稿，包含文档、dirty 状态和服务端 revision；普通展板不读取或覆盖这份草稿，只加载已保存的服务端面板。损坏草稿会隔离保留，迟到的网络读取不会覆盖管理编辑。

`useServerSync` 在应用根节点初始化。保存使用 `PUT /api/admin/dashboard`，成功后更新 ETag，失败保留编辑状态；后端串行检查版本，原子替换文件并保留最近 10 个历史版本。前端可导出含上传图片的完整备份。

### 响应式断点

| 断点 | 最小宽度 | 列数 |
|------|---------|------|
| lg | ≥1200px | 12 |
| md | ≥996px | 10 |
| sm | ≥768px | 6 |
| xs | ≥480px | 4 |
| xxs | <480px | 2 |

### 主题系统

- 三种模式: 浅色 / 深色 / 跟随系统
- **16 种** CSS 颜色变量（背景色 5 + 文本色 4 + 边框色 2 + 状态色 3 + 强调色 2）
- 玻璃态效果: glassEnabled, glassBlur

---

## 国际化

```
I18nProvider (React Context)
  └─ useTranslation() → { locale, t }
       ├─ t(key, params?) 点号路径 + {param} 插值
       └─ locale: string
```

- `TranslationSchema` TypeScript 类型绑定（编译时校验）
- 动态加载: `loadTranslation()` switch
- 当前: zh-CN, en

---

## 开发指南

### 常用命令

```bash
npm run dev          # 前端 (Vite, :5173)
npm run serve:upload # 后端 (Hono, :3001)
npm run dev:all      # 同时启动
npm run build        # 构建前端
npm run test         # Vitest 运行测试
npm run test:watch   # 监听模式
npm run lint         # ESLint
npm run format       # Prettier
```

### 测试

- **Vitest** + **Testing Library**
- 前端测试分布于 components/、store/、lib/、hooks/、data/；后端路由与安全测试位于 server/tests/，运行 `npm run test:server`。

### 组件生态

组件注册表模式，参见 [WIDGETS.md](./WIDGETS.md)。
