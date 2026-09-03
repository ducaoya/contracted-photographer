<script setup lang="ts">
import { computed } from 'vue'
import type { CertIdentity, PhotographerProfile } from '@/types'
import { formatSignedDate } from '@/utils/cert'

const props = defineProps<{
  profile: PhotographerProfile
  identity: CertIdentity | null
  signing: boolean
  signStage: string
  canSign: boolean
}>()

const emit = defineEmits<{
  sign: []
  resign: []
}>()

const initials = computed(() => props.profile.name.trim().slice(0, 1) || '·')

function onAvatarChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file)
    return
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件')
    return
  }
  if (file.size > 4 * 1024 * 1024) {
    alert('图片请小于 4MB')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    props.profile.avatar = reader.result as string
  }
  reader.readAsDataURL(file)
}

function clearAvatar() {
  props.profile.avatar = null
}
</script>

<template>
  <div class="contract-form">
    <div class="form-head">
      <span class="form-tag">CONTRACT</span>
      <h3>签约信息</h3>
      <p>仅需姓名与头像，其余由系统自动完成</p>
    </div>

    <div class="form-body">
      <!-- 头像 -->
      <div class="avatar-block">
        <div class="avatar-preview">
          <img v-if="profile.avatar" :src="profile.avatar" alt="头像" />
          <span v-else class="avatar-initial">{{ initials }}</span>
        </div>
        <div class="avatar-ops">
          <label class="btn btn-sm">
            {{ profile.avatar ? '更换头像' : '上传头像' }}
            <input type="file" accept="image/*" hidden @change="onAvatarChange" />
          </label>
          <button v-if="profile.avatar" class="link-btn" @click="clearAvatar">移除</button>
          <span class="avatar-tip">可选 · 建议正方形</span>
        </div>
      </div>

      <!-- 姓名 -->
      <div class="field">
        <label class="field-label">摄影师姓名 *</label>
        <input
          v-model.trim="profile.name"
          class="field-input name-input"
          maxlength="20"
          placeholder="输入真实姓名，将印于铭牌"
        />
      </div>

      <!-- 签约按钮 / 签约中 loading -->
      <div class="sign-block">
        <button v-if="!identity" class="btn btn-solid sign-btn" :disabled="!canSign" @click="emit('sign')">
          <span v-if="signing" class="sign-spinner" aria-hidden="true"></span>
          <span>{{ signing ? signStage : '签署合约' }}</span>
        </button>
        <div v-else class="signed-mark">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span>合约已签署</span>
        </div>
      </div>

      <!-- 自动生成的签约身份 -->
      <div class="identity-block" :class="{ active: !!identity && profile.name }">
        <div class="identity-row">
          <span class="identity-label">证书编号</span>
          <span class="identity-value mono">{{ identity?.certNo ?? '待签约生成' }}</span>
        </div>
        <div class="identity-row">
          <span class="identity-label">签约时间</span>
          <span class="identity-value mono">{{ identity ? formatSignedDate(identity.signedAt) : '—' }}</span>
        </div>
        <p class="identity-note">
          编号由姓名与签约时间戳加密生成，全球唯一。
          <button v-if="identity" class="link-btn" @click="emit('resign')">重新签约</button>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contract-form {
  padding: 34px 32px;
  border-radius: var(--radius);
  border: 1px solid var(--white-06);
  background: var(--white-02);
  backdrop-filter: blur(14px);
  min-width: 0;
}

.form-head {
  margin-bottom: 30px;
}

.form-tag {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.34em;
  color: var(--text-faint);
}

.form-head h3 {
  margin-top: 10px;
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.form-head p {
  margin-top: 8px;
  font-size: 13px;
  color: var(--text-dim);
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 26px;
}

/* 头像 */
.avatar-block {
  display: flex;
  align-items: center;
  gap: 22px;
}

.avatar-preview {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  border: 1px solid var(--white-16);
  background: var(--white-04);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initial {
  font-family: var(--font-serif);
  font-size: 32px;
  color: var(--white-40);
}

.avatar-ops {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.avatar-tip {
  font-size: 11.5px;
  color: var(--text-faint);
}

.link-btn {
  border: none;
  background: none;
  padding: 0;
  color: var(--white-60);
  font-size: 12px;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.2s ease;
}

.link-btn:hover {
  color: var(--white-100);
}

/* 姓名 */
.name-input {
  font-size: 17px;
  font-family: var(--font-serif);
  letter-spacing: 0.1em;
}

/* 签约按钮 */
.sign-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.sign-btn {
  width: 100%;
  padding: 15px 32px;
  font-size: 14.5px;
  letter-spacing: 0.2em;
  text-indent: 0.2em;
}

.sign-btn:disabled {
  opacity: 0.35;
}

.sign-spinner {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 1.5px solid rgba(10, 10, 11, 0.25);
  border-top-color: #0a0a0b;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.signed-mark {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: center;
  padding: 14px 32px;
  border-radius: 999px;
  border: 1px solid var(--white-16);
  color: var(--white-60);
  font-size: 13px;
  letter-spacing: 0.16em;
}

/* 身份块 */
.identity-block {
  border-top: 1px solid var(--white-06);
  padding-top: 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  opacity: 0.55;
  transition: opacity 0.4s ease;
}

.identity-block.active {
  opacity: 1;
}

.identity-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.identity-label {
  font-size: 12px;
  letter-spacing: 0.14em;
  color: var(--text-faint);
}

.identity-value {
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--white-80);
  letter-spacing: 0.06em;
}

.identity-note {
  font-size: 11.5px;
  line-height: 1.8;
  color: var(--text-faint);
}

.mono {
  font-family: var(--font-mono);
}
</style>
