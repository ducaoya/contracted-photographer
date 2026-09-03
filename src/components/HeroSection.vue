<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useGsap } from '@/composables/useGsap'

const emit = defineEmits<{ start: [] }>()

const titleLine1 = '签约摄影师'.split('')
const titleLine2 = '认证计划'.split('')

const rootRef = ref<HTMLElement | null>(null)
const titleRef = ref<HTMLElement | null>(null)
const ctaRef = ref<HTMLElement | null>(null)

let cleanup: (() => void) | null = null

onMounted(async () => {
  const gsap = await useGsap()
  if (!gsap || !rootRef.value)
    return

  const { gsap: g } = gsap
  const chars = titleRef.value!.querySelectorAll<HTMLElement>('.char')
  const tl = g.timeline({ defaults: { ease: 'power3.out' } })
  tl.from('.hero-badge', { y: 24, opacity: 0, duration: 0.7 })
    .from(chars, { y: 90, opacity: 0, stagger: 0.05, duration: 0.9 }, '-=0.3')
    .from('.hero-sub', { y: 26, opacity: 0, duration: 0.7 }, '-=0.5')
    .from('.hero-cta .btn', { y: 22, opacity: 0, stagger: 0.12, duration: 0.6 }, '-=0.4')
    .from('.hero-meta-item', { y: 18, opacity: 0, stagger: 0.1, duration: 0.55 }, '-=0.35')
    .from('.scroll-hint', { opacity: 0, duration: 0.8 }, '-=0.2')

  // CTA 磁吸
  const btn = ctaRef.value
  const onMove = (e: MouseEvent) => {
    const r = btn!.getBoundingClientRect()
    const x = e.clientX - r.left - r.width / 2
    const y = e.clientY - r.top - r.height / 2
    g.to(btn, { x: x * 0.22, y: y * 0.3, duration: 0.4, ease: 'power2.out' })
  }
  const onLeave = () => g.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' })
  btn?.addEventListener('mousemove', onMove)
  btn?.addEventListener('mouseleave', onLeave)

  cleanup = () => {
    btn?.removeEventListener('mousemove', onMove)
    btn?.removeEventListener('mouseleave', onLeave)
  }
})

onBeforeUnmount(() => cleanup?.())

function onStart() {
  emit('start')
}
</script>

<template>
  <section ref="rootRef" id="hero" class="hero">
    <div class="container hero-inner">
      <div class="hero-badge">CONTRACTED PHOTOGRAPHER PROGRAM</div>
      <h1 ref="titleRef" class="hero-title">
        <span class="line">
          <span v-for="(c, i) in titleLine1" :key="`a-${i}`" class="char">{{ c }}</span>
        </span>
        <span class="line line-2">
          <span v-for="(c, i) in titleLine2" :key="`b-${i}`" class="char">{{ c }}</span>
        </span>
      </h1>
      <p class="hero-sub">
        完成签约，即刻获得官方认证的摄影师身份铭牌。<br />
        每一枚铭牌拥有唯一证书编号，扫码即可验证认证状态。
      </p>
      <div class="hero-cta">
        <button ref="ctaRef" class="btn btn-solid" @click="onStart">
          立即签约
        </button>
        <a class="btn" href="#features">了解计划</a>
      </div>
      <div class="hero-meta">
        <div class="hero-meta-item"><strong>唯一编号</strong><span>身份可验证</span></div>
        <div class="hero-meta-item"><strong>扫码认证</strong><span>全球可查</span></div>
        <div class="hero-meta-item"><strong>本地签发</strong><span>隐私安全</span></div>
      </div>
    </div>
    <div class="scroll-hint">
      <span class="mouse"><span class="wheel" /></span>
      <span class="hint-text">SCROLL</span>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 120px 0 80px;
}

.hero-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.hero-badge {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.42em;
  text-indent: 0.42em;
  color: var(--white-60);
  border: 1px solid var(--white-16);
  padding: 8px 22px;
  border-radius: 999px;
  margin-bottom: 36px;
}

.hero-title {
  font-family: var(--font-serif);
  font-weight: 900;
  font-size: clamp(44px, 8vw, 92px);
  line-height: 1.16;
  letter-spacing: 0.08em;
  display: flex;
  flex-direction: column;
  color: var(--white-100);
}

.hero-title .line {
  display: block;
  overflow: hidden;
  padding-bottom: 0.08em;
}

.hero-title .line-2 {
  color: var(--white-40);
}

.hero-sub {
  margin-top: 30px;
  font-size: 15px;
  line-height: 2.1;
  color: var(--text-dim);
  max-width: 520px;
  letter-spacing: 0.04em;
}

.hero-cta {
  margin-top: 46px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.hero-meta {
  margin-top: 72px;
  display: flex;
  gap: 64px;
}

.hero-meta-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.hero-meta-item strong {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: var(--white-80);
}

.hero-meta-item span {
  font-size: 11px;
  letter-spacing: 0.22em;
  color: var(--text-faint);
}

.scroll-hint {
  position: absolute;
  bottom: 34px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.mouse {
  width: 20px;
  height: 32px;
  border: 1px solid var(--white-24);
  border-radius: 10px;
  display: flex;
  justify-content: center;
  padding-top: 6px;
}

.wheel {
  width: 2px;
  height: 6px;
  border-radius: 2px;
  background: var(--white-60);
  animation: wheel 1.6s ease-in-out infinite;
}

@keyframes wheel {
  0% { transform: translateY(0); opacity: 1; }
  70% { transform: translateY(10px); opacity: 0; }
  100% { transform: translateY(0); opacity: 0; }
}

.hint-text {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.34em;
  color: var(--text-faint);
}

@media (max-width: 768px) {
  .hero {
    padding-top: 96px;
  }
  .hero-meta {
    gap: 28px;
  }
}
</style>
