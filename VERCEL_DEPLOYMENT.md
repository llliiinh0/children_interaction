# Vercel 部署指南

本指南将帮助您将项目部署到 Vercel。

## 前置要求

1. 拥有 Vercel 账号（可通过 GitHub 账号登录）
2. 项目已推送到 GitHub 仓库

## 部署步骤

### 方法一：通过 Vercel Dashboard 部署（推荐）

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New Project"
3. 导入您的 GitHub 仓库
4. 配置项目设置：
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (默认)
   - **Build Command**: `npm run build` (默认)
   - **Output Directory**: `dist` (默认)
   - **Install Command**: `npm install` (默认)

5. 配置环境变量：
   在 "Environment Variables" 部分添加以下变量（参考 `env.example`）：
   ```
   VITE_ARK_API_KEY=你的ARK_API_KEY
   VITE_ARK_MODEL=doubao-seed-1-6-251015
   VITE_ARK_VIDEO_API_KEY=你的视频生成ARK_API_KEY
   VITE_ARK_VIDEO_MODEL=doubao-seedance-1-0-pro-250528
   VITE_TENCENT_SECRET_ID=你的腾讯云SecretID
   VITE_TENCENT_SECRET_KEY=你的腾讯云SecretKey
   VITE_TENCENT_REGION=ap-beijing
   ```

6. 点击 "Deploy" 开始部署

### 方法二：通过 Vercel CLI 部署

1. 安装 Vercel CLI：
   ```bash
   npm i -g vercel
   ```

2. 在项目根目录运行：
   ```bash
   vercel
   ```

3. 按照提示完成配置

4. 配置环境变量：
   ```bash
   vercel env add VITE_ARK_API_KEY
   vercel env add VITE_ARK_MODEL
   vercel env add VITE_ARK_VIDEO_API_KEY
   vercel env add VITE_ARK_VIDEO_MODEL
   vercel env add VITE_TENCENT_SECRET_ID
   vercel env add VITE_TENCENT_SECRET_KEY
   vercel env add VITE_TENCENT_REGION
   ```

## 重要说明

### API 代理配置

⚠️ **注意**：Vite 开发服务器中的 `proxy` 配置在 Vercel 生产环境中**不会生效**。

如果您需要代理 API 请求（例如解决 CORS 问题），您有以下选择：

1. **使用 Vercel Serverless Functions**（推荐）：
   - 在 `api/` 目录下创建代理函数
   - 修改前端代码，将 API 请求指向这些函数

2. **直接调用 API**：
   - 确保 API 服务器支持 CORS
   - 或者使用支持 CORS 的 API 网关

3. **使用 Vercel Edge Functions**：
   - 对于需要低延迟的代理请求

### 当前配置

项目已配置：
- ✅ `vercel.json` - Vercel 配置文件
- ✅ `vite.config.ts` - 已优化构建配置
- ✅ `.vercelignore` - 忽略不需要的文件

### 构建优化

项目已配置代码分割：
- React 相关代码单独打包
- Fabric.js 单独打包
- 其他代码按需加载

## 部署后检查

1. 访问部署的 URL
2. 检查控制台是否有错误
3. 测试主要功能：
   - 绘画功能
   - 橡皮擦功能
   - 故事生成
   - 视频生成
   - 聊天功能

## 故障排除

### 构建失败

- 检查 Node.js 版本（建议 18+）
- 检查环境变量是否全部配置
- 查看构建日志中的错误信息

### API 请求失败

- 检查环境变量是否正确配置
- 检查 API 密钥是否有效
- 检查浏览器控制台的网络请求

### 路由问题

- 确保 `vercel.json` 中的 `rewrites` 配置正确
- 所有路由都应重定向到 `index.html`

## 更新部署

每次推送到 GitHub 主分支，Vercel 会自动重新部署。

您也可以手动触发部署：
- 在 Vercel Dashboard 中点击 "Redeploy"
- 或使用 CLI：`vercel --prod`

## 自定义域名

1. 在 Vercel Dashboard 中进入项目设置
2. 在 "Domains" 部分添加您的域名
3. 按照提示配置 DNS 记录

