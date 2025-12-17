# 火山引擎豆包API集成说明

本项目已集成火山引擎豆包大模型，用于故事生成、对话和视频生成功能。

## 配置说明

### 1. 获取API Key

1. 访问 [火山引擎控制台](https://www.volcengine.com/)
2. 注册账号并完成实名认证
3. 在方舟模型广场选择模型并创建推理接入点
4. 获取 `ARK_API_KEY`

详细步骤：https://www.volcengine.com/docs/82379/1399008

### 2. 环境变量配置

在项目根目录的 `.env` 文件中配置：

```env
# 火山引擎豆包语言模型API配置
VITE_ARK_API_KEY=你的语言模型ARK_API_KEY
VITE_ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
VITE_ARK_MODEL=doubao-seed-1-6-251015

# 火山引擎视频生成API配置（使用独立的API Key）
VITE_ARK_VIDEO_API_KEY=你的视频生成ARK_API_KEY
VITE_ARK_VIDEO_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
VITE_ARK_VIDEO_MODEL=doubao-seedance-1-0-pro-250528
```

### 3. API使用说明

#### 3.1 语言模型API

**用途**：
- 根据绘画生成故事
- 用户对话交互
- 根据绘画更新更新故事
- 根据对话内容更新故事

**端点**：`POST /responses/create`

**请求格式**：
```typescript
{
  model: "doubao-seed-1-6-251015",
  input: [
    {
      role: "user",
      content: [
        {
          type: "input_image",
          image_url: "data:image/png;base64,..."
        },
        {
          type: "input_text",
          text: "提示词"
        }
      ]
    }
  ]
}
```

**返回格式**：
```typescript
{
  output_text: "生成的文本内容",
  // 或其他可能的格式
}
```

#### 3.2 视频生成API

**用途**：根据故事内容生成动画视频

**工作流程**：
1. 创建任务：`POST /content_generation/tasks/create`
2. 轮询查询：`GET /content_generation/tasks/{task_id}`
3. 获取结果：任务状态为 `succeeded` 时，返回视频URL

**请求格式**：
```typescript
{
  model: "doubao-seedance-1-0-pro-250528",
  content: [
    {
      type: "text",
      text: "故事内容 --resolution 1080p --duration 5 --camerafixed false --watermark true"
    },
    {
      type: "image_url",
      image_url: {
        url: "data:image/png;base64,..."  // 可选，作为首帧
      }
    }
  ]
}
```

**参数说明**：
- `--resolution`: 视频分辨率（如 1080p）
- `--duration`: 视频时长（秒）
- `--camerafixed`: 相机是否固定（true/false）
- `--watermark`: 是否添加水印（true/false）

**轮询说明**：
- 每3秒查询一次任务状态
- 最多等待3分钟（60次尝试）
- 任务状态：`pending` → `processing` → `succeeded`/`failed`

## 代码实现位置

- **语言模型服务**：`src/services/api.ts` - `LLMService` 类
- **视频生成服务**：`src/services/api.ts` - `VideoService` 类
- **API配置**：`src/services/api.ts` - `API_CONFIG` 对象

## 注意事项

1. **API Key安全**：请勿将API Key提交到Git仓库
2. **请求限制**：注意API的请求频率限制
3. **视频生成时间**：视频生成可能需要较长时间，请耐心等待
4. **错误处理**：如果API调用失败，会显示相应的错误提示

## 参考文档

- [火山引擎方舟API文档](https://www.volcengine.com/docs/82379/1399008)
- [视频生成API文档](https://www.volcengine.com/docs/82379/1521675)

