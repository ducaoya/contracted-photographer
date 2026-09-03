# 签约摄影师认证 · Contracted Photographer

完成签约，获得专属认证铭牌与可验证的电子证书。纯静态站点（SSG），无后端、零数据上传。

## ✨ 特性

- **签约流程**：输入姓名 → 点击「签署合约」→ 模拟服务处理的分阶段 loading（核验身份/生成编号/写入记录/签发铭牌）→ 签发唯一证书编号
- **唯一证书编号**：FNV-1a 双轮哈希（姓名 + 签约时间戳），格式 `CP-XXXX-XXXX`，稳定可复现
- **真实可扫二维码**：铭牌内置二维码（qrcode 库生成），扫码跳转 `/verify` 认证页实时展示认证状态
- **3D 质感铭牌**：鼠标悬停倾斜跟随 + 动态光泽高光，点击翻面查看背面（相机 logo + 姓名 + 编号 + 扫码验证二维码，极简信息布局）
- **背面扫码认证**：二维码与扫码验证信息位于卡片背面，正面保持纯净身份展示
- **双面导出/打印**：导出 PNG 自动将正反两面垂直拼接为一张图（840×2320 高清）；打印时两面平铺 A4 输出
- **双风格铭牌**：黑金典藏 / 纯白极简，GSAP 3D 翻转切换
- **暗黑设计系统**：纯黑基底 + 白色透明度阶梯（100/80/60/40/24/16/10/6/4%），简约高级
- **摄影主题粒子背景**：Three.js 粒子随滚动在「相机 → 光圈 → 胶片 → 星尘」间平滑变形，鼠标视差 + 呼吸微动 + 签约爆发
- **GSAP 动效编排**：逐字入场、按钮磁吸、滚动交错入场、姓名微弹
- **静态 Loading 页**：内联零依赖，彻底消除白屏
- **导出与打印**：html-to-image 2x/3x 高清 PNG；`@media print` A4 居中打印
- **本地暂存**：localStorage 自动保存草稿，刷新不丢失

## 🛠 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Vue 3.5 · `<script setup>` · TypeScript (strict) |
| 构建 | Vite 6 + **vite-ssg**（构建期静态生成，首屏直出） |
| 动效 | GSAP 3 + ScrollTrigger（懒加载） |
| 3D | Three.js（仅粒子系统，动态 import 独立 chunk） |
| 二维码 | qrcode（真实可扫，指向 /verify 认证页） |
| 导出 | html-to-image |

## 📦 命令

```bash
npm install        # 安装依赖
npm run dev        # 本地开发
npm run build      # 类型检查 + SSG 构建（输出 dist/）
npm run preview    # 预览构建产物
```

## 🏗 架构

```
src/
├─ main.ts               # vite-ssg 入口
├─ views/
│  ├─ HomeView.vue       # 首页编排（签约流程联动）
│  └─ VerifyView.vue     # /verify 扫码认证页
├─ components/
│  ├─ ParticleBackground # Three.js 粒子（WebGL 检测降级）
│  ├─ HeroSection        # 逐字入场 + 磁吸 CTA
│  ├─ FeatureStrip       # ScrollTrigger 交错入场
│  ├─ StudioSection      # 签约工作台布局
│  ├─ ContractForm       # 极简表单 + 签约按钮 + loading
│  ├─ BadgePreview       # 模板切换/导出/打印
│  └─ BadgeCard          # 铭牌本体（黑金/纯白 + 二维码）
├─ composables/
│  ├─ useProfile.ts      # 状态 + 签约流程 + localStorage 草稿
│  ├─ useGsap.ts         # GSAP 懒加载（SSG 安全）
│  └─ useParticles.ts    # Three.js 场景封装
└─ utils/
   ├─ cert.ts            # 证书编号哈希 + verify URL 构造/解析
   ├─ qr.ts              # 二维码生成
   └─ export.ts          # PNG 导出
```

### SSG 与加载策略

- `vite-ssg` 构建期预渲染完整 HTML（`data-server-rendered`），LCP 无白屏
- Loading 页**纯 CSS 内联**在 `index.html`，JS 未加载也立即呈现
- Three.js / GSAP 均为动态 `import()` 独立 chunk，不阻塞首屏

## 🎨 设计规范

- 主色：靛蓝 `#6366f1` → 紫 `#a855f7` → 青 `#22d3ee`；黑金模板用 `#d4af37`
- 字体：标题 Noto Serif SC（衬线仪式感）/ 正文 Noto Sans SC / 编号 JetBrains Mono
- 铭牌逻辑尺寸 420×560（3:4），打印输出 152×202mm

## 📄 License

MIT
