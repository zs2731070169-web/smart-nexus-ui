/**
 * API 基础地址配置，按运行形态解析（优先级从上到下）：
 * - Electron 生产（file://）：从 electron/main.cjs 读取的 config.json 获取地址，
 *   无需硬编码，修改服务器 IP/域名只需更新 exe 同目录下的 config.json，不必重新打包
 * - 浏览器开发（npm run dev）：用 /api、/consultant，由 Vite dev server 代理 rewrite 到 /smart/nexus/*
 * - 浏览器生产（npm run build 部署为 Web 站点）：用同源真实路径 /smart/nexus/*，
 *   由后端 Nginx 已配好的代理（含 SSE）转发，无需 CORS
 */
const isElectronFile = typeof window !== 'undefined' && window.location.protocol === 'file:'

// 从 preload 注入的配置中读取，并提供内置默认值兜底
const electronConfig = (typeof window !== 'undefined' && window.electronAPI?.config) || {}

// import.meta.env.DEV：vite dev server 为 true，vite build 产物为 false
const isDev = import.meta.env.DEV

export const CONSULTANT_BASE = isElectronFile
  ? (electronConfig.consultantBase || 'http://127.0.0.1:8001/smart/nexus/consultant')
  : (isDev ? '/consultant' : '/smart/nexus/consultant')

export const KNOWLEDGE_BASE = isElectronFile
  ? (electronConfig.knowledgeBase || 'http://127.0.0.1:8000/smart/nexus/knowledge')
  : (isDev ? '/api' : '/smart/nexus/knowledge')
