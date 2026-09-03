import { ref } from 'vue'
import type { gsap as GsapType } from 'gsap'
import type { ScrollTrigger } from 'gsap/ScrollTrigger'

/** gsap 命名空间（含已注册的 ScrollTrigger） */
export interface GsapBundle {
  gsap: typeof GsapType
  ScrollTrigger: typeof ScrollTrigger
}

let gsapPromise: Promise<GsapBundle> | null = null
const gsapRef = ref<GsapBundle | null>(null)

/**
 * 懒加载 GSAP（含 ScrollTrigger 注册）。
 * SSG 构建期返回 null，避免在 Node 中执行浏览器 API。
 */
export async function useGsap(): Promise<GsapBundle | null> {
  if (import.meta.env.SSR)
    return null
  if (!gsapPromise) {
    gsapPromise = (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      gsap.registerPlugin(ScrollTrigger)
      return { gsap, ScrollTrigger }
    })()
  }
  const bundle = await gsapPromise
  gsapRef.value = bundle
  return bundle
}

/** 同步获取已加载的 gsap（未加载时为 null） */
export function getGsap(): GsapBundle | null {
  return gsapRef.value
}
