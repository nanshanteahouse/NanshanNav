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
│   ├── index.ts              # 入口：路由、静态文件、SPA
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
│   └── __tests__/            # 18 个测试文件
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

所有路由定义在 `server/index.ts`（除 PVE 代理在 `routes/pve-proxy.ts`）：

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/dashboard` | GET / PUT | 面板配置读写 |
| `/api/upload` | POST | 图片上传（20MB, 6 种 MIME, Magic Bytes） |
| `/api/favicon?url=` | GET | Favicon 代理（4 层回退） |
| `/api/health-check?url=` | GET | 链接可达性检测 |
| `/api/pve/*` | ALL | 委托 pve-proxy.ts |
| `/uploads/*` | GET | 静态文件服务 |
| `/*` | GET | SPA 回退（index.html） |

### Favicon 代理

回退链（4 层）:
1. `https://{host}/favicon.ico`
2. `http://{host}/favicon.ico`
3. 8 种备选路径（/favicon.png, /favicon.svg, /static/favicon.ico 等）
4. HTML 解析 `<link rel="icon">`

缓存: 服务端 7 天（MD5 哈希 + .meta.json），HTTP 响应 1 天（max-age=86400）

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

```
localStorage (zustand persist)
  └─ 键: "dashboard-storage"
  └─ partialize: settings / layouts / widgets
  └─ merge: darkMode → themeMode 自动迁移

服务端同步 (useServerSync hook)
  ├─ 页面加载: GET /api/dashboard → 覆盖本地
  ├─ 退出编辑: saveToServer() → PUT /api/dashboard
  └─ authState: loading | authenticated | unauthenticated
```

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
- 18 个测试文件分布于 components/ / store/ / lib/ / hooks/

### 组件生态

组件注册表模式，参见 [WIDGETS.md](./WIDGETS.md)。
