import QRCode from 'qrcode'

export interface QrStyleOptions {
  /** 暗色模块（noir 模板用金色） */
  dark?: string
  /** 亮色背景 */
  light?: string
  /** 边距（模块数） */
  margin?: number
  /** 尺寸（px） */
  size?: number
}

/**
 * 生成真实可扫描的二维码 dataURL。
 * 内容为 /verify 认证页 URL，扫码后跳转认证页。
 */
export async function generateVerifyQr(url: string, options: QrStyleOptions = {}): Promise<string> {
  const { dark = '#000000', light = '#ffffff', margin = 1, size = 320 } = options
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    margin,
    width: size,
    color: { dark, light },
  })
}
