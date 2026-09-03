<script setup lang="ts">
import { onMounted } from 'vue'
import { useGsap } from '@/composables/useGsap'

const features = [
  {
    num: '01',
    title: '唯一证书编号',
    en: 'Unique Certificate ID',
    desc: '编号由姓名与签约时间戳哈希生成，全球唯一、不可伪造，是摄影师的数字身份凭证。',
  },
  {
    num: '02',
    title: '扫码即验',
    en: 'Scan to Verify',
    desc: '铭牌背面内置真实二维码，任何设备扫码即跳转认证页面，实时展示签约状态。',
  },
  {
    num: '03',
    title: '双风格铭牌',
    en: 'Two Signature Styles',
    desc: '黑金典藏与纯白极简两种设计语言，同一签约身份，两种仪式表达。',
  },
  {
    num: '04',
    title: '高清输出',
    en: 'Print-Ready Output',
    desc: '双面高清 PNG 导出与 A4 打印，满足线上展示与实体佩戴。',
  },
  {
    num: '05',
    title: '隐私至上',
    en: 'Privacy First',
    desc: '签约数据仅存于本地浏览器，无服务器、无上传、无追踪。',
  },
  {
    num: '06',
    title: '极速体验',
    en: 'Instant Experience',
    desc: '静态生成架构，首屏直出无白屏，动效按需加载流畅优雅。',
  },
]

onMounted(async () => {
  const gsap = await useGsap()
  if (!gsap)
    return
  const { gsap: g } = gsap

  // 标题区：标签淡入 + 标题 clip 展开 + 描述上浮
  g.from('.features-tag', { opacity: 0, y: 16, duration: 0.7, ease: 'power2.out',
    scrollTrigger: { trigger: '.features-head', start: 'top 85%' } })
  g.from('.features-title', { clipPath: 'inset(0 100% 0 0)', duration: 1.1, ease: 'power2.inOut',
    scrollTrigger: { trigger: '.features-head', start: 'top 85%' } })
  g.from('.features-desc', { opacity: 0, y: 20, duration: 0.8, delay: 0.2, ease: 'power2.out',
    scrollTrigger: { trigger: '.features-head', start: 'top 85%' } })

  // 列表行：整行从下方浮现 + 分隔线横向展开
  g.utils.toArray<HTMLElement>('.feature-row').forEach((row) => {
    const tl = g.timeline({
      scrollTrigger: { trigger: row, start: 'top 90%' },
      defaults: { ease: 'power3.out' },
    })
    tl.from(row.querySelector('.row-line'), { scaleX: 0, duration: 0.9, transformOrigin: 'left center' })
      .from(row.querySelector('.row-num'), { opacity: 0, y: 26, duration: 0.6 }, '-=0.55')
      .from(row.querySelectorAll('.row-title, .row-en'), { opacity: 0, y: 26, duration: 0.6, stagger: 0.08 }, '-=0.45')
      .from(row.querySelector('.row-desc'), { opacity: 0, y: 18, duration: 0.6 }, '-=0.4')
  })

  // 行 hover 时序号微亮（CSS 处理过渡，这里只做入场）
})
</script>

<template>
  <section id="features" class="features">
    <div class="container">
      <div class="features-head">
        <span class="features-tag">THE PROGRAM</span>
        <h2 class="features-title">一份值得被验证的签约</h2>
        <p class="features-desc">从签约到认证，全程本地完成 —— 你的信息永不离开浏览器</p>
      </div>

      <div class="features-list">
        <article v-for="f in features" :key="f.num" class="feature-row">
          <span class="row-line" aria-hidden="true"></span>
          <div class="row-body">
            <span class="row-num mono">{{ f.num }}</span>
            <div class="row-heading">
              <h3 class="row-title">{{ f.title }}</h3>
              <span class="row-en mono">{{ f.en }}</span>
            </div>
            <p class="row-desc">{{ f.desc }}</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.features {
  position: relative;
  z-index: 1;
  padding: 130px 0 120px;
}

/* ---- 头部：编辑式左对齐 ---- */
.features-head {
  margin-bottom: 72px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.features-tag {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.4em;
  color: var(--text-faint);
}

.features-title {
  font-family: var(--font-serif);
  font-size: clamp(30px, 4.6vw, 52px);
  font-weight: 900;
  letter-spacing: 0.04em;
  line-height: 1.2;
}

.features-desc {
  font-size: 14px;
  color: var(--text-dim);
  letter-spacing: 0.05em;
  max-width: 480px;
  line-height: 1.9;
}

/* ---- 列表：细分隔线 + 大序号 ---- */
.features-list {
  display: flex;
  flex-direction: column;
}

.feature-row {
  position: relative;
}

.row-line {
  display: block;
  height: 1px;
  width: 100%;
  background: var(--white-10);
}

.feature-row:last-child .row-line:last-of-type,
.feature-row::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 1px;
  background: var(--white-10);
}

.row-body {
  display: grid;
  grid-template-columns: 120px 1fr 1.1fr;
  gap: 32px;
  align-items: baseline;
  padding: 38px 0;
  transition: padding 0.4s cubic-bezier(0.22, 0.9, 0.24, 1);
}

.feature-row:hover .row-body {
  padding-left: 14px;
}

/* 序号 */
.row-num {
  font-size: 15px;
  color: var(--text-faint);
  letter-spacing: 0.14em;
  transition: color 0.35s ease;
}

.feature-row:hover .row-num {
  color: var(--white-80);
}

/* 标题组 */
.row-heading {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.row-title {
  font-family: var(--font-serif);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.08em;
  transition: color 0.35s ease;
}

.row-en {
  font-size: 10px;
  letter-spacing: 0.3em;
  color: var(--text-faint);
  text-transform: uppercase;
}

/* 描述 */
.row-desc {
  font-size: 13.5px;
  line-height: 2;
  color: var(--text-dim);
  letter-spacing: 0.03em;
}

/* ---- 响应式 ---- */
@media (max-width: 900px) {
  .row-body {
    grid-template-columns: 56px 1fr;
    gap: 20px;
    padding: 30px 0;
  }
  .row-desc {
    grid-column: 2;
  }
  .row-title {
    font-size: 20px;
  }
}

@media (max-width: 600px) {
  .row-body {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 26px 0;
  }
  .row-desc {
    grid-column: 1;
  }
  .features {
    padding: 90px 0 80px;
  }
}
</style>
