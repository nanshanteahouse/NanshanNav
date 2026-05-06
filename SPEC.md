# 家庭网络服务导航页 — 设计规格书

> 状态：**需求已确认** — 所有待决问题已闭环，可进入开发

---

## 1. 项目概述

一个面向家庭内网的自部署服务导航页，聚合 NAS、智能家居、监控、下载、媒体等各类服务的入口，并提供搜索引擎快捷搜索、主题切换、服务状态监控、Markdown 文本卡片等实用功能。

### 1.1 核心目标

- **一目了然**：所有家庭服务集中展示，一键直达
- **自由定制**：分类、服务、排序、配色均可通过管理页编辑
- **开箱即用**：PVE 轻量 VM 部署，最小化配置即可运行
- **全家适用**：移动端完美适配，非技术家庭成员也能使用

---

## 2. 技术栈

| 层级 | 选型 | 版本 | 备注 |
|------|------|------|------|
| **前端框架** | React | 18+ | |
| **构建工具** | Vite | 5+ | |
| **语言** | TypeScript | 5+ | 严格模式 |
| **样式方案** | Tailwind CSS | 3.4+ | class 策略暗色模式 |
| **状态管理** | Zustand | 4+ | 含 persist 中间件 |
| **拖拽排序** | @dnd-kit/core + sortable | 最新 | 支持 Grid 布局排序，~10KB |
| **Markdown 渲染** | react-markdown + remark-gfm | 最新 | 文本框卡片 |
| **图标** | Lucide React | 最新 | 线性图标，风格统一 |
| **后端** | Node.js (Fastify) | 20+ LTS | 与前端同语言栈 |
| **数据存储** | JSON 配置文件 | — | 人类可读可编辑，无需数据库 |
| **部署** | PVE 轻量 VM | — | 无 Docker，直接运行 |

### 2.1 后端职责

1. 提供 REST API 读写 JSON 配置文件
2. 服务状态 HTTP 检测代理（绕过 CORS）
3. Favicon 代理抓取 + 本地缓存
4. 前端静态资源托管（生产模式）

### 2.2 认证

**本项目不实现任何身份认证**。外网访问场景下，由 Nginx + Authelia 反代处理鉴权，本项目仅接收已认证的请求。

---

## 3. 项目目录结构

```
web-homepage/
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── index.html                    # Vite 入口 HTML（含 FOUC 防闪脚本）
│
├── server.ts                     # 后端单文件：Fastify + 3 API + 静态托管 + 启动初始化
│
├── src/
│   ├── main.tsx                  # React 入口
│   ├── App.tsx                   # 根组件 + 路由（/ → 主页，/admin → 管理页）
│   ├── store.ts                  # Zustand 单 store（config + theme + status 合一）
│   ├── api.ts                    # 后端 API 请求封装
│   ├── vite-env.d.ts
│   │
│   ├── components/               # 扁平结构，无子目录
│   │   ├── header.tsx            # 顶部栏（时钟/搜索/主题/设置入口）
│   │   ├── service-card.tsx      # 服务卡片
│   │   ├── text-card.tsx         # Markdown 文本框卡片
│   │   ├── category-section.tsx  # 分类区块（标题 + 宫格）
│   │   ├── card-grid.tsx         # 响应式宫格容器
│   │   ├── sortable-card.tsx     # dnd-kit 可排序卡片包装
│   │   ├── search-bar.tsx        # 搜索引擎框 + 引擎切换
│   │   ├── clock-widget.tsx      # 时钟/日期组件
│   │   ├── status-indicator.tsx  # 状态指示灯
│   │   ├── icon-display.tsx      # 统一图标渲染（favicon/icon/首字母）
│   │   ├── theme-provider.tsx    # 主题上下文（class 策略 + FOUC 防护）
│   │   └── color-picker.tsx      # 可视化色盘 + #RRGGBB 输入
│   │
│   ├── pages/
│   │   ├── HomePage.tsx          # 主页
│   │   └── AdminPage.tsx         # 管理页（侧栏导航 + tab 内容切换，单文件）
│   │
│   └── styles/
│       └── index.css             # Tailwind 入口 + CSS 变量 + 全局样式
│
├── data/                         # 运行时数据（git-ignored）
│   ├── services.json             # 分类 + 卡片（合并，见 §7.1）
│   ├── settings.json             # 全局设置（单独，见 §7.2）
│   └── favicons/                 # Favicon 本地缓存
│
└── public/
    └── favicon.ico               # 项目自身图标
```

### 3.1 精简设计原则

| 决策 | 理由 |
|------|------|
| `server.ts` 单文件 | 3 个 API 端点不值得分层，Fastify 单文件注册路由即可 |
| `components/` 扁平 | ~12 个组件，文件名自解释，子目录增加导航成本 |
| `store.ts` 单文件 | config/theme/status 总数据量小，一个 Zustand store 搞定 |
| `AdminPage.tsx` 单文件 | 各功能 tab 用条件渲染切换，无需文件拆分 |
| 合并 categories + services → `services.json` | 分类是服务的容器，合并后 ID 引用同文件内，编辑/备份一份搞定 |
| `settings.json` 单独保留 | 设置变更频率低、语义独立，分开更清晰 |
| 删除 `scripts/` | 初始化逻辑内置到 `server.ts` 启动流程 |
| 删除 `hooks/` + `stores/` + `lib/` | 各仅 2-3 个文件，`store.ts` + `api.ts` 足够 |

### 3.2 后续拆分信号

当项目膨胀时再按需拆分：
- 组件 > 20 个 → components 按功能分子目录
- 后端端点 > 8 个 → server.ts 拆 routes/
- AdminPage > 400 行 → 拆出管理子组件

---

## 4. 设计风格

### 4.1 视觉定位：简约现代

- **留白为主**：内容呼吸感强，不堆砌
- **宫格卡片流**：响应式等宽等高卡片，统一整齐，无瀑布流
- **圆角 + 微阴影**：柔和的视觉层次
- **配色克制**：主色 ≤ 2 种，辅助色用于分类标签
- **动画克制**：仅 hover 状态、主题切换过渡，无花哨动效

### 4.2 卡片规格

- **服务卡片**：等宽等高，宫格排列
  - 内容：图标 + 名称 + 描述（可选）+ 状态指示灯（可选）
  - 高度固定，描述文字超出截断省略
- **文本框卡片**：等宽，高度自适应 Markdown 内容
  - 支持 Markdown 渲染（标题/列表/链接/代码块/粗体等）
  - 可放置在任意分类中，与普通服务卡片混排

### 4.3 配色系统

#### 4.3.1 默认主题

| 元素 | 亮色模式 | 暗色模式 |
|------|----------|----------|
| 背景 | `#FAFAFA` | `#0F0F0F` |
| 卡片 | `#FFFFFF` | `#1E1E1E` |
| 主文字 | `#1A1A1A` | `#E5E5E5` |
| 次文字 | `#666666` | `#999999` |
| 主色调 | `#3B82F6` | `#3B82F6` |
| 分类标签色 | 每个分类独立色值 | 降饱和版本 |

#### 4.3.2 精确调色

**每个可视部件均支持按 `#RRGGBB` 精确调色**，管理页提供可视化色盘预览：

| 可调色部件 | CSS 变量 | 默认值（亮/暗） |
|-----------|----------|----------------|
| 页面背景 | `--color-background` | `#FAFAFA` / `#0F0F0F` |
| 卡片背景 | `--color-card` | `#FFFFFF` / `#1E1E1E` |
| 卡片边框 | `--color-card-border` | `#E5E7EB` / `#333333` |
| 主文字 | `--color-text-primary` | `#1A1A1A` / `#E5E5E5` |
| 次文字 | `--color-text-secondary` | `#666666` / `#999999` |
| 主色调（强调） | `--color-accent` | `#3B82F6` / `#3B82F6` |
| 搜索框背景 | `--color-search-bg` | `#FFFFFF` / `#252525` |
| 搜索框边框 | `--color-search-border` | `#D1D5DB` / `#404040` |
| 分类标题文字 | `--color-category-title` | `#1A1A1A` / `#E5E5E5` |
| 状态灯在线 | `--color-status-online` | `#22C55E` / `#22C55E` |
| 状态灯离线 | `--color-status-offline` | `#EF4444` / `#EF4444` |

管理页色盘交互：
- 点击色块 → 弹出原生 `<input type="color">` 或自定义色盘
- 实时预览：修改色值后主页立即反映变化
- 重置按钮：恢复默认配色

### 4.4 图标规范

优先级链：**Favicon（自动抓取）→ 图标库（手动指定）→ 自定义上传图标 → 首字母大写兜底**

| 优先级 | 来源 | 说明 |
|--------|------|------|
| 1 | **Favicon** | 后端代理抓取服务 favicon + 本地缓存，优先展示 |
| 2 | **图标库** | 管理页可手动指定 Lucide 图标名（如 `hard-drive`） |
| 3 | **自定义上传** | 管理页「上传自定义图标」按钮，文件存入 `data/favicons/`，适用于死活抓不到 favicon 的内网服务 |
| 4 | **首字母** | 以上均无时，取服务名首字母大写，背景色取分类色 |

#### 4.4.1 Favicon 抓取策略

- 后端代理抓取：解析目标 URL 的 HTML `<link rel="icon">` 或直接请求 `/favicon.ico`
- **User-Agent 伪装**：后端抓取请求携带浏览器 UA（如 `Mozilla/5.0 ...`），部分自部署服务（Proxmox、特定 WebUI）对无 UA 或脚本 UA 的请求会拦截或返回异常响应
- 本地缓存：抓取成功后存入 `data/favicons/`，7 天过期后重新抓取
- 前端通过 `/api/favicon?url=xxx` 加载，无 CORS 问题

#### 4.4.2 自定义图标上传

- 管理页服务编辑表单中提供「上传图标」按钮
- 支持 PNG / ICO / SVG 格式，单文件 ≤ 100KB
- 上传后存入 `data/favicons/custom_{serviceId}.{ext}`
- `iconSource` 字段自动设为 `"custom"`，`iconValue` 设为相对路径

---

## 5. 功能规格

### 5.1 服务导航

#### 5.1.1 服务卡片

每个服务展示：
- **图标**（Favicon / Lucide / 首字母，按优先级）
- **名称**
- **描述**（可选，一行简述，超出截断）
- **链接**（点击跳转，新标签页打开）
- **状态指示灯**（可选开关，见 §5.3）

#### 5.1.2 文本框卡片

- 支持 Markdown 渲染（GFM：表格、任务列表、删除线等）
- 可用于放置公告、使用说明、快捷链接列表等
- 与服务卡片在同一宫格中混排
- 高度自适应内容
- **XSS 防护**：使用 `rehype-sanitize` 插件过滤危险 HTML 标签和属性（如 `<script>`、`onclick`、`javascript:` 协议等）。即使当前为信任用户编辑，防范配置文件被复制/分享时的潜在风险。依赖：`rehype-sanitize`（react-markdown 生态内置兼容）
- **编辑态与展示态一致**：管理页 Markdown 实时预览**同样应用** `rehype-sanitize` 过滤，确保编辑时看到的渲染结果与主页展示完全一致，避免"编辑时正常、保存后被过滤"的差异

#### 5.1.3 分类

默认分类（用户可自定义增删改排序）：

| 分类 | 默认图标 | 默认标签色 |
|------|---------|-----------|
| NAS 管理 | `hard-drive` | `#3B82F6` |
| 智能家居 | `home` | `#8B5CF6` |
| 监控 / 运维 | `activity` | `#EF4444` |
| 媒体服务 | `play-circle` | `#F59E0B` |
| 下载管理 | `download` | `#10B981` |
| 路由 / 网关 | `router` | `#6366F1` |
| 开发 / 文档 | `code-2` | `#14B8A6` |
| 虚拟化 | `server` | `#F97316` |
| 自部署网页 | `globe` | `#EC4899` |
| AI 工具 | `sparkles` | `#A855F7` |
| 自定义… | `bookmark` | `#6B7280` |

展示方式：**单页平铺**，分类间用标题分隔线区隔，所有分类纵向排列。

### 5.2 搜索引擎快捷搜索

- 页面顶部搜索框
- **默认行为**：跳转至外部搜索引擎
- 用户可选引擎（多选，展示为搜索框下方快速切换标签）：

| 引擎 | 搜索 URL 模板 |
|------|--------------|
| Google | `https://www.google.com/search?q={query}` |
| 百度 | `https://www.baidu.com/s?wd={query}` |
| Bing | `https://www.bing.com/search?q={query}` |
| DuckDuckGo | `https://duckduckgo.com/?q={query}` |
| 自定义 | 用户填入 URL 模板 |

- **可开关**：用户可在设置中隐藏搜索框
- **默认引擎**：用户可设定
- **交互**：输入 → Enter 跳转当前选中引擎；点击引擎标签切换

#### 5.2.1 内网过滤模式

- 搜索框支持切换为「**内网过滤**」模式，作为特殊"引擎"选项
- 启用后，输入关键词 → **仅过滤当前页面卡片**（匹配名称 / 描述 / URL），隐藏不匹配的卡片
- 适用场景：服务数量 >30 时快速定位某个服务
- 交互：
  - 搜索框引擎标签中出现「🔍 内网」选项（可在管理页开关）
  - 选中后，搜索框行为从"跳转外链"变为"实时过滤"
  - 输入时即时过滤，无需 Enter；清空输入恢复全部卡片
- **自动补全提示**：内网过滤模式下，输入时在搜索框下方弹出匹配卡片列表（最多 8 条），显示卡片名称 + 所属分类 + 小图标；点击提示项直接跳转该服务链接（service 类型）或滚动至该卡片位置（text 类型）；选中提示项后搜索框保持聚焦，便于继续输入
- 实现：前端纯逻辑，无需后端参与；按分类过滤，无匹配卡片的分类自动隐藏；补全数据源为当前已加载的卡片列表

#### 5.2.2 搜索框快捷键

| 快捷键 | 行为 |
|--------|------|
| `/` | 聚焦搜索框，自动切换至「内网过滤」模式 |
| `Ctrl+K` / `⌘+K` | 聚焦搜索框，保持当前引擎 |
| `Escape` | 清空搜索内容并失焦，恢复全部卡片显示 |

- 快捷键仅在搜索框未聚焦时生效；搜索框已聚焦时 `/` 作为普通字符输入，`Escape` 仅清空失焦
- 实现方式：全局 `keydown` 监听，检查 `document.activeElement` 排除 `<input>` / `<textarea>` 等编辑态元素
- 提示文字：搜索框 placeholder 显示 `搜索... (Ctrl+K)`

### 5.3 服务状态监控

- **默认关闭**，用户可在管理页开启
- 开启后，每个卡片显示状态指示灯：
  - 🟢 在线（HTTP 2xx）
  - 🔴 离线（超时 / 非 2xx / 连接失败）
  - ⚪ 检测中
- **检测方式**：后端代理 HTTP 请求（前端受 CORS 限制）
- **检测间隔**：60s（可在管理页配置）
- **超时时间**：5s（可通过配置文件修改）
- **仅检测内网服务**：外部链接不检测
- **单服务可覆盖**：可单独关闭某服务的状态检测
- **按需轮询（性能优化）**：
  - 浏览器标签页处于后台时（`document.hidden === true`），**暂停**前端对 `/api/status` 的轮询
  - 标签页重新激活时（`visibilitychange` 事件），立即触发一次状态检测，然后恢复正常轮询
  - 实现方式：`useStatus` hook 内监听 `document.visibilitychange`，后台时 `clearInterval`，前台时 `setInterval` + 立即 fetch
  - 好处：导航页长期挂在后台时，避免后端持续执行无意义的 HTTP 检测，降低内网流量和后端负载
- **后端并发控制**：
  - 状态检测后端使用 `p-limit`（或等效工具）限制并发请求数为 **5 个**
  - 防止配置 50+ 服务时瞬间发出 50 个并发 HTTP 请求，避免对内网服务和后端自身造成冲击
  - 检测启动时采用 **stagger 错峰**策略：不一次性触发全部检测，而是按分类分组、每组间隔 2s 依次发起
  - 单次检测完整周期 = `服务数 / 5 × 平均响应时间`（约 10-15s 可完成 50 个服务的检测）

### 5.4 主题切换

- 支持亮色 / 暗色 / 跟随系统三种模式
- 切换方式：
  1. 主页右上角手动切换按钮
  2. 跟随系统偏好 `prefers-color-scheme`
- 优先级：手动选择 > 系统偏好
- 切换动画：平滑过渡 `transition-colors duration-200`
- 主题偏好持久化至后端 settings.json
- **FOUC 防闪**：`index.html` 内联脚本在渲染前应用主题

### 5.5 管理页

#### 5.5.1 路由与布局

- 主页：`/`
- 管理页：`/admin`
- 同一 React 应用，使用 React Router 区分路由
- 管理页布局：左侧导航栏 + 右侧内容区

#### 5.5.2 管理页功能模块

| 模块 | 功能 |
|------|------|
| **服务管理** | 增删改服务、拖拽排序（宫格预览）、选择分类、图标设置 |
| **分类管理** | 增删改分类、拖拽排序、标签色设置 |
| **搜索引擎** | 开关搜索框、增删改引擎、设默认引擎 |
| **状态监控** | 开关监控、设置检测间隔 |
| **外观设置** | 主题切换、逐部件调色（可视化色盘 + 实时预览） |
| **通用设置** | 时钟组件开关、页面标题设置、PVE 节点概览开关 + API 配置 |

#### 5.5.3 拖拽排序

- 管理页中分类和卡片均支持拖拽排序
- 使用 `@dnd-kit` 的 `rectSortingStrategy` 适配宫格
- 排序变更后自动调用 API 保存至配置文件
- 移动端：上下箭头按钮为主，长按拖拽为辅

#### 5.5.4 卡片编辑：渐进式披露 + 实时预览

**渐进式披露**：编辑表单分两级展示，降低新用户认知负担。

| 层级 | 展示时机 | 包含字段 |
|------|---------|---------|
| **基础**（默认展开） | 打开编辑即见 | 名称、URL（service）/ 内容（text）、分类、图标快捷选择 |
| **高级**（折叠） | 点击「高级设置 ▾」展开 | 描述、图标源切换（favicon/lucide/custom/initial）+ 对应值、状态检测覆盖、新标签页开关 |

- 折叠状态用 `▶ 高级设置` / `▾ 高级设置` 切换，展开/收起带 200ms 动画
- 已填写的高级字段在折叠时，标签旁显示已填项数量提示（如 `▾ 高级设置 (2)`），避免遗忘

**实时预览**：编辑表单右侧/下方渲染一张卡片预览，与主页最终效果一致。

```
┌─ 编辑服务 ─────────────┬─ 预览 ──────────┐
│ 名称：[群晖 DSM     ]  │  ┌──────────┐   │
│ URL： [https://nas...]  │  │ 🟢       │   │
│ 分类：[NAS 管理    ▾]  │  │ 群晖 DSM  │   │
│ 图标：[🌐 自动     ▾]  │  │ NAS 管理面板│  │
│                         │  └──────────┘   │
│ ▶ 高级设置              │                 │
│ 描述：[NAS 管理面板 ]   │                 │
│ 状态检测：[继承全局 ▾]  │                 │
└─────────────────────────┴─────────────────┘
```

- 预览卡片随表单字段变化**即时更新**（名称、图标、描述、状态灯等）
- 文本框卡片预览同样经过 `rehype-sanitize` 过滤渲染，与主页展示完全一致
- 图标选择后预览立即反映：favicon 抓取结果 / Lucide 图标 / 首字母
- 配色预览受当前主题设置影响（暗色模式下预览也是暗色）

### 5.6 PVE 节点概览

- **默认关闭**，用户可在管理页开启
- 开启后，在主页顶部（搜索框下方）显示 PVE 宿主机实时资源条：

```
┌────────────────────────────────────────────┐
│  🖥 PVE  CPU ▓▓▓▓░░░░ 35%  内存 ▓▓▓░░ 12.4/32 GB  ↑ 42d 7h │
└────────────────────────────────────────────┘
```

- 展示内容：
  - **CPU 使用率**（百分比，进度条）
  - **内存使用**（已用 / 总量 GB，进度条）
  - **运行时间**（格式化 uptime）

#### 5.6.1 PVE API 集成

| 项目 | 说明 |
|------|------|
| **端点** | `GET https://<pve-host>:8006/api2/json/nodes/<node-name>/status` |
| **认证方式** | API Token（推荐），格式 `PVEAPIToken=USER@REALM!TOKENID=UUID` |
| **Token 权限** | `PVEAuditor` 角色（只读，最低权限） |
| **关键字段映射** | `data.CPU` → CPU 使用率（0.0-1.0 浮点）；`data.Memory.Used/Total` → 内存；`data.Uptime` → 运行秒数 |
| **轮询间隔** | 60s（复用状态监控的定时机制，标签页后台时同样暂停） |
| **自签证书** | 后端请求需忽略 TLS 证书验证（PVE 默认自签） |

#### 5.6.2 PVE 异常状态处理

资源条**必须反映真实状态**，避免停留在过期数据上造成"系统正常"的假象：

| 场景 | `/api/pve/status` 响应 | 资源条 UI 表现 |
|------|----------------------|---------------|
| 正常 | 200 + 有效数据 | 正常显示 CPU/内存/uptime |
| PVE 宕机 / 网络不通 | 网络错误 / 超时 | 显示 `⚠ PVE 离线`，数值清空，进度条灰显 |
| Token 过期 / 权限不足 | 401 / 403 | 显示 `⚠ PVE 未授权`，提示检查 Token |
| Token 未配置 | 后端返回配置缺失 | 资源条不显示（等同功能未开启） |

- 前端实现：`usePveStatus` hook 维护 `status: "online" | "offline" | "unauthorized"` 状态，非 `online` 时数值字段置为 `null`
- 连续 3 次检测失败后，轮询间隔自动延长至 5 分钟（减少对宕机主机的无效请求）；下次成功后恢复正常间隔

#### 5.6.3 PVE Token 创建步骤

1. PVE Web UI → Datacenter → Permissions → API Tokens → Add
2. 选择 User（如 `root@pam`），输入 Token ID（如 `homepage-monitor`）
3. 勾选「Privilege Separation」→ 分配 `PVEAuditor` 角色
4. **立即复制 Token 值**（仅显示一次）
5. 在管理页 → 通用设置 → PVE 节点概览中填入：主机地址、节点名、Token

### 5.7 移动端适配

- **必须**完整适配
- 响应式宫格断点：

| 断点 | 列数 | 说明 |
|------|------|------|
| `< 640px` (手机) | 1-2 列 | 搜索框置顶，卡片紧凑 |
| `640-1024px` (平板) | 2-3 列 | |
| `> 1024px` (桌面) | 4 列 | |
| `> 1280px` | 5 列 | 宽屏 |

- 触控优化：卡片点击区域 ≥ 44px
- 管理页移动端：导航栏折叠为汉堡菜单

---

## 6. 页面结构

### 6.1 主页

```
┌──────────────────────────────────────────────────┐
│  ⏱ 14:32:08 周一     🔍 [ 搜索... ] Google  百度  🌙 ⚙️ │
├──────────────────────────────────────────────────┤
│                                                  │
│  ── NAS 管理 ──────────────────────────────────  │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐            │
│  │ 🟢  │  │ 🟢  │  │ 🔴  │  │ ⚪  │            │
│  │ DSM │  │ OMV │  │     │  │     │            │
│  └─────┘  └─────┘  └─────┘  └─────┘            │
│                                                  │
│  ── 媒体服务 ────────────────────────────────    │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌───────────────┐  │
│  │ 🟢  │  │ 🟢  │  │ 🟢  │  │ 📝 文本框卡片  │  │
│  │Plex │  │Jelly│  │Emby │  │ 支持 Markdown  │  │
│  └─────┘  └─────┘  └─────┘  └───────────────┘  │
│                                                  │
│  ── 下载管理 ────────────────────────────────    │
│  ...                                             │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 6.2 管理页

```
┌──────────┬─────────────────────────────────────┐
│ ⚙️ 管理  │                                     │
│          │  ── 外观设置 ──                      │
│ 📦 服务  │                                     │
│ 📁 分类  │  主题： [亮色] [暗色] [跟随系统]     │
│ 🔍 搜索  │                                     │
│ 📊 监控  │  主色调：  [████] #3B82F6  🔄       │
│ 🎨 外观  │  页面背景：[████] #FAFAFA  🔄       │
│ ⚙️ 通用  │  卡片背景：[████] #FFFFFF  🔄       │
│          │  主文字：  [████] #1A1A1A  🔄       │
│ ───────  │  次文字：  [████] #666666  🔄       │
│ ← 返回   │  ...                                │
│   主页   │                                     │
│          │  [ 预览效果 ]    [ 恢复默认 ]        │
└──────────┴─────────────────────────────────────┘
```

---

## 7. 配置文件数据结构

> **排序规则**：分类和卡片均不使用 `sortOrder` 字段。**JSON 数组的元素顺序即为展示/排序顺序**，拖拽排序后直接按新顺序写回数组。
>
> **嵌套结构**：卡片直接嵌套在所属分类的 `cards` 数组内，无需 `categoryId` 关联。渲染时每个 `CategorySection` 直接遍历自己的 `cards` 数组，无需前端 filter，性能更优且逻辑更直观。

### 7.1 `data/services.json`

```jsonc
{
  "categories": [
    {
      "id": "cat_nas",
      "name": "NAS 管理",
      "icon": "hard-drive",           // Lucide 图标名
      "color": "#3B82F6",             // 分类标签色 #RRGGBB
      "cards": [                      // 卡片直接嵌套，数组顺序 = 展示顺序
        {
          "id": "svc_dsm",
          "type": "service",          // "service" | "text"

          // --- service 类型专有字段 ---
          "name": "群晖 DSM",
          "url": "https://192.168.1.100:5001",
          "description": "NAS 管理面板",
          "iconSource": "favicon",    // "favicon" | "lucide" | "custom" | "initial"
          "iconValue": null,          // favicon/initial 时 null；lucide 时填图标名；custom 时填相对路径
          "enableStatusCheck": true,  // null = 继承全局设置，true/false = 单独覆盖
          "openInNewTab": true
        },
        {
          "id": "svc_omv",
          "type": "service",
          "name": "OpenMediaVault",
          "url": "http://192.168.1.101:80",
          "description": "NAS 备用节点",
          "iconSource": "favicon",
          "iconValue": null,
          "enableStatusCheck": null,
          "openInNewTab": true
        },
        {
          "id": "txt_announce",
          "type": "text",
          "title": "家庭公告",
          "content": "## 通知\n\nDSM 将于本周六维护，届时文件服务暂停。\n\n- 时间：周六 02:00-06:00\n- 影响：文件访问、Photo Station",
          "icon": "megaphone"         // 文本框卡片可选图标（Lucide 名）
        }
      ]
    },
    {
      "id": "cat_media",
      "name": "媒体服务",
      "icon": "play-circle",
      "color": "#F59E0B",
      "cards": [
        {
          "id": "svc_plex",
          "type": "service",
          "name": "Plex",
          "url": "http://192.168.1.100:32400",
          "description": "媒体服务器",
          "iconSource": "lucide",
          "iconValue": "play",
          "enableStatusCheck": null,
          "openInNewTab": true
        }
      ]
    }
    // ...更多分类（数组顺序 = 展示顺序，拖拽排序直接调整数组）
  ]
}
```

#### 7.1.1 字段说明

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| `categories[].id` | string | ✅ | — | 唯一标识，建议 `cat_` 前缀 |
| `categories[].name` | string | ✅ | — | 分类显示名称 |
| `categories[].icon` | string | ✅ | — | Lucide 图标名 |
| `categories[].color` | string | ✅ | — | 标签色 `#RRGGBB` |
| `categories[].cards` | array | ✅ | [] | 该分类下的卡片列表，数组顺序 = 展示顺序 |
| `cards[].id` | string | ✅ | — | 唯一标识，建议 `svc_`/`txt_` 前缀 |
| `cards[].type` | enum | ✅ | — | `"service"` 或 `"text"` |
| `cards[].name` | string | type=service | — | 服务卡片标题 |
| `cards[].url` | string | type=service | — | 服务链接 |
| `cards[].description` | string | ❌ | "" | 一行简述（超出截断） |
| `cards[].iconSource` | string | ❌ | "favicon" | `"favicon"` / `"lucide"` / `"custom"` / `"initial"` |
| `cards[].iconValue` | string\|null | ❌ | null | favicon/initial 时 null；lucide 时填图标名；custom 时填相对路径 |
| `cards[].enableStatusCheck` | boolean\|null | ❌ | null | null=跟随全局；true/false=覆盖 |
| `cards[].openInNewTab` | boolean | ❌ | true | 是否新标签页打开 |
| `cards[].title` | string | type=text | "" | 文本框标题 |
| `cards[].content` | string | type=text | "" | Markdown 内容 |
| `cards[].icon` | string | type=text ❌ | "" | 文本框卡片可选图标（Lucide 名） |

#### 7.1.2 ID 生成规则

- 分类：`cat_` + 小写英文短名，如 `cat_nas`
- 服务卡片：`svc_` + 小写英文短名，如 `svc_dsm`
- 文本框卡片：`txt_` + 小写英文短名，如 `txt_announce`
- 后端自动生成或管理页手动指定

### 7.2 `data/settings.json`

```jsonc
{
  "settings": {
    // --- 页面基础 ---
    "pageTitle": "家庭服务导航",
    "showClock": true,

    // --- 搜索引擎 ---
    "showSearchBar": true,
    "enableLocalFilter": true,         // 内网过滤模式（搜索框中的"🔍 内网"选项）
    "searchEngines": [
      {
        "id": "engine_google",
        "name": "Google",
        "urlTemplate": "https://www.google.com/search?q={query}",
        "enabled": true,
        "isDefault": true
      },
      {
        "id": "engine_baidu",
        "name": "百度",
        "urlTemplate": "https://www.baidu.com/s?wd={query}",
        "enabled": true,
        "isDefault": false
      },
      {
        "id": "engine_bing",
        "name": "Bing",
        "urlTemplate": "https://www.bing.com/search?q={query}",
        "enabled": false,
        "isDefault": false
      },
      {
        "id": "engine_ddg",
        "name": "DuckDuckGo",
        "urlTemplate": "https://duckduckgo.com/?q={query}",
        "enabled": false,
        "isDefault": false
      }
    ],

    // --- 状态监控 ---
    "enableStatusMonitor": false,
    "statusCheckInterval": 60,        // 秒
    "statusCheckTimeout": 5,          // 秒

    // --- PVE 节点概览 ---
    "enablePveOverview": false,
    "pveApiUrl": "",                   // 如 "https://192.168.1.10:8006/api2/json"
    "pveNodeName": "",                 // 如 "pve"
    "pveApiToken": ""                  // ⚠️ GET 请求时脱敏返回 "********"，仅 PUT 写入时接受明文

    // --- 主题 ---
    "theme": "system",                // "light" | "dark" | "system"
    "colors": {
      "light": {
        "background": "#FAFAFA",
        "card": "#FFFFFF",
        "cardBorder": "#E5E7EB",
        "textPrimary": "#1A1A1A",
        "textSecondary": "#666666",
        "accent": "#3B82F6",
        "searchBg": "#FFFFFF",
        "searchBorder": "#D1D5DB",
        "categoryTitle": "#1A1A1A",
        "statusOnline": "#22C55E",
        "statusOffline": "#EF4444"
      },
      "dark": {
        "background": "#0F0F0F",
        "card": "#1E1E1E",
        "cardBorder": "#333333",
        "textPrimary": "#E5E5E5",
        "textSecondary": "#999999",
        "accent": "#3B82F6",
        "searchBg": "#252525",
        "searchBorder": "#404040",
        "categoryTitle": "#E5E5E5",
        "statusOnline": "#22C55E",
        "statusOffline": "#EF4444"
      }
    }
  }
}
```

---

## 8. API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/config` | 获取全量配置（分类 + 卡片 + 设置）；敏感字段（`pveApiToken`）脱敏为 `********` |
| PUT | `/api/config` | 保存全量配置；`pveApiToken` 为 `********` 时保留原值不覆盖，非 `********` 时更新 |
| PUT | `/api/config/categories` | 仅更新分类（拖拽排序后局部保存） |
| PUT | `/api/config/services` | 仅更新卡片（拖拽排序后局部保存） |
| PUT | `/api/config/settings` | 仅更新设置 |
| GET | `/api/status` | 获取所有服务的当前状态（状态监控开启时） |
| GET | `/api/favicon?url=xxx` | 代理抓取 favicon，返回缓存或实时抓取结果 |
| POST | `/api/icon/upload` | 上传自定义图标（multipart/form-data，存入 data/favicons/） |
| GET | `/api/pve/status` | 代理获取 PVE 节点状态（CPU/内存/uptime） |

> 设计原则：提供全量 + 局部两种粒度，拖拽排序等高频操作用局部更新，管理页整体保存用全量更新。

---

## 9. 部署方案

### 9.1 目标环境

| 项目 | 要求 | 已具备 | 说明 |
|------|------|--------|------|
| **运行平台** | PVE LXC 容器 | ✅ | 轻量级，资源占用低 |
| **Node.js** | 20+ LTS | ✅ v24 | 后端运行时 + 前端构建 |
| **Nginx** | 任意稳定版 | ✅ | 反向代理 + HTTPS 终端 |
| **可用端口** | 1 个（默认 3000） | 需确认 | 后端监听端口，不与已有服务冲突即可 |
| **磁盘空间** | ≥ 200MB 空余 | — | 构建产物 + favicon 缓存 |
| **内存** | ≥ 128MB 空余 | — | Fastify 空载 ~50MB，带状态检测峰值 ~100MB |

**零额外依赖**：无需 Docker、无需数据库、无需 Redis、无需额外语言运行时。

**可选**：
- **Authelia**：仅在外网暴露场景需要，内网不需要
- **systemd**：推荐用于守护进程自动重启，否则 `nohup` / `screen` 也可

### 9.2 安装与启动

```bash
# 1. 克隆项目
git clone <repo> /opt/web-homepage
cd /opt/web-homepage

# 2. 安装依赖 + 构建
npm install
npm run build

# 3. 运行（生产模式）
NODE_ENV=production PORT=3000 node dist/server/index.js
```

### 9.3 systemd 守护（推荐）

```ini
[Unit]
Description=Family Homepage
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/web-homepage
ExecStart=/usr/bin/node dist/server/index.js
Environment=NODE_ENV=production
Environment=PORT=3000
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo cp web-homepage.service /etc/systemd/system/
sudo systemctl enable --now web-homepage
```

### 9.4 Nginx 反代配置

内网访问（无鉴权）：

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

外网访问（配合 Authelia 鉴权，本项目不实现认证）：

```nginx
server {
    listen 443 ssl;
    server_name home.example.com;

    location / {
        # Authelia 鉴权（本项目不实现，由反代层处理）
        include /etc/nginx/snippets/authelia.conf;

        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 10. 里程碑

| 阶段 | 内容 | 交付物 |
|------|------|--------|
| **M1 - 项目骨架** | Vite + React + Tailwind + React Router 搭建；主页静态布局（宫格卡片 + 分类 + 搜索框 + 时钟 + 主题切换） | 可运行的主页骨架 |
| **M2 - 后端 API** | Fastify 服务；JSON 配置读写；配置文件初始化 | 前后端联调通过 |
| **M3 - 管理页** | 管理页布局；服务/分类 CRUD；拖拽排序；搜索引擎设置 | 管理页全功能可用 |
| **M4 - 外观定制** | 逐部件色盘调色 + 实时预览（配色 + 卡片编辑预览）；Markdown 文本框卡片；渐进式披露编辑表单 | 外观完全可定制 |
| **M5 - 状态监控** | 后端 HTTP 检测代理；前端状态轮询 + 指示灯；后台标签页暂停轮询优化 | 状态监控可用 |
| **M6 - Favicon + 自定义图标** | Favicon 代理抓取（UA 伪装）+ 本地缓存；自定义图标上传；图标优先级链 | 图标完整展示 |
| **M7 - PVE 节点概览** | PVE API 代理；资源条 UI；Token 配置 | PVE 状态展示 |
| **M8 - 打磨** | 移动端细节优化；FOUC 防闪；过渡动画；首屏加载 | 生产就绪 |

---

> **下一步**：确认本规格书后，进入 M1 开发。
