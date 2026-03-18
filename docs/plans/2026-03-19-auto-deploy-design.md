# GitHub Auto Deploy Design

**Date:** 2026-03-19
**Project:** 问名

## Goal

让仓库在推送到 `main` 分支后，自动执行 Cloudflare Worker 的部署，不再依赖手工运行 `npm run deploy`。

## Current State

- 项目已经具备本地 `wrangler deploy` 能力。
- Cloudflare Worker 名称已经固定为 `wenming`。
- 仓库里还没有任何 GitHub Actions 工作流。

## Chosen Approach

采用 `GitHub Actions + cloudflare/wrangler-action`：

- `push` 到 `main` 时触发
- 先安装依赖
- 运行测试
- 运行构建
- 再使用官方 `wrangler-action` 执行 `deploy`

## Why This Approach

### Option A: GitHub Actions + Wrangler Action

优点：
- 与当前 `wrangler deploy` 方式完全一致
- 使用 Cloudflare 官方文档推荐方案
- 只需要 GitHub secrets，不需要额外改 Cloudflare 项目接入方式

缺点：
- 需要维护一个 workflow 文件

### Option B: Workers Builds

优点：
- Cloudflare 原生 Git 集成

缺点：
- 需要在 Cloudflare 控制台重新绑定仓库
- 会改变当前部署路径，不适合这次“最小改动接管现有部署”

## Required Secrets

根据 Cloudflare 官方 GitHub Actions 文档，需要在 GitHub 仓库 Secrets 中配置：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

本项目当前还需要：

- `OPENROUTER_API_KEY`

说明：

- `CLOUDFLARE_API_TOKEN` 与 `CLOUDFLARE_ACCOUNT_ID` 用于 CI 登录 Cloudflare
- `OPENROUTER_API_KEY` 用于在 workflow 中执行 `wrangler secret put OPENROUTER_API_KEY`

## Workflow Behavior

### Trigger

- `push` 到 `main`
- 可选支持 `workflow_dispatch`，方便手工重跑

### Steps

1. checkout
2. setup node
3. `npm ci`
4. `npm test`
5. `npm run build`
6. `wrangler secret put OPENROUTER_API_KEY`
7. `wrangler deploy`

## Secret Sync Strategy

GitHub Actions 运行时不会自动继承 Cloudflare Dashboard 里已有的 Worker secret。

因此 workflow 需要在每次部署前显式执行：

```bash
printf '%s' "$OPENROUTER_API_KEY" | wrangler secret put OPENROUTER_API_KEY
```

这样可以确保 GitHub 上的部署和本地/控制台的 secret 保持一致。

## Files To Change

- Create: `.github/workflows/deploy.yml`
- Optionally modify: `README.md` 仅补一句 GitHub secrets 提示

## Validation

- 本地执行 `npm test`
- 本地执行 `npm run build`
- 检查 workflow YAML 结构
- 推送到远端后观察 GitHub Actions 是否触发

## Sources

- [Cloudflare Workers GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
- [Cloudflare CI/CD Overview](https://developers.cloudflare.com/workers/ci-cd/)
- [cloudflare/wrangler-action](https://github.com/cloudflare/wrangler-action)
