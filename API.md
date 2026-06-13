# NanshanNav API 参考

家庭网络导航面板后端 API 文档。后端 Hono.js 4，默认监听 `:3001`。
开发环境直接访问 `http://localhost:3001`，生产环境通过 nginx 以 `/api/*` 路径访问。

---

## 面板配置 API

面板的布局、组件、设置等配置通过此接口持久化。数据存储于 `server/config/dashboard-state.json`。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/dashboard` | 加载已保存配置（首次返回 404） |
| PUT | `/api/dashboard` | 保存配置 |

### GET /api/dashboard

```json
// 200 — 成功
{
  "settings": { "themeMode": "dark", "cellSize": 50 },
  "layouts": {
    "lg": [{ "i": "abc", "x": 0, "y": 0, "w": 3, "h": 2 }],
    "md": [], "sm": [], "xs": [], "xxs": []
  },
  "widgets": [{ "id": "abc", "type": "clock", "options": {} }],
  "updatedAt": "2026-06-13T10:00:00.000Z"
}
// 404 — 从未保存
{ "error": "No dashboard config yet" }
```

### PUT /api/dashboard

请求体须包含 `settings`（对象）、`layouts`（对象）、`widgets`（数组），缺少任一返回 400。

```json
// Request
{ "settings": { "themeMode": "dark" },
  "layouts": { "lg": [{"i":"abc","x":0,"y":0,"w":3,"h":2}] },
  "widgets": [{ "id": "abc", "type": "clock", "options": {} }] }
// 200
{ "success": true, "updatedAt": "2026-06-13T10:00:00.000Z" }
// 400
{ "error": "Invalid payload: settings, layouts, widgets required" }
```

服务端自动追加 `updatedAt` 时间戳，以原子方式写入（临时文件 + rename）。

---

## 上传 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/upload` | 上传图片（字段 `image`，`multipart/form-data`） |

### POST /api/upload

- 最大大小: **20MB**
- 允许类型: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`, `image/bmp`
- 验证: MIME 类型白名单 + 魔术字节（Magic Bytes）双重校验

| 类型 | 魔术字节 |
|------|---------|
| JPEG | `FF D8 FF` |
| PNG | `89 50 4E 47` |
| GIF | `47 49 46` |
| WebP | `52 49 46 46` |

SVG 和 BMP 无可信固定签名，仅校验 MIME 类型。

```json
// 200
{ "url": "/uploads/<uuid>.<ext>" }
// 400 — 未上传
{ "error": "No file uploaded. Use field name \"image\"." }
// 415 — 类型不支持 / 魔术字节不匹配
{ "error": "Invalid file type: ..." }
{ "error": "File content does not match its MIME type." }
// 413 — 超过限制
{ "error": "File too large. Max: 20 MB. Received: 25.00 MB" }
```

---

## PVE 代理 API

挂载 `/api/pve/*`，提供 Proxmox VE API 代理转发与令牌管理。

**环境变量**: `PVE_API_TOKEN`（非 `VITE_PVE_API_TOKEN`，旧版 README 有误）

**令牌加密**: AES-256-GCM（32 字节密钥，16 字节 IV）。密钥来源: `PVE_ENCRYPTION_KEY` > `server/config/.pve-key`（首次自动生成，`0o600`）。写入采用原子方式（`.tmp` + `rename`）。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/pve/tokens?host=` | 查询令牌状态（返回掩码后信息） |
| PUT | `/api/pve/tokens` | 保存令牌（自动加密存储） |
| DELETE | `/api/pve/tokens?host=` | 删除指定主机令牌 |
| ALL | `/api/pve/*` | 代理转发到 Proxmox VE API |

**GET /api/pve/tokens**: 参数 `host` 或 `X-PVE-Host` 请求头。掩码规则: 前 5 + `****` + 后 4。

```json
{ "hasToken": true, "masked": "monit****xyz", "source": "host" }
{ "hasToken": false }
```

**PUT /api/pve/tokens**: `host` 为 `"default"` 或省略时保存为默认令牌。

```json
// Request & 200
{ "host": "pve.lan:8006", "token": "monitor@pve!dashboard=secret" }
{ "masked": "monit****cret" }
```

**DELETE /api/pve/tokens**: 必须指定 `host`，删除不存在的 host 也返回成功。

```json
{ "success": true }
```

**ALL /api/pve/***: 映射 `/api/pve/<path>` 到 `https://{host}/api2/json/<path>`。

- 目标主机: `X-PVE-Host` 请求头（默认 `pve.lan:8006`）
- 认证: `Authorization: PVEAPIToken=<token>`
- 令牌查找: 主机专用 > `default` > `PVE_API_TOKEN` 环境变量
- 超时: **30 秒**（AbortController）
- 响应: JSON 原样透传，非 JSON 截取 500 字符以 `{ raw }` 包裹

```json
// 502 — 无令牌
{ "error": "No PVE API token configured" }
// 504 — 超时
{ "error": "Request to PVE timed out" }
// 502 — 连接失败 / 认证失败
{ "error": "Bad Gateway", "detail": "Cannot reach PVE host" }
```

---

## Favicon 代理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/favicon?url=` | 代理获取网站 favicon |

### 4 层回退链

远比简单的 HTTPS→HTTP 复杂:

| 层级 | 策略 | 超时 |
|------|------|------|
| 1 | `https://{host}/favicon.ico` | 5s |
| 2 | `http://{host}/favicon.ico` | 5s |
| 3 | 依次尝试 8 个常见路径: `/favicon.png`, `/favicon.svg`, `/static/favicon.ico`, `/static/icons/favicon.ico`, `/icons/favicon.ico`, `/assets/favicon.ico`, `/assets/favicon.png` | 各 3s |
| 4 | 抓取首页 HTML，正则解析 `<link rel="icon">` href（兼容 `rel` 在前和 `href` 在前两种顺序），提取绝对 URL 后获取 | 5s |

全部失败返回 404。

### 服务端缓存

| 项目 | 说明 |
|------|------|
| 目录 | `uploads/favicons/` |
| 文件 | `<hostname的MD5哈希>.ico` + `<md5>.meta.json`（contentType） |
| 有效期 | **7 天**（基于文件 mtime） |
| HTTP 缓存 | `Cache-Control: public, max-age=86400`（1 天） |

```json
// 404
{ "error": "Favicon not found" }
// 502
{ "error": "Failed to fetch favicon" }
```

---

## 链接健康检查 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health-check?url=` | 检测目标 URL 可达性 |

服务端代理发起请求，避免浏览器跨域限制。

- 优先 **HEAD**（超时 5 秒），收到 **405** 自动回退 **GET**
- 仅允许 `http:` / `https:` 协议

```json
// 200 — 可达
{ "reachable": true, "statusCode": 200 }
// 200 — 不可达
{ "reachable": false, "error": "fetch failed" }
// 400 — 参数缺失 / URL 格式错误
{ "error": "Missing url" }
```

---

## 静态文件

| 路径 | 说明 |
|------|------|
| `/uploads/*` | 上传图片文件（Hono `serveStatic`，根 `uploads/`） |

### SPA 静态路由（后端直接部署时）

后端直接部署（无 nginx）时托管前端构建产物。生产环境建议 nginx 托管静态文件，后端仅处理 `/api/*`。

| 路径 | 说明 | 缓存策略 |
|------|------|----------|
| `/favicon.svg` | SPA 站点图标 | 默认 |
| `/assets/*` | 构建产物（文件名含内容哈希） | `max-age=31536000, immutable` |
| `/*` | SPA 回退（`dist/index.html`） | `no-cache, no-store, must-revalidate` |

`/assets/*` 可永久缓存。`index.html` 禁用缓存，确保加载最新资源引用并支持客户端路由（如 `/admin`）的正确回退。
