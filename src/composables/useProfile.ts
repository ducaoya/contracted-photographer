import { computed, ref, watch } from 'vue'
import type { CertIdentity, PhotographerProfile, TemplateId } from '@/types'
import { generateCertIdentity } from '@/utils/cert'

const STORAGE_KEY = 'cp-contract-draft-v2'

function defaultProfile(): PhotographerProfile {
  return {
    name: '',
    avatar: null,
  }
}

function isProfile(v: unknown): v is PhotographerProfile {
  if (typeof v !== 'object' || v === null)
    return false
  const p = v as Partial<PhotographerProfile>
  return typeof p.name === 'string'
}

interface DraftData {
  profile: PhotographerProfile
  template: TemplateId
  identity: CertIdentity | null
}

const profile = ref<PhotographerProfile>(defaultProfile())
const template = ref<TemplateId>('noir')
/** 签约身份（编号+时间戳）：点击「签署合约」后生成 */
const identity = ref<CertIdentity | null>(null)
/** 签约进行中（模拟服务处理） */
const signing = ref(false)
/** 签约阶段文案（loading 过程展示） */
const signStage = ref('')

let loaded = false

export function useProfile() {
  const hasIdentity = computed(() => identity.value !== null && profile.value.name.trim().length > 0)
  const canSign = computed(() => profile.value.name.trim().length > 0 && !signing.value)

  function loadDraft() {
    if (loaded)
      return
    loaded = true
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DraftData> | null
        if (parsed && isProfile(parsed.profile)) {
          profile.value = { ...defaultProfile(), ...parsed.profile }
        }
        if (parsed?.template === 'noir' || parsed?.template === 'studio') {
          template.value = parsed.template
        }
        if (parsed?.identity && typeof parsed.identity.certNo === 'string' && typeof parsed.identity.signedAt === 'number') {
          identity.value = parsed.identity
        }
      }
    }
    catch {
      /* 忽略损坏的草稿 */
    }
  }

  function saveDraft() {
    try {
      const data: DraftData = {
        profile: profile.value,
        template: template.value,
        identity: identity.value,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
    catch {
      /* 存储满等异常忽略 */
    }
  }

  /**
   * 签约流程：模拟服务端处理（阶段文案 + 延时），完成后签发唯一编号。
   * 实际为纯本地计算，loading 仅用于营造签约仪式感。
   */
  function sign(): Promise<void> {
    if (signing.value || !profile.value.name.trim())
      return Promise.resolve()

    signing.value = true
    const stages = [
      '正在核验摄影师身份…',
      '正在生成唯一证书编号…',
      '正在写入签约记录…',
      '正在签发认证铭牌…',
    ]

    return new Promise<void>((resolve) => {
      let i = 0
      signStage.value = stages[0]
      const step = () => {
        i++
        if (i < stages.length) {
          signStage.value = stages[i]
          window.setTimeout(step, 520 + Math.random() * 380)
        }
        else {
          // 阶段走完，签发身份
          identity.value = generateCertIdentity(profile.value.name.trim())
          signStage.value = ''
          signing.value = false
          resolve()
        }
      }
      window.setTimeout(step, 520 + Math.random() * 380)
    })
  }

  /** 重新签约：生成新的编号与时间戳 */
  function resign() {
    identity.value = generateCertIdentity(profile.value.name)
  }

  function reset() {
    profile.value = defaultProfile()
    identity.value = null
    template.value = 'noir'
  }

  // 自动暂存（防抖）
  let timer: ReturnType<typeof setTimeout> | undefined
  watch([profile, template, identity], () => {
    if (!loaded)
      return
    window.clearTimeout(timer)
    timer = setTimeout(saveDraft, 600)
  }, { deep: true })

  return { profile, template, identity, signing, signStage, hasIdentity, canSign, loadDraft, saveDraft, sign, resign, reset }
}
