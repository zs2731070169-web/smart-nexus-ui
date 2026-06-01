# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目简介

Smart Nexus UI 是一个基于 Vue 3 + Element Plus 的 Electron 桌面客户端，作为「设备售后智能顾问」的前端，对接两个后端服务：consultant（对话/鉴权）和 knowledge（知识库/上传）。同一份代码同时支持浏览器开发模式（Vite dev server）和 Electron 生产模式（`file://` 协议）。

## 常用命令

```bash
npm install
npm run dev              # 仅启动 Vite dev server（浏览器调试，走 .env 代理）
npm run electron:dev     # 同时启动 Vite + Electron 主进程
npm run build            # 构建到 dist/
npm run electron:build   # 构建 + 用 electron-builder 打包成 .exe（输出到 electron-dist/）
```

无 lint / test 配置；不要假装存在测试命令。

## 双模式架构（关键）

代码运行在两种环境下，API 基地址解析逻辑不同——这是项目最容易踩坑的地方：

| 模式 | 触发条件 | API 基地址来源 | 配置文件 |
|------|---------|--------------|---------|
| 浏览器开发 | `window.location.protocol !== 'file:'` | `/api`、`/consultant`，由 Vite dev server 代理转发 | 项目根 `.env`（`VITE_API_TARGET`、`VITE_CONSULTANT_TARGET` 等，不进 git） |
| Electron 生产 | `window.location.protocol === 'file:'` | 直接命中后端绝对 URL（含 CORS 头） | exe 同目录 `config.json`（`consultantBase`、`knowledgeBase`） |

判定与读取见 `src/config/api.js`。Electron 生产模式下：主进程 `electron/main.cjs` 在启动时读取 `config.json`，通过同步 IPC（`app:get-config-sync`）把配置传给 `electron/preload.cjs`，再经 `contextBridge` 暴露为 `window.electronAPI.config`。**修改服务器地址不需要重新打包**——用户替换安装目录下的 `config.json` 即可。

`.env` 仅影响 `npm run dev`，不会被打包进安装包；`config.json` 仅影响 Electron 生产，`npm run dev` 不读它。详见 `DEPLOY.md`。

## HTTP 与流式对话

`src/api/request.js` 创建两个独立 axios 实例：
- `knowledgeRequest`：超时 2 分钟，无鉴权
- `consultantRequest`：超时 20 分钟（覆盖长流式响应），请求拦截器自动附加 `Bearer ${authStore.token}`，401 时调用 `authStore.clearAuth()` 清登录

SSE 流式对话（`src/api/consultant.js` 的 `streamChat`）使用 axios `onDownloadProgress` 读取 XHR `responseText` 增量并解析 `data: ` 行——不是用 `fetch` + `ReadableStream`。这是为了复用 axios 的拦截器与配置；改写时务必保留 `responseType: 'text'`。Electron 主进程 `BrowserWindow` 设置了 `backgroundThrottling: false`，原因是窗口失焦后 reader 会被节流导致流卡顿。

## Electron 主进程要点（`electron/main.cjs`）

- 使用无边框窗口（`frame: false`）+ 自定义 TitleBar 组件；窗口控制通过 `win:minimize` / `win:maximize` / `win:close` IPC handle 触发
- **拦截一切刷新与导航**：`will-navigate`、`will-reload`、`Ctrl+R` / `F5` 全部 `preventDefault`，因为刷新会丢失渲染进程的 Pinia 状态。修改时不要为了"调试方便"放开
- `close` 事件被拦截并弹确认框；要真正退出需 `win.destroy()`
- 生产模式注入 CORS 响应头允许 `file://` 协议跨域访问 HTTP 后端

## 鉴权与会话状态

`src/store/auth.js`（Pinia）持久化到 `localStorage` 的 `smart_nexus_auth`。每次 `saveAuth` 会清除 `smart_nexus_active_session` 和 `smart_nexus_local_sessions`，并在 `sessionStorage` 设置 `smart_nexus_just_logged_in='1'`——表示"重新登录从新对话开始，但页面刷新不会触发"。修改登录流程时注意保持这个语义。

## Element Plus 自动导入

`vite.config.js` 配置了 `unplugin-auto-import` + `unplugin-vue-components` 的 `ElementPlusResolver`，所以代码里不需要 `import { ElMessage } from 'element-plus'`，直接用 `ElMessage.error(...)` 即可（参见 `src/api/request.js`）。`dts: false` 表示不生成类型声明文件。

## 代码规范

- 注释、文档、用户可见文案一律使用简体中文
- 注释风格参考现有代码：JSDoc 标注参数与简短中文说明，关键逻辑前用 `//` 单行说明"为什么"
