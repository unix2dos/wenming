# Radar And Navigation Results Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all radar-chart result views, remove the redundant generation conclusion strip, and unify page back-navigation into a predictable parent-level flow.

**Architecture:** Keep the existing hash-router SPA and solve this in three layers: normalize radar data once in a shared component/helper, simplify the generation result hierarchy by removing the redundant conclusion block, and introduce a shared navigation helper so every page uses the same fixed-parent return rules instead of hardcoded per-page links. Result-state pages keep their first back action inside the current feature, while top-level pages return to a fixed parent route.

**Tech Stack:** Vite SPA, hash router, vanilla JS page renderers, Node test runner

---

## Definition Of Done

1. All pages that render radar charts show an actual data polygon and numeric labels, never `undefined`.
2. Missing radar dimensions fall back to a default median score of `10`, preserving layout and visual completeness.
3. The generation result page no longer renders the standalone `本轮结论` strip or its CTA.
4. Every page with a return action exposes one clear “返回上一层” entry and follows fixed parent navigation rules instead of generic “返回首页/返回收藏列表”.
5. Result-state pages return to their own input state first and do not leave the current feature on the first back action.
6. Compare-report pages return to `#/collection` when compare context exists; otherwise they fall back to `#/`.
7. Automated tests cover radar fallback behavior, generation-strip removal, and shared back-navigation rules.

## Page-Level Acceptance Matrix

| Page / State | Back target | Acceptance note |
| --- | --- | --- |
| `#/score` input/loading | `#/` | One clear back entry only |
| `#/score` result | score input state | First back stays inside scoring |
| `#/generate` input/loading | `#/` | One clear back entry only |
| `#/generate` result | generation input state | First back stays inside generation |
| `#/collection` empty/list | `#/` | Collection remains top-level child of home |
| `#/collection` compare subview | collection list state | First back stays inside collection |
| `#/test` question | `#/` | Question flow is top-level feature |
| `#/test` result | test question state | First back restarts within test |
| `#/share` | `#/` | Shared landing always falls back home |
| `#/compare-report` with local compare context | `#/collection` | Includes summary/full states entered from local compare flow |
| `#/compare-report` direct/shared open | `#/` | No local compare context means home fallback |

## Product Assumptions Locked For This Plan

- “只保留一个统一的返回上一层入口” means one clear back action per page header, not a visible breadcrumb path.
- Non-return secondary actions such as `我的名字夹` or `发给伴侣看看` may remain if they are not labeled as return actions.
- Radar fallback uses `10` as the median/default score for any missing or malformed dimension item.
- Compare-report belongs to the collection layer from a product-information perspective, even if entry started from scoring/generation compare CTA.

### Task 1: Normalize Radar Data And Remove `undefined` Rendering

**Files:**
- Create: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/components/radar-chart.test.js`
- Modify: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/components/radar-chart.js`
- Modify: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/pages/scoring.js`
- Test: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/pages/scoring.test.js`

**Step 1: Write the failing radar normalization tests**

Add focused tests for a helper such as:

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeRadarDimensions } from './radar-chart.js';

test('normalizeRadarDimensions fills missing scores with 10', () => {
  assert.deepEqual(normalizeRadarDimensions({
    sound: { score: 18, analysis: '顺口' },
    shape: null,
  }), {
    sound: { score: 18, analysis: '顺口' },
    shape: { score: 10, analysis: '' },
    style: { score: 10, analysis: '' },
    classic: { score: 10, analysis: '' },
    practical: { score: 10, analysis: '' },
  });
});
```

Also extend the scoring page test to cover malformed/missing dimension payloads and assert the rendered HTML no longer contains `undefined`.

**Step 2: Run test to verify it fails**

Run: `node --import ./test-support/register-css-loader.mjs --test src/components/radar-chart.test.js src/pages/scoring.test.js`

Expected: FAIL because `normalizeRadarDimensions` does not exist and current result rendering still trusts raw dimension fields.

**Step 3: Implement shared normalization in the radar component**

Add an exported helper to:

- enforce the five canonical keys: `sound`, `shape`, `style`, `classic`, `practical`
- coerce invalid or missing scores to `10`
- coerce missing analysis strings to `''`
- let `renderRadarChart` always use normalized data before drawing labels and polygon

**Step 4: Reuse normalized dimensions in the scoring result page**

Update scoring result rendering so:

- dimension detail blocks read from normalized dimensions
- the radar chart receives normalized dimensions
- the page cannot render `undefined` in numeric labels or analysis copy

**Step 5: Run tests to verify the fix**

Run: `node --import ./test-support/register-css-loader.mjs --test src/components/radar-chart.test.js src/pages/scoring.test.js`

Expected: PASS

**Step 6: Commit**

```bash
git add src/components/radar-chart.js src/components/radar-chart.test.js src/pages/scoring.js src/pages/scoring.test.js
git commit -m "fix: normalize radar chart dimensions"
```

### Task 2: Apply Radar Fallback Across Other Result Surfaces

**Files:**
- Modify: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/pages/generation.js`
- Modify: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/pages/collection.js`
- Modify: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/pages/generation.test.js`
- Modify: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/pages/collection.test.js`

**Step 1: Write the failing page-level regression tests**

Add assertions that malformed candidate dimension payloads do not break result rendering:

```js
assert.doesNotMatch(container.innerHTML, /undefined/);
```

For generation, keep the modal render path safe when `nameData.dimensions` is incomplete.

For collection compare view, ensure selected names with partial dimensions still render and schedule radar drawing safely.

**Step 2: Run tests to verify they fail**

Run: `node --import ./test-support/register-css-loader.mjs --test src/pages/generation.test.js src/pages/collection.test.js`

Expected: FAIL if tests assert normalization behavior that current page code does not guarantee.

**Step 3: Use the shared normalization helper in all radar entry points**

Update generation modal and collection compare rendering to pass normalized dimension objects into `renderRadarChart` and any text fields derived from dimensions.

**Step 4: Run tests to verify they pass**

Run: `node --import ./test-support/register-css-loader.mjs --test src/pages/generation.test.js src/pages/collection.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/generation.js src/pages/collection.js src/pages/generation.test.js src/pages/collection.test.js
git commit -m "fix: harden radar rendering across result pages"
```

### Task 3: Remove The Redundant Generation Conclusion Strip

**Files:**
- Modify: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/pages/generation.js`
- Modify: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/styles/generation.css`
- Modify: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/pages/generation.test.js`

**Step 1: Write the failing result-structure test**

Extend the generation result-state test with:

```js
assert.doesNotMatch(container.innerHTML, /本轮结论/);
assert.doesNotMatch(container.innerHTML, /去名字夹选候选/);
```

Retain the compare-offer assertions so the paid-compare entry remains visible.

**Step 2: Run test to verify it fails**

Run: `node --import ./test-support/register-css-loader.mjs --test src/pages/generation.test.js`

Expected: FAIL because the current result page still renders the conclusion strip and its CTA.

**Step 3: Remove the strip and clean layout styles**

Delete the standalone `generation-conclusion-strip` block from the generation result page and remove or simplify any now-unused CSS tied to that block.

**Step 4: Run test to verify it passes**

Run: `node --import ./test-support/register-css-loader.mjs --test src/pages/generation.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/generation.js src/styles/generation.css src/pages/generation.test.js
git commit -m "refactor: remove redundant generation conclusion strip"
```

### Task 4: Introduce Shared Fixed-Parent Back Navigation

**Files:**
- Create: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/utils/navigation.js`
- Create: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/utils/navigation.test.js`
- Modify: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/pages/scoring.js`
- Modify: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/pages/generation.js`
- Modify: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/pages/collection.js`
- Modify: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/pages/quiz-page.js`
- Modify: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/pages/share.js`
- Modify: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/pages/compare-report.js`
- Modify: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/styles/base.css`

**Step 1: Write the failing navigation rule tests**

Create a navigation utility test with cases such as:

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveBackTarget } from './navigation.js';

test('compare report returns to collection when local compare context exists', () => {
  assert.deepEqual(resolveBackTarget({
    page: 'compare-report',
    hasCompareContext: true,
  }), {
    kind: 'route',
    href: '#/collection',
    label: '返回上一层',
  });
});

test('share page always falls back home', () => {
  assert.deepEqual(resolveBackTarget({
    page: 'share',
  }), {
    kind: 'route',
    href: '#/',
    label: '返回上一层',
  });
});
```

Cover all product rules from the acceptance matrix.

**Step 2: Run test to verify it fails**

Run: `node --import ./test-support/register-css-loader.mjs --test src/utils/navigation.test.js`

Expected: FAIL because the shared navigation resolver does not exist.

**Step 3: Implement the shared navigation helper**

Create a utility that can return one of two back actions:

- `{ kind: 'route', href: '#/...', label: '返回上一层' }`
- `{ kind: 'handler', label: '返回上一层' }`

Use it to model:

- fixed-parent route returns for top-level pages
- in-feature state returns for result states and collection compare subview
- compare-report fallback to collection or home depending on compare context

**Step 4: Update every page header to use the shared helper**

Required behavior:

- scoring result back -> scoring input state
- generation result back -> generation input state
- test result back -> first question state
- collection compare subview back -> collection list state
- top-level scoring/generation/test/share/collection back -> `#/`
- compare-report topbar back -> `#/collection` when local compare context exists, otherwise `#/`

Also normalize the user-facing copy to one clear label: `返回上一层`.

**Step 5: Add or update page-level regression tests**

At minimum:

- `src/pages/scoring.test.js`: result-state back label exists and no longer says `测下一个名字`
- `src/pages/generation.test.js`: result-state back label exists and no longer says `换一批 / 重新起名`
- `src/pages/compare-report.test.js`: topbar route switches between collection and home based on context
- create targeted tests for share/test if no coverage exists yet

**Step 6: Run the full page/navigation test set**

Run: `node --import ./test-support/register-css-loader.mjs --test src/utils/navigation.test.js src/pages/scoring.test.js src/pages/generation.test.js src/pages/collection.test.js src/pages/compare-report.test.js`

Expected: PASS

**Step 7: Commit**

```bash
git add src/utils/navigation.js src/utils/navigation.test.js src/pages/scoring.js src/pages/generation.js src/pages/collection.js src/pages/quiz-page.js src/pages/share.js src/pages/compare-report.js src/styles/base.css src/pages/scoring.test.js src/pages/generation.test.js src/pages/collection.test.js src/pages/compare-report.test.js
git commit -m "feat: unify fixed-parent back navigation"
```

### Task 5: Manual Verification Sweep

**Files:**
- Verify only: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/pages/scoring.js`
- Verify only: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/pages/generation.js`
- Verify only: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/pages/collection.js`
- Verify only: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/pages/quiz-page.js`
- Verify only: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/pages/share.js`
- Verify only: `/Users/liuwei/.codex/worktrees/ac64/wenming/src/pages/compare-report.js`

**Step 1: Run the automated suite**

Run: `npm test`

Expected: PASS

**Step 2: Run the app locally**

Run: `npm run dev`

Expected: Vite dev server starts without runtime errors.

**Step 3: Verify scoring flow manually**

Acceptance:

- input page back returns home
- loading page back returns scoring input
- result page back returns scoring input
- radar polygon and five dimension values render without `undefined`

**Step 4: Verify generation flow manually**

Acceptance:

- input page back returns home
- loading page back returns generation input
- result page back returns generation input
- modal radar renders with complete labels even when dimension data is partial
- `本轮结论` strip is gone

**Step 5: Verify collection, test, share, compare-report manually**

Acceptance:

- collection list/empty back returns home
- collection compare subview back returns collection list
- test question back returns home
- test result back returns the first test question
- share page back returns home
- compare-report back returns collection when local compare context exists
- compare-report back returns home on direct/shared open

**Step 6: Commit**

```bash
git add .
git commit -m "test: verify radar and navigation polish"
```

Plan complete and saved to `docs/plans/2026-03-20-radar-navigation-results.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
