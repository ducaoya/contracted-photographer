<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CertIdentity, PhotographerProfile, TemplateId } from '@/types'
import { formatSignedDate } from '@/utils/cert'
import { generateVerifyQr } from '@/utils/qr'
import { buildVerifyUrl } from '@/utils/cert'
import { trackEvent } from '@/composables/useAnalytics'

const props = defineProps<{
  profile: PhotographerProfile
  template: TemplateId
  identity: CertIdentity | null
}>()

const rootRef = ref<HTMLElement | null>(null)
const frontRef = ref<HTMLElement | null>(null)
const backRef = ref<HTMLElement | null>(null)
const innerRef = ref<HTMLElement | null>(null)

defineExpose({
  /** 正面节点（导出目标之一） */
  frontNode: frontRef,
  /** 背面节点（导出目标之一） */
  backNode: backRef,
  /** 瞬间复位翻面 */
  resetFlip,
})

const initials = computed(() => props.profile.name.trim().slice(0, 1) || '影')

const flipped = ref(false)
const tiltX = ref(0)
const tiltY = ref(0)
const glareX = ref(50)
const glareY = ref(50)

const MAX_TILT = 9

function onPointerMove(e: PointerEvent) {
  const el = rootRef.value
  if (!el)
    return
  const r = el.getBoundingClientRect()
  const px = (e.clientX - r.left) / r.width
  const py = (e.clientY - r.top) / r.height
  glareX.value = px * 100
  glareY.value = py * 100
  // 翻面后水平轴镜像，取反保持倾斜方向与光标一致
  const dir = flipped.value ? -1 : 1
  tiltY.value = (px - 0.5) * 2 * MAX_TILT * dir
  tiltX.value = -(py - 0.5) * 2 * MAX_TILT
}

function onPointerLeave() {
  tiltX.value = 0
  tiltY.value = 0
  glareX.value = 50
  glareY.value = 50
}

function toggleFlip() {
  flipped.value = !flipped.value
  trackEvent('badge_flip', { to: flipped.value ? 'back' : 'front', template: props.template })
}

function resetFlip() {
  const inner = innerRef.value
  if (inner) {
    inner.style.transition = 'none'
    flipped.value = false
    requestAnimationFrame(() => {
      inner.style.transition = ''
    })
  }
}

const qrDataUrl = ref('')

// 生成真实可扫的认证二维码
watch(
  () => [props.identity?.certNo, props.identity?.signedAt, props.profile.name, props.template] as const,
  async ([certNo, signedAt, name, template]) => {
    if (!certNo || !signedAt || !name.trim()) {
      qrDataUrl.value = ''
      return
    }
    const url = buildVerifyUrl({ n: name.trim(), c: certNo, t: signedAt })
    // noir 用深古铜色（金色系但亮度足够低，保证扫码成功率）；studio 用近黑
    const dark = template === 'noir' ? '#3a2e10' : '#111111'
    qrDataUrl.value = await generateVerifyQr(url, { dark, light: '#ffffff', size: 360, margin: 2 })
  },
  { immediate: true },
)
</script>

<template>
  <div
    ref="rootRef"
    class="badge-card-3d"
    :class="`tpl-${template}`"
    role="button"
    tabindex="0"
    :aria-label="flipped ? '翻回铭牌正面' : '翻看铭牌背面'"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
    @click="toggleFlip"
    @keydown.enter.prevent="toggleFlip"
    @keydown.space.prevent="toggleFlip"
  >
    <!-- 倾斜层（鼠标跟随） -->
    <div class="badge-tilt" :style="{ transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)` }">
      <!-- 翻面层 -->
      <div ref="innerRef" class="badge-card-inner" :class="{ flipped }">
        <!-- ============ 正面 ============ -->
        <div ref="frontRef" class="badge-card badge-face badge-face-front">
          <div class="face-frame" aria-hidden="true"></div>
          <div class="face-frame frame-2" aria-hidden="true"></div>

          <header class="badge-header">
            <div class="badge-brand">
              <svg class="badge-logo" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.4">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12l3 3 5-6" />
              </svg>
              <span class="badge-brand-text">CONTRACTED PHOTOGRAPHER</span>
            </div>
            <span class="badge-year mono">{{ identity ? new Date(identity.signedAt).getFullYear() : '—' }}</span>
          </header>

          <div class="badge-main">
            <div class="badge-avatar-wrap">
              <div class="badge-avatar">
                <img v-if="profile.avatar" :src="profile.avatar" alt="" />
                <span v-else class="badge-initial">{{ initials }}</span>
              </div>
            </div>
            <h3 class="badge-name">{{ profile.name || '你的名字' }}</h3>
            <div class="badge-title">签约摄影师 · CERTIFIED</div>
            <div class="badge-divider"><span class="divider-dot" /></div>
          </div>

          <div class="badge-info">
            <div class="badge-info-row">
              <span class="badge-info-label">CERT NO.</span>
              <span class="badge-info-value mono">{{ identity?.certNo ?? '—' }}</span>
            </div>
            <div class="badge-info-row">
              <span class="badge-info-label">SIGNED</span>
              <span class="badge-info-value mono">{{ identity ? formatSignedDate(identity.signedAt) : '—' }}</span>
            </div>
            <div class="badge-info-row">
              <span class="badge-info-label">STATUS</span>
              <span class="badge-info-value status">● ACTIVE</span>
            </div>
          </div>

          <footer class="badge-footer">
            <span class="front-footnote">翻转卡片，扫码验证认证</span>
          </footer>

          <div class="card-glare" :style="{ '--gx': `${glareX}%`, '--gy': `${glareY}%` }" aria-hidden="true"></div>
        </div>

        <!-- ============ 背面（相机 logo + 二维码验证） ============ -->
        <div ref="backRef" class="badge-card badge-face badge-face-back">
          <div class="face-frame" aria-hidden="true"></div>
          <div class="face-frame frame-2" aria-hidden="true"></div>

          <!-- 相机 logo -->
          <div class="back-camera" aria-hidden="true">
            <svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.6">
              <!-- 机身 -->
              <rect x="6" y="14" width="36" height="26" rx="4" />
              <!-- 取景器 -->
              <path d="M17 14l3-5h8l3 5" stroke-linejoin="round" />
              <!-- 镜头 -->
              <circle cx="24" cy="27" r="8" />
              <circle cx="24" cy="27" r="3.5" opacity="0.6" />
              <!-- 快门按钮 -->
              <path d="M34 10v4" stroke-linecap="round" />
            </svg>
          </div>

          <div class="back-main">
            <h4 class="back-name">{{ profile.name || '——' }}</h4>
            <div class="back-cert-no mono">{{ identity?.certNo ?? 'CP-————-————' }}</div>
          </div>

          <footer class="back-footer">
            <div class="badge-qr">
              <img v-if="qrDataUrl" :src="qrDataUrl" alt="认证二维码" />
              <div v-else class="qr-placeholder">
                <span>QR</span>
              </div>
            </div>
            <div class="badge-verify">
              <span class="verify-text">扫码验证认证</span>
              <span class="verify-sub mono">SCAN TO VERIFY</span>
            </div>
          </footer>

          <div class="card-glare" :style="{ '--gx': `${glareX}%`, '--gy': `${glareY}%` }" aria-hidden="true"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============ 3D 结构 ============ */
.badge-card-3d {
  position: relative;
  width: 420px;
  height: 560px;
  transform-style: preserve-3d;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  outline: none;
}

.badge-tilt {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transition: transform 0.18s ease-out;
  will-change: transform;
}

.badge-card-inner {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transition: transform 0.85s cubic-bezier(0.22, 0.9, 0.24, 1);
  will-change: transform;
}

.badge-card-inner.flipped {
  transform: rotateY(180deg);
}

.badge-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.badge-face-back {
  transform: rotateY(180deg);
}

/* ============ 面基础 ============ */
.badge-card {
  width: 100%;
  height: 100%;
  padding: 36px 38px 32px;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  font-family: var(--font-sans);
  isolation: isolate;
}

.face-frame {
  position: absolute;
  inset: 10px;
  border: 1px solid;
  border-radius: 14px;
  pointer-events: none;
}

.face-frame.frame-2 {
  inset: 14px;
  border-radius: 11px;
  opacity: 0.45;
}

/* 光泽层 */
.card-glare {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background: radial-gradient(
    circle at var(--gx, 50%) var(--gy, 50%),
    rgba(255, 255, 255, 0.13),
    rgba(255, 255, 255, 0.03) 32%,
    transparent 58%
  );
  opacity: 0;
  transition: opacity 0.35s ease;
}

.badge-card-3d:hover .card-glare {
  opacity: 1;
}

/* ============ 模板：黑金典藏 noir ============ */
.tpl-noir .badge-face-front {
  background: linear-gradient(168deg, #141312 0%, #0b0a09 52%, #12100d 100%);
  color: #f0e9d8;
  border: 1px solid rgba(212, 175, 55, 0.4);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.8);
}

.tpl-noir .badge-face-back {
  background:
    radial-gradient(ellipse 90% 40% at 50% 0%, rgba(212, 175, 55, 0.1), transparent 60%),
    linear-gradient(200deg, #12100d 0%, #0b0a09 48%, #161310 100%);
  color: #f0e9d8;
  border: 1px solid rgba(212, 175, 55, 0.4);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.8);
}

/* 背面扭索纹（guilloche） */
.tpl-noir .badge-face-back::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-radial-gradient(
    circle at 50% 34%,
    transparent 0 13px,
    rgba(212, 175, 55, 0.045) 13px 14px
  );
  pointer-events: none;
}

.tpl-noir .face-frame { border-color: rgba(212, 175, 55, 0.22); }
.tpl-noir .badge-brand-text { color: rgba(212, 175, 55, 0.9); }
.tpl-noir .badge-logo { color: #d4af37; }
.tpl-noir .badge-year { color: rgba(212, 175, 55, 0.6); }
.tpl-noir .badge-avatar { border: 1.5px solid rgba(212, 175, 55, 0.65); box-shadow: 0 0 0 6px rgba(212, 175, 55, 0.06); }
.tpl-noir .badge-name { color: #f5efdc; text-shadow: 0 1px 24px rgba(212, 175, 55, 0.25); }
.tpl-noir .badge-title { color: #d4af37; }
.tpl-noir .divider-dot { background: #d4af37; }
.tpl-noir .badge-info { border-color: rgba(212, 175, 55, 0.25); }
.tpl-noir .badge-info-label { color: rgba(212, 175, 55, 0.55); }
.tpl-noir .badge-info-value { color: #f0e9d8; }
.tpl-noir .badge-info-value.status { color: #d4af37; }
.tpl-noir .verify-text { color: rgba(240, 233, 216, 0.75); }
.tpl-noir .verify-sub { color: rgba(212, 175, 55, 0.45); }
.tpl-noir .badge-qr { border-color: rgba(212, 175, 55, 0.35); background: #fff; }
.tpl-noir .qr-placeholder { color: rgba(212, 175, 55, 0.4); }
.tpl-noir .card-glare {
  background: radial-gradient(
    circle at var(--gx, 50%) var(--gy, 50%),
    rgba(212, 175, 55, 0.16),
    rgba(255, 255, 255, 0.04) 30%,
    transparent 60%
  );
}
/* 背面元素 */
.tpl-noir .back-camera { color: #d4af37; }
.tpl-noir .back-name { color: #f5efdc; }
.tpl-noir .back-cert-no { color: #d4af37; border-color: rgba(212, 175, 55, 0.3); background: rgba(212, 175, 55, 0.05); }
.tpl-noir .verify-text { color: rgba(240, 233, 216, 0.75); }
.tpl-noir .verify-sub { color: rgba(212, 175, 55, 0.45); }
.tpl-noir .badge-qr { border-color: rgba(212, 175, 55, 0.35); background: #fff; }
.tpl-noir .qr-placeholder { color: rgba(212, 175, 55, 0.4); }

/* ============ 模板：纯白极简 studio ============ */
.tpl-studio .badge-face-front {
  background: linear-gradient(176deg, #ffffff 0%, #f6f6f4 100%);
  color: #141414;
  border: 1px solid rgba(20, 20, 20, 0.1);
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.45);
}

.tpl-studio .badge-face-back {
  background: linear-gradient(176deg, #fafaf8 0%, #f0f0ec 100%);
  color: #141414;
  border: 1px solid rgba(20, 20, 20, 0.1);
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.45);
}

.tpl-studio .badge-face-back::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-radial-gradient(
    circle at 50% 34%,
    transparent 0 13px,
    rgba(20, 20, 20, 0.028) 13px 14px
  );
  pointer-events: none;
}

.tpl-studio .face-frame { border-color: rgba(20, 20, 20, 0.08); }
.tpl-studio .badge-brand-text { color: rgba(20, 20, 20, 0.55); }
.tpl-studio .badge-logo { color: #141414; }
.tpl-studio .badge-year { color: rgba(20, 20, 20, 0.4); }
.tpl-studio .badge-avatar { border: 1.5px solid rgba(20, 20, 20, 0.16); box-shadow: 0 12px 34px rgba(20, 20, 20, 0.1); }
.tpl-studio .badge-name { color: #111; }
.tpl-studio .badge-title { color: rgba(20, 20, 20, 0.5); }
.tpl-studio .divider-dot { background: #141414; }
.tpl-studio .badge-info { border-color: rgba(20, 20, 20, 0.1); }
.tpl-studio .badge-info-label { color: rgba(20, 20, 20, 0.42); }
.tpl-studio .badge-info-value { color: #141414; }
.tpl-studio .badge-info-value.status { color: #0a7d33; }
.tpl-studio .verify-text { color: rgba(20, 20, 20, 0.65); }
.tpl-studio .verify-sub { color: rgba(20, 20, 20, 0.35); }
.tpl-studio .badge-qr { border-color: rgba(20, 20, 20, 0.12); background: #fff; }
.tpl-studio .qr-placeholder { color: rgba(20, 20, 20, 0.25); }
.tpl-studio .card-glare {
  background: radial-gradient(
    circle at var(--gx, 50%) var(--gy, 50%),
    rgba(255, 255, 255, 0.65),
    rgba(255, 255, 255, 0.12) 30%,
    transparent 58%
  );
}
.tpl-studio .back-camera { color: #141414; }
.tpl-studio .back-name { color: #111; }
.tpl-studio .back-cert-no { color: #141414; border-color: rgba(20, 20, 20, 0.14); background: rgba(20, 20, 20, 0.03); }
.tpl-studio .verify-text { color: rgba(20, 20, 20, 0.65); }
.tpl-studio .verify-sub { color: rgba(20, 20, 20, 0.35); }
.tpl-studio .badge-qr { border-color: rgba(20, 20, 20, 0.12); background: #fff; }
.tpl-studio .qr-placeholder { color: rgba(20, 20, 20, 0.25); }

/* ============ 正面通用元素 ============ */
.badge-header {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.badge-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.badge-brand-text {
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.26em;
  font-weight: 600;
}

.badge-year {
  font-size: 11px;
  letter-spacing: 0.14em;
}

.badge-main {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.badge-avatar {
  width: 116px;
  height: 116px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(127, 127, 127, 0.12);
}

.badge-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge-initial {
  font-family: var(--font-serif);
  font-size: 44px;
  font-weight: 700;
  opacity: 0.5;
}

.badge-name {
  margin-top: 24px;
  font-family: var(--font-serif);
  font-size: 34px;
  font-weight: 900;
  letter-spacing: 0.14em;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge-title {
  margin-top: 10px;
  font-size: 11px;
  letter-spacing: 0.42em;
  text-indent: 0.42em;
  font-weight: 500;
}

.badge-divider {
  margin-top: 26px;
  display: flex;
  align-items: center;
}

.divider-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  opacity: 0.7;
}

.badge-info {
  margin-top: 26px;
  width: 100%;
  border-top: 1px solid;
  border-bottom: 1px solid;
  padding: 14px 6px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.badge-info-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.badge-info-label {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.22em;
}

.badge-info-value {
  font-family: var(--font-mono);
  font-size: 12.5px;
  letter-spacing: 0.06em;
}

.badge-info-value.status {
  font-size: 10.5px;
  letter-spacing: 0.14em;
}

.badge-footer {
  margin-top: auto;
  width: 100%;
  padding-top: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.front-footnote {
  font-size: 11px;
  letter-spacing: 0.28em;
  text-indent: 0.28em;
  opacity: 0.5;
}

.badge-qr {
  width: 92px;
  height: 92px;
  border: 1px solid;
  border-radius: 10px;
  padding: 8px;
  flex-shrink: 0;
  background: #fff;
}

.badge-qr img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

.qr-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.badge-verify {
  display: flex;
  flex-direction: column;
  gap: 5px;
  text-align: left;
}

.verify-text {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.1em;
}

.verify-sub {
  font-size: 8.5px;
  letter-spacing: 0.3em;
}

/* ============ 背面元素 ============ */
.back-camera {
  margin-top: 54px;
  opacity: 0.9;
  filter: drop-shadow(0 2px 10px rgba(0, 0, 0, 0.25));
}

.back-main {
  margin-top: 26px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  position: relative;
}

.back-name {
  font-family: var(--font-serif);
  font-size: 26px;
  font-weight: 900;
  letter-spacing: 0.16em;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.back-cert-no {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.18em;
  padding: 10px 24px;
  border-top: 1px solid;
  border-bottom: 1px solid;
  border-radius: 2px;
}

.back-footer {
  margin-top: auto;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding-top: 20px;
  padding-bottom: 8px;
}

.mono {
  font-family: var(--font-mono);
}

@media (prefers-reduced-motion: reduce) {
  .badge-card-inner {
    transition-duration: 0.01s;
  }
  .badge-tilt {
    transition: none;
  }
}
</style>
