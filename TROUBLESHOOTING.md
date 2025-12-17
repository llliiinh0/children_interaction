# 环境变量配置问题排查指南

## 问题：提示"生成故事失败，请检查API配置"

如果遇到这个错误，说明环境变量没有正确加载。请按以下步骤排查：

### 1. 确认 .env 文件位置和格式

- ✅ **位置**：`.env` 文件必须在项目根目录（与 `package.json` 同级）
- ✅ **格式**：每行一个变量，格式为 `VITE_变量名=值`
- ✅ **注意事项**：
  - 变量名必须以 `VITE_` 开头
  - 等号前后不要有空格（除非值本身需要）
  - 值不要用引号包裹（除非值本身包含引号）

### 2. 检查 .env 文件内容

确保 `.env` 文件包含以下内容：

```env
# 大模型API配置（OpenAI ChatGPT）
VITE_LLM_API_URL=https://api.openai.com/v1
VITE_LLM_API_KEY=sk-proj-你的API密钥

# 腾讯云语音服务配置
VITE_TENCENT_SECRET_ID=AKID你的SecretId
VITE_TENCENT_SECRET_KEY=你的SecretKey
VITE_TENCENT_REGION=ap-beijing

# 视频生成API配置（RunwayML）
VITE_VIDEO_API_URL=https://api.runwayml.com/v1
VITE_VIDEO_API_KEY=key_你的API密钥
```

### 3. 重启开发服务器

**重要**：修改 `.env` 文件后，必须重启开发服务器才能生效！

1. 在终端按 `Ctrl+C` 停止当前服务器
2. 重新运行 `npm run dev`

### 4. 验证环境变量是否加载

重启服务器后，打开浏览器控制台（F12），应该能看到：

```
=== 环境变量配置检查 ===

配置项状态:
✓ LLM API URL: 已配置
✓ LLM API Key: 已配置
...
```

如果看到 `✗ 未配置`，说明环境变量没有正确加载。

### 5. 常见问题

#### 问题1：变量名错误
❌ 错误：`LLM_API_KEY=...`  
✅ 正确：`VITE_LLM_API_KEY=...`

#### 问题2：等号前后有空格
❌ 错误：`VITE_LLM_API_KEY = sk-...`  
✅ 正确：`VITE_LLM_API_KEY=sk-...`

#### 问题3：值被引号包裹
❌ 错误：`VITE_LLM_API_KEY="sk-..."`  
✅ 正确：`VITE_LLM_API_KEY=sk-...`

#### 问题4：文件位置不对
❌ 错误：`.env` 在 `src/` 目录下  
✅ 正确：`.env` 在项目根目录（与 `package.json` 同级）

#### 问题5：没有重启服务器
❌ 错误：修改 `.env` 后直接刷新页面  
✅ 正确：修改 `.env` 后重启开发服务器

### 6. 手动验证环境变量

在浏览器控制台输入以下命令，检查环境变量：

```javascript
console.log('LLM API URL:', import.meta.env.VITE_LLM_API_URL);
console.log('LLM API Key:', import.meta.env.VITE_LLM_API_KEY ? '已设置' : '未设置');
console.log('Tencent SecretId:', import.meta.env.VITE_TENCENT_SECRET_ID);
```

如果都显示 `undefined`，说明环境变量没有加载。

### 7. 仍然无法解决？

如果以上步骤都无法解决问题，请检查：

1. **文件编码**：确保 `.env` 文件是 UTF-8 编码
2. **隐藏字符**：检查文件中是否有不可见字符
3. **缓存问题**：尝试删除 `node_modules/.vite` 目录，然后重新启动
4. **Vite版本**：确保使用的是最新版本的 Vite

### 8. 快速修复命令

```bash
# 1. 停止服务器（Ctrl+C）

# 2. 清理缓存
rm -rf node_modules/.vite
# Windows PowerShell:
Remove-Item -Recurse -Force node_modules\.vite

# 3. 重新启动
npm run dev
```


