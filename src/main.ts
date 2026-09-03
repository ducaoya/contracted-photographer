import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { routes } from './router'
import './styles/main.css'

export const createApp = ViteSSG(
  App,
  {
    routes,
    // vite-ssg 客户端不会自动读取 Vite base，必须显式传入（GitHub Pages 项目页为子路径）
    base: import.meta.env.BASE_URL,
  },
  ({ app, router }) => {
    // SEO：客户端路由切换时同步 document title 与 meta description（仅浏览器环境）
    router.afterEach((to) => {
      if (typeof document === 'undefined')
        return
      const meta = to.meta as { title?: string; description?: string } | undefined
      if (meta?.title)
        document.title = meta.title
      if (meta?.description) {
        const desc = document.querySelector('meta[name="description"]')
        if (desc)
          desc.setAttribute('content', meta.description)
      }
    })
    void app
  },
)
