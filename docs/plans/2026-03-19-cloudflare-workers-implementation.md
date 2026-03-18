# Cloudflare Workers Deployment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为问名项目补齐 README，并完成基于 Cloudflare Workers 的安全部署改造，避免 OpenRouter 密钥暴露到前端。

**Architecture:** 保持现有 Vite SPA 与 hash 路由不变，把 API 调用下沉到 Cloudflare Worker。Worker 负责处理 `/api/*`，静态资源继续由 Vite 构建并作为 Workers Static Assets 一起发布。前端页面层只保留对站内 API 的依赖，不再持有任何上游密钥。

**Tech Stack:** Vite 5, vanilla JS, Cloudflare Workers, Wrangler, OpenRouter Chat Completions API

---

### Task 1: 补齐部署与运行配置

**Files:**
- Create: `/Users/liuwei/workspace/wenming/.worktrees/cloudflare-deploy/wrangler.jsonc`
- Modify: `/Users/liuwei/workspace/wenming/.worktrees/cloudflare-deploy/package.json`
- Modify: `/Users/liuwei/workspace/wenming/.worktrees/cloudflare-deploy/.gitignore`

**Step 1: 写下预期行为**

目标：
- 本地可执行 `npm run dev` 进行前端开发
- 可执行 `npm run cf:dev` 运行 Worker + 静态资源
- 可执行 `npm run deploy` 进行 Cloudflare 部署

**Step 2: 先验证现有基线**

Run: `npm run build`
Expected: PASS，Vite 构建成功

**Step 3: 写最小配置**

实现：
- 添加 Wrangler 配置
- 添加 `assets.not_found_handling = "single-page-application"`
- 添加 `assets.run_worker_first = ["/api/*"]`
- 增加 `wrangler` 和 Cloudflare Vite 插件依赖及脚本

**Step 4: 验证配置生效**

Run: `npm run build`
Expected: PASS，构建仍可通过

**Step 5: Commit**

```bash
git add .gitignore package.json package-lock.json wrangler.jsonc
git commit -m "chore: add cloudflare worker config"
```

### Task 2: 实现 Worker 代理与前端 API 改造

**Files:**
- Create: `/Users/liuwei/workspace/wenming/.worktrees/cloudflare-deploy/src/worker.js`
- Modify: `/Users/liuwei/workspace/wenming/.worktrees/cloudflare-deploy/src/api/openrouter.js`

**Step 1: 写下失败验证目标**

目标：
- 前端不再读取 `VITE_OPENROUTER_API_KEY`
- `/api/generate` 和 `/api/score` 成为唯一接口入口
- Worker 能读取 `env.OPENROUTER_API_KEY`

**Step 2: 先做静态验证**

Run: `rg -n "VITE_OPENROUTER_API_KEY|openrouter.ai/api/v1/chat/completions" src`
Expected: 初始状态下，前端文件仍直接依赖浏览器端密钥和 OpenRouter 地址

**Step 3: 写最小实现**

实现：
- 前端 API 层改为调用站内 `/api/*`
- Worker 校验请求体并转发到 OpenRouter
- 对错误统一返回 JSON

**Step 4: 验证改造结果**

Run: `rg -n "VITE_OPENROUTER_API_KEY|openrouter.ai/api/v1/chat/completions" src`
Expected: 仅 Worker 中保留 OpenRouter 上游地址；浏览器端不再含密钥引用

**Step 5: Commit**

```bash
git add src/api/openrouter.js src/worker.js
git commit -m "feat: proxy openrouter through cloudflare worker"
```

### Task 3: 编写 README

**Files:**
- Create: `/Users/liuwei/workspace/wenming/.worktrees/cloudflare-deploy/README.md`

**Step 1: 明确文档目标**

README 必须覆盖：
- 项目定位与主要功能
- 运行截图级别的页面说明
- 本地运行命令
- 环境变量与 secret 配置
- Cloudflare 部署步骤
- 常见问题与故障排查

**Step 2: 写最小文档**

实现：
- 用当前实际代码结构写 README，不写未实现能力
- 把 Cloudflare secret 配置和部署命令写清楚

**Step 3: 验证 README 与代码一致**

Run: `rg -n "cf:dev|deploy|OPENROUTER_API_KEY|/api/generate|/api/score" README.md package.json wrangler.jsonc src`
Expected: 文档与命令、路径、变量名一致

**Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add project readme"
```

### Task 4: 完整验证与部署尝试

**Files:**
- Verify: `/Users/liuwei/workspace/wenming/.worktrees/cloudflare-deploy/package.json`
- Verify: `/Users/liuwei/workspace/wenming/.worktrees/cloudflare-deploy/wrangler.jsonc`
- Verify: `/Users/liuwei/workspace/wenming/.worktrees/cloudflare-deploy/src/worker.js`
- Verify: `/Users/liuwei/workspace/wenming/.worktrees/cloudflare-deploy/src/api/openrouter.js`
- Verify: `/Users/liuwei/workspace/wenming/.worktrees/cloudflare-deploy/README.md`

**Step 1: 构建验证**

Run: `npm run build`
Expected: PASS

**Step 2: Cloudflare 本地预览验证**

Run: `npm run preview`
Expected: Worker 运行，静态资源与 API 路由都可用

**Step 3: 部署前条件检查**

Run: `npx wrangler whoami`
Expected: 若已登录，则显示账号信息；否则报告为部署阻塞项

**Step 4: 部署**

Run: `npm run deploy`
Expected: 若账号和 secret 均已配置，则返回部署 URL

**Step 5: Commit**

```bash
git add README.md package.json package-lock.json wrangler.jsonc src/api/openrouter.js src/worker.js
git commit -m "feat: deploy app to cloudflare workers"
```
