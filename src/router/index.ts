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
    // SSG 构建期用 memory history，客户端激活用 web history
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes,
  })
}
