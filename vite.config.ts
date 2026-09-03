import { fileURLToPath, URL } from 'node:url'
import Vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  // GitHub Pages 项目页必须用绝对 base（'/contracted-photographer/'），
  // 否则 vue-router 的 web history 无法正确解析子路径导致白屏；
  // 本地预览用 '/' 即可
  base: process.env.GITHUB_ACTIONS === 'true'
    ? '/contracted-photographer/'
    : '/',
  plugins: [Vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2018',
    chunkSizeWarningLimit: 900,
    // three/gsap 通过动态 import() 自动拆分为独立 chunk，无需 manualChunks
  },
}))
