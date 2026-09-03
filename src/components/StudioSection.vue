<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { CertIdentity, PhotographerProfile, TemplateId } from '@/types'
import { useGsap } from '@/composables/useGsap'
import ContractForm from '@/components/ContractForm.vue'
import BadgePreview from '@/components/BadgePreview.vue'

const props = defineProps<{
  profile: PhotographerProfile
  template: TemplateId
  identity: CertIdentity | null
  signing: boolean
  signStage: string
  canSign: boolean
}>()

const emit = defineEmits<{
  sign: []
  resign: []
}>()

const rootRef = ref<HTMLElement | null>(null)

onMounted(async () => {
  const gsap = await useGsap()
  if (!gsap)
    return
  const { gsap: g } = gsap
  g.from('.studio-head', {
    y: 40,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out',
    scrollTrigger: { trigger: rootRef.value, start: 'top 80%' },
  })
})
</script>

<template>
  <section ref="rootRef" id="studio" class="studio">
    <div class="container">
      <div class="studio-head">
        <span class="studio-tag">SIGNING</span>
        <h2>完成你的签约</h2>
        <p>输入姓名，系统即刻为你签发唯一证书编号与认证铭牌</p>
      </div>
      <div class="studio-grid">
        <ContractForm
          :profile="profile"
          :identity="identity"
          :signing="signing"
          :sign-stage="signStage"
          :can-sign="canSign"
          @sign="emit('sign')"
          @resign="emit('resign')"
        />
        <BadgePreview :profile="profile" :template="template" :identity="identity" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.studio {
  position: relative;
  z-index: 1;
  padding: 110px 0 130px;
}

.studio-head {
  text-align: center;
  margin-bottom: 56px;
}

.studio-tag {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.34em;
  color: var(--text-faint);
}

.studio-head h2 {
  margin-top: 18px;
  font-family: var(--font-serif);
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  letter-spacing: 0.06em;
}

.studio-head p {
  margin-top: 12px;
  color: var(--text-dim);
  font-size: 14px;
  letter-spacing: 0.04em;
}

.studio-grid {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  gap: 32px;
  align-items: start;
  /* 防止 grid item 内容把列撑出容器 */
  > * {
    min-width: 0;
  }
}

@media (max-width: 1080px) {
  .studio-grid {
    grid-template-columns: 1fr;
  }
}
</style>
