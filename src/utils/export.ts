import { toPng } from 'html-to-image'

export interface ExportOptions {
  scale: number
  name: string
  template: string
}

/**
 * 将卡片面节点克隆到一个脱离 3D 上下文的平铺容器中再截图。
 * 原因：背面节点带 rotateY(180deg) + backface-visibility:hidden，
 * html-to-image 直接截图会得到空白/镜像图。
 */
async function faceToPng(node: HTMLElement, scale: number): Promise<string> {
  const stage = document.createElement('div')
  stage.style.cssText = [
    'position:fixed',
    'left:0',
    'top:0',
    'width:420px',
    'height:560px',
    'opacity:0',
    'pointer-events:none',
    'z-index:2147483647',
  ].join(';')

  const clone = node.cloneNode(true) as HTMLElement
  // 重置 3D 变换，平铺展示
  clone.style.position = 'absolute'
  clone.style.inset = '0'
  clone.style.transform = 'none'
  clone.style.backfaceVisibility = 'visible'
  clone.style.boxShadow = 'none'
  // 光泽层在静态截图中无意义
  clone.querySelectorAll('.card-glare').forEach((el) => el.remove())

  stage.appendChild(clone)
  document.body.appendChild(stage)

  try {
    return await toPng(clone, {
      pixelRatio: scale,
      skipFonts: true,
      width: 420,
      height: 560,
      // 过滤掉无需内联的元素，加速截图
      filter: (el) => !(el instanceof HTMLElement && el.classList.contains('card-glare')),
    })
  }
  finally {
    stage.remove()
  }
}

/**
 * 将正反两面垂直拼接为一张 PNG（正面在上、背面在下）。
 */
async function combineVertically(front: string, back: string, scale: number): Promise<string> {
  const loadImg = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

  const [frontImg, backImg] = await Promise.all([loadImg(front), loadImg(back)])

  const gap = Math.round(40 * scale)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(frontImg.width, backImg.width)
  canvas.height = frontImg.height + gap + backImg.height

  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#0a0a0b'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const drawCentered = (img: HTMLImageElement, y: number) => {
    const x = (canvas.width - img.width) / 2
    ctx.drawImage(img, x, y)
  }
  drawCentered(frontImg, 0)
  drawCentered(backImg, frontImg.height + gap)

  return canvas.toDataURL('image/png')
}

/**
 * 导出铭牌正反两面为一张 PNG（垂直拼接）。
 */
export async function exportBadgePng(frontNode: HTMLElement, backNode: HTMLElement, options: ExportOptions): Promise<void> {
  const { scale, name, template } = options

  const [front, back] = await Promise.all([
    faceToPng(frontNode, scale),
    faceToPng(backNode, scale),
  ])

  const dataUrl = await combineVertically(front, back, scale)

  const link = document.createElement('a')
  link.download = `签约摄影师铭牌-${name}-${template}.png`
  link.href = dataUrl
  link.click()
}
