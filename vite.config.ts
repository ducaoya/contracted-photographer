import { fileURLToPath, URL } from 'node:url'
import Vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  // GitHub Pages 项目页需要以仓库名为 base；本地/自定义域名部署用 '/'
  base:
    process.env.GITHUB_ACTIONS === 'true'
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
