# 签约摄影师铭牌生成器 · 详细设计文档

> 版本：v1.0 · 日期：2026-09-03
> 定位：纯本地（无后端）的静态站点，用户填写信息后实时生成「签约摄影师」铭牌，支持导出 PNG 与打印。

---

## 1. 功能设计

### 1.1 核心功能清单

| 编号 | 功能 | 说明 | 优先级 |
|---|---|---|---|
| F01 | 信息表单 | 姓名、职位头衔、机构/工作室名、编号、签约日期、有效期、个人简介、擅长领域标签、联系方式（电话/邮箱/网站）、头像上传 | P0 |
| F02 | 手写签名板 | Canvas 手写签名，支持笔画粗细、清除、撤销 | P0 |
| F03 | 模板系统 | 3 套模板：`aurora`（极光渐变·现代）、`noir`（黑金·奢华）、`studio`（纯白·极简） | P0 |
| F04 | 实时预览 | 表单输入实时映射到铭牌预览，带 GSAP 微动效反馈 | P0 |
| F05 | 导出 PNG | html-to-image 将铭牌导出为高清 PNG（2x/3x 像素密度） | P0 |
| F06 | 打印 | `window.print()` + `@media print` 样式隔离，只打印铭牌区域 | P0 |
| F07 | 示例数据 | 一键填充示例数据，快速体验 | P1 |
| F08 | 本地暂存 | localStorage 自动保存草稿，刷新不丢失 | P1 |
| F09 | 3D 粒子背景 | Three.js 粒子星云 + 鼠标视差 + 滚动联动 | P0 |
| F10 | Loading 页 | 纯静态（零依赖）炫酷加载页，消除白屏 | P0 |

### 1.2 用户流程

```
Loading 页（静态，立即渲染）
   └─> JS/CSS/首屏就绪
        └─> Loading 退出动效（光圈扩散 + 淡出）
             └─> Hero 首屏（粒子背景 + GSAP 入场编排）
                  └─> 滚动/点击「开始制作」
                       └─> Studio 工作台（左表单 / 右实时预览）
                            ├─ 填写信息 ──实时──> 预览更新（GSAP 数字滚动/微弹）
                            ├─ 手写签名 ──> 嵌入铭牌
                            ├─ 切换模板 ──> Flip/交叉淡入动效
                            ├─ 导出 PNG（2x/3x）
                            └─ 打印（打印样式表隔离）
```

### 1.3 数据模型（TypeScript）

```ts
interface PhotographerProfile {
  name: string            // 姓名
  title: string           // 头衔，如「签约摄影师」
  org: string             // 机构/工作室
  certNo: string          // 证书编号
  signDate: string        // 签约日期 YYYY-MM-DD
  expiryDate: string      // 有效期至
  bio: string             // 简介
  tags: string[]          // 擅长领域
  phone: string
  email: string
  website: string
  avatar: string | null   // dataURL
  signature: string | null // dataURL
}

type TemplateId = 'aurora' | 'noir' | 'studio'
```

校验规则：姓名必填（≤20 字）；编号自动生成可覆盖；日期默认今天/一年后；标签最多 6 个、单个 ≤12 字。

---

## 2. 页面设计

### 2.1 页面结构（单页应用，3 个「场景」）

```
App.vue
├─ LoadingScreen.vue        # 静态加载页（index.html 内联，零 JS 依赖）
├─ ParticleBackground.vue   # Three.js 全屏粒子（fixed, z-index:0）
├─ HeroSection.vue          # 首屏：大标题 + CTA + 滚动提示
├─ StudioSection.vue        # 工作台
│   ├─ ProfileForm.vue      # 左侧表单（分组卡片）
│   │   ├─ SignaturePad.vue # 手写签名板
│   │   └─ TagEditor.vue    # 标签编辑器
│   └─ BadgePreview.vue     # 右侧预览（sticky）
│       └─ BadgeCard.vue    # 铭牌本体（3 套模板渲染）
├─ FeatureStrip.vue         # 特性介绍条（滚动入场）
└─ AppFooter.vue            # 页脚
```

### 2.2 视觉规范

- **主色**：`#6366f1`（靛蓝）→ `#a855f7`（紫）→ `#22d3ee`（青）渐变体系
- **背景**：深空 `#05060f`，粒子提供层次
- **字体**：标题 `Noto Serif SC`（衬线，仪式感）；正文 `Noto Sans SC`；编号/日期用等宽 `JetBrains Mono`
- **铭牌比例**：3:4 竖版（600×800 逻辑像素），打印友好
- **暗/亮**：整站暗色；铭牌模板自带明暗（studio 为亮）

### 2.3 响应式

- ≥1280px：工作台左右分栏（表单 5 : 预览 7）
- 768–1279px：上下堆叠，预览吸顶折叠按钮
- <768px：单列，预览在表单下方；粒子数量减半

---

## 3. 动效设计

### 3.1 Loading 页（纯 CSS，零依赖）

- 深空背景 + 中央「光圈呼吸」：多层 `conic-gradient` 圆环旋转
- 快门光圈造型（摄影主题）：6 片叶片用 CSS `clip-path` 旋转开合
- 底部进度条（细线渐变扫动）+ 文案「CALIBRATING LENS…」
- 退出动效：JS 就绪后给根节点加 `.is-ready`，光圈全开 + 整体缩放淡出（600ms）

### 3.2 3D 粒子背景（Three.js）

- **形态**：`BufferGeometry` + 8000（移动端 3000）粒子，三层分布：
  - 星云层：球状高斯分布，青紫色，缓慢自转
  - 尘埃层：远景小粒子，低透明度
  - 光斑层：少量大尺寸加色混合粒子（`AdditiveBlending`）
- **交互**：
  - 鼠标移动 → 相机视差（lerp 平滑）
  - 页面滚动 → 粒子整体绕 Y 轴旋转 + 相机 Z 轴推进（与 GSAP ScrollTrigger 同步）
  - 点击「开始制作」→ 粒子爆发扩散（速度脉冲）后回归
- **性能**：`PointsMaterial` + 自定义着色器（顶点大小随深度衰减）；`requestAnimationFrame` 中做 visibility 暂停；`prefers-reduced-motion` 时降级为静态星空

### 3.3 GSAP 交互编排

| 场景 | 动效 | 技术 |
|---|---|---|
| Hero 入场 | 标题逐字上浮 + 渐变描边扫光 | `gsap.timeline` + `SplitText` 思路（手动分字） |
| Hero 背景 | 渐变文字流光、按钮磁吸 | `gsap.to` + mousemove |
| 滚动 | 各区块交错入场（fade-up / clip 展开） | `ScrollTrigger` |
| 数字滚动 | 编号/日期变化时数字翻滚 | `gsap.to` + `snap` |
| 模板切换 | 铭牌 3D 翻转（rotateY 90 → 换内容 → 转回） | `timeline` + `transformPerspective` |
| 表单反馈 | 输入聚焦时对应铭牌字段高亮脉冲 | `gsap.fromTo` |
| 导出成功 | 铭牌闪光扫过 + 按钮粒子迸发 | `timeline` |
| 签名落笔 | 签名嵌入时铭牌轻微弹跳 + 光晕 | `gsap` elastic |

### 3.4 降级策略

- `prefers-reduced-motion: reduce` → 关闭粒子动画循环与大幅位移动效，保留淡入
- WebGL 不可用 → CSS 渐变星空背景兜底

---

## 4. 技术架构

### 4.1 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 框架 | Vue 3.5 + `<script setup>` + TS | Composition API |
| 构建 | Vite 7 + `vite-ssg` | **构建期 SSG**，输出纯静态 HTML |
| 动效 | GSAP 3（含 ScrollTrigger） | 按需引入 |
| 3D | Three.js | 仅粒子系统，懒加载 |
| 导出 | html-to-image | DOM → PNG，跨域安全（全本地资源） |
| 字体 | Google Fonts（构建期预连接） | `Noto Serif SC` 等 |

### 4.2 SSG 与加载策略

- `vite-ssg` 在构建时预渲染出完整 HTML/CSS，首屏直出，无白屏
- Loading 页**内联在 `index.html`**（`<style>` + 少量结构），不依赖任何 JS——即使 JS 未加载也有炫酷画面
- Three.js 与 GSAP 通过动态 `import()` 懒加载，Loading 退出条件 = 首屏组件挂载 + 关键资源就绪（或 3s 超时兜底）
- 粒子组件挂载后再淡入，避免阻塞 LCP

### 4.3 目录结构

```
contracted-photographer/
├─ index.html              # 内联 Loading 页
├─ vite.config.ts          # vite-ssg 插件
├─ src/
│  ├─ main.ts              # createApp + vite-ssg 入口
│  ├─ App.vue
│  ├─ router/index.ts      # 单路由（/），SSG 需要
│  ├─ styles/              # 全局样式、变量、打印样式
│  ├─ types/index.ts       # PhotographerProfile 等
│  ├─ composables/
│  │  ├─ useProfile.ts     # 表单状态 + localStorage
│  │  ├─ useParticles.ts   # Three.js 封装
│  │  └─ useGsap.ts        # gsap 懒加载注册
│  ├─ components/
│  │  ├─ LoadingScreen.vue
│  │  ├─ ParticleBackground.vue
│  │  ├─ HeroSection.vue
│  │  ├─ FeatureStrip.vue
│  │  ├─ ProfileForm.vue
│  │  ├─ SignaturePad.vue
│  │  ├─ TagEditor.vue
│  │  ├─ BadgePreview.vue
│  │  ├─ BadgeCard.vue     # 3 套模板
│  │  └─ AppFooter.vue
│  └─ utils/
│     ├─ export.ts         # PNG 导出
│     └─ sample.ts         # 示例数据
```

### 4.4 导出与打印方案

- **导出**：`html-to-image` 的 `toPng(node, { pixelRatio: 2|3, backgroundColor })`；导出前将铭牌克隆为固定 600×800 容器，避免视口影响；文件名 `签约摄影师铭牌-{name}-{template}.png`
- **打印**：`@media print` 隐藏除 `#print-area` 外全部元素；`@page { size: A4; margin: 0 }`；铭牌居中；`window.print()` 前用 GSAP 做一次确认脉冲

### 4.5 性能预算

- 首屏 JS（gzip）≤ 90KB（Vue runtime + 首屏组件）
- Three.js 懒加载 chunk ≤ 160KB
- LCP 目标 < 1.8s（SSG 直出 + 内联 Loading）

---

## 5. 里程碑

1. 脚手架 + SSG 验证
2. Loading 页 + 粒子背景
3. Hero + 滚动动效
4. 表单 + 签名板
5. 铭牌模板 + 预览动效
6. 导出/打印
7. 构建验证 + 浏览器实测
