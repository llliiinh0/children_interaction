import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'fabric-vendor': ['fabric'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      // 1. 保留你原有的 OpenAI 代理（如果还需要的话）
      '/api/openai': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openai/, ''),
      },
      // 2. 新增火山引擎 Ark 代理，解决视频生成等接口的 CORS 问题
      '/api-ark': {
        target: 'https://ark.cn-beijing.volces.com',
        changeOrigin: true,
        // 将 /api-ark 替换为空，这样请求 /api-ark/api/v3 就会变成 https://ark.cn-beijing.volces.com/api/v3
        rewrite: (path) => path.replace(/^\/api-ark/, ''),
      },
      '/api-volc-tts': {
        target: 'https://openspeech.bytedance.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-volc-tts/, '')
      },
      '/api-volc-video': {
      target: 'https://ark.cn-beijing.volces.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api-volc-video/, '')
    }
    },
  },
})