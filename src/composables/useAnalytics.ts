import { readonly, ref } from 'vue'

/**
 * GA4 计量 ID：通过环境变量 VITE_GA_ID 配置（.env / 部署环境注入）。
 * 未配置时所有埋点为 no-op，不注入任何脚本，不影响性能。
 */
export const GA_MEASUREMENT_ID: string = import.meta.env.VITE_GA_ID ?? ''

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

/** 脚本是否已注入 */
const injected = ref(false)
/** GA 是否可用（已配置且注入成功） */
const enabled = ref(false)

/**
 * 注入 gtag.js（动态加载，不阻塞首屏）。
 * 幂等：多次调用只注入一次。
 */
export function initAnalytics(): void {
  if (import.meta.env.SSR || injected.value)
    return
  if (!GA_MEASUREMENT_ID || !/^G-[A-Z0-9]+$/.test(GA_MEASUREMENT_ID)) {
    // 未配置或 ID 格式非法：静默跳过
    if (GA_MEASUREMENT_ID)
      console.warn(`[analytics] VITE_GA_ID 格式非法: ${GA_MEASUREMENT_ID}（应为 G-XXXXXXXXXX），已跳过初始化`)
    return
  }

  injected.value = true

  // 标准 gtag 引导片段
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_MEASUREMENT_ID, {
    // 页面浏览由 we track on route change 手动触发，避免 SPA 重复上报
    send_page_view: false,
  })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  script.onload = () => {
    enabled.value = true
  }
  script.onerror = () => {
    console.warn('[analytics] gtag.js 加载失败（可能被广告拦截器阻止）')
  }
  document.head.appendChild(script)
}

/** 上报页面浏览（SPA 路由变化时调用） */
export function trackPageview(path: string, title: string): void {
  if (!enabled.value || !window.gtag)
    return
  window.gtag('event', 'page_view', {
    page_title: title,
    page_path: path,
    page_location: window.location.href,
  })
}

/** 业务事件参数 */
export interface EventParams {
  [key: string]: string | number | boolean | undefined
}

/**
 * 上报自定义业务事件。
 * 事件名遵循 GA4 规范：小写 + 下划线，长度 ≤ 40 字符。
 */
export function trackEvent(name: string, params?: EventParams): void {
  if (!enabled.value || !window.gtag)
    return
  window.gtag('event', name, params ?? {})
}

/** 统计状态（调试用） */
export function getAnalyticsState() {
  return readonly({ injected, enabled, id: GA_MEASUREMENT_ID })
}
