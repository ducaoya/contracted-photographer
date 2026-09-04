<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useProfile } from '@/composables/useProfile'
import { trackEvent } from '@/composables/useAnalytics'
import ParticleBackground from '@/components/ParticleBackground.vue'
import HeroSection from '@/components/HeroSection.vue'
import FeatureStrip from '@/components/FeatureStrip.vue'
import StudioSection from '@/components/StudioSection.vue'
import AppFooter from '@/components/AppFooter.vue'

const { profile, template, identity, signing, signStage, canSign, loadDraft, sign, resign } = useProfile()

const particleRef = ref<InstanceType<typeof ParticleBackground> | null>(null)

function onStart() {
  trackEvent('cta_start_click')
  // 粒子爆发 + 平滑滚动到签约区
  particleRef.value?.triggerBurst()
  document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' })
}

/** 签约：等待流程完成后上报结果 */
function onSign() {
  void Promise.resolve(sign()).then(() => {
    if (identity.value) {
      trackEvent('contract_signed', {
        template: template.value,
        has_avatar: !!profile.value.avatar,
      })
    }
  })
}

function onResign() {
  trackEvent('contract_resign', { template: template.value })
  resign()
}

onMounted(() => {
  loadDraft()
})
</script>

<template>
  <div class="home">
    <ParticleBackground ref="particleRef" />
    <HeroSection @start="onStart" />
    <FeatureStrip />
    <StudioSection
      :profile="profile"
      :template="template"
      :identity="identity"
      :signing="signing"
      :sign-stage="signStage"
      :can-sign="canSign"
      @sign="onSign"
      @resign="onResign"
    />
    <AppFooter />
  </div>
</template>
