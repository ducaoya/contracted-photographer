export interface PhotographerProfile {
  /** 姓名 */
  name: string
  /** 头像 dataURL */
  avatar: string | null
}

export type TemplateId = 'noir' | 'studio'

export const TEMPLATE_IDS = ['noir', 'studio'] as const

export interface TemplateMeta {
  id: TemplateId
  label: string
  desc: string
}

export const TEMPLATES: TemplateMeta[] = [
  { id: 'studio', label: '纯白极简', desc: '极简留白 · 工作室风' },
  { id: 'noir', label: '黑金典藏', desc: '奢华质感 · 仪式典藏' },
]

/** 证书编号：姓名 + 时间戳哈希生成的唯一编号 */
export interface CertIdentity {
  /** 展示编号，如 CP-7F3A-9D2B */
  certNo: string
  /** 签约时间戳（ms），编号的输入之一 */
  signedAt: number
}

export interface VerifyPayload {
  /** 姓名 */
  n: string
  /** 证书编号 */
  c: string
  /** 签约时间戳 */
  t: number
}
