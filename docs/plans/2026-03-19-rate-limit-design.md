# API Rate Limit Design

**Date:** 2026-03-19
**Project:** 问名

## Goal

为部署在 Cloudflare Workers 上的 `/api/generate` 和 `/api/score` 增加双层防刷，避免 OpenRouter token 被高频请求打爆，同时尽量不伤害正常用户体验。

## Confirmed Limits

用户已确认采用平衡档：

- `/api/generate`
  - 目标短期限制：`5 次 / 10 分钟 / IP`
  - 目标长期限制：`15 次 / 24 小时 / IP`
- `/api/score`
  - 目标短期限制：`15 次 / 10 分钟 / IP`
  - 目标长期限制：`60 次 / 24 小时 / IP`

## Official Constraints

根据 Cloudflare 官方文档：

- Workers Rate Limiting binding 的 `simple.period` 只能是 `10` 或 `60` 秒，不能直接配置 `10 分钟`
- Rate Limiting binding 是按 Cloudflare location 本地计数，且是 permissive / eventually consistent，不适合做精确记账
- Durable Objects 适合承担全局一致的状态型配额判断

这意味着：

- 第一层只能做 `10 秒` 或 `60 秒` 的快速削峰
- 真正的 `10 分钟` 和 `24 小时` 配额必须放在 Durable Object

## Chosen Architecture

### Layer 1: Edge Burst Limit

使用 Workers Rate Limiting binding 快速挡掉突发流量：

- `GENERATE_BURST_LIMITER`: `2 次 / 60 秒 / key`
- `SCORE_BURST_LIMITER`: `6 次 / 60 秒 / key`

`key` 采用 `clientId + route` 组合。

目的不是精确记账，而是尽早在边缘挡掉秒级爆发请求，减少 DO 和上游 OpenRouter 的压力。

### Layer 2: Global Quota Limit

使用 Durable Object 做全局一致配额：

- `/api/generate`
  - `5 次 / 10 分钟`
  - `15 次 / 24 小时`
- `/api/score`
  - `15 次 / 10 分钟`
  - `60 次 / 24 小时`

Durable Object 以 `clientId` 为对象粒度，每个对象内部按路由维护计数窗口。

## Client Identifier

优先使用：

1. `CF-Connecting-IP`
2. `x-forwarded-for`
3. `unknown`

说明：

- Cloudflare 官方不推荐把 IP 作为唯一限流 key，因为共享网络会误伤多人
- 但当前项目没有登录体系、没有 API key、没有用户 ID，IP 是现阶段最实际的保护手段
- 后续若接入登录或付费体系，可直接把 key 升级为 `userId` 或 `plan:userId`

## Response Behavior

- 任意一层限流失败，直接返回 `429`
- 返回 JSON 结构：

```json
{
  "error": "请求过于频繁，请稍后再试。",
  "retryAfter": 120,
  "limitType": "burst"
}
```

或

```json
{
  "error": "今日请求次数已达上限，请明天再试。",
  "retryAfter": 3600,
  "limitType": "quota"
}
```

## Data Model

Durable Object 内部为每个路由维护两组固定窗口：

- `tenMinute`
  - `startedAt`
  - `count`
- `day`
  - `startedAt`
  - `count`

当当前时间超过窗口长度时，重置该窗口并重新计数。

这是固定窗口，不是滑动窗口，但实现简单、可预测，足以覆盖当前保护需求。

## Files To Change

- Modify: `/Users/liuwei/workspace/wenming/.worktrees/cloudflare-deploy/src/worker.js`
- Modify: `/Users/liuwei/workspace/wenming/.worktrees/cloudflare-deploy/wrangler.jsonc`
- Modify: `/Users/liuwei/workspace/wenming/.worktrees/cloudflare-deploy/test/worker.test.js`
- Modify: `/Users/liuwei/workspace/wenming/.worktrees/cloudflare-deploy/README.md`

## Validation

- `npm test`
- `npm run build`
- `npm run preview`
- `npm run deploy`

## Sources

- [Cloudflare Workers Rate Limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- [Cloudflare Durable Objects Migrations](https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/)
- [Cloudflare Wrangler Configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
