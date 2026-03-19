# 问名

问名是一个中文宝宝起名 Web 项目，核心方向不是玄学，也不是流行词堆砌，而是用"大雅大俗，新文人起名"的审美标准，帮用户更认真地看待一个名字。

项目主要面向两类场景：
- 还没有名字时，输入姓氏和偏好，生成一批可选名字
- 已经有名字时，输入名字，看看它在音韵、字形、意境、风骨和实用性上的整体表现

## 项目特点

- 起名结果强调常用字、可读性和气质，不追求生僻和炫技
- 打分不是一句空泛评价，而是拆成五个维度分别说明
- 支持收藏喜欢的名字，方便回看和比较
- 支持导出结果，方便和家人讨论

## 主要页面

- 首页：进入起名或打分两条主路径
- 起名页：填写姓氏、性别、风格和偏好，生成候选名字
- 打分页：输入已有名字，查看整体分数和分项解释
- 名字夹：收纳已经收藏、准备比较的名字

## 适合谁

- 正在给宝宝起名的父母
- 对现有名字拿不准，想多一个参考视角的人
- 喜欢偏文学、偏克制、偏中文审美表达的人

## 本地启动

```bash
npm install
cp .dev.vars.example .dev.vars
```

本地最少要补齐这些值：
- `OPENROUTER_API_KEY`
- `PUBLIC_APP_URL`

可选覆盖项：
- `OPENROUTER_MODEL`：默认是 `google/gemini-3.1-flash-lite-preview`

补完 `.dev.vars` 之后，再运行：

```bash
npm run worker:dev
npm run dev
```

如果只想快速预览，也可以直接运行：

```bash
npm run preview
```

## 事件日志与漏斗

这版已经把关键行为写进 `D1` 的 `event_logs`，包括：
- `share_clicked`
- `summary_report_opened`
- `upgrade_clicked`

如果只是排查 Worker 报错，可以直接看：

```bash
npx wrangler tail
```

如果要看漏斗，可以直接运行：

```bash
npm run analytics:funnel:local
npm run analytics:funnel:remote
```

默认统计最近 `7` 天，也可以自定义：

```bash
npm run analytics:funnel:remote -- --days 14
```

## 自动部署

仓库推送到 `main` 后会通过 GitHub Actions 自动部署到 Cloudflare。

首次启用前，需要在 GitHub 仓库的 Secrets 里配置：
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`（可选，不填时默认 `google/gemini-3.1-flash-lite-preview`）
- `PUBLIC_APP_URL`
