# 第三方API配置指南

本项目需要配置以下第三方API服务才能完整运行：

## 1. 大模型API (必需)

用于生成故事和对话功能。

### 选项A: 火山引擎豆包 (当前配置) ⭐

```env
# 语言模型API配置
VITE_ARK_API_KEY=你的语言模型ARK_API_KEY
VITE_ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
VITE_ARK_MODEL=doubao-seed-1-6-251015
```

**获取方式**: 
1. 访问 https://www.volcengine.com/docs/82379/1399008
2. 注册火山引擎账号并完成实名认证
3. 在控制台创建应用，获取 ARK_API_KEY

**API调用示例**（Python SDK参考）:
```python
from volcenginesdkarkruntime import Ark

client = Ark(
    base_url='https://ark.cn-beijing.volces.com/api/v3',
    api_key=os.getenv('ARK_API_KEY'),
)

response = client.responses.create(
    model="doubao-seed-1-6-251015",
    input=[
        {
            "role": "user",
            "content": [
                {
                    "type": "input_image",
                    "image_url": "data:image/png;base64,..."
                },
                {
                    "type": "input_text",
                    "text": "你看见了什么？"
                }
            ]
        }
    ]
)
```

**支持的模型**:
- `doubao-seed-1-6-251015` - 支持图像输入的多模态模型（默认）
- 其他豆包模型可根据需要配置

**特性**:
- ✅ 支持图像输入（用于根据画作生成故事）
- ✅ 支持文本对话
- ✅ 国内服务，访问速度快
- ✅ 价格相对便宜

### 选项B: OpenAI API

```env
VITE_LLM_API_URL=https://api.openai.com/v1
VITE_LLM_API_KEY=sk-你的API密钥
```

**获取方式**: https://platform.openai.com/api-keys

**支持的模型**:
- `gpt-4o` (推荐，支持图像输入)
- `gpt-4` (用于对话)
- `gpt-3.5-turbo` (更经济的选项)

**注意**: 使用OpenAI需要修改 `src/services/api.ts` 中的实现。

### 选项C: Anthropic Claude API

需要修改 `src/services/api.ts` 中的请求格式：

```typescript
// Claude API格式示例
const response = await axios.post(
  'https://api.anthropic.com/v1/messages',
  {
    model: 'claude-3-opus-20240229',
    max_tokens: 1000,
    messages: [...]
  },
  {
    headers: {
      'x-api-key': API_CONFIG.LLM_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    }
  }
);
```

### 选项C: 国内API (文心一言、通义千问等)

根据具体API文档调整 `src/services/api.ts` 中的请求格式。

## 2. TTS API - 文本转语音 (必需)

用于故事和对话的语音播放功能。

### 选项A: 腾讯云语音合成 (推荐)

```env
VITE_TENCENT_SECRET_ID=AKIDqdGk3A6rTuCB31ylV7XkmdLuIVZTBqJa
VITE_TENCENT_SECRET_KEY=71jFeGhx1sWzFIHJH5reLqBLJ4c6PVQC
VITE_TENCENT_REGION=ap-beijing
```

**获取方式**: 
1. 登录腾讯云控制台
2. 开通语音合成服务（通过控制台创建应用即可获得每日10万字符免费额度）
3. 在访问管理-API密钥管理中获取 SecretId 和 SecretKey

**API调用示例**（Python SDK参考）:
```python
from tencentcloud.common import credential
from tencentcloud.tts.v20190711 import tts_client, models
cred = credential.Credential("SecretId", "SecretKey")
client = tts_client.TtsClient(cred, "ap-beijing")
req = models.TextToVoiceRequest()
req.Text = "免费API测试"
req.Codec = "mp3"
req.ModelType = 1
resp = client.TextToVoice(req)
```

**参数说明**:
- `Text`: 要转换的文本内容
- `Codec`: 音频格式，支持 `mp3`、`wav`、`pcm`
- `ModelType`: 模型类型，`0`-轻量版，`1`-标准版（推荐）

**语音类型**（可选参数）:
- `1001` - 智逍遥（默认）
- `1002` - 智聆
- `1003` - 智美

**注意**: 
- 腾讯云API需要TC3-HmacSHA256签名，前端直接调用可能存在安全风险
- 建议使用后端代理服务或腾讯云官方SDK
- 当前实现已包含签名算法，但生产环境建议使用后端代理

### 选项B: Azure Speech Services

```env
VITE_TTS_API_URL=https://your-region.tts.speech.microsoft.com/cognitiveservices/v1
VITE_TTS_API_KEY=your-azure-speech-key
```

**获取方式**: 
1. 登录 Azure Portal
2. 创建 Speech Services 资源
3. 获取密钥和区域

**中文语音选项**:
- `zh-CN-XiaoxiaoNeural` (女声)
- `zh-CN-YunyangNeural` (男声)
- `zh-CN-XiaoyiNeural` (女声，年轻)

### 选项C: Google Cloud Text-to-Speech

需要修改 `src/services/api.ts` 中的 `TTSService.textToSpeech` 方法：

```typescript
const response = await axios.post(
  `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_CONFIG.TTS_API_KEY}`,
  {
    input: { text: text },
    voice: { languageCode: 'zh-CN', name: 'zh-CN-Wavenet-A' },
    audioConfig: { audioEncoding: 'MP3' }
  }
);
```

### 选项D: 百度语音合成

需要修改请求格式，使用百度API的格式。

### 选项E: 讯飞语音

需要修改请求格式，使用讯飞API的格式。

## 2.5. STT API - 语音识别 (可选)

用于语音输入功能。

### 腾讯云语音识别

使用与TTS相同的配置：

```env
VITE_TENCENT_SECRET_ID=AKIDqdGk3A6rTuCB31ylV7XkmdLuIVZTBqJa
VITE_TENCENT_SECRET_KEY=71jFeGhx1sWzFIHJH5reLqBLJ4c6PVQC
VITE_TENCENT_REGION=ap-beijing
```

**注意**: 同样需要后端代理或使用官方SDK以确保安全。

## 3. 视频生成API (必需)

用于根据故事生成动画视频。

### 选项A: RunwayML

```env
VITE_VIDEO_API_URL=https://api.runwayml.com/v1
VITE_VIDEO_API_KEY=key_e0336a7bcffc48b1b54896813aba9deb9de7d7f43e2c0ad900947d7d9639223fe0c1ed578782eb5fd8557af7d85837922c53f5019ab5aac5d5d8a92d219c959e
```

**获取方式**: https://runwayml.com/

**注意**: RunwayML API可能需要等待视频生成完成，返回的是任务ID，需要轮询获取结果。

### 选项B: Pika Labs

需要根据Pika Labs的API文档调整请求格式。

### 选项C: 其他视频生成服务

根据具体服务的API文档调整 `src/services/api.ts` 中的 `VideoService.generateVideo` 方法。

## 配置步骤

1. 在项目根目录创建 `.env` 文件（如果不存在）
2. 复制以下配置模板并填入你的API密钥：

```env
# 火山引擎豆包语言模型API配置
VITE_ARK_API_KEY=你的语言模型ARK_API_KEY
VITE_ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
VITE_ARK_MODEL=doubao-seed-1-6-251015

# 火山引擎视频生成API配置（使用独立的API Key）
VITE_ARK_VIDEO_API_KEY=你的视频生成ARK_API_KEY
VITE_ARK_VIDEO_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
VITE_ARK_VIDEO_MODEL=doubao-seedance-1-0-pro-250528

# 腾讯云语音服务 (TTS和STT)
# 通过控制台创建应用即可获得每日10万字符免费额度
# 支持30+种语言及200+种音色
VITE_TENCENT_SECRET_ID=AKIDqdGk3A6rTuCB31ylV7XkmdLuIVZTBqJa
VITE_TENCENT_SECRET_KEY=71jFeGhx1sWzFIHJH5reLqBLJ4c6PVQC
VITE_TENCENT_REGION=ap-beijing
```

**快速配置**：
1. 复制项目根目录下的 `env.example` 文件并重命名为 `.env`
2. 在 `.env` 文件中填入你的 `VITE_ARK_API_KEY`
3. 确保腾讯云语音服务的配置已填写
4. 重启开发服务器使环境变量生效

3. 如果使用不同的API服务，需要修改 `src/services/api.ts` 中对应的请求格式
4. 重启开发服务器使环境变量生效

## 费用说明

- **火山引擎豆包**: 按使用量计费，价格相对便宜，适合国内使用
- **腾讯云语音服务**: 按使用量计费，有免费额度（每日10万字符）
- **OpenAI API**: 按使用量计费，GPT-4较贵，GPT-3.5-turbo较便宜
- **Azure Speech**: 有免费额度，超出后按使用量计费
- **RunwayML**: 需要订阅计划，不同计划有不同的生成次数限制

## 安全提示

⚠️ **重要**: 腾讯云的 SecretKey 是敏感信息，不应该直接暴露在前端代码中。

**推荐方案**:
1. 使用后端代理服务，将 SecretKey 保存在服务器端
2. 使用腾讯云官方SDK（需要Node.js后端）
3. 如果必须在前端使用，请确保：
   - 使用环境变量（不要提交到Git）
   - 配置CORS和API访问限制
   - 定期轮换密钥

## 测试API配置

配置完成后，可以：
1. 在画布上画一些内容
2. 点击"我画完了！"测试故事生成
3. 点击🔊按钮测试语音播放
4. 在聊天框输入消息测试对话功能
5. 点击"视频"按钮测试视频生成

如果某个功能不工作，检查浏览器控制台的错误信息，通常是API配置问题。

