# 问名

一个面向中文宝宝起名场景的 Web 应用，主打“大雅大俗，新文人起名”风格。用户可以输入姓氏和偏好生成候选名，也可以对已有名字进行五维打分、收藏和导出。

## 功能概览

- AI 起名：输入姓氏、性别、风格偏好、排除字和自由描述，生成 8 个候选名
- AI 打分：对已有名字给出总分、路线判断和五维解析
- 收藏对比：把喜欢的名字收进“藏书阁”，便于回看和比较
- PDF 导出：把打分结果或生成结果导出为 PDF
- 安全部署：前端不再持有 OpenRouter Key，统一由 Cloudflare Worker 代理请求

## 技术栈

- 前端：Vite 5 + 原生 JavaScript
- 路由：Hash Router
- 图表与导出：Canvas / `html2canvas` / `jspdf`
- AI 接口：OpenRouter Chat Completions
- 部署：Cloudflare Workers + Static Assets

## 项目结构

```text
.
├── src/
│   ├── api/              # 前端调用站内 /api/*
│   ├── components/       # loading / radar chart 等组件
│   ├── pages/            # landing / generation / scoring / collection
│   ├── styles/           # 页面与基础样式
│   ├── utils/            # 本地存储、PDF 导出
│   └── worker.js         # Cloudflare Worker API 代理
├── public/
├── docs/
├── test/                 # 轻量 node:test 覆盖 Worker 关键行为
├── vite.config.js
└── wrangler.jsonc
```

## 本地运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置本地 secret

推荐直接从示例文件复制：

```bash
cp .dev.vars.example .dev.vars
```

然后把 `.dev.vars` 里的 `OPENROUTER_API_KEY` 改成你自己的 key。

仓库里也提供了 `.env.example`，方便团队统一保留变量说明；但当前项目本地联调真正读取的是 `.dev.vars`。

`.dev.vars` 已被 `.gitignore` 忽略，不会提交到仓库。

### 3. 选择本地开发方式

#### 方式 A：前端热更新 + Worker API 联调

终端 1：

```bash
npm run worker:dev
```

终端 2：

```bash
npm run dev
```

说明：
- `vite.config.js` 已把 `/api` 代理到 `http://127.0.0.1:8787`
- 这种方式适合高频调 UI，同时保留真实 API 流程

#### 方式 B：接近线上的一体化预览

```bash
npm run preview
```

这个命令会先执行 `vite build`，再通过 `wrangler dev` 启动 Cloudflare 本地运行时。

## 测试与构建

```bash
npm test
npm run build
```

## 部署到 Cloudflare

### 1. 登录 Cloudflare

```bash
npx wrangler login
```

### 2. 配置生产 secret

```bash
npx wrangler secret put OPENROUTER_API_KEY
```

### 3. 确认当前登录状态

```bash
npx wrangler whoami
```

### 4. 执行部署

```bash
npm run deploy
```

部署成功后，Wrangler 会返回线上域名。

## 运行方式说明

- 浏览器始终只请求站内接口：
  - `POST /api/generate`
  - `POST /api/score`
- Worker 再把请求转发到 OpenRouter
- `OPENROUTER_API_KEY` 仅存在于 Cloudflare secret 或本地 `.dev.vars`
- 应用使用 hash 路由，因此刷新 `#/score`、`#/generate` 不依赖服务端路由重写

## 接口限流

为了避免 OpenRouter token 被刷爆，Worker 现在启用了双层限流：

- 第一层：Cloudflare Rate Limiting binding
  - `/api/generate`：`2 次 / 60 秒 / IP`
  - `/api/score`：`6 次 / 60 秒 / IP`
- 第二层：Durable Object 全局配额
  - `/api/generate`：`5 次 / 10 分钟 / IP`，`15 次 / 24 小时 / IP`
  - `/api/score`：`15 次 / 10 分钟 / IP`，`60 次 / 24 小时 / IP`

说明：
- 第一层负责在边缘快速削峰
- 第二层负责做更准确的全局配额判断
- 命中任意一层时，接口都会返回 `429`

## 常见问题

### 本地点击生成/打分时报错“OPENROUTER_API_KEY 未配置”

检查：
- 是否创建了 `.dev.vars`
- 是否在运行 `wrangler dev`
- `.dev.vars` 中变量名是否精确为 `OPENROUTER_API_KEY`

### `npm run dev` 页面打开了，但 API 404

说明前端热更新服务已启动，但 Worker API 没有启动。另开一个终端执行：

```bash
npm run worker:dev
```

### 部署时提示未登录或无权限

先执行：

```bash
npx wrangler login
npx wrangler whoami
```

如果是 CI/CD 场景，再改用 API Token 配置。

### 被限流时会发生什么

接口会返回类似下面的 JSON：

```json
{
  "error": "请求过于频繁，请稍后再试。",
  "retryAfter": 60,
  "limitType": "burst"
}
```

或者：

```json
{
  "error": "今日起名次数已达上限，请明天再试。",
  "retryAfter": 3600,
  "limitType": "quota"
}
```

后续如果产品加入登录体系，建议把限流 key 从 IP 升级为 `userId` 或 `plan:userId`。

## 备注

- 收藏数据当前保存在浏览器 `localStorage`
- PDF 导出依赖浏览器端截图与生成，不需要额外后端存储
- 若后续要做埋点、鉴权、限流或付费校验，可以继续放在 Worker 层演进
