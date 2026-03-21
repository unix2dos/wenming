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

## 数据与分析

项目的用户使用记录主要记在 Cloudflare D1 里，核心表有：
- `event_logs`：行为事件日志
- `report_requests`：比较报告请求记录
- `payment_orders`：支付订单记录

### 比较漏斗脚本

```bash
npm run analytics:funnel:remote
```

这个命令会读取线上 D1 的 `event_logs`，汇总最近 7 天和“比较报告”相关的漏斗指标，包括：
- `share_clicks`：分享结果卡点击数
- `summary_opens`：比较摘要打开数
- `partner_copy_clicks`：复制给伴侣的话术点击数
- `shared_report_cta_clicks`：分享页继续去测试的点击数
- `upgrade_clicks`：查看完整报告点击数
- `payments`：支付完成数

同时会输出几个转化率：
- `share_to_open`
- `open_to_copy`
- `open_to_test`
- `open_to_upgrade`
- `upgrade_to_pay`

如果你想查本地模拟库，用：

```bash
npm run analytics:funnel:local
```

### 直接查线上 D1

先进入项目目录：

```bash
cd /Users/liuwei/workspace/wenming
```

查看最近 50 条使用记录：

```bash
npx wrangler d1 execute wenming --remote --config /Users/liuwei/workspace/wenming/wrangler.jsonc --command "
SELECT created_at, event_name, page, session_id, report_id, payload_json
FROM event_logs
ORDER BY created_at DESC
LIMIT 50;
"
```

查看今天各事件次数：

```bash
npx wrangler d1 execute wenming --remote --config /Users/liuwei/workspace/wenming/wrangler.jsonc --command "
SELECT event_name, COUNT(*) AS cnt
FROM event_logs
WHERE created_at >= date('now')
GROUP BY event_name
ORDER BY cnt DESC;
"
```
