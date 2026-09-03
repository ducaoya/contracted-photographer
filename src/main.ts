import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { routes } from './router'
import './styles/main.css'

export const createApp = ViteSSG(App, { routes }, ({ app }) => {
  // 无需额外插件
  void app
})
