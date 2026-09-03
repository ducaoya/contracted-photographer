import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/HomeView.vue'

export const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path: '/verify',
    name: 'verify',
    component: () => import('@/views/VerifyView.vue'),
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
