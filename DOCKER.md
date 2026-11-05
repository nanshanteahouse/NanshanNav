# Docker 与宿主机部署

默认部署只运行应用后端，由后端同时提供前端页面、API 和经过验证的上传图片。无需域名、HTTPS、登录服务或管理员令牌，局域网可直接通过 IP 访问。

应用只区分公开展示页 `/` 与管理页 `/admin`，管理接口集中在 `/api/admin` 及其子路径。应用不识别用户、组、登录会话或代理身份头。能够访问管理入口的设备可以编辑仪表盘、上传图片、管理 PVE 凭据；需要访问控制时，在反向代理处同时保护这两组路径。

## 默认 Docker 部署

要求 Docker Compose v2。以下命令从仓库根目录执行：

```bash
cp deploy/docker/.env.example .env
docker compose --env-file .env -f deploy/docker/docker-compose.yml config --quiet
docker compose --env-file .env -f deploy/docker/docker-compose.yml up -d --build
```

访问 `http://服务器IP:3001/` 查看面板，访问 `http://服务器IP:3001/admin` 管理面板。默认 `NAV_BIND_ADDRESS=0.0.0.0`、`NAV_HTTP_PORT=3001`，可按需更改宿主机绑定地址和端口。容器内部固定监听 `0.0.0.0:3001`，上传目录固定为 `/app/uploads`。

只需展示时，在 `.env` 设置 `NAV_READ_ONLY=true`，再次执行上面的 `up -d` 命令重建容器配置。后端会关闭 `/admin`、`/api/admin` 及各自所有子路径，公开展示和公开读取接口仍可用。该开关不依赖浏览器按钮或反向代理。

## 宿主机部署

要求 Node.js 22+。构建后直接启动后端即可提供完整站点：

```bash
npm ci
npm run build
cp .env.example .env
# 直接通过局域网访问时，在 .env 设置 HOST=0.0.0.0
node_modules/.bin/tsx --env-file=.env server/index.ts
```

根目录示例默认 `HOST=127.0.0.1`，适用于本机开发或已有本机反向代理。直接局域网部署可改为 `0.0.0.0`，然后访问 `http://服务器IP:3001`。`deploy/systemd/nanshan-nav-backend.service.example` 提供服务示例，从 `/etc/nanshan/nav.env` 加载环境变量；部署路径和用户需按实际情况调整。

## 可选反向代理认证

可以使用现有的 Basic Auth、Authelia 或其他代理认证方式。认证规则必须覆盖精确的 `/admin`、`/api/admin`，以及 `/admin/`、`/api/admin/` 下的全部路径和全部 HTTP 方法。只保护管理页面会让保存、上传和凭据管理接口直接暴露。公开 `/`、公开读取接口和静态资源可以放行。

依赖代理认证时，必须关闭后端的对外发布端口，或通过绑定地址、容器网络和防火墙确保后端仅该代理可达。应用不验证代理身份，直接访问后端会绕过代理控制。宿主机代理可将后端绑定到 `127.0.0.1`；同一 Docker 网络中的代理无需发布后端端口。所有应用静态页面、静态资源及 `/uploads/` 都应转发到后端，以保留后端 CSP 和图片验证，不能另行配置 `root`、`alias` 或上传目录静态挂载。

### 可选 Authelia 完整示例

`deploy/docker/docker-compose.authelia.yml` 是一份独立的可选配置，包含 Backend、Nginx、Authelia 和配置渲染服务。**单独使用该文件，不要与默认 Compose 合并**；它不发布后端端口，仅向本机发布 Nginx HTTP 上游。切换前停止旧的默认栈，保留配置卷和上传卷：

```bash
docker compose --env-file .env -f deploy/docker/docker-compose.yml down
cp deploy/docker/authelia.env.example .env.authelia
# 分别生成 JWT_SECRET、SESSION_SECRET、STORAGE_ENCRYPTION_KEY：
openssl rand -hex 32
# 生成密码哈希，并保留 .env.authelia 中包住哈希的单引号：
docker run --rm -it ghcr.io/authelia/authelia:4.38.18 authelia crypto hash generate argon2
chmod 600 .env.authelia
```

填写 `.env.authelia` 中的域名、HTTPS origin、邮箱、密码哈希和各个密钥。该可选认证方案要求一个已配置 TLS 证书的外部 HTTPS 反向代理。`NAV_PUBLIC_URL=https://nav.example.com` 必须是精确 HTTPS origin，其主机名与 `NAV_DOMAIN=nav.example.com` 相同；可包含非标准端口，不能包含路径。这里的非 IP 域名和 HTTPS 要求来自 Authelia 的安全 Cookie；默认不带认证的应用部署可以直接使用 HTTP/IP。

将 HTTPS 入口转发到 `http://127.0.0.1:8080` 并保留原始 Host（含非标准端口）。宿主机已有 Caddy 时，例如：

```caddyfile
nav.example.com {
    reverse_proxy 127.0.0.1:8080
}
```

私有域名可加入 `tls internal` 并在访问设备上信任 Caddy 根 CA。若 TLS 代理位于其他主机或容器，调整 `NGINX_BIND_ADDRESS`、网络和防火墙，使 HTTP 上游仅该代理可达。不能把这个上游当作无 TLS 的公开认证入口。

```bash
docker compose --env-file .env.authelia -f deploy/docker/docker-compose.authelia.yml config --quiet
docker compose --env-file .env.authelia -f deploy/docker/docker-compose.authelia.yml run --rm auth-config
docker compose --env-file .env.authelia -f deploy/docker/docker-compose.authelia.yml run --rm --no-deps authelia authelia validate-config --config /config/configuration.yml
docker compose --env-file .env.authelia -f deploy/docker/docker-compose.authelia.yml up -d --build
```

Compose 不会替换 bind mount 模板中的变量。`auth-config` 会显式渲染 YAML 和用户数据库，并以 0600 权限写入私有命名卷；密码哈希中的 `$` 不经过 shell 执行。修改环境或密码后，重新运行渲染命令，再用同一 Compose 文件和环境文件执行 `restart authelia nginx`。

配置固定使用 Authelia 4.38.18 和 `/api/authz/auth-request`。Authelia 的默认策略为拒绝，仅 `admins` 组可以通过两组管理路径的认证；示例用户属于该组。公开展示路径由 Nginx 直接转发后端，不发起认证。管理页面未登录时跳转至 `/auth/`，管理 API 保留 401/403 响应。应用不接收身份声明；组策略完全由 Authelia 执行。会话默认在内存中，重启后需重新登录，自助重置密码默认关闭。

宿主机版可参考 `deploy/nginx/nginx.conf.example`，调整域名、上游和 TLS 入口；该文件同样是可选认证示例。

## PVE、内网目标与图片

在服务端 `NAV_PVE_HOSTS_JSON` 中登记 PVE HTTPS origin；域名目标需要 `addresses` 固定允许 IP，IP URL 可省略。`NAV_HEALTH_TARGETS_JSON` 登记允许检查的精确服务 URL。默认/全局 PVE 令牌回退已移除，在管理页逐台绑定令牌。令牌 AES-256-GCM 加密保存；`PVE_ENCRYPTION_KEY` 留空时在持久化配置目录自动创建 `.pve-key`，必须备份。

内部 CA 使用 `NODE_EXTRA_CA_CERTS`。Docker 部署需在 backend 环境中设置容器内 PEM 路径，并把证书只读挂载到同一路径；不能全局关闭 TLS 验证。`NAV_EMBED_ORIGINS` 为逗号分隔的精确 iframe origin，空值仅允许本站。

上传图片仍由后端校验并重新编码，旧 SVG、HTML 和非 UUID 上传不再提供，应使用原始安全图片重新上传；动画取首帧。不要通过 Nginx 或其他静态服务绕过此校验。传统 DIB favicon 暂不支持。

## 迁移与备份

旧版本的写入、上传、历史版本、PVE 主机列表与令牌管理接口迁到 `/api/admin/*`；旧管理 API 路径不再兼容。公开 `GET /api/dashboard` 和 PVE 监控读取保留原路径，用于展示。更新自定义脚本及反向代理规则，完整路径以 [API.md](API.md) 为准。应用内管理员令牌、网关共享密钥和身份头配置已移除，不再提供登录或用户权限判断。

更新前备份配置卷（含 dashboard、历史版本、`pve-tokens.json` 和 `.pve-key`）、上传卷和环境文件。旧按精确 host/origin 加密的 PVE 令牌可按已登记 ID 读取，下一次保存写入 ID。健康检查旧 URL 只接受完整匹配。

应用持久化卷为 `nanshan-nav-config`、`nanshan-nav-uploads`；可选认证另有 `authelia-db`、`nanshan-nav-authelia-config`。Authelia 数据库及存储加密密钥需一起备份。`docker compose down` 保留卷，`down -v` 会删除数据。两个部署配置使用相同应用卷，可以在停止旧栈后切换，切勿同时运行。

## 验证

运行 `bash deploy/scripts/check-deploy.sh` 检查文件、可选认证渲染、代理路径覆盖、管理员组策略、后端端口发布边界及 TLS 设置；安装 Docker 时还执行两份 Compose 配置检查。该检查不启动服务或访问真实 PVE。

部署后检查日志及 `/api/status`，验证直接 IP 部署能保存，或在可选认证部署中验证匿名管理请求被拒绝、非 `admins` 用户被拒绝、管理员可以保存，并确认没有可绕过代理的后端端口。使用 `NAV_READ_ONLY=true` 时确认管理页面和管理 API 均被关闭。本次已通过 Authelia 4.38.18 CLI 配置校验及管理员组策略检查，以及 Nginx 1.26.3 对渲染模板的 `nginx -t` 检查（仅将容器上游及监听端口替换为临时本机地址）。另用临时本机进程实测 Nginx + Authelia：匿名管理页返回 302 登录跳转，管理 API 的根路径和子路径返回 401；Authelia 使用 `/auth` 基路径时，根路径 `/api/authz/auth-request` 仍可正常验证。运行环境没有 Docker，未启动完整 Compose 栈或真实浏览器 TLS 登录会话。
