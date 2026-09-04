<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { VerifyPayload } from '@/types'
import { formatSignedDate, parseVerifyQuery } from '@/utils/cert'
import { useGsap } from '@/composables/useGsap'
import { trackEvent } from '@/composables/useAnalytics'

const route = useRoute()

const payload = ref<VerifyPayload | null>(null)
const checking = ref(true)

onMounted(async () => {
  // 从 URL 查询参数解析认证数据
  const query = typeof route.query === 'object' ? window.location.search : ''
  payload.value = parseVerifyQuery(query)
  checking.value = false

  // 上报验证来源（referrer 为扫码进入的浏览器 app 时通常为空）
  trackEvent('cert_verify', {
    valid: payload.value !== null,
    from_scan: document.referrer === '' || document.referrer.includes('google'),
    referrer: document.referrer || 'direct',
  })

  // 入场动效
  const gsap = await useGsap()
  if (!gsap)
    return
  const { gsap: g } = gsap
  g.from('.verify-card', { y: 40, opacity: 0, duration: 0.8, ease: 'power3.out' })
  if (payload.value) {
    g.from('.verify-badge', { scale: 0, duration: 0.7, delay: 0.3, ease: 'elastic.out(1, 0.5)' })
    g.from('.verify-row', { y: 14, opacity: 0, stagger: 0.08, duration: 0.5, delay: 0.5, ease: 'power2.out' })
  }
})

const initials = computed(() => payload.value?.n.trim().slice(0, 1) || '·')
</script>

<template>
  <main class="verify-page">
    <div class="container">
      <!-- 校验中 -->
      <div v-if="checking" class="verify-card">
        <div class="checking-ring" />
        <p class="checking-text">正在验证认证信息…</p>
      </div>

      <!-- 验证成功 -->
      <div v-else-if="payload" class="verify-card verified">
        <div class="verify-badge">
          <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.6">
            <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.4 7.2 16.9l.9-5.4L4.2 7.7l5.4-.8L12 2z" />
          </svg>
        </div>
        <span class="verify-tag">VERIFIED</span>
        <h1 class="verify-title">认证有效</h1>
        <p class="verify-desc">该摄影师已通过签约认证，以下为其认证信息</p>

        <div class="verify-profile">
          <div class="verify-avatar">{{ initials }}</div>
          <div class="verify-name-block">
            <h2 class="verify-name">{{ payload.n }}</h2>
            <span class="verify-role">签约摄影师 · CONTRACTED PHOTOGRAPHER</span>
          </div>
        </div>

        <div class="verify-rows">
          <div class="verify-row">
            <span class="row-label">证书编号</span>
            <span class="row-value mono">{{ payload.c }}</span>
          </div>
          <div class="verify-row">
            <span class="row-label">签约时间</span>
            <span class="row-value mono">{{ formatSignedDate(payload.t) }}</span>
          </div>
          <div class="verify-row">
            <span class="row-label">认证状态</span>
            <span class="row-value status">● 有效 ACTIVE</span>
          </div>
        </div>

        <p class="verify-footnote">本页面由签约摄影师认证计划提供 · 验证时间 {{ new Date().toLocaleString('zh-CN') }}</p>
      </div>

      <!-- 验证失败 -->
      <div v-else class="verify-card invalid">
        <div class="verify-badge invalid-badge">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
        </div>
        <span class="verify-tag invalid-tag">NOT FOUND</span>
        <h1 class="verify-title">无法验证</h1>
        <p class="verify-desc">认证信息缺失或链接无效，请扫描铭牌上的二维码重试</p>
        <router-link class="btn" to="/">返回首页</router-link>
      </div>
    </div>
  </main>
</template>

<style scoped>
.verify-page {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
}

.container {
  display: flex;
  justify-content: center;
}

.verify-card {
  width: min(460px, 100%);
  padding: 52px 44px 40px;
  border-radius: 20px;
  border: 1px solid var(--white-10);
  background: rgba(16, 16, 18, 0.85);
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* 校验中 */
.checking-ring {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--white-16);
  border-top-color: var(--white-80);
  animation: spin 1s linear infinite;
  margin-bottom: 24px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.checking-text {
  font-size: 14px;
  color: var(--text-dim);
  letter-spacing: 0.08em;
}

/* 徽章 */
.verify-badge {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--white-100);
  border: 1px solid var(--white-24);
  background: var(--white-06);
  margin-bottom: 26px;
}

.invalid-badge {
  color: var(--white-60);
}

.verify-tag {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.4em;
  text-indent: 0.4em;
  color: var(--white-60);
  margin-bottom: 14px;
}

.invalid-tag {
  color: var(--text-faint);
}

.verify-title {
  font-family: var(--font-serif);
  font-size: 30px;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.verify-desc {
  margin-top: 14px;
  font-size: 13.5px;
  color: var(--text-dim);
  line-height: 1.9;
}

/* 档案 */
.verify-profile {
  margin-top: 36px;
  display: flex;
  align-items: center;
  gap: 18px;
  width: 100%;
  padding: 20px 22px;
  border-radius: 14px;
  border: 1px solid var(--white-06);
  background: var(--white-02);
}

.verify-avatar {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  border: 1px solid var(--white-16);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-serif);
  font-size: 24px;
  color: var(--white-60);
  flex-shrink: 0;
}

.verify-name-block {
  text-align: left;
  min-width: 0;
}

.verify-name {
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.1em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.verify-role {
  display: block;
  margin-top: 4px;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.2em;
  color: var(--text-faint);
}

/* 信息行 */
.verify-rows {
  margin-top: 22px;
  width: 100%;
  border-top: 1px solid var(--white-06);
  padding-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.verify-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.row-label {
  font-size: 12px;
  letter-spacing: 0.14em;
  color: var(--text-faint);
}

.row-value {
  font-family: var(--font-mono);
  font-size: 13.5px;
  color: var(--white-80);
  letter-spacing: 0.05em;
}

.row-value.status {
  color: var(--white-100);
}

.verify-footnote {
  margin-top: 30px;
  font-size: 10.5px;
  color: var(--text-faint);
  font-family: var(--font-mono);
  letter-spacing: 0.04em;
}

.mono {
  font-family: var(--font-mono);
}

@media (max-width: 520px) {
  .verify-card {
    padding: 40px 26px 32px;
  }
}
</style>
