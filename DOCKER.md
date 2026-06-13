# NanshanNav Docker 部署指南

使用 Docker Compose 一键部署 NanshanNav 完整服务栈，包含 Nginx 反向代理、Node.js 后端和 Authelia 认证服务。

---

## 前置要求

- Docker ≥ 24.x
- Docker Compose ≥ v2.x
- 确保主机 `8080` 和 `8443` 端口可用（或通过环境变量修改）

---

## 快速开始

从项目根目录执行以下步骤：

```bash
# 1. 准备环境变量
cp deploy/docker/.env.example .env

# 2. 编辑 .env 文件，填入以下必填项：
#    PVE_ENCRYPTION_KEY  生成: openssl rand -hex 32
#    JWT_SECRET          生成: openssl rand -hex 32
#    SESSION_SECRET      生成: openssl rand -hex 32
#    AUTHELIA_PASSWORD   bcrypt 哈希（见步骤 3）

# 3. 生成 Authelia 密码哈希（替换 'your-password' 为实际密码）
docker run --rm ghcr.io/authelia/authelia:4.38 authelia hash-password 'your-password'

# 4. 将输出的哈希值填入 .env 的 AUTHELIA_PASSWORD 字段
#    然后切换到 deploy/docker/ 目录启动所有服务
cd deploy/docker && docker compose up -d

# 首次构建需下载依赖和编译前端，约 1-3 分钟
```

### 访问地址

| 地址 | 说明 |
|------|------|
| `http://localhost:8080` | 仪表盘主页（公开访问） |
| `http://localhost:8080/admin` | 编辑模式（需 Authelia 登录） |
| `https://localhost:8443` | HTTPS 入口（需自行配置 TLS 证书） |

---

## 服务架构

```
┌────────────────────────────────────────────────────────────┐
│                     Nginx 反向代理                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  宿主机:8080 ──→ 容器:80 (HTTP)                     │   │
│  │  宿主机:8443 ──→ 容器:443 (HTTPS, 无 TLS 终止)      │   │
│  │                                                     │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  auth_request ──→ Authelia :9091/api/verify  │   │   │
│  │  │                                              │   │   │
│  │  │  受保护路径: /api/*  /admin                  │   │   │
│  │  │  公开路径:   /     /api/health-check         │   │   │
│  │  │                                              │   │   │
│  │  │  认证通过 ──→ 请求转发至 Backend :3001       │   │   │
│  │  │  认证失败 ──→ 302 重定向至 Authelia 登录页   │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────┬──────────────────┬────────────────────┘
                      │                  │
                      ▼                  ▼
┌────────────────────────────┐  ┌──────────────────────────┐
│   Backend :3001            │  │  Authelia :9091           │
│                            │  │                          │
│  /api/*          受保护    │  │  /api/verify    认证端点 │
│  /admin          受保护    │  │  文件认证 (users.yml)    │
│  /api/health-check 公开    │  │  SQLite 数据库 (/db)     │
│  / (SPA 静态文件) 公开     │  │  会话: 内存存储(默认)    │
│                            │  │  环境变量注入密码哈希    │
│  数据卷:                   │  └──────┬───────────────────┘
│  nanshan-nav-config        │         │（可选）
│  nanshan-nav-uploads       │         ▼
└────────────────────────────┘  ┌──────────────┐
                                │  Redis :6379  │
                                └──────────────┘
```

> **Redis 为可选服务**：默认使用 Authelia 内存会话（轻量无依赖）。如需持久化会话（重启不丢登录），见下方"启用 Redis"说明。

### 请求流程

1. 用户访问 `http://localhost:8080/` → Nginx 直接代理到 Backend，返回 SPA
2. 用户访问 `http://localhost:8080/admin` → Nginx 触发 `auth_request` 到 Authelia :9091
3. Authelia 验证会话（内存中查询）→ 未登录则重定向到 Authelia 登录页
4. 登录成功后 Authelia 设置会话 Cookie，后续请求自动通过验证
5. 请求到达 Backend，返回管理页面

HTTPS 端口（8443）已映射但容器内 Nginx **未配置 TLS 终止**。如需 HTTPS，请在外部反向代理（Traefik、Caddy、Cloudflare Tunnel 等）中处理，或在 Nginx 中自行添加 SSL 证书。

---

## 服务说明

### backend

| 属性 | 值 |
|------|-----|
| 构建方式 | `deploy/docker/Dockerfile` 多阶段构建 |
| 基础镜像 | `node:22-alpine` |
| 容器端口 | `3001` |
| 重启策略 | `unless-stopped` |
| 健康检查 | `wget --spider http://localhost:3001/api/health-check?url=https://example.com` |
| 数据卷 | `nanshan-nav-config` → `/app/server/config` |
| | `nanshan-nav-uploads` → `/app/uploads` |

多阶段构建过程：
- **builder 阶段**: 安装全部 npm 依赖，用 Vite 编译前端 TypeScript 源码到 `dist/`
- **runtime 阶段**: 仅安装生产依赖，拷贝前端构建产物和后端源码，用 `tsx` 运行 Hono.js

### nginx

| 属性 | 值 |
|------|-----|
| 镜像 | `nginx:alpine` |
| 端口映射 | `8080:80`（HTTP），`8443:443`（HTTPS） |
| 依赖 | backend（等待健康检查通过），authelia（等待启动） |
| 配置挂载 | `nginx/nginx.conf` → `/etc/nginx/nginx.conf`（只读） |
| | `nginx/conf.d/` → `/etc/nginx/conf.d/`（只读） |

通过 `auth_request` 指令集成 Authelia。受保护路径的每个请求都会先向 Authelia 发送子请求验证身份，通过后才转发到后端。

### authelia

| 属性 | 值 |
|------|-----|
| 镜像 | `ghcr.io/authelia/authelia:4.38` |
| 容器端口 | `9091` |
| 重启策略 | `unless-stopped` |
| 配置挂载 | `authelia/config/` → `/config/`（只读） |
| 数据卷 | `authelia-db` → `/db`（SQLite） |
| 会话存储 | 内存（Authelia 内置，无需额外服务） |

环境变量注入配置：
- `JWT_SECRET`: 签名认证令牌
- `SESSION_SECRET`: 加密会话数据
- `AUTHELIA_USER` / `AUTHELIA_PASSWORD`: 文件认证的用户名和 bcrypt 密码哈希

### redis（可选）

| 属性 | 值 |
|------|-----|
| 镜像 | `redis:7-alpine` |
| 容器端口 | `6379` |
| 数据卷 | `redis-data` → `/data` |
| 用途 | Authelia 会话缓存（可选） |

默认 Authelia 使用**内存会话**，零额外依赖。如需重启不丢登录，启用 Redis：

1. **编辑 `deploy/docker/docker-compose.yml`**：取消注释 `redis` 服务块、authelia 下的 `depends_on: - redis`、以及 `redis-data` 卷
2. **编辑 `deploy/authelia/config/configuration.yml`**：取消注释 `session.redis` 块（`host: redis / port: 6379`）
3. **重启**：`docker compose up -d`

启用后 Authelia 的会话数据持久化在 Redis 中，重启 Authelia 容器不会导致已登录用户被踢出。

---

## 环境变量

全部变量定义在 `deploy/docker/.env.example` 中。复制为 `.env` 后按需修改：

| 变量 | 默认值 | 必填 | 说明 |
|------|--------|------|------|
| `PORT` | `3001` | 否 | 后端容器内部监听端口 |
| `UPLOAD_DIR` | `/app/uploads` | 否 | 上传文件在容器内的存储路径 |
| `PVE_API_TOKEN` | — | 否 | Proxmox VE API 令牌（可选） |
| `PVE_ENCRYPTION_KEY` | — | **是** | PVE 令牌加密密钥（32 字节 hex） |
| `JWT_SECRET` | — | **是** | Authelia JWT 签名密钥 |
| `SESSION_SECRET` | — | **是** | Authelia 会话加密密钥 |
| `AUTHELIA_USER` | `admin` | 否 | Authelia 管理员用户名 |
| `AUTHELIA_PASSWORD` | — | **是** | Authelia 密码（bcrypt 哈希值，非明文） |
| `NGINX_HTTP_PORT` | `8080` | 否 | Nginx HTTP 宿主机端口映射 |
| `NGINX_HTTPS_PORT` | `8443` | 否 | Nginx HTTPS 宿主机端口映射 |

### 密钥生成参考

```bash
# PVE_ENCRYPTION_KEY（32 字节 hex = 64 字符十六进制）
openssl rand -hex 32

# JWT_SECRET（32 字节 hex = 64 字符十六进制）
openssl rand -hex 32

# SESSION_SECRET（32 字节 hex = 64 字符十六进制）
openssl rand -hex 32

# AUTHELIA_PASSWORD（bcrypt 哈希）
docker run --rm ghcr.io/authelia/authelia:4.38 authelia hash-password 'your-password'
```

> **重要**: `PVE_ENCRYPTION_KEY` 一旦设置并存储了加密令牌后不可更改。丢失该密钥会导致所有已加密的 PVE 令牌永久无法恢复。
>
> `NGINX_HTTPS_PORT` 端口已映射但容器内 Nginx 未配置 TLS 终止。
> HTTPS 需要额外配置（如 Traefik、Caddy、Cloudflare Tunnel 或自行配置 SSL 证书）。

---

## 数据卷

所有持久化数据存储在 Docker 命名卷中（`docker volume ls` 可查看）：

| 卷名称 | 用途 | 容器内路径 | 数据说明 |
|--------|------|-----------|---------|
| `nanshan-nav-config` | 仪表盘配置、PVE 令牌、加密密钥 | `/app/server/config` | `dashboard-state.json`、`pve-tokens.json`、`.pve-key` |
| `nanshan-nav-uploads` | 上传的图片、Favicon 缓存 | `/app/uploads` | 用户上传文件、`favicons/` 目录 |
| `authelia-db` | Authelia 用户和设备数据库 | `/db` | SQLite 数据库文件 |
| `redis-data`（可选） | Redis 持久化数据 | `/data` | 启用 Redis 后自动创建 |

> 这些卷在 `docker compose down` 后仍保留。只有 `docker compose down -v` 会删除它们。

---

## 文件结构

```
deploy/
├── docker/
│   ├── Dockerfile               # 多阶段构建（builder + runtime）
│   ├── docker-compose.yml       # 服务编排（3 服务 + 可选 Redis + 3+1 卷 + 1 网络）
│   ├── .dockerignore            # 构建上下文排除规则
│   └── .env.example             # 环境变量模板
├── nginx/
│   ├── nginx.conf               # Nginx 主配置
│   ├── conf.d/
│   │   └── nav.conf             # NanshanNav 路由配置
│   └── nginx.conf.example       # Nginx 配置示例（供外部参考）
├── authelia/
│   └── config/
│       ├── configuration.yml    # Authelia 认证服务配置
│       └── users.yml            # 用户文件（文件认证）
├── scripts/
│   └── start.sh                 # 开发环境一键启动脚本
└── systemd/
    ├── nanshan-nav-backend.service.example
    └── nanshan-nav-frontend.service.example
```

---

## 备份与恢复

### 备份所有数据卷

```bash
BACKUP_DIR="/backup/nanshan-nav-$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

docker run --rm -v nanshan-nav-config:/data -v "$BACKUP_DIR":/backup alpine \
    tar czf /backup/config.tar.gz -C /data .
docker run --rm -v nanshan-nav-uploads:/data -v "$BACKUP_DIR":/backup alpine \
    tar czf /backup/uploads.tar.gz -C /data .
docker run --rm -v authelia-db:/data -v "$BACKUP_DIR":/backup alpine \
    tar czf /backup/authelia-db.tar.gz -C /data .
# 如启用 Redis，取消以下注释：
# docker run --rm -v redis-data:/data -v "$BACKUP_DIR":/backup alpine \
#     tar czf /backup/redis-data.tar.gz -C /data .

echo "备份完成，文件保存在 $BACKUP_DIR"
```

### 恢复数据卷

```bash
RESTORE_DIR="/backup/nanshan-nav-20260613"

docker run --rm -v nanshan-nav-config:/data -v "$RESTORE_DIR":/restore alpine \
    tar xzf /restore/config.tar.gz -C /data
docker run --rm -v nanshan-nav-uploads:/data -v "$RESTORE_DIR":/restore alpine \
    tar xzf /restore/uploads.tar.gz -C /data
docker run --rm -v authelia-db:/data -v "$RESTORE_DIR":/restore alpine \
    tar xzf /restore/authelia-db.tar.gz -C /data
# 如启用 Redis，取消以下注释：
# docker run --rm -v redis-data:/data -v "$RESTORE_DIR":/restore alpine \
#     tar xzf /restore/redis-data.tar.gz -C /data

echo "恢复完成"
```

### 从现有部署迁移

如果你已直接在宿主机上运行 NanshanNav，可将现有数据导入 Docker 卷：

```bash
# 1. 先启动服务一次以创建命名卷（然后立刻停止）
cd deploy/docker
docker compose up -d && docker compose down

# 2. 导入 config 数据
docker run --rm -v nanshan-nav-config:/data \
    -v /path/to/existing/server/config:/source alpine \
    cp -r /source/. /data/

# 3. 导入上传文件
docker run --rm -v nanshan-nav-uploads:/data \
    -v /path/to/existing/uploads:/source alpine \
    cp -r /source/. /data/

# 4. 重新启动
docker compose up -d
```

---

## 故障排查

### 端口冲突

如果 `8080` 已被占用，编辑 `.env` 修改端口映射：

```
NGINX_HTTP_PORT=9090
NGINX_HTTPS_PORT=9443
```

重启服务：

```bash
docker compose down && docker compose up -d
```

### Authelia 认证不生效

检查 Authelia 日志：

```bash
docker compose logs authelia | tail -30
```

常见原因：
- `AUTHELIA_PASSWORD` 是明文密码，不是 bcrypt 哈希
- `JWT_SECRET` 或 `SESSION_SECRET` 未设置或为空
- Authelia 配置文件中 `jwt_secret` 或 `session.secret` 与环境变量不一致
- 启用了 Redis 但未取消注释 `docker-compose.yml` 中的 `redis` 服务和 `redis-data` 卷

### 后端启动失败

检查后端日志：

```bash
docker compose logs backend | tail -30
```

常见原因：
- `PVE_ENCRYPTION_KEY` 未设置（后端仍可启动，但 PVE 令牌加密功能不可用）
- 配置文件目录 `/app/server/config` 权限问题
- TypeScript 运行时错误

### 健康检查一直不通过

```bash
docker compose ps
# 查看 HEALTH 列状态

# 手动测试
docker exec nanshan-nav-backend wget --spider http://localhost:3001/api/health-check
```

### 构建失败

```bash
# 查看构建详细输出
docker compose build --no-cache backend
```

常见原因：
- npm 依赖下载超时（可尝试更换镜像源或重试）
- TypeScript 编译错误（检查代码）

### 常用 Docker Compose 命令

```bash
# 查看所有容器状态
docker compose ps

# 查看实时日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f backend
docker compose logs -f nginx
docker compose logs -f authelia

# 重新构建并启动（代码更新后）
docker compose up -d --build

# 重启单个服务
docker compose restart backend

# 停止所有服务（保留数据卷）
docker compose down

# 停止并删除数据卷（⚠️ 会丢失所有持久化数据）
docker compose down -v

# 进入容器内部调试
docker exec -it nanshan-nav-backend sh
```

---

## 注意事项

1. **数据持久化**: 配置和上传文件存储在 Docker 命名卷中，删除容器不会丢失。但 `docker compose down -v` 会清除所有数据，务必提前备份。

2. **首次构建**: 首次启动需下载 Node.js 基础镜像、npm 依赖并编译前端，耗时约 1-3 分钟，视网络状况而定。

3. **HTTPS**: 容器内 Nginx 未配置 TLS 证书。如需 HTTPS，使用 Traefik、Caddy、Nginx Proxy Manager 或 Cloudflare Tunnel 等外部工具处理。

4. **Authelia 密码**: `AUTHELIA_PASSWORD` 必须是 bcrypt 哈希值，不是明文密码。修改密码后需重新生成哈希并重启 Authelia 容器。

5. **日志管理**: Docker 容器日志默认无大小限制。长期运行建议配置 Docker 守护进程的 `log-opts` 限制日志文件大小和数量。
