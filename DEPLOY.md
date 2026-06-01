# Smart Nexus UI 部署文档

> 本文档仅覆盖**前端 Electron 客户端**的配置、打包与发布。
> 后端服务部署请参考 `smart_nexus/DEPLOY.md`。

---

## 一、API 配置说明（`config.json` vs `.env`）

前端有两套独立的 API 地址配置，用途不同，**不要混淆**：

| 配置文件 | 作用范围 | 说明 |
|----------|---------|------|
| `.env` | 仅 `npm run dev`（Vite 开发服务器） | Vite 读取该文件做反向代理，将本地 `/api`、`/consultant` 请求转发到后端；打包产物不包含该文件 |
| `config.json` | Electron 生产客户端 | 打包进安装包，运行时由主进程读取并通过 IPC 传给渲染进程；`npm run dev` 不使用此文件 |

因此：
- **测试后端联通性**（`npm run dev`）→ 修改 `.env` 中的 `VITE_API_TARGET` / `VITE_CONSULTANT_TARGET`
- **打包 Electron 客户端** → 修改 `config.json`

---

## 二、开发调试（`npm run dev`）

### 2.1 配置 `.env`

在项目根目录创建 `.env`（不进 git），指向后端地址：

```ini
VITE_API_TARGET=https://你的域名.com          # knowledge 服务
VITE_CONSULTANT_TARGET=https://你的域名.com   # consultant 服务
```

> 注意：这里填完整域名（不含路径），`VITE_API_BASE_PATH` / `VITE_CONSULTANT_BASE_PATH` 单独配置路径前缀。

### 2.2 启动开发服务器

```bash
npm install
npm run dev
```

---

## 三、打包 Electron 客户端

> 在**本地 Windows 开发机**上执行，不是服务器。

### 3.1 修改 `config.json` 指向云服务器

编辑项目根目录下的 `config.json`：

```json
{
  "consultantBase": "http://你的服务器IP/smart/nexus/consultant",
  "knowledgeBase":  "http://你的服务器IP/smart/nexus/knowledge"
}
```

如已配置 HTTPS 则使用 `https://你的域名.com/...`。

### 3.2 执行打包

```bash
npm install
npm run electron:build
```

打包完成后，安装包位于 `electron-dist/` 目录下（`.exe` 安装程序）。

### 3.3 用户如何切换服务器地址

用户安装完成后，如需更换服务器地址，只需修改**安装目录根目录**下的 `config.json`，无需重新安装客户端。

---

## 四、发布为 Web 站点（浏览器直接访问）

除了 Electron 桌面客户端，前端也可以构建成静态文件，**部署到后端同一个 Nginx、同一个域名根路径 `/` 下**，用户用浏览器直接访问 `https://你的域名.com/`。

### 4.1 原理

浏览器生产模式下，前端用**同源相对路径** `/smart/nexus/consultant`、`/smart/nexus/knowledge` 访问后端（见 `src/config/api.js`），由后端 Nginx 已配好的代理（含 SSE 流式配置）转发。因此：

- **同源、无 CORS**：前端和后端同一个域名，浏览器不产生跨域。
- **复用后端代理**：不需要在 Nginx 里为前端重复写 `/api`、`/consultant` 代理，直接用后端既有的 `/smart/nexus/*`。
- **无需新证书**：和后端共用同一张 HTTPS 证书。

> 三种运行形态的 API 地址来源对比：
> | 形态 | API 基地址 | 配置来源 |
> |------|-----------|---------|
> | `npm run dev` 浏览器调试 | `/api`、`/consultant` | `.env` + Vite 代理 |
> | **Web 站点（本章）** | `/smart/nexus/*`（同源） | 无需配置，硬编码同源路径 |
> | Electron 桌面客户端 | 后端绝对 URL | `config.json` |

### 4.2 在服务器上拉取代码并构建（在服务器执行）

**① 安装 Node.js（服务器首次构建需要，已装可跳过）：**

```bash
# 通过 NodeSource 安装 Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v        # 验证
```

**② 拉取前端代码并构建：**

```bash
cd /opt
git clone https://github.com/zs2731070169-web/smart-nexus-ui.git
cd smart-nexus-ui
npm install
npm run build            # 产物在 /opt/smart-nexus-ui/dist/
```

> 构建产物 `dist/` 直接被 Nginx 容器挂载使用（见 4.3），无需再复制到别处。

### 4.3 修改后端 Nginx，挂载静态文件（在服务器执行）

**① `deploy/nginx/nginx.conf`** 需改两处：

**(a) 在 `http {` 开头引入 MIME 类型表**（**必须**，否则 `.css`/`.js` 会被当成 `text/plain` 返回，浏览器拒绝加载样式表与模块脚本）：

```nginx
http {
    include       /etc/nginx/mime.types;     # 正确识别 .css/.js 等静态资源 MIME 类型
    default_type  application/octet-stream;   # 兜底类型

    # ...（原有 map / upstream / server 等保持不变）
}
```

**(b) 在 HTTPS `server { listen 443 ssl; ... }` 块内，两个 `/smart/nexus/*` location **之外**，新增根 location 服务前端静态文件：

```nginx
        # consultant
        location /smart/nexus/consultant { ... }   # 保持原样

        # knowledge
        location /smart/nexus/knowledge { ... }    # 保持原样

        # 前端静态站点
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;
        }
```

> Nginx 按最长前缀匹配，`/smart/nexus/consultant`、`/smart/nexus/knowledge` 比 `/` 更长，会**优先**命中后端代理；其余请求才落到静态站点，互不抢占。

**② `deploy/docker/docker-compose.yml`**：给 `nginx` 服务新增一个挂载，把前端构建产物 `dist/` 映射进容器（使用绝对路径指向 4.2 的 clone 目录）：

```yaml
  nginx:
    image: nginx:alpine
    ports: ["443:443", "80:80"]
    volumes:
      - ../nginx/nginx.conf:/etc/nginx/nginx.conf
      - ../nginx/ssl:/etc/nginx/ssl
      - /opt/smart-nexus-ui/dist:/usr/share/nginx/html   # 前端构建产物
```

### 4.4 重启 Nginx 使配置生效

```bash
cd /opt/smart_nexus/deploy/docker
docker compose up -d nginx            # docker-compose.yml新增了挂载需重建容器，不能只 restart
docker compose restart nginx          # 把现有容器停掉再启动
```

完成后浏览器访问 `https://你的域名.com/` 即可看到前端登录页。

### 4.5 后续更新发布

前端有更新时，在服务器上拉取最新代码并重新构建，**无需重启容器**（产物原地更新，静态文件实时生效，用户浏览器强刷 `Ctrl+F5` 加载新版本）：

```bash
cd /opt/smart-nexus-ui
git pull
npm install              # 依赖无变化可省略
npm run build            # 覆盖 dist/，Nginx 立即生效
```

---

## 五、前后端联通验证

1. 安装并打开 Electron 客户端，进入登录页
2. 输入手机号，点击「获取验证码」，在服务器日志中确认收到请求：
   ```bash
   docker compose logs -f consultant | grep "验证码"
   ```
3. 输入验证码完成登录，进入聊天页面
4. 发送一条消息，观察 SSE 流式响应是否正常（文字逐字出现）

---

## 六、更新发布（Electron 客户端）

前端是 Electron 桌面客户端，更新需要重新打包并分发安装包。在**本地 Windows 开发机**上执行：

```bash
npm run electron:build
```

打包完成后将 `electron-dist/` 下的 `.exe` 安装程序发给用户重新安装。

> 若只修改了服务器地址（`config.json`），用户也可直接替换安装目录下的 `config.json`，无需重装。

---

## 七、常见问题排错

### `npm run dev` 报 `ECONNREFUSED` 或接口返回 500

**原因**：`.env` 中的代理目标地址配置错误或域名解析到了旧 IP。按以下步骤逐一排查：

**步骤 1：确认 `.env` 已配置正确的后端地址**

`.env` 中两个代理目标必须指向实际可访问的后端（HTTP 或 HTTPS）：

```ini
VITE_API_TARGET=https://你的域名.com          # knowledge 服务
VITE_CONSULTANT_TARGET=https://你的域名.com   # consultant 服务
```

**步骤 2：验证 443 端口是否可达**

在本地 Windows PowerShell 执行：

```powershell
Test-NetConnection -ComputerName 你的域名.com -Port 443
```

若 `TcpTestSucceeded: True` 则端口通；若 `False` 则检查云服务商安全组是否已开放 443 入站规则。

**步骤 3：验证域名解析是否正确**

```cmd
nslookup 你的域名.com
```

若输出的 IP 不是服务器当前 IP，说明本机 DNS 缓存了旧记录，执行：

```cmd
ipconfig /flushdns
```

再次 `nslookup` 确认 IP 已更新。若仍解析到旧 IP，重启路由器（路由器有独立 DNS 缓存），重启后等待约 1 分钟再测试。

**步骤 4：后端无日志打印 → 请求未到达服务器**

若 Vite 控制台报 `ECONNREFUSED`，但服务器 `docker compose logs -f consultant` 毫无打印，说明请求在本机代理阶段就失败了（域名解析失败或端口不通），不是后端问题，继续排查步骤 2/3。

### 域名解析到旧服务器 IP（DNS 缓存问题）

更换服务器并修改 DNS A 记录后，本机可能仍缓存旧 IP，导致请求打到旧服务器（或不存在的地址）。

**排查流程：**

```cmd
# 1. 查看当前解析结果
nslookup 你的域名.com

# 2. 刷新本机 DNS 缓存（需管理员权限的命令提示符）
ipconfig /flushdns

# 3. 再次确认解析结果
nslookup 你的域名.com
```

若刷新后仍是旧 IP，**重启路由器**（路由器有独立缓存），待重启完成（约 1 分钟）后重试。DNS TTL 一般为 5～10 分钟，正常情况重启路由器后即可解析到新 IP。

---

## 附：前端相关文件

```
smart_nexus_ui/
  config.json          # 服务器地址配置，随安装包分发（生产必改）
  .env                 # Vite 开发代理配置，不进 git
  electron/            # Electron 主进程代码
  src/                 # Vue/React 渲染进程源码
  electron-dist/       # 打包输出目录（.exe 安装程序）
```
