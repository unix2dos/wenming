# Professional Results Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade Wenming into a professional, monetizable naming product with summary-to-paid comparison reports, Lemon Squeezy checkout, and queryable product event logs.

**Architecture:** Keep the current SPA funnel, add a paid comparison-report flow behind Worker-controlled APIs, persist payment/report/event state in D1, and separate debug logs from product event logs. The frontend continues to render free summaries, while full reports are unlocked only after verified payment.

**Tech Stack:** Vite SPA, Cloudflare Workers, D1, Lemon Squeezy, existing hash router, existing OpenRouter integration

---

### Task 1: Add D1 schema for reports, payments, and events

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/wrangler.jsonc`
- Create: `/Users/liuwei/workspace/wenming/migrations/0001_professional_results.sql`
- Test: `/Users/liuwei/workspace/wenming/src/worker.js`

**Step 1: Write the schema**

Create D1 tables for:
- `report_requests`
- `payment_orders`
- `event_logs`

Include indexes on:
- `session_id`
- `report_id`
- `payment_status`
- `created_at`

**Step 2: Wire D1 binding**

Add a D1 binding in `wrangler.jsonc` and document the binding name used by the Worker.

**Step 3: Validate local config**

Run the local Wrangler/D1 command needed to apply the migration and verify the schema exists.

**Step 4: Commit**

Use a commit once the schema and binding are stable.

### Task 2: Add server utilities for event logging and report persistence

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/src/worker.js`
- Test: `/Users/liuwei/workspace/wenming/src/worker.js`

**Step 1: Add helper functions**

Add Worker helpers for:
- `logEvent`
- `createReportRequest`
- `markReportPaid`
- `getSummaryReport`
- `getFullReportIfPaid`

**Step 2: Define event names**

Start with:
- `landing_cta_clicked`
- `quiz_completed`
- `generate_completed`
- `score_completed`
- `upgrade_clicked`
- `checkout_created`
- `payment_completed`
- `share_clicked`

**Step 3: Log on server-side milestones**

Ensure payment creation, webhook success, and full-report retrieval all emit structured event logs.

**Step 4: Verify**

Run Worker tests or local requests to confirm inserts happen and bad payloads fail safely.

### Task 3: Introduce comparison-report summary and full-report prompts

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/src/worker.js`
- Test: `/Users/liuwei/workspace/wenming/src/worker.js`

**Step 1: Define new prompt builders**

Add prompt builders for:
- summary comparison report
- full paid comparison report

**Step 2: Extend prompt dimensions**

Require output fields covering:
- recommendation
- why each candidate works
- literary analysis
- risk notes
- traditional-dimension module
- ranked comparison

**Step 3: Keep free and paid outputs separate**

Ensure summary prompt cannot accidentally return the full paid payload.

**Step 4: Verify**

Test JSON parsing and schema validation for both response types.

### Task 4: Add checkout creation API for Lemon Squeezy

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/src/worker.js`
- Modify: `/Users/liuwei/workspace/wenming/.dev.vars.example`
- Test: `/Users/liuwei/workspace/wenming/src/worker.js`

**Step 1: Add env variables**

Add placeholders for:
- `LEMON_SQUEEZY_API_KEY`
- `LEMON_SQUEEZY_STORE_ID`
- `LEMON_SQUEEZY_VARIANT_ID`
- `LEMON_SQUEEZY_WEBHOOK_SECRET`

**Step 2: Implement checkout endpoint**

Add `POST /api/checkout/compare-report` that:
- validates selected names
- creates a report request
- creates a Lemon Squeezy checkout
- stores checkout metadata
- returns checkout URL

**Step 3: Attach custom metadata**

Include:
- `report_id`
- `session_id`
- selected names digest

**Step 4: Verify**

Use a test request and confirm a valid checkout URL is returned.

### Task 5: Add Lemon Squeezy webhook verification and payment unlock

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/src/worker.js`
- Test: `/Users/liuwei/workspace/wenming/src/worker.js`

**Step 1: Implement webhook endpoint**

Add `POST /api/webhooks/lemonsqueezy`.

**Step 2: Verify signature**

Reject unsigned or invalid webhook payloads.

**Step 3: Persist payment state**

On `order_created`, mark the order paid and unlock the report.

**Step 4: Log completion**

Emit `payment_completed` with report and order identifiers.

**Step 5: Verify**

Replay a sample webhook and confirm the report becomes readable.

### Task 6: Add report summary and full-report retrieval APIs

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/src/worker.js`
- Test: `/Users/liuwei/workspace/wenming/src/worker.js`

**Step 1: Add summary endpoint**

Add `POST /api/report/summary` to generate or retrieve a summary report for 2-3 selected names.

**Step 2: Add full-report endpoint**

Add `GET /api/report/full?report_id=...` that only returns data when payment is verified.

**Step 3: Enforce server-side boundary**

Never return full paid content from summary APIs.

**Step 4: Verify**

Test unpaid and paid access separately.

### Task 7: Add frontend comparison flow and upgrade CTA

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/src/pages/generation.js`
- Modify: `/Users/liuwei/workspace/wenming/src/pages/scoring.js`
- Modify: `/Users/liuwei/workspace/wenming/src/pages/collection.js`
- Create: `/Users/liuwei/workspace/wenming/src/pages/compare-report.js`
- Modify: `/Users/liuwei/workspace/wenming/src/main.js`
- Create: `/Users/liuwei/workspace/wenming/src/styles/compare-report.css`

**Step 1: Add compare entry points**

Expose “compare 2-3 names” from result and collection flows.

**Step 2: Build summary report UI**

Render:
- headline recommendation
- short reasoning
- per-name cards
- upgrade CTA

**Step 3: Add checkout redirect**

When the user clicks upgrade, call the checkout API and redirect to Lemon Squeezy.

**Step 4: Add success return handling**

After payment, reload the report page and fetch the full report.

**Step 5: Verify**

Test the full browser flow from selection to checkout redirect to unlocked content.

### Task 8: Rename collection language away from “藏书阁”

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/src/pages/collection.js`
- Modify: `/Users/liuwei/workspace/wenming/src/pages/generation.js`
- Modify: `/Users/liuwei/workspace/wenming/src/pages/scoring.js`
- Modify: `/Users/liuwei/workspace/wenming/README.md`

**Step 1: Replace collection naming**

Rename user-facing collection copy to naming-centered terminology.

**Step 2: Keep tone restrained**

Preserve a little literary polish without using book metaphors.

**Step 3: Verify**

Search the codebase for remaining `藏书阁` strings and remove or justify each remaining use.

### Task 9: Upgrade result-page copy and professional structure

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/src/pages/generation.js`
- Modify: `/Users/liuwei/workspace/wenming/src/pages/scoring.js`
- Modify: `/Users/liuwei/workspace/wenming/src/styles/generation.css`
- Modify: `/Users/liuwei/workspace/wenming/src/styles/scoring.css`

**Step 1: Redesign free result hierarchy**

Add:
- recommendation layer
- explanation layer
- upgrade layer

**Step 2: Improve visual quality**

Make the result pages feel more editorial and premium, especially on mobile.

**Step 3: Verify**

Check both desktop and mobile layouts and confirm the upgrade CTA is visible without overwhelming the free result.

### Task 10: Add client-side event capture hooks

**Files:**
- Create: `/Users/liuwei/workspace/wenming/src/utils/analytics.js`
- Modify: `/Users/liuwei/workspace/wenming/src/pages/landing.js`
- Modify: `/Users/liuwei/workspace/wenming/src/pages/quiz-page.js`
- Modify: `/Users/liuwei/workspace/wenming/src/pages/generation.js`
- Modify: `/Users/liuwei/workspace/wenming/src/pages/scoring.js`
- Modify: `/Users/liuwei/workspace/wenming/src/pages/share.js`
- Modify: `/Users/liuwei/workspace/wenming/src/pages/collection.js`

**Step 1: Add lightweight analytics helper**

Send structured events to a Worker endpoint with a stable anonymous session ID.

**Step 2: Instrument key funnel points**

Track:
- CTA clicks
- quiz completion
- result exposure
- compare selection
- upgrade click
- share click

**Step 3: Verify**

Trigger the flows locally and confirm event rows are written.

### Task 11: Add log viewing and operator workflow

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/README.md`
- Create: `/Users/liuwei/workspace/wenming/docs/plans/2026-03-19-professional-results-ops.md`

**Step 1: Document debug log viewing**

Add instructions for:
- Cloudflare Workers Logs
- `wrangler tail`

**Step 2: Document product-event querying**

Add sample `wrangler d1 execute` queries for:
- recent upgrades
- paid reports today
- checkout success rate

**Step 3: Verify**

Run each documented query once and confirm it returns expected columns.

### Task 12: Verify the full funnel before shipping

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/src/pages/landing.test.js`
- Modify: `/Users/liuwei/workspace/wenming/src/utils/direction-quiz.test.js`
- Create: `/Users/liuwei/workspace/wenming/src/pages/compare-report.test.js`

**Step 1: Add or update tests**

Cover:
- compare-report route rendering
- free vs paid content boundary
- renamed collection copy

**Step 2: Run tests**

Run the project test suite and any targeted manual verification.

**Step 3: Record residual risks**

Document any untested payment-provider edge cases.

**Step 4: Commit**

Commit when the funnel is stable and tests pass.
