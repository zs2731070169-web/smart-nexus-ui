# Smart Nexus UI 💻

> 智能售后顾问系统前端 | Desktop UI for Smart Nexus After-sales Consultant

[![Vue.js](https://img.shields.io/badge/Vue.js-3.4%2B-green?logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0%2B-purple?logo=vite)](https://vitejs.dev/)
[![Electron](https://img.shields.io/badge/Electron-29.0%2B-blue?logo=electron)](https://www.electronjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

## 📋 项目概述

Smart Nexus UI 是 Smart Nexus 系统的桌面客户端，采用 **Electron + Vue 3** 技术栈，为用户提供优雅、流畅的智能售后咨询体验。通过 SSE 流式传输实现实时对话，与后端 Consultant/Knowledge 服务深度集成。

### 🎯 核心特性

- **现代化 UI**：Vue 3 + Vite 高效开发，响应式界面设计
- **桌面应用**：Electron 跨平台支持（Windows/macOS/Linux）
- **流式对话**：SSE 实时流式数据显示，卡顿感
- **鉴权管理**：JWT Token 本地存储与自动续签
- **离线支持**：部分功能离线可用
- **开发者友好**：完整的类型支持与 DevTools

---

## 🏗️ 架构设计

### 应用分层

```
┌─────────────────────────────────────┐
│     Electron 主进程                 │
│  (窗口管理、IPC、系统集成)          │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│   Vue 3 + Vite 渲染进程             │
│  ┌──────────────┐  ┌──────────────┐ │
│  │ Components   │  │  Pages       │ │
│  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐ │
│  │  Stores      │  │   Services   │ │
│  │ (Pinia)      │  │ (HTTP/SSE)   │ │
│  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│   Backend Services                  │
│   (Consultant + Knowledge)          │
└─────────────────────────────────────┘
```

### 页面结构

```
App (根组件)
├── Login (登录页)
│   ├── PhoneInput
│   ├── CodeVerification
│   └── AgreeTerms
│
├── MainLayout (主布局)
│   ├── Sidebar (侧边栏)
│   │   ├── UserProfile
│   │   ├── SessionList
│   │   └── Settings
│   │
│   ├── ChatPanel (对话面板)
│   │   ├── MessageList
│   │   │   ├── TextMessage
│   │   │   ├── ThinkingMessage
│   │   │   ├── ToolCallMessage
│   │   │   └── ExceptionMessage
│   │   │
│   │   └── InputArea
│   │       ├── TextInput
│   │       └── SendButton
│   │
│   └── RightPanel (右侧面板)
│       ├── SessionInfo
│       └── DocumentViewer
│
└── Settings (设置页)
    ├── AccountSettings
    ├── AppearanceSettings
    └── AdvancedSettings
```

---

## 🚀 快速开始

### 前置要求

- **Node.js**: 18.0+（推荐 20 LTS）
- **npm**: 9.0+ 或 **pnpm**: 8.0+
- **系统**：Windows 7+ / macOS 10.14+ / Ubuntu 18.04+

### 本地开发

#### 1. 克隆仓库

```bash
git clone https://github.com/zs2731070169-web/smart-nexus-ui.git
cd smart-nexus-ui
```

#### 2. 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm（推荐，速度更快）
pnpm install
```

#### 3. 环境配置

```bash
cp .env.example .env.local
# 编辑 .env.local，填写后端服务地址
```

配置示例：
```env
VITE_API_BASE_URL=http://localhost:8001/smart/nexus/consultant
VITE_KNOWLEDGE_BASE_URL=http://localhost:8000/smart/nexus/knowledge
VITE_APP_NAME=Smart Nexus
VITE_APP_VERSION=1.0.0
```

#### 4. 启动开发服务器

```bash
# Web 开发（仅渲染进程，用于前端界面开发）
npm run dev

# Electron 开发（完整应用，包括主进程）
npm run dev:electron
```

打开浏览器访问 `http://localhost:5173` 或 Electron 窗口。

---

## 📦 生产构建

### 构建 Web 版本

```bash
npm run build
# 输出到 dist/ 目录，可部署到 Web 服务器
```

### 构建 Electron 应用

```bash
# macOS
npm run build:electron:mac

# Windows
npm run build:electron:win

# Linux
npm run build:electron:linux

# 全平台
npm run build:electron
```

构建产物存放在 `dist-electron/` 目录。

---

## 🛠️ 项目结构

```
smart-nexus-ui/
├── src/
│   ├── components/              # Vue 组件库
│   │   ├── common/              # 通用组件（Button、Input等）
│   │   ├── layout/              # 布局组件（Sidebar、Header等）
│   │   └── chat/                # 对话相关组件
│   │
│   ├── pages/                   # 页面组件
│   │   ├── LoginPage.vue
│   │   ├── ChatPage.vue
│   │   └── SettingsPage.vue
│   │
│   ├── stores/                  # Pinia 状态管理
│   │   ├── authStore.ts         # 认证状态
│   │   ├── chatStore.ts         # 对话状态
│   │   └── userStore.ts         # 用户信息
│   │
│   ├── services/                # 业务逻辑层
│   │   ├── api/                 # HTTP 请求（axios）
│   │   │   ├── authApi.ts       # 认证接口
│   │   │   ├── chatApi.ts       # 对话接口
│   │   │   └── knowledgeApi.ts  # 知识库接口
│   │   │
│   │   └── sse/                 # SSE 流式处理
│   │       └── sseService.ts    # SSE 客户端
│   │
│   ├── types/                   # TypeScript 类型定义
│   │   ├── api.ts
│   │   ├── chat.ts
│   │   └── user.ts
│   │
│   ├── utils/                   # 工具函数
│   │   ├── request.ts           # HTTP 客户端
│   │   ├── storage.ts           # 本地存储
│   │   └── formatters.ts        # 格式化工具
│   │
│   ├── assets/                  # 静态资源
│   │   ├── icons/
│   │   ├── images/
│   │   └── styles/
│   │
│   ├── App.vue                  # 根组件
│   └── main.ts                  # 入口文件
│
├── electron/                    # Electron 主进程
│   ├── main.ts                  # 主进程入口
│   ├── preload.ts               # 预加载脚本
│   └── utils/
│       ├── updateManager.ts     # 自动更新
│       └── windowManager.ts     # 窗口管理
│
├── public/                      # 公开资源
├── .env.example                 # 环境变量模板
├── vite.config.ts               # Vite 配置
├── electron-builder.json        # Electron Build 配置
├── tsconfig.json                # TypeScript 配置
├── package.json
└── README.md
```

---

## 🔌 核心功能模块

### 1️⃣ 认证系统

**流程**：手机号 → 验证码 → JWT Token → 本地存储

```typescript
// stores/authStore.ts
const login = async (phone: string, code: string) => {
  const response = await authApi.login(phone, code);
  const { token, user } = response;
  
  // 保存 Token 到本地存储
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  // 更新 API 请求头
  updateAuthHeader(token);
};
```

### 2️⃣ SSE 流式对话

**实时流式消息处理**：

```typescript
// services/sse/sseService.ts
export const streamChat = (question: string) => {
  const eventSource = new EventSource(
    `/api/chat?q=${question}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  eventSource.onmessage = (event) => {
    const message = JSON.parse(event.data);
    // render_type: THINKING | PROCESSING | ANSWER | EXCEPTION
    handleStreamMessage(message);
  };
  
  eventSource.onerror = () => {
    eventSource.close();
  };
};
```

### 3️⃣ 状态管理（Pinia）

```typescript
// stores/chatStore.ts
import { defineStore } from 'pinia';

export const useChatStore = defineStore('chat', () => {
  const messages = ref<Message[]>([]);
  const currentSession = ref<Session | null>(null);
  
  const addMessage = (msg: Message) => {
    messages.value.push(msg);
  };
  
  const clearMessages = () => {
    messages.value = [];
  };
  
  return {
    messages,
    currentSession,
    addMessage,
    clearMessages
  };
});
```

### 4️⃣ 响应式消息渲染

```vue
<!-- components/chat/MessageList.vue -->
<template>
  <div class="message-list">
    <div
      v-for="msg in messages"
      :key="msg.id"
      :class="['message', msg.role]"
    >
      <!-- 思考过程 -->
      <template v-if="msg.type === 'thinking'">
        <ThinkingMessage :content="msg.content" />
      </template>
      
      <!-- 处理中 -->
      <template v-else-if="msg.type === 'processing'">
        <ProcessingMessage :tool-calls="msg.toolCalls" />
      </template>
      
      <!-- 最终答案 -->
      <template v-else-if="msg.type === 'answer'">
        <AnswerMessage :content="msg.content" />
      </template>
      
      <!-- 异常 -->
      <template v-else-if="msg.type === 'exception'">
        <ExceptionMessage :error="msg.error" />
      </template>
    </div>
  </div>
</template>
```

---

## 🎨 样式与主题

### 支持的主题

- **浅色主题**（默认）
- **深色主题**
- **自定义主题**（高级用户）

```typescript
// stores/themeStore.ts
export const useThemeStore = defineStore('theme', () => {
  const theme = ref<'light' | 'dark'>('light');
  
  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme.value);
    localStorage.setItem('theme', theme.value);
  };
});
```

---

## 🔐 安全性

### Token 管理

```typescript
// utils/storage.ts
export const setAuthToken = (token: string) => {
  localStorage.setItem('auth_token', token);
  // 设置自动续签
  scheduleTokenRefresh(token);
};

export const getAuthToken = (): string | null => {
  const token = localStorage.getItem('auth_token');
  if (!token || isTokenExpired(token)) {
    clearAuthToken();
    return null;
  }
  return token;
};
```

### 请求拦截

```typescript
// utils/request.ts
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

// 请求拦截器
request.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器
request.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期，重定向到登录
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 📱 响应式设计

所有组件均采用移动优先设计，支持多设备自适应：

- **Desktop**：1920px 以上
- **Tablet**：768px - 1919px
- **Mobile**：< 768px

```vue
<style scoped>
.container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* 平板 */
@media (min-width: 768px) {
  .container {
    grid-template-columns: 250px 1fr;
  }
}

/* 桌面 */
@media (min-width: 1920px) {
  .container {
    grid-template-columns: 250px 1fr 300px;
  }
}
</style>
```

---

## 🧪 测试

### 单元测试

```bash
npm run test
```

使用 **Vitest + Vue Test Utils**。

### E2E 测试

```bash
npm run test:e2e
```

使用 **Playwright**。

### 测试用例示例

```typescript
// src/components/__tests__/MessageList.spec.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MessageList from '../MessageList.vue';

describe('MessageList', () => {
  it('renders messages correctly', () => {
    const messages = [
      { id: 1, content: 'Hello', role: 'user' }
    ];
    
    const wrapper = mount(MessageList, {
      props: { messages }
    });
    
    expect(wrapper.text()).toContain('Hello');
  });
});
```

---

## 🚀 部署

### Web 部署（Nginx）

```nginx
server {
    listen 80;
    server_name example.com;
    
    root /var/www/smart-nexus-ui/dist;
    index index.html;
    
    # SPA 路由配置
    location / {
        try_files $uri /index.html;
    }
    
    # 反向代理后端接口
    location /api {
        proxy_pass http://localhost:8001;
    }
}
```

### Electron 应用发布

```bash
# 配置 electron-builder.json
{
  "appId": "com.smartnexus.app",
  "productName": "Smart Nexus",
  "build": {
    "publish": {
      "provider": "github",
      "owner": "zs2731070169-web",
      "repo": "smart-nexus-ui"
    }
  }
}

# 自动发布更新
npm run release
```

---

## 📚 依赖列表

### 核心依赖

| 包名 | 版本 | 说明 |
|------|------|------|
| vue | 3.4+ | 前端框架 |
| vite | 5.0+ | 构建工具 |
| pinia | 2.1+ | 状态管理 |
| axios | 1.6+ | HTTP 客户端 |
| electron | 29.0+ | 桌面应用 |
| typescript | 5.3+ | 类型系统 |

完整依赖见 `package.json`。

---

## 🤝 贡献指南

### 开发规范

1. **代码风格**：遵循 ESLint + Prettier 配置
2. **提交信息**：`type(scope): subject`
   - type: feat / fix / docs / style / refactor / perf / test
   - scope: 功能模块名
   - subject: 简短描述

3. **分支规范**：
   - `main` - 生产分支
   - `develop` - 开发分支
   - `feature/*` - 功能分支
   - `fix/*` - 修复分支

### 提交 PR 前

```bash
# 代码格式检查
npm run lint

# 自动修复可修复的问题
npm run lint:fix

# 运行测试
npm run test

# 构建检查
npm run build
```

---

## 🐛 常见问题

### Q: Vite 开发服务器连接不到后端

**A**: 检查 `.env.local` 中的 `VITE_API_BASE_URL` 是否正确，或在 `vite.config.ts` 中配置代理：

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});
```

### Q: Electron 无法访问后端 HTTPS 接口

**A**: 在 `electron/main.ts` 中禁用证书验证（开发环境）：

```typescript
app.on('ready', () => {
  // 开发环境禁用证书验证
  if (isDev) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
});
```

### Q: 构建后文件过大

**A**: 启用代码分割与压缩：

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue'],
          axios: ['axios']
        }
      }
    },
    minify: 'terser'
  }
});
```

---

## 📄 许可证

MIT License © 2025 zs2731070169-web

---

## 📞 联系方式

- **GitHub Issues**：[反馈问题](https://github.com/zs2731070169-web/smart-nexus-ui/issues)
- **GitHub Discussions**：[讨论想法](https://github.com/zs2731070169-web/smart-nexus-ui/discussions)

---

## 🔗 相关项目

- **[Smart Nexus Backend](https://github.com/zs2731070169-web/smart_nexus)** - 后端服务
- **[Smart Nexus Docs](https://github.com/zs2731070169-web/smart-nexus-docs)** - 完整文档

---

<div align="center">

**⭐ 如果对你有帮助，请给个 Star！**

[English](README.md) | [简体中文](README.md)

Made with ❤️ by zs2731070169-web

</div>
