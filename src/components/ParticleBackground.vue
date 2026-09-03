<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { createParticleScene, type ParticleScene } from '@/composables/useParticles'

const props = defineProps<{ onBurst?: () => void }>()

const containerRef = ref<HTMLElement | null>(null)
let scene: ParticleScene | null = null

onMounted(async () => {
  if (!containerRef.value)
    return
  // WebGL 不可用时降级为 CSS 星空
  const test = document.createElement('canvas')
  const ok = !!(test.getContext('webgl2') || test.getContext('webgl'))
  if (!ok) {
    containerRef.value.classList.add('fallback')
    return
  }
  try {
    const { createParticleScene } = await import('@/composables/useParticles')
    scene = createParticleScene({ container: containerRef.value })
  }
  catch (e) {
    console.warn('[particles] 初始化失败，降级为 CSS 背景', e)
    containerRef.value.classList.add('fallback')
  }
})

onBeforeUnmount(() => {
  scene?.dispose()
})

defineExpose({ triggerBurst: () => scene?.triggerBurst() })
</script>

<template>
  <div ref="containerRef" class="particle-bg" aria-hidden="true" />
</template>

<style scoped>
.particle-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  /* 顶部轻微渐隐，保证 Hero 文案对比度 */
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 12%, #000 88%, transparent 100%);
  mask-image: linear-gradient(to bottom, transparent 0%, #000 12%, #000 88%, transparent 100%);
}

.particle-bg :global(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

/* WebGL 不可用时的 CSS 星空兜底（单色白） */
.particle-bg.fallback {
  background:
    radial-gradient(1.5px 1.5px at 12% 22%, rgba(255, 255, 255, 0.5), transparent 60%),
    radial-gradient(1px 1px at 32% 68%, rgba(255, 255, 255, 0.35), transparent 60%),
    radial-gradient(2px 2px at 58% 18%, rgba(255, 255, 255, 0.4), transparent 60%),
    radial-gradient(1px 1px at 74% 52%, rgba(255, 255, 255, 0.3), transparent 60%),
    radial-gradient(1.5px 1.5px at 88% 78%, rgba(255, 255, 255, 0.3), transparent 60%),
    radial-gradient(ellipse 70% 55% at 50% 38%, rgba(255, 255, 255, 0.03), transparent 65%),
    #0a0a0b;
}

@media (prefers-reduced-motion: reduce) {
  .particle-bg {
    opacity: 0.5;
  }
}
</style>
