import axios from 'axios';

// API Configuration
const API_CONFIG = {
  // --- Volcengine Doubao Language Model Configuration ---
  // Use Vite proxy path to solve browser CORS issues
  ARK_BASE_URL: import.meta.env.VITE_API_URL || 'https://ark.cn-beijing.volces.com/api/v3',
  // Must be the endpoint ID generated from console (ep-xxx)
  ARK_MODEL: import.meta.env.VITE_ARK_MODEL || '', 
  ARK_API_KEY: import.meta.env.VITE_ARK_API_KEY || '',

  // --- Volcengine Video Generation Configuration ---
  // Also use proxy path
  // For browser (Vite dev) we MUST go through the proxy to avoid CORS.
  // If you deploy behind your own backend, you can override this via env.
  ARK_VIDEO_BASE_URL: import.meta.env.VITE_ARK_VIDEO_API_URL || '/api-volc-video/api/v3',
  // Video generation model endpoint ID
  ARK_VIDEO_MODEL: import.meta.env.VITE_ARK_VIDEO_MODEL || 'doubao-seedance-1-0-pro-250528',
  // Video generation specific API Key (if different)
  ARK_VIDEO_API_KEY: import.meta.env.VITE_ARK_VIDEO_API_KEY || '',
};

export class LLMService {
  /**
   * Unified request method wrapper to reduce redundancy
   */
  private static async postToArk(messages: any[]) {
    return await axios.post(
      `${API_CONFIG.ARK_BASE_URL}/chat/completions`,
      {
        model: API_CONFIG.ARK_MODEL,
        messages: messages,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${API_CONFIG.ARK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  /**
   * Generate story based on canvas content
   */
  static async generateStory(
    imageBase64: string,
    existingStory?: string,
    chatHistory?: Array<{ role: string; content: string }>
  ): Promise<string> {
    if (!API_CONFIG.ARK_API_KEY) throw new Error('VITE_ARK_API_KEY not configured');

    try {
      const messages: any[] = [
        { 
          role: 'system', 
          content: 'You are a creative story writing assistant for children. Always respond with ONLY the story text, without any explanation or comments.' 
        }
      ];

      if (chatHistory) {
        chatHistory.forEach(msg => messages.push({ 
          role: msg.role === 'assistant' ? 'assistant' : 'user', 
          content: msg.content 
        }));
      }

      const prompt = existingStory 
        ? `Current story: ${existingStory}\nPlease update the story based on the new drawing. Do not explain the changes, just give the updated story text.`
        : 'Please create a vivid and interesting story based on this drawing. Only output the story itself, no additional explanation.';

      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${imageBase64}` } }
        ]
      });

      const response = await this.postToArk(messages);
      return response.data?.choices?.[0]?.message?.content || '';
    } catch (error: any) {
      throw new Error(`Failed to generate story: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Chat conversation
   */
  static async chat(
    message: string,
    chatHistory: Array<{ role: string; content: string }>,
    currentStory?: string
  ): Promise<string> {
    if (!API_CONFIG.ARK_API_KEY) throw new Error('VITE_ARK_API_KEY not configured');

    try {
      const messages: any[] = [
        { 
          role: 'system', 
          content: `You are StoryBuddy, a friendly story writing assistant. Current story: ${currentStory || 'None'}. Please guide the user to provide more interesting plots or characters.` 
        }
      ];

      chatHistory.forEach(msg => messages.push({ role: msg.role, content: msg.content }));
      messages.push({ role: 'user', content: message });

      const response = await this.postToArk(messages);
      return response.data?.choices?.[0]?.message?.content || '';
    } catch (error: any) {
      throw new Error(`Chat failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Update story by comparing drawings
   */
  static async updateStoryFromDrawing(
    newImageBase64: string,
    previousImageBase64: string,
    currentStory: string
  ): Promise<string> {
    try {
      const messages = [
        { 
          role: 'system', 
          content: 'You are a story update assistant. Compare the changes between the two drawings and update the story accordingly. Only return the updated story text, without describing the changes.' 
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: `Original story: ${currentStory}\nPlease update the story based on the changes in the following two images. The first is the old image, the second is the new image. Do not explain what changed, only output the new version of the story.` },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${previousImageBase64}` } },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${newImageBase64}` } }
          ]
        }
      ];
      const response = await this.postToArk(messages);
      return response.data?.choices?.[0]?.message?.content || '';
    } catch (error: any) {
      throw new Error(`Failed to update story: ${error.message}`);
    }
  }

  /**
   * Update story based on chat content
   */
  static async updateStoryFromChat(
    currentStory: string,
    chatHistory: Array<{ role: string; content: string }>,
    imageBase64?: string
  ): Promise<string> {
    try {
      const messages: any[] = [
        { 
          role: 'system', 
          content: 'Update the existing story based on new ideas mentioned in the conversation. Only output the updated story text, without any explanation.' 
        },
        { 
          role: 'user', 
          content: `Current story: ${currentStory}\nChat history: ${JSON.stringify(chatHistory.slice(-3))}\nPlease incorporate elements from the conversation into the story, and return only the updated story.` 
        }
      ];

      if (imageBase64) {
        messages[1].content = [
          { type: 'text', text: messages[1].content },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${imageBase64}` } }
        ];
      }

      const response = await this.postToArk(messages);
      return response.data?.choices?.[0]?.message?.content || '';
    } catch (error: any) {
      throw new Error(`Failed to sync conversation to story: ${error.message}`);
    }
  }
}

/**
 * 豆包语音合成服务 (Volcengine TTS)
 * 全量替换腾讯云，只保留播放功能
 */
export class TTSService {
  static async textToSpeech(text: string, voiceType: string | number = 'BV001_streaming'): Promise<string> {
    const appId = '4015335495';
    // 关键：请确保这个 token 是从“语音技术-服务授权”或“项目管理”生成的 Access Token
    const accessToken = 'eDxfM0_u8sCVG62AIScdIOcumI0xNb6x'; 

    try {
      const response = await axios.post(
        '/api-volc-tts/api/v1/tts',
        {
          app: {
            appid: appId,
            token: accessToken, // 核心：基础版主要看这里的 token
            cluster: 'volcano_tts'
          },
          user: { uid: 'student_user' },
          audio: {
            voice_type: 'BV001_streaming',
            encoding: 'mp3',
            speed_ratio: 1.0,
            volume_ratio: 1.0,
            pitch_ratio: 1.0
          },
          request: {
            text: text,
            reqid: `req_${Date.now()}`,
            operation: 'query'
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            // 尝试这种官方最标准的 Header 格式
            'Authorization': `Bearer; ${accessToken}` 
          }
        }
      );

      if (response.data?.data) {
        const binaryString = atob(response.data.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
      }
      
      // 如果 code 不为 0，说明 token 还是不对
      if (response.data?.code) {
         throw new Error(`Code ${response.data.code}: ${response.data.message}`);
      }
      throw new Error('No data');
    } catch (error: any) {
      console.error('基础语音合成失败:', error.response?.data || error.message);
      return this.fallbackTTS(text);
    }
  }

  private static fallbackTTS(text: string): Promise<string> {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.onend = () => resolve('browser-tts');
        window.speechSynthesis.speak(utterance);
      } else {
        resolve('browser-tts');
      }
    });
  }
}

export class VideoService {
  /**
   * 尝试从不同结构中提取视频 URL，方便兼容官方可能的返回格式差异
   */
  private static extractVideoUrl(data: any): string {
    if (!data) return '';
    // 当前火山引擎返回结构：data.content.video_url
    if (data.content?.video_url) return data.content.video_url;

    // 兼容其他可能的输出字段
    if (data.output?.video_url) return data.output.video_url;
    if (data.output?.video?.url) return data.output.video.url;
    if (Array.isArray(data.output) && data.output.length > 0) {
      const first = data.output[0];
      if (typeof first === 'string') return first;
      if (first.url) return first.url;
      if (first.video_url) return first.video_url;
    }
    return '';
  }

  /**
   * 轮询查询任务状态
   */
  private static async pollTaskStatus(taskId: string): Promise<string> {
    // 轮询次数从 60 提升到 120，每 5 秒一次，总等待时间约 10 分钟
    for (let i = 0; i < 120; i++) {
      try {
        const res = await axios.get(
          // Note: path is contents/generations
          `${API_CONFIG.ARK_VIDEO_BASE_URL}/contents/generations/tasks/${taskId}`, 
          {
            headers: { 'Authorization': `Bearer ${API_CONFIG.ARK_VIDEO_API_KEY}` }
          }
        );
        
        // Compatible with different response structures
        const data = res.data?.data || res.data;

        if (data.status === 'succeeded') {
          console.log('[VideoService] Task succeeded, raw data:', data);
          const url = this.extractVideoUrl(data);
          if (!url) {
            console.warn('[VideoService] Task succeeded but no video URL found in response.');
          }
          return url;
        }
        if (data.status === 'failed') {
          console.error('[VideoService] Task failed, raw data:', data);
          throw new Error(data.error?.message || 'Video generation task failed');
        }
        
        console.log(`Video generating, status: ${data.status}...`);
        await new Promise(r => setTimeout(r, 5000)); // Poll every 5 seconds
      } catch (error: any) {
        // 对于 404 或暂时的网络错误（如超时），继续轮询而不是立刻失败
        if (error.response?.status === 404) {
          console.warn("Task ID not yet active on server, continuing to wait...");
        } else if (!error.response && (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.message?.includes('timeout'))) {
          console.warn("[VideoService] Network timeout while polling, will retry...", error.code || error.message);
        } else {
          console.error("[VideoService] Polling error (non-retryable):", error.response?.data || error.message);
          throw error;
        }
      }
    }
    throw new Error('Video generation timeout, please check in the background later');
  }

  /**
   * Generate video
   */
  static async generateVideo(story: string, imageBase64?: string): Promise<string> {
    if (!API_CONFIG.ARK_VIDEO_API_KEY) throw new Error('Video API key not configured');

    // 构造文案，并通过控制参数压缩视频时长，降低生成耗时
    const baseStory = story.slice(0, 300); // 文本不要太长，避免过度复杂
    const controlFlags = '--resolution 720p --duration 12 --camerafixed false --watermark true';

    // Construct content
    const content: any[] = [
      { 
        type: 'text', 
        // 在提示词后追加控制参数，控制分辨率和时长（约 10~15s）
        text: `${baseStory}\n\n${controlFlags}`
      }
    ];

    if (imageBase64) {
      content.push({
        type: 'image_url',
        image_url: { 
          // Ensure Base64 format is correct
          url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}` 
        }
      });
    }

    try {
      const res = await axios.post(
        // Note: official task creation path ends with /tasks, not /create
        `${API_CONFIG.ARK_VIDEO_BASE_URL}/contents/generations/tasks`, 
        { 
          model: API_CONFIG.ARK_VIDEO_MODEL, 
          content 
        },
        { 
          headers: { 
            'Authorization': `Bearer ${API_CONFIG.ARK_VIDEO_API_KEY}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      // Get task ID
      const taskId = res.data?.data?.id || res.data?.id;
      if (!taskId) throw new Error('Failed to get task ID');

      return await this.pollTaskStatus(taskId);
    } catch (error: any) {
      console.error("Video API Error Detail:", error.response?.data);
      throw error;
    }
  }
}
