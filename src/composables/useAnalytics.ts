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
 * gtag.js 加载完成前排队的事件。
 * 实测：gtag.js 不会回放加载前入队 dataLayer 的 event（仅处理 js/config），
 * 首屏 page_view 会因异步加载竞态丢失，因此需自行缓冲、就绪后补发。
 */
interface PendingHit {
  name: string
  params?: EventParams
}
const pendingHits: PendingHit[] = []
/** 排队上限：防止脚本被拦截器长期阻塞时无限增长 */
const MAX_PENDING_HITS = 50

/** 真正发送事件（仅在 gtag.js 就绪后调用） */
function sendEvent(name: string, params?: EventParams): void {
  window.gtag!('event', name, params ?? {})
}

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
  // 注意：必须用 arguments 形态（与官方片段一致）。
  // 实测：push 真数组会导致 gtm.js 静默丢弃 config 事件，
  // _ga cookie 不创建，后续所有事件永远不被发送
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    (window.dataLayer as unknown[]).push(arguments)
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
    const dl = window.dataLayer!

    const flushPending = () => {
      for (const hit of pendingHits.splice(0))
        sendEvent(hit.name, hit.params)
    }
    const hasGtmLoad = () =>
      dl.some(e => e !== null && typeof e === 'object' && (e as { event?: string }).event === 'gtm.load')

    // 实测：gtm.js 初始化完成（gtm.load）之前收到的事件会被静默丢弃，
    // 因此拦截 dataLayer.push，等 gtm.load 入队后立即补发
    if (hasGtmLoad()) {
      flushPending()
      return
    }
    const rawPush = dl.push.bind(dl)
    dl.push = (...args: unknown[]) => {
      const result = rawPush(...args)
      const entry = args[0] as { event?: string } | undefined
      if (entry && entry.event === 'gtm.load') {
        dl.push = rawPush
        flushPending()
      }
      return result
    }
    // 兜底：gtm.load 异常（如被拦截器干扰）时 5 秒后强制补发
    window.setTimeout(() => {
      if (dl.push !== rawPush)
        dl.push = rawPush
      flushPending()
    }, 5000)
  }
  script.onerror = () => {
    console.warn('[analytics] gtag.js 加载失败（可能被广告拦截器阻止）')
  }
  document.head.appendChild(script)
}

/** 上报页面浏览（SPA 路由变化时调用） */
export function trackPageview(path: string, title: string): void {
  if (!injected.value)
    return
  const params = {
    page_title: title,
    page_path: path,
    page_location: window.location.href,
  }
  if (!enabled.value) {
    // 脚本仍在加载：只保留最新一次 page_view，加载完成后补发
    const i = pendingHits.findIndex(hit => hit.name === 'page_view')
    if (i !== -1)
      pendingHits.splice(i, 1)
    pendingHits.push({ name: 'page_view', params })
    return
  }
  sendEvent('page_view', params)
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
  if (!injected.value)
    return
  if (!enabled.value) {
    // 脚本仍在加载：入队，加载完成后按序补发
    if (pendingHits.length < MAX_PENDING_HITS)
      pendingHits.push({ name, params })
    return
  }
  sendEvent(name, params)
}

/** 统计状态（调试用） */
export function getAnalyticsState() {
  return readonly({ injected, enabled, id: GA_MEASUREMENT_ID })
}
