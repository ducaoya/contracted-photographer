<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CertIdentity, PhotographerProfile, TemplateId } from '@/types'
import { TEMPLATES } from '@/types'
import { useGsap } from '@/composables/useGsap'
import { useProfile } from '@/composables/useProfile'
import BadgeCard from '@/components/BadgeCard.vue'
import { exportBadgePng } from '@/utils/export'

const props = defineProps<{
  profile: PhotographerProfile
  template: TemplateId
  identity: CertIdentity | null
}>()

const { template: sharedTemplate } = useProfile()

const badgeRef = ref<InstanceType<typeof BadgeCard> | null>(null)
const cardElRef = ref<HTMLElement | null>(null)
const exporting = ref(false)
const toast = ref('')

let toastTimer: number | undefined

function showToast(msg: string) {
  toast.value = msg
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.value = ''), 2600)
}

const currentTemplate = computed(() => props.template)
const canExport = computed(() => !!props.identity && props.profile.name.trim().length > 0)

async function switchTemplate(id: TemplateId) {
  if (id === props.template)
    return
  const gsap = await useGsap()
  const el = cardElRef.value?.querySelector('.badge-card-3d') ?? cardElRef.value
  if (!gsap || !el) {
    sharedTemplate.value = id
    return
  }
  const { gsap: g } = gsap
  await g.to(el, {
    rotateY: 90,
    scale: 0.88,
    duration: 0.32,
    ease: 'power2.in',
    transformPerspective: 900,
  })
  sharedTemplate.value = id
  await g.to(el, {
    rotateY: 0,
    scale: 1,
    duration: 0.5,
    ease: 'power3.out',
    transformPerspective: 900,
  })
}

async function onExport() {
  const front = badgeRef.value?.frontNode
  const back = badgeRef.value?.backNode
  if (!front || !back || !canExport.value)
    return
  exporting.value = true
  try {
    // 导出前瞬间复位到正面，避免倾斜状态影响截图
    badgeRef.value?.resetFlip()
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
    await exportBadgePng(front, back, {
      scale: 2,
      name: props.profile.name,
      template: props.template,
    })
    showToast('✓ 已导出正反两面铭牌')
  }
  catch (e) {
    console.error(e)
    showToast('导出失败，请重试')
  }
  finally {
    exporting.value = false
  }
}

function onPrint() {
  if (!canExport.value)
    return
  badgeRef.value?.resetFlip()
  document.body.classList.add('printing')
  const cleanup = () => {
    document.body.classList.remove('printing')
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  window.setTimeout(cleanup, 2000)
  window.print()
}

// 姓名变化时铭牌微弹
watch(
  () => props.profile.name,
  async () => {
    const gsap = await useGsap()
    if (!gsap || !cardElRef.value)
      return
    gsap.gsap.fromTo(
      cardElRef.value.querySelector('.badge-name'),
      { scale: 1 },
      { scale: 1.03, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.inOut' },
    )
  },
)

onMounted(async () => {
  const gsap = await useGsap()
  if (!gsap)
    return
  const { gsap: g } = gsap
  g.from('.preview-panel', {
    y: 50,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.preview-panel', start: 'top 85%' },
  })
})

onBeforeUnmount(() => {
  window.clearTimeout(toastTimer)
})
</script>

<template>
  <div class="badge-preview">
    <div class="preview-panel">
      <div class="preview-toolbar">
        <div class="tpl-tabs">
          <button
            v-for="t in TEMPLATES"
            :key="t.id"
            class="tpl-tab"
            :class="{ active: currentTemplate === t.id }"
            :title="t.desc"
            @click="switchTemplate(t.id)"
          >
            {{ t.label }}
          </button>
        </div>
        <div class="export-ops">
          <button class="btn btn-sm btn-solid" :disabled="exporting || !canExport" @click="onExport">
            {{ exporting ? '导出中…' : '导出铭牌' }}
          </button>
          <button class="btn btn-sm" :disabled="!canExport" @click="onPrint">打印</button>
        </div>
      </div>

      <div id="print-area" class="print-area">
        <div ref="cardElRef" class="card-stage">
          <BadgeCard ref="badgeRef" :profile="profile" :template="currentTemplate" :identity="identity" />
        </div>
      </div>

      <div class="stage-hints">
        <span class="stage-hint">🖱 悬停倾斜 · 点击翻面</span>
      </div>

      <p v-if="!canExport" class="preview-hint">在左侧输入姓名并签署合约后，铭牌将自动生成</p>

      <Transition name="toast">
        <div v-if="toast" class="toast">{{ toast }}</div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.badge-preview {
  position: sticky;
  top: 24px;
}

.preview-panel {
  position: relative;
  padding: 26px;
  border-radius: var(--radius);
  border: 1px solid var(--white-06);
  background: var(--white-02);
  backdrop-filter: blur(14px);
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}

.tpl-tabs {
  display: flex;
  gap: 6px;
  padding: 4px;
  border: 1px solid var(--white-06);
  border-radius: 999px;
}

.tpl-tab {
  padding: 8px 20px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: var(--text-faint);
  font-size: 12.5px;
  letter-spacing: 0.08em;
  transition: all 0.25s ease;
}

.tpl-tab:hover {
  color: var(--white-80);
}

.tpl-tab.active {
  background: var(--white-100);
  color: #0a0a0b;
}

.export-ops {
  display: flex;
  gap: 8px;
  align-items: center;
}

.print-area {
  display: flex;
  justify-content: center;
  padding: 22px 0 8px;
  min-width: 0;
  overflow: hidden;
}

.card-stage {
  perspective: 1400px;
  transform-origin: top center;
}

.stage-hints {
  display: flex;
  justify-content: center;
  padding-bottom: 4px;
}

.stage-hint {
  font-size: 11.5px;
  color: var(--text-faint);
  letter-spacing: 0.1em;
}

.preview-hint {
  text-align: center;
  font-size: 12.5px;
  color: var(--text-faint);
  letter-spacing: 0.06em;
  padding-bottom: 6px;
}

.toast {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  padding: 10px 22px;
  border-radius: 999px;
  background: rgba(16, 16, 18, 0.94);
  border: 1px solid var(--white-16);
  color: var(--white-100);
  font-size: 13px;
  white-space: nowrap;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

@media (max-width: 1080px) {
  .badge-preview {
    position: static;
  }
}

@media (max-width: 480px) {
  .card-stage {
    zoom: 0.82;
  }
}
</style>
