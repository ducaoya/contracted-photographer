import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/HomeView.vue'

export const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: {
      title: '签约摄影师认证 · Contracted Photographer Program',
      description: '签约摄影师认证计划 — 输入姓名完成签约，即刻获得唯一证书编号与专属认证铭牌。扫码即验认证状态，支持双面高清导出与打印，全程本地生成、隐私安全。',
    },
  },
  {
    path: '/verify',
    name: 'verify',
    component: () => import('@/views/VerifyView.vue'),
    meta: {
      title: '认证验证 · 签约摄影师认证',
      description: '扫码验证签约摄影师认证状态 — 查看证书编号、签约时间与认证有效性。',
    },
  },
  // 兜底：未知路径重定向首页，避免空白页
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/',
  },
]

export function createAppRouter() {
  return createRouter({
    // SSG 构建期用 memory history，客户端激活用 web history（带 Pages 项目的 base 路径）
    history: import.meta.env.SSR
      ? createMemoryHistory()
      : createWebHistory(import.meta.env.BASE_URL),
    routes,
  })
}
