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
  ({ app }) => {
    // 无需额外插件
    void app
  },
)
