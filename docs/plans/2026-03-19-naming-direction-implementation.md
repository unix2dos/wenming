# Naming Direction Test Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a shareable naming-direction quiz flow that leads into the existing generation experience without turning the product back into a generic naming tool.

**Architecture:** Keep the current Vite + vanilla JS + hash router structure. Introduce a dedicated quiz route, a share route backed by URL parameters, and a small pure utility layer for quiz state/result calculation so the behavior can be tested with the existing `node --test` script. Reuse the current generation page as the conversion step, but prefill it from quiz results and surface the chosen direction throughout the flow.

**Tech Stack:** Vite 5, vanilla JS, hash routing, node:test, localStorage, OpenRouter-backed generation flow

---

## Implementation Notes

- The repo already exposes `npm test` via `node --test`; use that instead of adding a new test runner.
- Prefer pure helper modules for:
  - quiz question config
  - score/result calculation
  - share URL encode/decode
  - generation prefill mapping
- Required verification at the end:
  - `cd /Users/liuwei/workspace/wenming && npm test`
  - `cd /Users/liuwei/workspace/wenming && npm run build`

### Task 1: Add quiz domain helpers and tests

**Files:**
- Create: `/Users/liuwei/workspace/wenming/src/utils/direction-quiz.js`
- Create: `/Users/liuwei/workspace/wenming/src/utils/direction-quiz.test.js`

**Step 1: Write the failing test**

- Cover:
  - `calculateQuizResult()` returns `雅正型`
  - `calculateQuizResult()` returns `空明型`
  - `calculateQuizResult()` returns `天真型`
  - `encodeShareState()` and `decodeShareState()` are symmetric
  - generation prefill maps `雅正/空明 -> 大雅`, `天真 -> 大俗`

**Step 2: Run test to verify it fails**

Run: `cd /Users/liuwei/workspace/wenming && npm test -- src/utils/direction-quiz.test.js`

**Step 3: Write minimal implementation**

- Export:
  - `quizQuestions`
  - `resultProfiles`
  - `calculateQuizResult`
  - `encodeShareState`
  - `decodeShareState`
  - `getGenerationPreset`

**Step 4: Run test to verify it passes**

Run: `cd /Users/liuwei/workspace/wenming && npm test -- src/utils/direction-quiz.test.js`

### Task 2: Add quiz and share routes

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/src/main.js`
- Create: `/Users/liuwei/workspace/wenming/src/pages/test.js`
- Create: `/Users/liuwei/workspace/wenming/src/pages/share.js`
- Create: `/Users/liuwei/workspace/wenming/src/styles/test.css`
- Create: `/Users/liuwei/workspace/wenming/src/styles/share.css`

**Step 1: Write the failing test**

- Add route parsing coverage to `direction-quiz.test.js` or a new focused test for share hash parsing if extracted to utility.

**Step 2: Run test to verify it fails**

Run: `cd /Users/liuwei/workspace/wenming && npm test -- src/utils/direction-quiz.test.js`

**Step 3: Write minimal implementation**

- Add `#/test` and `#/share?...` handling in the router.
- Build `renderTest()` with:
  - 5-question single-screen flow
  - automatic step advance
  - result screen in-page after completion
- Build `renderShare()` with:
  - TA result card
  - `我也测一下`
  - `按 TA 的方向起名`

**Step 4: Run test to verify it passes**

Run: `cd /Users/liuwei/workspace/wenming && npm test -- src/utils/direction-quiz.test.js`

### Task 3: Rewrite landing page around the quiz-first narrative

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/src/pages/landing.js`
- Modify: `/Users/liuwei/workspace/wenming/src/styles/landing.css`

**Step 1: Write the failing test**

- No DOM test harness is present; use manual acceptance criteria only for this task.

**Step 2: Write minimal implementation**

- Replace the current hero with:
  - quiz-first headline
  - anti-mysticism support line
  - primary CTA to `#/test`
  - secondary CTA to `#/generate`
- Replace floating names with 3 result preview cards.
- Add one short “why test first” section.

**Step 3: Run focused verification**

Manual check:
- Open `#/`
- Confirm the first screen answers:
  - what the product does
  - why it is not玄学
  - what the user gets after testing

### Task 4: Make generation page accept quiz direction context

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/src/pages/generation.js`
- Modify: `/Users/liuwei/workspace/wenming/src/styles/generation.css`

**Step 1: Write the failing test**

- Extend `direction-quiz.test.js` to assert `getGenerationPreset()` output for each result type if not already covered.

**Step 2: Run test to verify it fails**

Run: `cd /Users/liuwei/workspace/wenming && npm test -- src/utils/direction-quiz.test.js`

**Step 3: Write minimal implementation**

- Read direction info from hash query params.
- Surface a current-direction badge above the form.
- Prefill style and helper copy from the selected result.
- Keep direct-use compatibility when no test result exists.

**Step 4: Run test to verify it passes**

Run: `cd /Users/liuwei/workspace/wenming && npm test -- src/utils/direction-quiz.test.js`

### Task 5: Add result sharing utilities and polish the result CTA layer

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/src/pages/test.js`
- Modify: `/Users/liuwei/workspace/wenming/src/styles/test.css`

**Step 1: Write the failing test**

- Add a test that `encodeShareState()` includes the expected profile id and acceptance level in the decoded payload.

**Step 2: Run test to verify it fails**

Run: `cd /Users/liuwei/workspace/wenming && npm test -- src/utils/direction-quiz.test.js`

**Step 3: Write minimal implementation**

- Add `发给伴侣看看` action:
  - use Web Share when available
  - fallback to clipboard copy
- Add “按这个方向起名” CTA linking to generation with encoded params.
- Add a short family-acceptance block under the hero result card.

**Step 4: Run test to verify it passes**

Run: `cd /Users/liuwei/workspace/wenming && npm test -- src/utils/direction-quiz.test.js`

### Task 6: End-to-end visual cleanup

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/src/styles/base.css`
- Modify: `/Users/liuwei/workspace/wenming/src/styles/variables.css`
- Modify: `/Users/liuwei/workspace/wenming/src/styles/test.css`
- Modify: `/Users/liuwei/workspace/wenming/src/styles/share.css`
- Modify: `/Users/liuwei/workspace/wenming/src/styles/generation.css`

**Step 1: Write minimal implementation**

- Introduce reusable styles for:
  - result cards
  - direction badges
  - sample name chips
  - CTA rows
- Keep the overall tone “new literati” rather than mystical.

**Step 2: Run manual checks**

- Mobile width
- Desktop width
- Long text wrapping on result cards
- Share CTA visibility in the first viewport

### Task 7: Final verification

**Files:**
- Verify modified files only

**Step 1: Run tests**

Run: `cd /Users/liuwei/workspace/wenming && npm test`
Expected: all node tests pass

**Step 2: Run build**

Run: `cd /Users/liuwei/workspace/wenming && npm run build`
Expected: Vite build succeeds

**Step 3: Manual smoke**

- Open `#/`
- Complete one quiz flow to `雅正型`
- Share/copy result
- Open `#/share` link and verify landing behavior
- Enter generation from a quiz result and verify the direction badge/preset
- Open direct generation and verify it still works without quiz context

