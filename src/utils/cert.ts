import type { CertIdentity, VerifyPayload } from '@/types'

/**
 * FNV-1a 哈希（32 位 ×2 轮得到 64 位散列）。
 * 输入：姓名 + 签约时间戳，输出唯一证书编号。
 */
function fnv1a64(input: string): string {
  // 两轮不同初始值的 FNV-1a，拼成 64 位
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < input.length; i++) {
    h1 ^= input.charCodeAt(i)
    h1 = Math.imul(h1, 0x01000193) >>> 0
    h2 ^= (input.charCodeAt(i) + i) & 0xff
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0
  }
  return (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')).slice(0, 16)
}

/**
 * 由姓名 + 时间戳生成唯一证书编号。
 * 同一姓名在不同时间签约得到不同编号；编号稳定可复现。
 */
export function generateCertIdentity(name: string, signedAt: number = Date.now()): CertIdentity {
  const hash = fnv1a64(`${name.trim()}::${signedAt}`)
  // 格式化为 CP-XXXX-XXXX 分组展示
  const certNo = `CP-${hash.slice(0, 4).toUpperCase()}-${hash.slice(4, 8).toUpperCase()}`
  return { certNo, signedAt }
}

/** 编号展示格式（含空格分组） */
export function formatCertNo(certNo: string): string {
  return certNo
}

/** 由编号反解时间戳不可行（单向哈希），因此签约时间需单独存储 */
export function formatSignedDate(signedAt: number): string {
  const d = new Date(signedAt)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

/** 构造扫码认证 URL（指向 /verify 页并携带参数） */
export function buildVerifyUrl(payload: VerifyPayload): string {
  const params = new URLSearchParams({
    n: payload.n,
    c: payload.c,
    t: String(payload.t),
  })
  if (typeof window !== 'undefined') {
    // 用当前页面路径推导部署前缀（如 GitHub Pages 的 /contracted-photographer），
    // 避免硬编码 origin 导致子路径部署下二维码指向错误地址
    const { origin, pathname } = window.location
    // 取路径中最后一个非 'verify' 段之前的目录（兼容 /、/repo/、/repo/verify）
    const segments = pathname.replace(/\/+$/, '').split('/').filter(Boolean)
    if (segments.length > 0 && segments[segments.length - 1] !== 'verify') {
      return `${origin}/${segments.join('/')}/verify?${params.toString()}`
    }
    return `${origin}/verify?${params.toString()}`
  }
  return `https://contracted-photographer.example.com/verify?${params.toString()}`
}

/** 解析 /verify 页查询参数 */
export function parseVerifyQuery(query: string): VerifyPayload | null {
  const params = new URLSearchParams(query)
  const n = params.get('n')
  const c = params.get('c')
  const t = Number(params.get('t'))
  if (!n || !c || !Number.isFinite(t) || t <= 0)
    return null
  return { n, c, t }
}
