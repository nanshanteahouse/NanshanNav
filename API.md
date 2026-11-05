# NanshanNav API

Node 22+ 后端默认监听 `127.0.0.1:3001`。需要局域网直连时设置 `HOST=0.0.0.0`，无需域名或反向代理。`/` 是普通展板，`/admin` 是管理页面；所有管理接口集中在 `/api/admin` 路径下，其余 API 只允许读取。未知 API 返回 JSON 404。

应用不提供登录、用户角色或管理员令牌认证。默认情况下，能连接应用的人就能使用管理页面和管理 API。需要访问限制时，由反向代理同时保护精确路径 `/admin`、`/api/admin` 及其所有子路径；也可以按部署需求限制整个站点。反代必须保留原始 `Host`，并防止用户绕过反代直连后端。Authelia 仅为可选示例，不是应用依赖。

`NAV_READ_ONLY=true` 开启纯展板模式：后端对上述管理页面和管理 API 的所有请求返回404，前端不启用编辑功能；公开面板、上传图片和监控读取继续可用。默认 `false`；其他非空值会阻止启动，避免配置拼错后意外开启管理。此选项关闭管理功能，不限制展板数据的读取，也不表示禁止 favicon 缓存等内部文件写入。

保留请求完整性校验：公共 API 的写入方法返回405；管理写请求如果携带不同 Host 的 `Origin` 或 `Sec-Fetch-Site: cross-site`，返回403。这不是身份认证，无浏览器来源头的直接客户端仍可管理。应用不读取 `Authorization`、`X-Nav-User`、`X-Nav-Groups` 或网关共享密钥。

| 方法、路径 | 契约 |
| --- | --- |
| GET `/api/status` | 本地进程存活：`{ok:true}`；不发出外部网络请求 |
| GET `/api/capabilities` | `{readOnly:boolean}`；禁止缓存，用于前端决定是否启用管理功能 |
| GET `/api/embed-policy` | `{origins:string[]}`；来自 `NAV_EMBED_ORIGINS` 精确origin列表 |
| GET `/api/admin/pve/hosts` | 返回 `[{id,label,origin}]` |
| GET `/api/pve/nodes` | 只读监控；必须传 `X-PVE-Host-ID` |
| GET `/api/pve/nodes/:node/status` | node仅允许字母、数字、下划线、连字符 |
| GET `/api/pve/cluster/resources` | 可选 `type=vm/storage/node`；其余查询参数丢弃 |
| GET/PUT/DELETE `/api/admin/pve/tokens` | 管理接口；GET/DELETE `?hostId=home`；PUT `{hostId:"home",token:"user@realm!id=secret"}`。只返回存在状态或全掩码 |
| GET `/api/health-check?serviceId=nas` | 仅登记目标发HEAD，5秒超时，无GET回退，无重定向；`{reachable,statusCode?,lastSuccessAt?,lastFailureAt?,history}`；history保留最近20次实际检查，进程重启清空。目标结果缓存15秒，全局最多4并发、每秒补1次额度（上限60），超限429 |
| GET `/api/favicon?url=https%3A%2F%2Fexample.com` | 只尝试同origin `/favicon.ico`、`/favicon.png`、`/assets/favicon.png`；不跟随重定向、不解析HTML。响应仅为重编码 `image/webp`，绝不透传远端MIME |
| POST `/api/admin/upload` | 管理接口，multipart字段 `image`；输入≤20MB，输出 `{url:"/uploads/<uuid>.webp"}`；支持JPEG/PNG/GIF/WebP，动画仅首帧；禁用SVG/BMP/HTML，像素上限4000万，输出最大4096×4096 |
| GET `/uploads/:filename` | 只提供UUID格式的图片名，并重新解码为WebP；旧HTML/SVG或任意路径不再提供 |

PVE主机通过 `NAV_PVE_HOSTS_JSON='[{"id":"home","url":"https://pve.lan:8006","addresses":["192.168.1.10"]}]'` 注册。只能使用HTTPS origin；凭据按ID绑定，任何HTTP、任意目标、未允许路径、写入方法或重定向均拒绝。旧 `X-PVE-Host`/令牌管理 `host` 仅在精确匹配登记ID、origin或host:port时兼容。默认令牌和 `PVE_API_TOKEN` 环境回退已移除；旧按主机加密令牌只向精确匹配的登记origin迁移，不读取明文令牌。

健康目标通过 `NAV_HEALTH_TARGETS_JSON='[{"id":"nas","url":"http://192.168.1.20/"}]'` 登记；旧 `?url=` 仅在规范化后与登记完整URL完全一致时兼容。允许家庭内网目标。两种登记目标使用域名时必须设置 `addresses` 固定允许的IP，直接使用IP URL则可省略；每次请求解析DNS，检查所有结果并将socket固定到验证后的地址。域名未配置addresses时后端拒绝启动。

Favicon任意公开站点只允许公网解析地址；私网favicon必须与登记服务/PVE目标的origin一致，遵守相同addresses限制。每次下载≤2MB，3秒超时，全局最多4并发、每2秒补1额度（上限30）；服务器缓存7天。PNG容器ICO可解码，传统DIB ICO暂不支持。旧favicon缓存不再读取。所有图像响应包含nosniff和限制性CSP。

`NAV_EMBED_ORIGINS` 为逗号分隔精确HTTP(S) origin。生产SPA响应CSP以该列表收窄iframe；空值仅本站。内部自签证书使用 `NODE_EXTRA_CA_CERTS=/绝对路径/internal-ca.pem`，禁止 `NODE_TLS_REJECT_UNAUTHORIZED=0`（后端检测到会拒绝启动）。

## 面板、草稿与版本迁移

公开面板包含导航配置，请勿在其中存放密码和访问令牌。面板写入、历史读取及回滚都位于管理 API 路径；需要访问限制时在反代设置。

| 方法、路径 | 契约 |
| --- | --- |
| GET `/api/dashboard` | 返回完整文档及 `revision`、`updatedAt`，HTTP `ETag` 与 revision 相同；未创建时404和 `ETag: "0"`。所有响应禁止缓存 |
| PUT `/api/admin/dashboard` | JSON完整文档，必须传 `If-Match: <GET得到的ETag>`；首次创建传 `If-Match: "0"`（引号属于值）。成功返回 `{success:true,revision,updatedAt}` 和新ETag |
| GET `/api/admin/dashboard/versions` | `{versions:[{revision,updatedAt,title}]}`，按新到旧排列，最多保留最近10个历史有效版本 |
| POST `/api/admin/dashboard/rollback` | JSON `{revision:"\"历史revision\""}`，`If-Match`必须等于当前ETag；立即恢复指定版本，生成新revision，并先归档当前版本。成功返回恢复后的完整文档和新ETag |

缺少 `If-Match` 返回428；当前版本已改变返回412，绝不覆盖新版本；schema不合法返回400；JSON请求体上限20MiB（包括没有Content-Length的请求），超限413；写入或持久化确认失败返回500。遇到500应先读取最新ETag，再决定是否重试，因为原子替换可能已完成而后续确认失败。每个进程串行检查版本与写入，以临时文件写入、fsync、原子rename更新主文件，原文件中断时仍保持完整。请使用一个后端写入进程管理同一配置目录；这不是跨主机分布式锁。主文件损坏时GET返回500并附 `X-Dashboard-Recovery: available`，编辑器可用历史版本恢复；此种恢复使用 `If-Match: "0"`。

文档格式为 `{schemaVersion:1,settings,layouts,widgets}`。`layouts` 必须包含 `lg/md/sm/xs/xxs` 五个数组，引用存在且唯一的widget ID，并使用合法整数坐标和尺寸。组件类型限定现有8种，选项、链接、tags和时区均验证；旧版缺失选项会补安全默认值。旧JSON导出的 `version:"1.0.0"` 和没有schemaVersion的历史文件继续可读；旧 `darkMode` 迁移到 `themeMode`。前后端复用 `src/lib/dashboard-schema.ts`。

普通展板从服务端读取已保存内容，不显示或覆盖管理页面的本机草稿。应用仅在根节点初始化读取一次；手机菜单挂载不会重新读取。编辑内容实时保存在浏览器草稿，迟到GET不覆盖草稿；已有revision的草稿保留原版本用于冲突检查。保存成功且保存期间没有新编辑时才退出编辑，失败保留草稿。刷新自动恢复本机草稿；损坏localStorage会隔离到 `dashboard-storage-recovery-<时间戳>`，显示恢复提示并加载安全默认状态。导入先校验整份文档、显示预览，再一次性替换；导入可撤销，服务端仍需点击保存。

“完整备份”由浏览器导出JSON：`{...文档,backupVersion:1,exportedAt,assets:[{path,mime,data}]}`。`data`为base64，包最大100MB，包含当前草稿引用的本机上传图片及图标；已嵌入的data URL保留在文档内，外部图片保留原URL。恢复先完整校验，随后用 `POST /api/admin/upload` 的multipart `image`字段上传所有图片并替换新路径，全部成功后才提交面板；中途失败不会替换当前面板。图片上传成功但后续导入失败时可能留下未引用的图片文件。普通旧JSON仍可导入，其图片路径需要在目标实例存在。

升级前建议备份 `server/config/dashboard-state.json`、`server/config/dashboard-versions/`、`uploads/`。该配置目录应持久化并限制文件权限；历史面板与图片需一起迁移。

## 从旧版认证方案迁移

移除 `NAV_ADMIN_TOKEN`、`NAV_GATEWAY_SECRET` 和 `/api/session`。不要继续使用旧 URL 写入：保存、上传、版本列表/回滚以及 PVE 主机登记列表和凭据管理均迁至 `/api/admin/*`；公开 `GET /api/dashboard` 与 PVE 监控读取保留原路径。旧管理路径没有兼容写入别名，以免绕过反代对新路径的限制。

已有反代部署应先调整管理路径的访问策略，再开放新版。只保护 `/admin` 页面不足以限制写入。无需认证的局域网部署可以直接运行；纯展示实例使用 `NAV_READ_ONLY=true`。旧版内置令牌不会再限制访问。
