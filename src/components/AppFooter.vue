<script setup lang="ts">
</script>

<template>
  <footer class="app-footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <span>签约摄影师认证计划</span>
      </div>
      <p class="footer-note">CONTRACTED PHOTOGRAPHER PROGRAM · 本地签发 · 数据不出浏览器</p>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  position: relative;
  z-index: 1;
  border-top: 1px solid var(--white-06);
  padding: 32px 0;
  background: rgba(10, 10, 11, 0.6);
  backdrop-filter: blur(10px);
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.footer-brand {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.14em;
  color: var(--white-60);
}

.footer-note {
  font-size: 11px;
  color: var(--text-faint);
  font-family: var(--font-mono);
  letter-spacing: 0.06em;
}
</style>
