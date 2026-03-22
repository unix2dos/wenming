# TODOS

## 创建 DESIGN.md

**What:** 创建 DESIGN.md，记录问名的设计体系（颜色 token、字体、间距、组件模式）

**Why:** 现在设计体系散落在 variables.css 和各页面 CSS 中，新功能开发时没有统一参考。设计审查也缺少校准基准。

**Pros:** 未来每次设计审查都能校准，新功能开发更快

**Cons:** 需要花 30 分钟整理

**Context:** variables.css 已经有完整的色彩/字体/间距 token（中国色名变量、Noto Serif/Sans SC、间距体系），只需要把组件模式（`.result-card` 卡片、`.pill` 标签、按钮、输入框、`.dimensions-list` 列表）整理到一个文档里。可以用 `/design-consultation` 来生成。

**Depends on:** 无

**Added:** 2026-03-22 by /plan-design-review

---

## 「问名态度」品牌声明页

**What:** 独立页面 `/about-culture` 阐明问名对待五行/生肖的态度

**Why:** 当家长问「为什么不做五行」时，可以发链接而不是每次解释。同时是潜在的获客内容（可分享、可 SEO）。

**Pros:** 降低解释成本，建立品牌态度，潜在获客入口

**Cons:** 需要写一篇好文案（文案质量决定效果）

**Context:** `docs/cultural-perspective-samples.md` 的「语调校准说明」已经定义了原则（先给信息再给观点、不说大吉大凶、敢说不重要），可以直接改编为面向用户的页面。

**Effort:** S (CC: ~15分钟) | **Priority:** P2

**Depends on:** 传统文化视角功能上线后

**Added:** 2026-03-22 by /plan-ceo-review

---

## 分享金句（微信截图）

**What:** 每个名字的文化分析中提取一句话，优化为微信截图分享格式

**Why:** 自传播机制——家长截图发给家人时，问名的声音跟着传播。

**Pros:** 零成本获客渠道，增强品牌传播

**Cons:** 金句质量依赖 LLM，需要 prompt 工程确保质量稳定

**Context:** 类似现有的 `overall_comment` 一句话总结，但专门为传统文化视角生成，格式适合截图（短、有观点、有记忆点）。

**Effort:** M (CC: ~20分钟) | **Priority:** P2

**Depends on:** 传统文化板块稳定 + LLM 评语质量确认

**Added:** 2026-03-22 by /plan-ceo-review

---

## 比较报告加入传统文化对比

**What:** 现有比较报告加入五行/生肖/重名率维度的对比

**Why:** 家长在两个候选名之间犹豫时，传统文化维度也能给出参考。让比较报告的价值感更完整。

**Pros:** 复用已有比较报告架构 + 文化计算函数，增量工作量小

**Cons:** 比较报告本身的使用率需要先验证

**Context:** 现有比较报告 (`compare-report.js`) 只比较审美五维。加入文化维度后，每个名字的 wuxing/zodiac/freq 数据可以并排展示。

**Effort:** M (CC: ~30分钟) | **Priority:** P2

**Depends on:** 单个名字的传统文化板块稳定

**Added:** 2026-03-22 by /plan-ceo-review

---

## 「终审报告」导出

**What:** 审美五维 + 传统文化 + 实用性（谐音、重名率）合成一份可导出的 PDF 报告

**Why:** 12 个月理想状态的核心价值主张——帮家长终结家庭讨论。也是自然的付费载体（「专业系统已经全面评估过了」）。

**Pros:** 付费转化的自然载体，提升产品价值感

**Cons:** 需要重新设计 PDF 导出模板，工作量较大

**Context:** 现有 PDF 导出 (`export.js`) 只包含审美打分。升级版需要整合所有维度，设计上要体现「一份完整的命名报告」的感觉。可以作为付费功能。

**Effort:** L (CC: ~1小时) | **Priority:** P1

**Depends on:** 传统文化板块 + 比较报告文化对比

**Added:** 2026-03-22 by /plan-ceo-review
