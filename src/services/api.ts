import axios from 'axios';

// API Configuration
const API_CONFIG = {
  // --- Volcengine Doubao Language Model Configuration ---
  // Use Vite proxy path to solve browser CORS issues
  ARK_BASE_URL: '/api-ark/api/v3',
  // Must be the endpoint ID generated from console (ep-xxx)
  ARK_MODEL: import.meta.env.VITE_ARK_MODEL || '', 
  ARK_API_KEY: import.meta.env.VITE_ARK_API_KEY || '',

  // --- Volcengine Video Generation Configuration ---
  // Also use proxy path
  ARK_VIDEO_BASE_URL: '/api-ark/api/v3',
  // Video generation model endpoint ID
  ARK_VIDEO_MODEL: import.meta.env.VITE_ARK_VIDEO_MODEL || 'doubao-seedance-1-0-pro-250528',
  // Video generation specific API Key (if different)
  ARK_VIDEO_API_KEY: import.meta.env.VITE_ARK_VIDEO_API_KEY || '',

  // --- Tencent Cloud TTS/STT Configuration ---
  TENCENT_SECRET_ID: import.meta.env.VITE_TENCENT_SECRET_ID || '',
  TENCENT_SECRET_KEY: import.meta.env.VITE_TENCENT_SECRET_KEY || '',
  TENCENT_REGION: import.meta.env.VITE_TENCENT_REGION || 'ap-beijing',
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
        { role: 'system', content: 'You are a creative story writing assistant, specializing in creating stories for children.' }
      ];

      if (chatHistory) {
        chatHistory.forEach(msg => messages.push({ 
          role: msg.role === 'assistant' ? 'assistant' : 'user', 
          content: msg.content 
        }));
      }

      const prompt = existingStory 
        ? `Current story: ${existingStory}\nPlease update the story based on the new drawing.`
        : 'Please create a vivid and interesting story based on this drawing.';

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
        { role: 'system', content: 'You are a story update assistant. Compare the changes between the two drawings and update the story accordingly.' },
        {
          role: 'user',
          content: [
            { type: 'text', text: `Original story: ${currentStory}\nPlease update the story based on the changes in the following two images. The first is the old image, the second is the new image.` },
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
        { role: 'system', content: 'Update the existing story based on new ideas mentioned in the conversation.' },
        { 
          role: 'user', 
          content: `Current story: ${currentStory}\nChat history: ${JSON.stringify(chatHistory.slice(-3))}\nPlease incorporate elements from the conversation into the story.` 
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

/** * Tencent Cloud signature tool (unchanged, compatible) 
 */
async function generateTencentSignature(
  secretKey: string, service: string, action: string, region: string, 
  payload: any, timestamp: number, date: string
): Promise<string> {
  const encoder = new TextEncoder();
  const requestString = JSON.stringify(payload);
  const signString = `POST\n/\n\ncontent-type:application/json\nhost:${service}.tencentcloudapi.com\n\n${requestString}`;
  
  const kDate = await crypto.subtle.importKey('raw', encoder.encode(secretKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const kDateSig = await crypto.subtle.sign('HMAC', kDate, encoder.encode(date));
  const kService = await crypto.subtle.importKey('raw', kDateSig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const kServiceSig = await crypto.subtle.sign('HMAC', kService, encoder.encode(service));
  const kSigning = await crypto.subtle.importKey('raw', kServiceSig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const kSigningSig = await crypto.subtle.sign('HMAC', kSigning, encoder.encode('tc3_request'));
  const kFinal = await crypto.subtle.importKey('raw', kSigningSig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', kFinal, encoder.encode(signString));
  
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export class TTSService {
  static async textToSpeech(text: string, voiceType?: number): Promise<string> {
    if (!API_CONFIG.TENCENT_SECRET_ID || !API_CONFIG.TENCENT_SECRET_KEY) throw new Error('Tencent Cloud credentials not configured');
    try {
      const service = 'tts';
      const action = 'TextToVoice';
      const region = API_CONFIG.TENCENT_REGION;
      const endpoint = `https://${service}.tencentcloudapi.com/`;
      const payload = { Text: text, Codec: 'mp3', ModelType: 1, VoiceType: voiceType || 1001, SessionId: `s_${Date.now()}` };
      const timestamp = Math.floor(Date.now() / 1000);
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const signature = await generateTencentSignature(API_CONFIG.TENCENT_SECRET_KEY, service, action, region, payload, timestamp, date);
      
      const response = await axios.post(endpoint, payload, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-TC-Action': action, 'X-TC-Version': '2019-08-23', 'X-TC-Region': region,
          'X-TC-Timestamp': timestamp.toString(),
          'Authorization': `TC3-HmacSHA256 Credential=${API_CONFIG.TENCENT_SECRET_ID}/${date}/${service}/tc3_request, SignedHeaders=content-type;host, Signature=${signature}`
        }
      });

      if (response.data?.Response?.Audio) {
        const binaryString = atob(response.data.Response.Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        return URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
      }
      throw new Error(response.data?.Response?.Error?.Message || 'TTS failed');
    } catch (error: any) {
      if (window.speechSynthesis) return this.fallbackTTS(text);
      throw error;
    }
  }

  private static fallbackTTS(text: string): Promise<string> {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.onend = () => resolve('browser-tts');
      speechSynthesis.speak(utterance);
    });
  }
}

export class STTService {
  static async speechToText(audioBlob: Blob): Promise<string> {
    if (!API_CONFIG.TENCENT_SECRET_ID || !API_CONFIG.TENCENT_SECRET_KEY) throw new Error('Credentials not configured');
    try {
      const reader = new FileReader();
      const audioBase64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(audioBlob);
      });

      const service = 'asr';
      const action = 'SentenceRecognition';
      const payload = { ProjectId: 0, SubServiceType: 2, EngSerViceType: '16k_zh', SourceType: 1, VoiceFormat: 'mp3', UsrAudioKey: `a_${Date.now()}`, Data: audioBase64, DataLen: audioBlob.size };
      const timestamp = Math.floor(Date.now() / 1000);
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const signature = await generateTencentSignature(API_CONFIG.TENCENT_SECRET_KEY, service, action, API_CONFIG.TENCENT_REGION, payload, timestamp, date);
      
      const response = await axios.post(`https://${service}.tencentcloudapi.com/`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-TC-Action': action, 'X-TC-Version': '2019-06-14', 'X-TC-Region': API_CONFIG.TENCENT_REGION,
          'X-TC-Timestamp': timestamp.toString(),
          'Authorization': `TC3-HmacSHA256 Credential=${API_CONFIG.TENCENT_SECRET_ID}/${date}/${service}/tc3_request, SignedHeaders=content-type;host, Signature=${signature}`
        }
      });
      return response.data?.Response?.Result || '';
    } catch (error: any) {
      throw new Error(`识别失败: ${error.message}`);
    }
  }
}

export class VideoService {
  /**
   * 轮询查询任务状态
   */
  private static async pollTaskStatus(taskId: string): Promise<string> {
    for (let i = 0; i < 60; i++) {
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
          return data.output?.video_url || '';
        }
        if (data.status === 'failed') {
          throw new Error(data.error?.message || 'Video generation task failed');
        }
        
        console.log(`Video generating, status: ${data.status}...`);
        await new Promise(r => setTimeout(r, 5000)); // Poll every 5 seconds
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.warn("Task ID not yet active on server, continuing to wait...");
        } else {
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

    // Construct content
    const content: any[] = [
      { 
        type: 'text', 
        text: story.slice(0, 500) // Prompt should not be too long
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
