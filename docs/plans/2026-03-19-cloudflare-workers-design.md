# Cloudflare Workers Deployment Design

**Date:** 2026-03-19
**Project:** 问名

## Goal

为当前 Vite 单页应用补齐项目 README，并将前端静态资源与 OpenRouter 代理统一部署到 Cloudflare Workers，确保 `OPENROUTER_API_KEY` 不进入浏览器端产物。

## Context

- 现有项目是 `Vite + vanilla JS + hash router` 的单页前端。
- 当前前端通过 [src/api/openrouter.js](/Users/liuwei/workspace/wenming/.worktrees/cloudflare-deploy/src/api/openrouter.js) 直接请求 OpenRouter，并依赖 `VITE_OPENROUTER_API_KEY`，这会在生产构建中暴露密钥。
- 当前仓库没有 README，也没有 Cloudflare 的部署配置。

## Chosen Approach

采用 `Cloudflare Worker + Static Assets` 一体部署方案：

- 继续使用 Vite 负责前端开发和打包。
- 新增 Worker 入口处理 `/api/*` 请求。
- 使用 Cloudflare 静态资源能力托管构建产物。
- 将 `OPENROUTER_API_KEY` 存为 Cloudflare secret，由 Worker 读取后转发请求到 OpenRouter。

## Why This Approach

### Option A: Workers + Static Assets

优点：
- 前后端同域，前端只请求站内 `/api/*`
- 密钥只存在于 Worker 运行时
- 部署单元统一，运维最简单
- 适合当前单页应用和 hash 路由

缺点：
- 需要新增 Worker 入口和 Wrangler 配置

### Option B: Pages + Pages Functions

优点：
- 也能保护密钥

缺点：
- 需要引入额外目录约定
- 本项目更适合直接使用 Worker + Static Assets

### Option C: Pages 纯静态

已排除：
- `VITE_` 前缀环境变量会打进前端产物，不满足密钥保护要求

## Target Architecture

```text
Browser
  -> GET /, /assets/*, /#/...
      -> Cloudflare Static Assets
  -> POST /api/generate
      -> Cloudflare Worker
          -> OpenRouter API
  -> POST /api/score
      -> Cloudflare Worker
          -> OpenRouter API
```

## Code Changes

### 1. 前端 API 层改造

- 保留 [src/api/openrouter.js](/Users/liuwei/workspace/wenming/.worktrees/cloudflare-deploy/src/api/openrouter.js) 作为前端调用入口。
- 移除浏览器端对 `VITE_OPENROUTER_API_KEY` 的读取。
- 将前端请求改为：
  - `POST /api/generate`
  - `POST /api/score`
- 保留现有 prompt 逻辑和 JSON 解析逻辑，避免页面层大改。

### 2. Worker API 代理

- 新增 Worker 入口文件，用 `fetch()` 路由 API 请求。
- 仅处理：
  - `POST /api/generate`
  - `POST /api/score`
- Worker 使用 `env.OPENROUTER_API_KEY` 调用 OpenRouter。
- 对外仅暴露业务结果，不把上游密钥或敏感信息透传到前端。

### 3. Cloudflare 配置

- 新增 `wrangler.jsonc`
- 配置：
  - `main`
  - `compatibility_date`
  - `assets.not_found_handling = "single-page-application"`
  - `assets.run_worker_first = ["/api/*"]`
- 新增适合本项目的 `dev / preview / deploy` 脚本。

### 4. 文档

- 新增仓库 README，覆盖：
  - 项目简介
  - 功能列表
  - 本地开发
  - 环境变量
  - Cloudflare 部署
  - 常见问题

## Local Development

本地开发分成两层：

- 纯前端开发：继续使用 `vite`
- 集成代理开发：使用 Cloudflare 本地运行，验证 Worker 路由和 secret 读取

## Risks And Mitigations

### 1. SPA 路由被 Worker 或静态资源配置吞掉

处理方式：
- 使用 `not_found_handling = "single-page-application"`
- 使用 `run_worker_first = ["/api/*"]`，只让 API 请求优先进入 Worker

### 2. OpenRouter 返回格式不稳定

处理方式：
- 继续保留清洗 Markdown fenced code block 和 `JSON.parse` 的兜底逻辑
- Worker 和前端都返回明确错误信息

### 3. 本地登录 Cloudflare 或 secret 未配置

处理方式：
- README 写清楚 `wrangler login` 与 `wrangler secret put OPENROUTER_API_KEY`
- 如果当前环境未登录，则完成代码与部署配置，部署步骤留在 README 和终端提示中

## Validation

- `npm run build`
- `npm run preview`
- 在本地 Cloudflare 开发模式下验证：
  - `GET /` 返回 SPA
  - `POST /api/generate` 命中 Worker
  - `POST /api/score` 命中 Worker
- 若当前环境已具备 Cloudflare 登录态，则执行一次真实部署验证
