# API Rate Limit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为问名项目的 Cloudflare Worker 增加双层限流，保护 OpenRouter token 成本。

**Architecture:** 第一层使用 Workers Rate Limiting binding 做 60 秒突发削峰，第二层使用 Durable Object 做 10 分钟和 24 小时的全局准确配额。所有判断都发生在调用 OpenRouter 之前，命中限流时直接返回 `429` JSON。

**Tech Stack:** Cloudflare Workers, Rate Limiting binding, Durable Objects, Wrangler, node:test

---

### Task 1: 写限流失败测试

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/.worktrees/cloudflare-deploy/test/worker.test.js`

**Step 1: 写 burst limit 失败测试**

新增测试：
- 当 `env.GENERATE_BURST_LIMITER.limit()` 返回 `{ success: false }` 时，`/api/generate` 返回 `429`

**Step 2: 运行测试验证失败**

Run: `npm test`
Expected: FAIL，因为当前 Worker 还不会调用 rate limiting binding

**Step 3: 写 quota limit 失败测试**

新增测试：
- 当 Durable Object 返回 quota exceeded 时，`/api/score` 返回 `429`

**Step 4: 再次运行测试验证失败**

Run: `npm test`
Expected: FAIL，因为当前 Worker 还没有 Durable Object 配额判断

### Task 2: 实现 Worker 双层限流

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/.worktrees/cloudflare-deploy/src/worker.js`

**Step 1: 实现 clientId、burst limit 和 quota limit helper**

**Step 2: 实现 Durable Object 类**

类名：
- `QuotaLimiter`

职责：
- 维护 `/api/generate` 和 `/api/score` 的 10 分钟 / 24 小时固定窗口计数
- 返回 `{ allowed, retryAfter, limitType }`

**Step 3: 在 API 入口接入双层限流**

顺序：
1. burst limiter
2. durable object quota
3. payload 校验
4. upstream OpenRouter

**Step 4: 运行测试验证通过**

Run: `npm test`
Expected: PASS

### Task 3: 配置 Wrangler 绑定

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/.worktrees/cloudflare-deploy/wrangler.jsonc`

**Step 1: 添加 ratelimits 绑定**

- `GENERATE_BURST_LIMITER`
- `SCORE_BURST_LIMITER`

**Step 2: 添加 durable_objects binding 和 migrations**

- binding name: `QUOTA_LIMITER`
- class name: `QuotaLimiter`
- migration tag: 新增唯一 tag

**Step 3: 运行构建验证**

Run: `npm run build`
Expected: PASS

### Task 4: 更新 README 并重新部署

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/.worktrees/cloudflare-deploy/README.md`

**Step 1: 更新 README**

补充：
- 当前限流策略
- 被限流时的行为
- 未来如何切换到用户级 key

**Step 2: 完整验证**

Run: `npm test && npm run build`
Expected: PASS

**Step 3: 重新部署**

Run: `npm run deploy`
Expected: PASS，并返回新的 Worker version id
