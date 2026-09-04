<script setup lang="ts">
import { onMounted } from 'vue'

/** 移除内联 Loading 页（幂等，任何时序下都安全） */
function dismissLoading() {
  const el = document.getElementById('app-loading')
  if (!el || el.classList.contains('is-ready'))
    return
  el.classList.add('is-ready')
  // 退出动效结束后彻底移除
  window.setTimeout(() => el.remove(), 700)
}

onMounted(() => {
  // 双重时机：挂载 + 下一帧，确保 hydration 完成后一定触发
  requestAnimationFrame(dismissLoading)
  window.setTimeout(dismissLoading, 300)
  // 兜底：即使时序异常，1.5s 后强制退出，绝不卡死在 Loading
  window.setTimeout(dismissLoading, 1500)
})
</script>

<template>
  <router-view />
</template>
