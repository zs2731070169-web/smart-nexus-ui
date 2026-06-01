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

## 四、前后端联通验证

1. 安装并打开 Electron 客户端，进入登录页
2. 输入手机号，点击「获取验证码」，在服务器日志中确认收到请求：
   ```bash
   docker compose logs -f consultant | grep "验证码"
   ```
3. 输入验证码完成登录，进入聊天页面
4. 发送一条消息，观察 SSE 流式响应是否正常（文字逐字出现）

---

## 五、更新发布

前端是 Electron 桌面客户端，更新需要重新打包并分发安装包。在**本地 Windows 开发机**上执行：

```bash
npm run electron:build
```

打包完成后将 `electron-dist/` 下的 `.exe` 安装程序发给用户重新安装。

> 若只修改了服务器地址（`config.json`），用户也可直接替换安装目录下的 `config.json`，无需重装。

---

## 六、常见问题排错

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
