# NanshanNav 组件生态文档

> 本文档基于 `src/types/widget.ts`、`src/registry/index.ts`、`src/registry/definitions/*` 和 `src/registry/loaders.ts` 中的实际代码生成。所有声明均可溯源。

---

## 组件注册表（Widget Registry）

NanshanNav 采用组件注册表模式管理所有仪表盘组件。8 个内置组件统一在 `src/registry/` 下注册，通过动态导入按需加载，不占用首屏体积。

组件注册表的核心数据结构定义在 `src/types/widget.ts` 中：

```typescript
export interface WidgetDefinition<TKind extends WidgetType = WidgetType> {
  kind: TKind;
  displayName: string;
  displayKey?: string;
  icon: string;
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };
  defaultOptions: Record<string, unknown>;
  componentLoader: () => Promise<{ default: ComponentType<WidgetComponentProps> }>;
  settingsLoader?: () => Promise<{ default: ComponentType<WidgetSettingsProps> }>;
  requiresServerData: boolean;
}
```

| 字段 | 说明 |
|---|---|
| `kind` | 组件类型标识，与 `WidgetType` 联动 |
| `displayName` | 显示名称，组件库中展示（无翻译时回退） |
| `displayKey` | i18n 翻译键，优先级高于 `displayName` |
| `icon` | Lucide 图标名称（PascalCase） |
| `defaultSize` | 默认网格尺寸 `{w, h}`，单位是网格单元格 |
| `minSize` | 最小网格尺寸，拖拽缩小时不可小于此值 |
| `defaultOptions` | 新建组件时的默认配置项 |
| `componentLoader` | 动态导入组件主体（`() => import(...)`） |
| `settingsLoader` | 动态导入配置面板（可选） |
| `requiresServerData` | 是否需要通过 TanStack Query 请求服务端数据 |

### 注册表 API

`src/registry/loaders.ts` 导出 6 个工具函数，供运行时按组件类型获取注册信息：

| 函数 | 返回类型 | 说明 |
|---|---|---|
| `loadWidgetComponent(type)` | `Promise<{default: ComponentType}>` | 动态加载组件主体 |
| `loadWidgetSettings(type)` | `Promise<{default: ComponentType}> \| null` | 动态加载设置面板，不存在则返回 null |
| `getWidgetDisplayName(type)` | `string` | 获取组件显示名称 |
| `getWidgetDisplayKey(type)` | `string \| undefined` | 获取 i18n 翻译键 |
| `getWidgetDefaultSize(type)` | `{w, h}` | 获取默认尺寸 |
| `getWidgetMinSize(type)` | `{w, h} \| undefined` | 获取最小尺寸 |

`src/registry/index.ts` 还导出 3 个注册表查询函数：

| 函数 | 说明 |
|---|---|
| `getWidgetDefinition(type)` | 获取单个组件定义 |
| `getAllWidgetDefinitions()` | 获取所有组件定义列表 |
| `getWidgetDefinitionsByGroup()` | 按分组获取组件类型列表 |

---

## 组件分组

组件按用途分为 5 组，定义在 `getWidgetDefinitionsByGroup()` 中：

| 分组 | 包含组件 | 用途 |
|---|---|---|
| `content` | `title-header`, `markdown-text` | 内容展示类 |
| `navigation` | `web-link`, `web-page`, `search-box` | 导航与搜索类 |
| `media` | `image` | 多媒体类 |
| `system` | `pve-status` | 系统监控类 |
| `utilities` | `clock` | 工具类 |

---

## 组件详情

### 时钟（clock）

| 属性 | 值 |
|---|---|
| `displayName` | 时钟 |
| `icon` | Clock |
| `defaultSize` | 4 x 4 |
| `minSize` | 2 x 2 |
| `requiresServerData` | false |

| 选项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `displayMode` | `'analog' \| 'digital'` | `'digital'` | 显示模式：模拟钟表或数字时钟 |
| `timezone` | `string` | `'Asia/Shanghai'` | IANA 时区标识 |
| `showSeconds` | `boolean` | `true` | 是否显示秒数（数字模式） |
| `showDate` | `boolean` | `true` | 是否显示日期 |
| `dateFormat` | `string` | `'YYYY-MM-DD dddd'` | 日期格式模板 |
| `is24Hour` | `boolean` | `true` | 24 小时制（数字模式） |

模拟钟表模式下时分秒指针由 SVG 绘制，支持 CSS 动画过渡。`timezone` 支持任意 IANA 时区（如 `America/New_York`、`Europe/London`），与 `Intl.DateTimeFormat` 配合使用。

---

### 标题（title-header）

| 属性 | 值 |
|---|---|
| `displayName` | 标题 |
| `icon` | Heading |
| `defaultSize` | 4 x 2 |
| `minSize` | 2 x 1 |
| `requiresServerData` | false |

| 选项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `headingLevel` | `'h1' \| 'h2' \| 'h3' \| 'h4'` | `'h2'` | HTML 标题等级 |
| `textAlign` | `'left' \| 'center' \| 'right'` | `'center'` | 文字对齐方式 |
| `showDivider` | `boolean` | `true` | 是否显示标题下方分割线 |
| `iconName` | `string` | `''` | Lucide 图标名称（PascalCase），空字符串表示无图标 |

`iconName` 填入 Lucide 图标名（如 `Home`、`BookOpen`），组件内部使用 `lucide-react` 动态渲染图标 SVG。设置为空字符串时不渲染图标。

---

### Markdown 文本（markdown-text）

| 属性 | 值 |
|---|---|
| `displayName` | Markdown |
| `icon` | FileText |
| `defaultSize` | 4 x 4 |
| `minSize` | 2 x 2 |
| `requiresServerData` | false |

| 选项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `content` | `string` | `'# Hello World\n\nWrite your markdown here.'` | Markdown 原文 |

使用 `react-markdown` + `remark-gfm` 渲染，支持 GitHub Flavored Markdown 语法：表格、删除线、任务列表、URL 自动链接、脚注等。不依赖服务端，所有渲染在前端完成。

---

### 链接集合（web-link）

| 属性 | 值 |
|---|---|
| `displayName` | 链接 |
| `icon` | Link |
| `defaultSize` | 4 x 4 |
| `minSize` | 2 x 2 |
| `requiresServerData` | true |

每个链接的数据结构 `LinkItem`：

```typescript
export interface LinkItem {
  id: string;
  name: string;
  url: string;
  icon: string;
  description: string;
  iconSource?: IconSource;   // 'favicon' | 'lucide' | 'custom' | 'initial'
  iconValue?: string | null;
}
```

图标来源 `IconSource` 支持 4 种：

| 来源 | 说明 |
|---|---|
| `favicon` | 自动抓取目标网站的 favicon（通过后端代理缓存） |
| `lucide` | 使用 Lucide 图标，`iconValue` 填写图标名称 |
| `custom` | 自定义上传的图标图片 |
| `initial` | 取链接名称首字母作为文字图标 |

| 选项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `links` | `LinkItem[]` | `[]` | 链接列表 |
| `openInNewTab` | `boolean` | `true` | 点击是否在新标签页打开 |
| `healthCheckEnabled` | `boolean` | `true` | 是否启用链接健康检查 |
| `healthCheckInterval` | `number` | `60` | 健康检查轮询间隔（秒） |
| `showName` | `boolean` | `true` | 是否显示链接名称 |
| `showUrl` | `boolean` | `true` | 是否显示链接 URL |
| `showDescription` | `boolean` | `true` | 是否显示描述文字 |

健康检查通过后端 `/api/health-check` 接口代理检测，避免跨域问题。每个链接状态（可达/不可达）以绿色/红色圆点标识。`requiresServerData: true` 表示需要 TanStack Query 管理健康检查请求。

---

### 网页嵌入（web-page）

| 属性 | 值 |
|---|---|
| `displayName` | 网页 |
| `icon` | Globe |
| `defaultSize` | 4 x 4 |
| `minSize` | 1 x 1 |
| `requiresServerData` | false |

| 选项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `url` | `string` | `''` | 嵌入页面的 URL |

通过 `<iframe>` 嵌入外部网页。`minSize` 为 `1 x 1`，是最小尺寸限制最小的组件之一（与 image 并列）。适合将路由器管理页面、NAS 界面、Grafana 面板等集成到仪表盘中。

---

### PVE 状态监控（pve-status）

| 属性 | 值 |
|---|---|
| `displayName` | PVE 状态 |
| `icon` | Server |
| `defaultSize` | 4 x 5 |
| `minSize` | 3 x 3 |
| `requiresServerData` | true |

| 选项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `proxmoxHost` | `string` | `''` | PVE 主机地址，格式 `host:port`，如 `pve.lan:8006` |
| `nodeName` | `string` | `'pve'` | Proxmox 节点名称 |
| `showCpu` | `boolean` | `true` | 显示 CPU 使用率 |
| `showMemory` | `boolean` | `true` | 显示内存使用率 |
| `showUptime` | `boolean` | `true` | 显示运行时间 |
| `showStorage` | `boolean` | `true` | 显示存储使用量 |
| `showVmCounts` | `boolean` | `true` | 显示 VM/LXC 运行/停止数量 |
| `showTitleLink` | `boolean` | `true` | 标题是否可点击跳转到 PVE Web 界面 |
| `refreshInterval` | `number` | `15` | 自动刷新间隔（秒） |

数据通过后端代理转发 `/api/pve/*`，PVE API 令牌使用 AES-256-GCM 加密存储在服务端。`refreshInterval` 控制 TanStack Query 的 `refetchInterval` 参数。`requiresServerData: true` 意味着组件依赖 TanStack Query 从服务端拉取实时数据。

---

### 搜索框（search-box）

| 属性 | 值 |
|---|---|
| `displayName` | 搜索 |
| `icon` | Search |
| `defaultSize` | 4 x 2 |
| `minSize` | 2 x 1 |
| `requiresServerData` | false |

| 选项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `defaultEngine` | `'google' \| 'baidu' \| 'bing' \| 'duckduckgo' \| 'custom'` | `'google'` | 默认搜索引擎 |
| `customEngineUrl` | `string` | `''` | 自定义搜索引擎 URL，需包含 `{query}` 占位符 |
| `enableLocalSearch` | `boolean` | `true` | 是否启用本地搜索（页内组件标题和内容） |
| `placeholder` | `string` | `'搜索或按 Ctrl+K...'` | 输入框占位文字 |
| `ctrlKEnabled` | `boolean` | `true` | 是否启用 Ctrl+K 快捷键聚焦搜索框 |

`customEngineUrl` 格式示例：`https://search.example.com?q={query}`。本地搜索会遍历当前仪表盘所有组件的标题和部分文本内容进行模糊匹配。

---

### 图片（image）

| 属性 | 值 |
|---|---|
| `displayName` | 图片 |
| `icon` | Image |
| `defaultSize` | 4 x 4 |
| `minSize` | 1 x 1 |
| `requiresServerData` | false |

| 选项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `sourceType` | `'url' \| 'upload'` | `'url'` | 图片来源：远程 URL 或本地上传 |
| `url` | `string` | `''` | 图片 URL（`sourceType=url` 时使用） |
| `alt` | `string` | `''` | 图片替代文本 |
| `scaleMode` | `'contain' \| 'cover' \| 'fill' \| 'original'` | `'contain'` | 缩放模式 |
| `alignX` | `'left' \| 'center' \| 'right'` | `'center'` | 水平对齐 |
| `alignY` | `'top' \| 'center' \| 'bottom'` | `'center'` | 垂直对齐 |
| `caption` | `string` | `''` | 图片说明文字 |
| `borderRadius` | `number` | `8` | 圆角半径（像素） |
| `showShadow` | `boolean` | `false` | 是否显示阴影 |
| `onClick` | `'none' \| 'preview' \| 'link'` | `'none'` | 点击行为 |
| `linkUrl` | `string` | `''` | 跳转链接（`onClick=link` 时使用） |
| `openInNewTab` | `boolean` | `true` | 跳转是否在新标签页打开 |

缩放模式说明：

| 模式 | 行为 |
|---|---|
| `contain` | 保持宽高比，完整显示图片（可能留白） |
| `cover` | 保持宽高比，填充整个容器（可能裁剪） |
| `fill` | 拉伸至填满容器，不保持宽高比 |
| `original` | 按图片原始尺寸显示，超出部分滚动 |

上传的图片通过后端 `/api/upload` 接口存储，支持 JPEG/PNG/GIF/WebP/SVG/BMP 格式，最大 20MB。

---

## 添加新组件

以下步骤对应实际代码路径，每一步都涉及具体的注册流程：

### 1. 定义组件配置类型

在 `src/types/widget.ts` 中创建组件特有选项的类型接口，继承或独立于组件系统类型体系。例如：

```typescript
export interface MyWidgetOptions {
  title: string;
  theme: 'light' | 'dark';
}
```

### 2. 注册组件类型标识

在 `WIDGET_TYPES` 数组（`src/types/widget.ts` 第 5-14 行）中添加新类型字符串。这一步确保 TypeScript 类型系统能识别新组件。

### 3. 创建组件定义文件

在 `src/registry/definitions/` 下新建文件，导出符合 `WidgetDefinition` 接口的定义对象。需指定 `kind`、`displayName`、`icon`、`defaultSize`、`minSize`、`defaultOptions`、`componentLoader`、`settingsLoader` 和 `requiresServerData`。

### 4. 实现组件界面

在 `src/components/widgets/` 下创建组件目录，导出实现 `WidgetComponentProps` 接口的 React 组件。目录名与 `componentLoader` 中的导入路径一致。

### 5. 实现设置面板（可选）

在同一目录下创建 `Settings` 子组件，导出实现 `WidgetSettingsProps` 接口的 React 组件。若组件无需用户配置，可省略 `settingsLoader`。

### 6. 注册到注册表

在 `src/registry/index.ts` 中导入新定义，将其添加到 `registry` 对象中。这一步使 `getWidgetDefinition()` 和 `getAllWidgetDefinitions()` 能查询到新组件。

### 7. 添加到组件分组

在 `getWidgetDefinitionsByGroup()` 方法（`src/registry/index.ts` 第 30-37 行）中，将新组件类型加入合适的分组，使其在组件选择面板中出现在正确分类下。

### 8. 添加翻译文本

在 `src/i18n/locales/zh-CN.ts` 和 `en.ts` 中，为 `registry.widget.<camelCaseName>` 键添加翻译值。如果同时设置了 `displayName` 和 `displayKey`，`displayKey` 优先。

---

## 架构说明

### 动态加载机制

所有组件通过 `componentLoader: () => import(...)` 动态导入，Vite 自动将其拆分为独立 chunk。组件主体和设置面板分别加载，设置面板仅在进入编辑模式时按需加载。首屏仅渲染已放置的组件，未使用的组件代码不会被加载。

### 数据依赖

`requiresServerData` 标识组件是否需要服务端数据。设为 `true` 的组件（如 web-link 的健康检查、pve-status 的实时监控）通过 TanStack React Query 管理数据获取、缓存和自动刷新。设为 `false` 的组件完全在浏览器端运行，不产生网络请求。

### 组件尺寸体系

`defaultSize` 和 `minSize` 的单位是网格单元格。仪表盘布局使用 `react-grid-layout`，网格列数随断点变化：lg 12 列、md 10 列、sm 6 列、xs 4 列、xxs 2 列。组件的 `w` 值在这些列数范围内自动适配。
