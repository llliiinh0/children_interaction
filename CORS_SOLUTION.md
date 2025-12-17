# CORS问题解决方案

## 问题说明

浏览器直接调用 OpenAI API 会遇到 CORS（跨域资源共享）错误，因为 OpenAI API 服务器不允许来自浏览器的直接请求。

错误信息：
```
Access to XMLHttpRequest at 'https://api.openai.com/v1/chat/completions' from origin 'http://localhost:3000' has been blocked by CORS policy
```

## 解决方案

### 方案1：使用后端代理（推荐）

创建一个简单的后端代理服务器，前端请求后端，后端再请求 OpenAI API。

#### Node.js + Express 代理示例

创建 `server.js` 文件：

```javascript
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      req.body,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`代理服务器运行在 http://localhost:${PORT}`);
});
```

然后在 `.env` 文件中添加：
```env
OPENAI_API_KEY=你的API密钥
```

#### 修改前端代码

修改 `src/services/api.ts`，将请求指向本地代理：

```typescript
// 使用后端代理
const response = await axios.post(
  'http://localhost:3001/api/chat',
  {
    model: 'gpt-4-vision-preview',
    messages: [...]
  }
);
```

### 方案2：使用 Vite 代理配置

在 `vite.config.ts` 中配置代理：

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/openai': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openai/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // 添加 API Key
            proxyReq.setHeader('Authorization', `Bearer ${process.env.VITE_LLM_API_KEY}`);
          });
        },
      },
    },
  },
})
```

然后修改前端请求：

```typescript
const response = await axios.post(
  '/api/openai/v1/chat/completions',
  { model, messages, ... }
);
```

### 方案3：使用云函数/Serverless

使用 Vercel、Netlify Functions 或腾讯云函数创建代理：

#### Vercel 函数示例

创建 `api/chat.ts`：

```typescript
export default async function handler(req, res) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req.body),
  });
  
  const data = await response.json();
  res.json(data);
}
```

### 方案4：使用现有的代理服务

可以使用一些公开的代理服务，但要注意安全性。

## 当前状态

目前代码已经修复了 URL 重复的问题。但要解决 CORS，建议：

1. **开发环境**：使用 Vite 代理配置（方案2）- 最简单
2. **生产环境**：使用后端代理或云函数（方案1或3）- 更安全

## 快速修复（开发环境）

修改 `vite.config.ts`，添加代理配置（见方案2）。

然后修改 `src/services/api.ts` 中的请求URL为相对路径。


