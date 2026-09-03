import { fileURLToPath, URL } from 'node:url'
import Vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  // 相对路径 base：本地预览、GitHub Pages 项目页、任意子路径部署均可用
  base: './',
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
