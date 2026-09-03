import { fileURLToPath, URL } from 'node:url'
import Vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

/**
 * 路由 → 页面 SEO meta 映射（构建期逐页注入 title/description）。
 * 注意：与 src/router/index.ts 的 meta 保持同步（此处不能 import router，
 * 因为 @ 别名在 vite 配置加载阶段不可用）。
 */
const PAGE_META: Record<string, { title?: string; description?: string }> = {
  '/': {
    title: '签约摄影师认证 · Contracted Photographer Program',
    description: '签约摄影师认证计划 — 输入姓名完成签约，即刻获得唯一证书编号与专属认证铭牌。扫码即验认证状态，支持双面高清导出与打印，全程本地生成、隐私安全。',
  },
  '/verify': {
    title: '认证验证 · 签约摄影师认证',
    description: '扫码验证签约摄影师认证状态 — 查看证书编号、签约时间与认证有效性。',
  },
}

export default defineConfig(({ mode }) => ({
  // GitHub Pages 项目页必须用绝对 base（'/contracted-photographer/'），
  // 否则 vue-router 的 web history 无法正确解析子路径导致白屏；
  // 本地预览用 '/' 即可
  base: process.env.GITHUB_ACTIONS === 'true'
    ? '/contracted-photographer/'
    : '/',
  plugins: [Vue()],
  // vite-ssg：构建期为每个预渲染页面注入路由专属 SEO meta
  ssgOptions: {
    onBeforePageRender(route: string, indexHTML: string) {
      const meta = PAGE_META[route]
      if (!meta?.title && !meta?.description)
        return indexHTML
      let html = indexHTML
      if (meta.title)
        html = html.replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`)
      if (meta.description)
        html = html.replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${meta.description}" />`)
      return html
    },
  },
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
