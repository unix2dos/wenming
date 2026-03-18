# GitHub Auto Deploy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为问名项目补齐 GitHub Actions 自动部署，使 `main` 分支 push 后自动发布到 Cloudflare。

**Architecture:** 使用 GitHub Actions 作为外部 CI/CD，在 `main` 分支 push 时统一执行 `npm ci`、`npm test`、`npm run build`，然后通过 `cloudflare/wrangler-action@v3` 调用 `wrangler secret put` 与 `wrangler deploy`。这样可以沿用当前 Worker 和 Wrangler 配置，不改变部署架构。

**Tech Stack:** GitHub Actions, Cloudflare Wrangler Action, Cloudflare Workers, Node.js

---

### Task 1: 新增自动部署 workflow

**Files:**
- Create: `/Users/liuwei/workspace/wenming/.worktrees/auto-deploy/.github/workflows/deploy.yml`

**Step 1: 写最小 workflow**

要求：
- 触发条件：`push` 到 `main`，以及 `workflow_dispatch`
- 安装 Node
- 执行 `npm ci`
- 执行 `npm test`
- 执行 `npm run build`
- 使用 `cloudflare/wrangler-action@v3`

**Step 2: 确保 secret 同步**

在 workflow 内加入：
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `OPENROUTER_API_KEY`

并在 deploy 前运行 `wrangler secret put OPENROUTER_API_KEY`

**Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add cloudflare deploy workflow"
```

### Task 2: 最小补充说明

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/.worktrees/auto-deploy/README.md`

**Step 1: 仅补一小段说明**

内容：
- 仓库自动部署依赖 3 个 GitHub secrets

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add auto deploy note"
```

### Task 3: 验证

**Files:**
- Verify: `/Users/liuwei/workspace/wenming/.worktrees/auto-deploy/.github/workflows/deploy.yml`
- Verify: `/Users/liuwei/workspace/wenming/.worktrees/auto-deploy/README.md`

**Step 1: 运行测试**

Run: `npm test`
Expected: PASS

**Step 2: 运行构建**

Run: `npm run build`
Expected: PASS

**Step 3: 检查 git diff**

Run: `git diff --stat`
Expected: 只包含 workflow 和极少量说明变更
