import * as THREE from 'three'

export interface ParticleSceneOptions {
  container: HTMLElement
  onReady?: () => void
}

interface Pt { x: number; y: number }

/* ============ 形状采样工具 ============ */
function sampleLine(x1: number, y1: number, x2: number, y2: number, count: number): Pt[] {
  const pts: Pt[] = []
  const denom = Math.max(count - 1, 1)
  for (let i = 0; i < count; i++) {
    const t = i / denom
    pts.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t })
  }
  return pts
}

function sampleCircle(cx: number, cy: number, r: number, count: number, start = 0, end = Math.PI * 2): Pt[] {
  const pts: Pt[] = []
  for (let i = 0; i < count; i++) {
    const t = start + (end - start) * (i / count)
    pts.push({ x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r })
  }
  return pts
}

function sampleRect(x: number, y: number, w: number, h: number, count: number): Pt[] {
  const pts: Pt[] = []
  const perim = 2 * (w + h)
  for (let i = 0; i < count; i++) {
    const d = (i / count) * perim
    if (d < w)
      pts.push({ x: x + d, y })
    else if (d < w + h)
      pts.push({ x: x + w, y: y + (d - w) })
    else if (d < 2 * w + h)
      pts.push({ x: x + w - (d - w - h), y: y + h })
    else
      pts.push({ x, y: y + h - (d - 2 * w - h) })
  }
  return pts
}

/** 将点集补齐（带微抖动）/ 均匀抽样到精确 n 个 */
function fillToN(pts: Pt[], n: number): Pt[] {
  const out: Pt[] = []
  if (pts.length === 0)
    return out
  if (pts.length >= n) {
    const stride = pts.length / n
    for (let i = 0; i < n; i++)
      out.push(pts[Math.floor(i * stride)])
  }
  else {
    for (let i = 0; i < n; i++) {
      const p = pts[i % pts.length]
      out.push({ x: p.x + (Math.random() - 0.5) * 0.014, y: p.y + (Math.random() - 0.5) * 0.014 })
    }
  }
  return out
}

/* ============ 摄影主题形状 ============ */
/** 相机：机身 + 取景器 + 镜头 + 快门 + 热靴（按周长均匀分配粒子密度） */
function buildCamera(n: number): Pt[] {
  // 各部件几何定义：[周长, 权重]
  const body = { w: 1.3, h: 0.74 } // 机身
  const finder = { w: 0.42, h: 0.14 } // 取景器
  const lensR = 0.2 // 镜头半径
  const parts: Array<() => Pt[]> = []

  const perimBody = 2 * (body.w + body.h)
  const perimFinder = 2 * (finder.w + finder.h)
  const perimLens = 2 * Math.PI * lensR
  const perimShutter = 0.14
  const perimHotshoe = 2 * (0.17 + 0.05)

  // 总周长 → 按比例分配（机身占主导）
  const totalPerim = perimBody + perimFinder + perimLens + perimShutter + perimHotshoe
  const nBody = Math.floor((perimBody / totalPerim) * n)
  const nFinder = Math.floor((perimFinder / totalPerim) * n)
  const nLens = Math.floor((perimLens / totalPerim) * n)
  const nShutter = Math.max(Math.floor((perimShutter / totalPerim) * n), 5)
  const nHotshoe = Math.max(Math.floor((perimHotshoe / totalPerim) * n), 8)

  const pts: Pt[] = []
  // 机身（主体，占 ~66%）
  pts.push(...sampleRect(-body.w / 2, -body.h / 2, body.w, body.h, nBody))
  // 取景器（顶部凸起）
  pts.push(...sampleRect(-finder.w / 2, body.h / 2, finder.w, finder.h, nFinder))
  // 镜头（单环，弱化为中心小圆，不再叠加双环）
  pts.push(...sampleCircle(0, 0, lensR, nLens))
  // 快门按钮（右上小凸起）
  pts.push(...sampleLine(0.42, body.h / 2, 0.42, body.h / 2 + 0.14, nShutter))
  // 热靴（顶部小矩形）
  pts.push(...sampleRect(-0.085, body.h / 2 + finder.h, 0.17, 0.05, nHotshoe))

  void parts
  return fillToN(pts, n)
}

/** 闪光灯：横向灯头 + 反射碗 + 热靴底座 + 两侧光束 */
function buildFlash(n: number): Pt[] {
  const pts: Pt[] = []
  // 横向长条灯头（明显宽扁，区别于光圈的圆形）
  pts.push(...sampleRect(-0.72, -0.26, 1.44, 0.52, Math.floor(n * 0.32)))
  // 灯头内两条横向灯管
  pts.push(...sampleLine(-0.56, -0.1, 0.56, -0.1, Math.floor(n * 0.08)))
  pts.push(...sampleLine(-0.56, 0.1, 0.56, 0.1, Math.floor(n * 0.08)))
  // 两端竖向封边
  pts.push(...sampleLine(-0.72, -0.26, -0.72, 0.26, Math.floor(n * 0.03)))
  pts.push(...sampleLine(0.72, -0.26, 0.72, 0.26, Math.floor(n * 0.03)))
  // 中央反射碗（半圆朝下）
  pts.push(...sampleCircle(0, 0.26, 0.16, Math.floor(n * 0.1), Math.PI, Math.PI * 2))
  // 热靴底座（下方梯形双层）
  pts.push(...sampleRect(-0.14, 0.26, 0.28, 0.1, Math.floor(n * 0.05)))
  pts.push(...sampleRect(-0.08, 0.36, 0.16, 0.08, Math.floor(n * 0.04)))
  // 两侧斜向光束（短促，从灯头两端向外上发散）
  pts.push(...sampleLine(-0.78, -0.1, -1.02, -0.3, Math.floor(n * 0.04)))
  pts.push(...sampleLine(0.78, -0.1, 1.02, -0.3, Math.floor(n * 0.04)))
  pts.push(...sampleLine(-0.78, 0.05, -1.05, 0.02, Math.floor(n * 0.03)))
  pts.push(...sampleLine(0.78, 0.05, 1.05, 0.02, Math.floor(n * 0.03)))
  return fillToN(pts, n)
}

/** 胶片：宽片轨 + 大齿孔 + 分帧线 + 片头 */
function buildFilm(n: number): Pt[] {
  const pts: Pt[] = []
  // 上下片轨（长横线）
  pts.push(...sampleLine(-0.95, 0.42, 0.95, 0.42, Math.floor(n * 0.14)))
  pts.push(...sampleLine(-0.95, -0.42, 0.95, -0.42, Math.floor(n * 0.14)))
  // 齿孔：上下两排矩形孔（胶片最典型特征，加大尺寸）
  for (let i = 0; i < 8; i++) {
    const x = -0.84 + i * 0.24
    pts.push(...sampleRect(x, 0.28, 0.13, 0.1, Math.floor(n * 0.022)))
    pts.push(...sampleRect(x, -0.38, 0.13, 0.1, Math.floor(n * 0.022)))
  }
  // 分帧线：三帧竖线
  for (let i = 0; i < 3; i++) {
    const x = -0.36 + i * 0.36
    pts.push(...sampleLine(x, -0.16, x, 0.16, Math.floor(n * 0.014)))
  }
  // 帧内对角线（暗示画面）
  pts.push(...sampleLine(-0.36, -0.16, 0, 0.16, Math.floor(n * 0.012)))
  pts.push(...sampleLine(0, -0.16, 0.36, 0.16, Math.floor(n * 0.012)))
  return fillToN(pts, n)
}

/** 星尘：随机散布（页脚收尾） */
function buildStars(n: number): Pt[] {
  const pts: Pt[] = []
  for (let i = 0; i < n; i++) {
    const r = 0.75 + Math.random() * 0.55
    const a = Math.random() * Math.PI * 2
    pts.push({ x: Math.cos(a) * r * 1.5, y: Math.sin(a) * r * 0.85 })
  }
  return pts
}

/* ============ 场景 ============ */
const SHAPE_SCALE = 1.18
const SECTION_IDS = ['hero', 'features', 'studio']

function getActiveIndex(): number {
  const mid = window.scrollY + window.innerHeight * 0.45
  let idx = 0
  SECTION_IDS.forEach((id, i) => {
    const el = document.getElementById(id)
    if (el && el.offsetTop <= mid)
      idx = i
  })
  const footer = document.querySelector('footer')
  if (footer && (footer as HTMLElement).offsetTop <= mid)
    idx = 3
  return idx
}

/**
 * 摄影主题粒子场景：
 * 粒子随滚动在「相机 → 光圈 → 胶片 → 星尘」之间平滑变形，
 * 配合鼠标视差、呼吸微动与点击爆发。
 */
export function createParticleScene(options: ParticleSceneOptions) {
  const { container } = options
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isMobile = window.matchMedia('(max-width: 768px)').matches

  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(
    55,
    container.clientWidth / container.clientHeight,
    0.1,
    20,
  )
  camera.position.set(0, 0, 2.7)

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(container.clientWidth, container.clientHeight)
  container.appendChild(renderer.domElement)

  /* ---------- 主题形态粒子 ---------- */
  const N = isMobile ? 1000 : 1800
  const shapeFns = [buildCamera, buildFlash, buildFilm, buildStars]
  const shapes = shapeFns.map(fn => fn(N))

  const cur = new Float32Array(N * 3)
  const targets = new Float32Array(N * 3)
  const ease = new Float32Array(N)
  const phase = new Float32Array(N)
  const colors = new Float32Array(N * 3)

  function writeShape(dst: Float32Array, shape: Pt[]) {
    for (let i = 0; i < N; i++) {
      const p = shape[i]
      dst[i * 3] = p.x * SHAPE_SCALE
      dst[i * 3 + 1] = p.y * SHAPE_SCALE
      // z 保持原值（初始化时写入抖动）
    }
  }

  // 初始化：相机形态
  for (let i = 0; i < N; i++) {
    const i3 = i * 3
    cur[i3] = shapes[0][i].x * SHAPE_SCALE
    cur[i3 + 1] = shapes[0][i].y * SHAPE_SCALE
    cur[i3 + 2] = (Math.random() - 0.5) * 0.12
    targets[i3] = cur[i3]
    targets[i3 + 1] = cur[i3 + 1]
    targets[i3 + 2] = cur[i3 + 2]
    ease[i] = 0.018 + Math.random() * 0.03
    phase[i] = Math.random() * Math.PI * 2
    // 弱化亮度：低区间随机灰度，避免压过文案
    const c = 0.22 + Math.random() * 0.3
    colors[i3] = c
    colors[i3 + 1] = c
    colors[i3 + 2] = c
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(cur.slice(), 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const mat = new THREE.PointsMaterial({
    size: 0.031,
    vertexColors: true,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  })
  const shapePoints = new THREE.Points(geo, mat)

  const group = new THREE.Group()
  group.add(shapePoints)
  scene.add(group)

  /* ---------- 环境尘埃（稀疏，增加纵深） ---------- */
  const DUST_N = isMobile ? 90 : 220
  const dustPos = new Float32Array(DUST_N * 3)
  for (let i = 0; i < DUST_N; i++) {
    const r = 2.2 + Math.random() * 1.2
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    dustPos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    dustPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7
    dustPos[i * 3 + 2] = -Math.abs(r * Math.cos(phi)) - 0.5
  }
  const dustGeo = new THREE.BufferGeometry()
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
  const dustMat = new THREE.PointsMaterial({
    size: 0.02,
    color: 0xffffff,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    sizeAttenuation: true,
  })
  const dust = new THREE.Points(dustGeo, dustMat)
  scene.add(dust)

  /* ---------- 交互状态 ---------- */
  const mouse = { x: 0, y: 0 }
  const mouseTarget = { x: 0, y: 0 }
  let burst = 0
  let activeIdx = 0
  let pendingRetarget = false

  function retarget() {
    const idx = getActiveIndex()
    if (idx !== activeIdx) {
      activeIdx = idx
      writeShape(targets, shapes[idx])
    }
  }

  function onPointerMove(e: PointerEvent) {
    mouseTarget.x = (e.clientX / window.innerWidth) * 2 - 1
    mouseTarget.y = (e.clientY / window.innerHeight) * 2 - 1
  }

  function onScroll() {
    if (pendingRetarget)
      return
    pendingRetarget = true
    requestAnimationFrame(() => {
      pendingRetarget = false
      retarget()
    })
  }

  function onResize() {
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.clientWidth, container.clientHeight)
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)

  /** 点击「立即签约」等场景触发粒子爆发 */
  function triggerBurst() {
    burst = 1
  }

  /* ---------- 渲染循环 ---------- */
  let raf = 0
  let running = true
  const clock = new THREE.Clock()
  const posAttr = geo.attributes.position

  function tick() {
    if (!running)
      return
    raf = requestAnimationFrame(tick)
    const t = clock.getElapsedTime()

    // 鼠标视差（lerp 平滑）
    mouse.x += (mouseTarget.x - mouse.x) * 0.05
    mouse.y += (mouseTarget.y - mouse.y) * 0.05

    // 爆发衰减
    burst *= 0.93
    const burstScale = 1 + burst * 0.45

    const arr = posAttr.array as Float32Array
    for (let i = 0; i < N; i++) {
      const i3 = i * 3
      const e = ease[i]
      cur[i3] += (targets[i3] - cur[i3]) * e
      cur[i3 + 1] += (targets[i3 + 1] - cur[i3 + 1]) * e
      // 呼吸微动 + 爆发缩放
      arr[i3] = cur[i3] * burstScale + Math.sin(t * 1.3 + phase[i]) * 0.006
      arr[i3 + 1] = cur[i3 + 1] * burstScale + Math.cos(t * 1.1 + phase[i]) * 0.006
    }
    posAttr.needsUpdate = true

    // 形态组：鼠标视差 + 极缓漂移
    group.rotation.y = mouse.x * 0.1 + Math.sin(t * 0.08) * 0.03
    group.rotation.x = -mouse.y * 0.07

    // 尘埃缓旋
    dust.rotation.y = t * 0.018

    // 爆发时相机轻微推进
    camera.position.z = 2.7 - burst * 0.25

    renderer.render(scene, camera)
  }

  if (reduced) {
    // 降级：静态渲染相机形态
    renderer.render(scene, camera)
  }
  else {
    tick()
  }

  function onVisibility() {
    running = !document.hidden && !reduced
    if (running)
      tick()
    else
      cancelAnimationFrame(raf)
  }
  document.addEventListener('visibilitychange', onVisibility)

  options.onReady?.()

  return {
    triggerBurst,
    dispose() {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      geo.dispose()
      mat.dispose()
      dustGeo.dispose()
      dustMat.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}

export type ParticleScene = ReturnType<typeof createParticleScene>
