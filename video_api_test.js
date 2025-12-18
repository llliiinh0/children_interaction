// Simple Node test script to debug Volcengine video generation API
// Usage:
//   1. npm install dotenv
//   2. node video_api_test.js

const axios = require('axios');
require('dotenv').config();

async function createVideoTask(prompt) {
  const baseUrl = process.env.VITE_ARK_VIDEO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
  const model = process.env.VITE_ARK_VIDEO_MODEL || 'doubao-seedance-1-0-pro-250528';
  const apiKey = process.env.VITE_ARK_VIDEO_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_ARK_VIDEO_API_KEY not set in .env');
  }

  const baseStory = prompt.slice(0, 300);
  const controlFlags = '--resolution 720p --duration 12 --camerafixed false --watermark true';

  console.log('[NodeTest] Creating task with prompt:', baseStory);

  const res = await axios.post(
    `${baseUrl}/contents/generations/tasks`,
    {
      model,
      content: [
        {
          type: 'text',
          text: `${baseStory}\n\n${controlFlags}`,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = res.data?.data || res.data;
  console.log('[NodeTest] Create task response:', JSON.stringify(data, null, 2));

  const taskId = data.id;
  if (!taskId) {
    throw new Error('No task id in create response');
  }
  return taskId;
}

async function pollTask(taskId) {
  const baseUrl = process.env.VITE_ARK_VIDEO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
  const apiKey = process.env.VITE_ARK_VIDEO_API_KEY;

  console.log('[NodeTest] Start polling task:', taskId);

  // 轮询次数从 60 提升到 120，每 5 秒一次，总等待时间约 10 分钟
  for (let i = 0; i < 120; i++) {
    try {
      const res = await axios.get(
        `${baseUrl}/contents/generations/tasks/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      const data = res.data?.data || res.data;
      console.log(`[NodeTest] Poll #${i + 1}, status:`, data.status);

      if (data.status === 'succeeded') {
        console.log('[NodeTest] Task succeeded full payload:', JSON.stringify(data, null, 2));
        const url = data.content?.video_url;
        console.log('[NodeTest] Extracted video URL:', url);
        return url;
      }

      if (data.status === 'failed') {
        console.error('[NodeTest] Task failed:', JSON.stringify(data, null, 2));
        throw new Error(data.error?.message || 'Task failed');
      }
    } catch (err) {
      // 对于网络层超时等错误，不立刻失败，而是记录并继续下一次轮询
      if (!err.response && (err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET' || (err.message || '').includes('timeout'))) {
        console.warn(`[NodeTest] Poll #${i + 1} network error (${err.code || err.message}), will retry...`);
      } else {
        console.error('[NodeTest] Polling error (non-retryable):', err.response?.data || err.message);
        throw err;
      }
    }

    await new Promise((r) => setTimeout(r, 5000));
  }

  throw new Error('Timeout after 60 polls');
}

async function main() {
  try {
    const prompt =
      'A cute cartoon cat running happily in a sunny park, colorful and lively for kids.';
    const taskId = await createVideoTask(prompt);
    const url = await pollTask(taskId);
    console.log('\n=== FINAL VIDEO URL ===\n', url || '(empty)');
  } catch (err) {
    console.error('[NodeTest] Error:', err);
  }
}

main();


