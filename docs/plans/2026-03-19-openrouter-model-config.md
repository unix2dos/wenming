# OpenRouter Model Config Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the OpenRouter model configurable via environment variable while defaulting the app to `deepseek/deepseek-v3.2`.

**Architecture:** Keep model resolution inside the Worker so the frontend API surface does not change. Read `OPENROUTER_MODEL` from runtime env, trim it, fall back to the new DeepSeek default, and lock the behavior with a request-payload test plus local config docs.

**Tech Stack:** Cloudflare Workers, Node test runner, OpenRouter, Vite

---

### Task 1: Lock model selection behavior with a failing test

**Files:**
- Modify: `src/worker.test.js`
- Test: `src/worker.test.js`

**Step 1: Write the failing test**

Add a test that sends a generate request with `OPENROUTER_MODEL=custom/model` and asserts the outbound OpenRouter request body uses `custom/model`.

**Step 2: Run test to verify it fails**

Run: `npm test -- --test-name-pattern "generate endpoint uses OPENROUTER_MODEL"`
Expected: FAIL because the Worker still sends the hard-coded model.

**Step 3: Write minimal implementation**

Resolve the model from `env.OPENROUTER_MODEL`, trimming whitespace and falling back to `deepseek/deepseek-v3.2`.

**Step 4: Run test to verify it passes**

Run: `npm test -- --test-name-pattern "generate endpoint uses OPENROUTER_MODEL"`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/worker.js src/worker.test.js
git commit -m "feat: make openrouter model configurable"
```

### Task 2: Update local config examples and docs

**Files:**
- Modify: `.dev.vars.example`
- Modify: `README.md`

**Step 1: Write the failing expectation**

Document that local development can set `OPENROUTER_MODEL`, and that the default is `deepseek/deepseek-v3.2`.

**Step 2: Update the example config**

Add `OPENROUTER_MODEL=deepseek/deepseek-v3.2` to `.dev.vars.example`.

**Step 3: Update README**

Mention the optional model override in the local setup section.

**Step 4: Run verification**

Run: `npm test`
Expected: PASS.

**Step 5: Commit**

```bash
git add .dev.vars.example README.md docs/plans/2026-03-19-openrouter-model-config.md
git commit -m "docs: document openrouter model override"
```
