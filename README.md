# Magic Story Canvas - 人机共创系统

一个支持绘画、AI故事生成、语音播放和视频生成的人机共创系统。

## 功能特性

1. **绘画功能**
   - 左侧画布支持自由绘画
   - 多种颜色选择
   - 可调节画笔大小
   - ✅ 橡皮擦功能（支持擦除已绘制内容）

2. **AI故事生成**
   - 完成绘画后，AI自动生成故事描述
   - 支持故事编辑和修改
   - 故事内容支持语音播放

3. **视频生成**
   - 根据故事内容生成动画视频

4. **智能对话**
   - 与StoryBuddy进行自然对话
   - AI会将对话中的信息融入故事
   - 对话内容支持语音播放

## 技术栈

- React 18
- TypeScript
- Vite
- Fabric.js (画布绘制)
- Axios (HTTP请求)

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 配置环境变量：
创建 `.env` 文件，配置以下变量：

```env
# 火山引擎豆包语言模型API配置（必需）- 用于故事生成和对话
VITE_ARK_API_KEY=你的语言模型ARK_API_KEY
VITE_ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
VITE_ARK_MODEL=doubao-seed-1-6-251015

# 火山引擎视频生成API配置（必需）- 用于视频生成（使用独立的API Key）
VITE_ARK_VIDEO_API_KEY=你的视频生成ARK_API_KEY
VITE_ARK_VIDEO_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
VITE_ARK_VIDEO_MODEL=doubao-seedance-1-0-pro-250528

# 腾讯云语音服务配置（必需）- TTS和STT
VITE_TENCENT_SECRET_ID=AKIDqdGk3A6rTuCB31ylV7XkmdLuIVZTBqJa
VITE_TENCENT_SECRET_KEY=71jFeGhx1sWzFIHJH5reLqBLJ4c6PVQC
VITE_TENCENT_REGION=ap-beijing
```

3. 启动开发服务器：
```bash
npm run dev
```

4. 构建生产版本：
```bash
npm run build
```

5. 预览生产版本：
```bash
npm run preview
```

## 部署到 Vercel

项目已配置好 Vercel 部署，详细步骤请参考 [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

快速部署：
1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量（参考 `env.example`）
4. 点击部署

项目已包含以下 Vercel 配置：
- `vercel.json` - Vercel 配置文件
- `.vercelignore` - 忽略不需要的文件
- 优化的构建配置

## 第三方API配置说明

### 1. 大模型API (LLM)

**当前配置**: 火山引擎豆包

**配置项**:
- `VITE_ARK_API_KEY`: 火山引擎语言模型API密钥
- `VITE_ARK_BASE_URL`: API基础URL（默认：https://ark.cn-beijing.volces.com/api/v3）
- `VITE_ARK_MODEL`: 语言模型ID（默认：doubao-seed-1-6-251015）

**配置位置**: `src/services/api.ts` 中的 `LLMService` 类

**获取API Key**: 访问 https://www.volcengine.com/docs/82379/1399008

**特性**:
- ✅ 支持图像输入（多模态）
- ✅ 支持文本对话
- ✅ 国内服务，访问速度快

### 2. TTS API (文本转语音)

支持以下API服务：
- **腾讯云语音合成** (当前配置): 需要配置 SecretId 和 SecretKey
- **Azure Speech Services**: 需要配置订阅密钥和区域
- **Google Cloud Text-to-Speech**: 需要配置服务账号
- **百度语音**: 需要配置API Key和Secret Key
- **讯飞语音**: 需要配置AppID和API Key

**配置位置**: `src/services/api.ts` 中的 `TTSService` 类

### 2.5. STT API (语音识别)

支持以下API服务：
- **腾讯云语音识别** (当前配置): 使用与TTS相同的配置
- **其他服务**: 可根据需要添加

**配置位置**: `src/services/api.ts` 中的 `STTService` 类

**配置位置**: `src/services/api.ts` 中的 `TTSService` 类

**当前配置**: 腾讯云语音合成服务

**注意**: 腾讯云API需要签名，前端直接使用SecretKey存在安全风险，建议使用后端代理。

### 3. 视频生成API

**当前配置**: 火山引擎豆包视频生成

**配置项**:
- `VITE_ARK_VIDEO_API_KEY`: 火山引擎视频生成API密钥（独立的Key，与语言模型不同）
- `VITE_ARK_VIDEO_BASE_URL`: API基础URL（默认：https://ark.cn-beijing.volces.com/api/v3）
- `VITE_ARK_VIDEO_MODEL`: 视频生成模型ID（默认：doubao-seedance-1-0-pro-250528）

**配置位置**: `src/services/api.ts` 中的 `VideoService` 类

**获取API Key**: 访问火山引擎控制台，创建视频生成应用并获取API Key

**特性**:
- ✅ 支持文本到视频生成
- ✅ 支持图片到视频生成（首帧）
- ✅ 国内服务，访问速度快
- ✅ 异步任务，自动轮询获取结果

## 项目结构

```
src/
├── components/          # React组件
│   ├── DrawingCanvas/  # 画布组件
│   ├── StoryPanel/     # 故事面板组件
│   └── ChatPanel/      # 聊天面板组件
├── services/           # API服务
│   └── api.ts         # API调用封装
├── types/             # TypeScript类型定义
│   └── index.ts
├── App.tsx            # 主应用组件
├── App.css            # 主应用样式
├── main.tsx           # 应用入口
└── index.css          # 全局样式
```

## 使用说明

1. **开始绘画**: 在左侧画布上使用画笔工具进行绘画
2. **完成绘画**: 点击"我画完了！"按钮，AI将自动生成故事
3. **编辑故事**: 点击故事面板的编辑按钮，可以修改故事内容
4. **播放音频**: 点击🔊按钮，可以播放故事或对话的语音
5. **生成视频**: 点击"视频"按钮，根据故事生成动画视频
6. **与AI对话**: 在聊天区域输入消息，与StoryBuddy进行对话

## 注意事项

1. **API配置**: 所有第三方API都需要正确配置才能使用完整功能
2. **API费用**: 使用第三方API可能产生费用，请注意使用量
3. **网络要求**: 需要稳定的网络连接以调用API服务
4. **浏览器兼容**: 建议使用现代浏览器（Chrome、Firefox、Edge等）

## 开发计划

- [ ] 实现语音输入功能
- [ ] 支持更多画布工具（形状、文字等）
- [ ] 优化视频生成流程
- [ ] 添加故事保存和加载功能
- [ ] 支持多语言

## 许可证

MIT License

