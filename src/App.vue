<script setup lang="ts">
import { onMounted, ref } from 'vue'

const appReady = ref(false)

onMounted(() => {
  // 首屏挂载后，让内联 Loading 页退出
  requestAnimationFrame(() => {
    appReady.value = true
    const el = document.getElementById('app-loading')
    if (el) {
      el.classList.add('is-ready')
      // 退出动效结束后彻底移除
      window.setTimeout(() => el.remove(), 700)
    }
  })
})
</script>

<template>
  <router-view />
</template>
