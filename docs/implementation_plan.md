# Sprint 1 · 「问名」MVP 实现方案

> 首页 + 名字打分页 + 新文人视觉 + OpenRouter/Gemini 2.5 Flash 集成

## 技术栈

- **构建工具**：Vite（vanilla JS，不用框架）
- **样式**：Vanilla CSS（CSS Variables 设计系统）
- **图表**：Canvas API 手绘雷达图（保持水墨质感，不用 Chart.js）
- **LLM**：OpenRouter API → `google/gemini-2.5-flash`
- **部署**：本地开发先行（`npm run dev`）

## 项目结构

```
/Users/liuwei/workspace/wenming/
├── index.html              # 单页应用入口
├── package.json
├── vite.config.js
├── .env                    # VITE_OPENROUTER_API_KEY
├── src/
│   ├── main.js             # 路由 & 初始化
│   ├── styles/
│   │   ├── variables.css   # 新文人设计系统（色彩/字体/间距）
│   │   ├── base.css        # 重置 & 全局样式
│   │   ├── landing.css     # 首页样式
│   │   └── scoring.css     # 打分页样式
│   ├── pages/
│   │   ├── landing.js      # 首页渲染
│   │   └── scoring.js      # 打分页逻辑
│   ├── components/
│   │   ├── radar-chart.js  # 5维雷达图（Canvas）
│   │   └── loading.js      # 水墨加载动画
│   └── api/
│       └── openrouter.js   # OpenRouter API 封装
└── public/
    └── fonts/              # 思源宋体子集
```

## Proposed Changes

### Design System

#### [NEW] [variables.css](file:///Users/liuwei/workspace/wenming/src/styles/variables.css)
CSS 变量定义：色彩体系（黛色/月白/烟灰/藕荷/赭石/竹青）、字体栈（思源宋体+思源黑体 via Google Fonts）、间距/圆角/阴影 token。

#### [NEW] [base.css](file:///Users/liuwei/workspace/wenming/src/styles/base.css)
CSS Reset + 全局排版样式 + 下划线式输入框 + 药丸标签 + CTA 按钮。

---

### Landing Page

#### [NEW] [landing.js](file:///Users/liuwei/workspace/wenming/src/pages/landing.js)
首页：居中布局，产品名「问名」+ slogan + 两个场景入口卡片（"给宝宝取名"/"看看名字好不好"）+ 底部示例名字散落。

#### [NEW] [landing.css](file:///Users/liuwei/workspace/wenming/src/styles/landing.css)
首页布局 + 入口卡片 hover 动效 + 底部名字淡入动画。

---

### Scoring Page

#### [NEW] [scoring.js](file:///Users/liuwei/workspace/wenming/src/pages/scoring.js)
打分页三态：输入态（单输入框+按钮）→ 加载态（水墨动画）→ 结果态（总分+雷达图+路线标签+逐维解读）。调用 OpenRouter API，解析 JSON 响应渲染结果。

#### [NEW] [scoring.css](file:///Users/liuwei/workspace/wenming/src/styles/scoring.css)
打分页布局 + 结果卡片 + 维度解读展开/折叠。

---

### Components

#### [NEW] [radar-chart.js](file:///Users/liuwei/workspace/wenming/src/components/radar-chart.js)
Canvas 绘制 5 维雷达图：低饱和填充、细线条、绘制动画（从中心向外展开）、各维度标签。

#### [NEW] [loading.js](file:///Users/liuwei/workspace/wenming/src/components/loading.js)
水墨晕染加载动画（CSS animation）+ 起名趣闻随机文案。

---

### API Integration

#### [NEW] [openrouter.js](file:///Users/liuwei/workspace/wenming/src/api/openrouter.js)
封装 OpenRouter API 调用：POST `https://openrouter.ai/api/v1/chat/completions`，模型 `google/gemini-2.5-flash`，temperature=0，JSON mode。包含打分 System Prompt。

---

### App Shell

#### [NEW] [index.html](file:///Users/liuwei/workspace/wenming/index.html)
HTML 入口，引入 Google Fonts（Noto Serif SC + Noto Sans SC），SEO meta tags。

#### [NEW] [main.js](file:///Users/liuwei/workspace/wenming/src/main.js)
简单的 hash 路由（`#/` → 首页，`#/score` → 打分页），页面切换过渡动画。

#### [NEW] [vite.config.js](file:///Users/liuwei/workspace/wenming/vite.config.js)
Vite 配置：环境变量前缀 `VITE_`。

#### [NEW] [package.json](file:///Users/liuwei/workspace/wenming/package.json)
依赖：仅 vite。

---

## User Review Required

> [!IMPORTANT]
> **API Key 安全**：MVP 阶段将 OpenRouter API Key 存储在 `.env` 中，通过 `VITE_` 前缀暴露给前端。这意味着 API Key 会被打包进前端代码。这对本地开发/演示足够安全，但上线前需要加后端代理。

> [!IMPORTANT]
> **需要你提供 OpenRouter API Key**：开发完成后，需要你在 `.env` 文件中填入你的 API Key 才能运行。

## Verification Plan

### 自动化验证
```bash
# 1. 项目构建检查
cd /Users/liuwei/workspace/wenming && npm run build

# 2. 开发服务器启动
cd /Users/liuwei/workspace/wenming && npm run dev
```

### 浏览器验证（使用 browser 工具）
1. 打开 `http://localhost:5173`，验证首页渲染：产品名、两个入口、底部示例名字
2. 点击「看看名字好不好」，验证跳转到打分页
3. 输入名字（如"林半亩"），点击打分，验证：
   - 加载动画出现
   - 结果页渲染：总分、雷达图、路线标签、逐维解读
4. 验证响应式布局（移动端宽度）
