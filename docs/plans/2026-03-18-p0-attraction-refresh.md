# Wenming P0 Attraction Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Increase first-visit appeal, trial rate, perceived maturity, and decision support quality for the `wenming` naming product without expanding scope beyond the current MVP.

**Architecture:** Keep the current Vite + vanilla JS + hash-router structure. Improve attraction by tightening the landing narrative, reducing first-run friction, upgrading result pages from "pretty commentary" to "decision support", and making saved-name / compare / export flows explicit parts of the main user journey. Treat build stability and missing dependency cleanup as P0 because broken export/build paths undermine product trust.

**Tech Stack:** Vite 5, vanilla JS, vanilla CSS, Canvas radar chart, OpenRouter API, localStorage, jsPDF/html2canvas export flow

---

## Implementation Notes

- This repo currently has no automated test suite.
- Required verification for every task:
  - Run: `cd /Users/liuwei/workspace/wenming && npm run build`
  - Expected: production build completes without unresolved dependency errors.
- Required manual smoke checks after UI tasks:
  - Open landing page.
  - Complete one generate flow.
  - Complete one score flow.
  - Save at least one name.
  - Open collection route and compare two names.
  - Export one report.

### Task 1: Stabilize Build and Export Dependencies

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/package.json`
- Modify: `/Users/liuwei/workspace/wenming/package-lock.json`
- Modify: `/Users/liuwei/workspace/wenming/src/utils/export.js`
- Modify: `/Users/liuwei/workspace/wenming/index.html`

**Step 1: Add and align export dependencies**

- Add declared dependencies for `jspdf` and `html2canvas`.
- Reinstall cleanly so `package-lock.json` matches `package.json`.
- Confirm no stray unresolved `core-js/canvg` dependency chain remains.

**Step 2: Make export utility degrade cleanly**

- Guard export flow so missing element or export failure shows a user-facing message without leaving the UI in a broken state.
- Keep PDF export optional, not a hard requirement for route rendering.

**Step 3: Add missing browser polish assets**

- Add a favicon reference or bundled favicon file so the app does not emit a 404 for a basic resource.

**Step 4: Run build verification**

Run: `cd /Users/liuwei/workspace/wenming && npm run build`
Expected: successful build, no unresolved import errors.

**Step 5: Commit**

```bash
git add package.json package-lock.json index.html src/utils/export.js
git commit -m "fix: stabilize export dependencies and build"
```

### Task 2: Rewrite Landing Page Value Proposition

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/src/pages/landing.js`
- Modify: `/Users/liuwei/workspace/wenming/src/styles/landing.css`
- Reference: `/Users/liuwei/workspace/wenming/docs/design.md`

**Step 1: Replace generic slogan with an explicit promise**

- Add a headline that communicates the product stance:
  - no fortune-telling
  - no forced classical references
  - no awkward uncommon characters
  - names that hold up over time

**Step 2: Add a concise differentiation strip**

- Add a compact three-point section near the hero:
  - `不用生僻字`
  - `不走玄学`
  - `重审美判断`

**Step 3: Keep the two existing primary entry points**

- Preserve both `#/generate` and `#/score` as the main CTA choices.
- Make one of them visually primary and the other secondary.

**Step 4: Verify landing comprehension**

Manual check:
- Open `#/`.
- Within 5 seconds, a new viewer should be able to answer:
  - what the product does
  - how it is different from a generic naming tool

**Step 5: Commit**

```bash
git add src/pages/landing.js src/styles/landing.css
git commit -m "feat: clarify landing value proposition"
```

### Task 3: Add Real Result Previews to the Landing Page

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/src/pages/landing.js`
- Modify: `/Users/liuwei/workspace/wenming/src/styles/landing.css`

**Step 1: Replace low-information floating names with preview cards**

- Keep atmosphere, but show 2 to 3 structured examples instead of only faded names.
- Each preview should include:
  - full name
  - route tag (`大雅` or `大俗`)
  - short one-line explanation

**Step 2: Add a "what you will get" expectation block**

- Show the output shape before the user clicks:
  - 8 candidate names
  - 5-dimension scoring
  - save / compare / export support

**Step 3: Adjust mobile layout**

- Ensure hero, CTA cards, and preview cards stack cleanly at phone width.

**Step 4: Verify first-screen appeal**

Manual check:
- Compare current and new landing page on desktop and mobile.
- Confirm the first screen feels like a product with output quality, not just a tool index.

**Step 5: Commit**

```bash
git add src/pages/landing.js src/styles/landing.css
git commit -m "feat: add landing result previews"
```

### Task 4: Reduce First-Run Friction on the Generation Page

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/src/pages/generation.js`
- Modify: `/Users/liuwei/workspace/wenming/src/styles/generation.css`

**Step 1: Reframe the form into "quick start" and "advanced preferences"**

- Default visible fields:
  - surname
  - optional gender
  - primary generate button
- Move style, include/exclude words, and free-form description into a collapsible advanced section.

**Step 2: Add fast preference chips**

- Add 4 to 6 quick-pick options such as:
  - `山水感`
  - `朴素有劲`
  - `不网红`
  - `偏中性`

**Step 3: Improve helper copy**

- Replace abstract labels with examples that show what kind of instructions work well.

**Step 4: Keep power-user control**

- Do not remove advanced inputs.
- Keep them accessible after expansion so high-intent users still get control.

**Step 5: Verify funnel friction**

Manual check:
- Confirm one can reach generation with only a surname.
- Confirm advanced preferences still work and do not break layout.

**Step 6: Commit**

```bash
git add src/pages/generation.js src/styles/generation.css
git commit -m "feat: simplify first-run generation flow"
```

### Task 5: Turn Generated Results Into Decision Support

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/src/pages/generation.js`
- Modify: `/Users/liuwei/workspace/wenming/src/styles/generation.css`
- Modify: `/Users/liuwei/workspace/wenming/src/api/openrouter.js`

**Step 1: Change the output contract for generated names**

- Extend each generated result with structured fields:
  - `why_it_fits`
  - `minor_risk`
  - `best_for`
  - optional `rank_reason`

**Step 2: Tighten scoring distribution**

- Update the generation prompt so not every strong name clusters in the low-to-high 90s.
- Ask for meaningful spread and at least one explicit tradeoff per candidate.

**Step 3: Update card information hierarchy**

- On the result grid show:
  - name
  - score
  - route
  - one strong reason to keep it
- Move the longer narrative into the detail modal.

**Step 4: Upgrade detail modal**

- In the modal show:
  - why it fits
  - its small downside
  - who it suits
  - current save/export actions

**Step 5: Verify selection clarity**

Manual check:
- Generate one batch.
- Confirm a reviewer can explain why candidate A should beat candidate B without reading long prose.

**Step 6: Commit**

```bash
git add src/pages/generation.js src/styles/generation.css src/api/openrouter.js
git commit -m "feat: make generation results easier to compare"
```

### Task 6: Make the Scoring Page More Verdict-Led

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/src/pages/scoring.js`
- Modify: `/Users/liuwei/workspace/wenming/src/styles/scoring.css`
- Modify: `/Users/liuwei/workspace/wenming/src/api/openrouter.js`

**Step 1: Add a top-level verdict**

- Add a short status near the top such as:
  - `值得保留`
  - `有气质但略挑人`
  - `不建议做正式名`

**Step 2: Restructure the header**

- Keep score and route.
- Shorten the opening explanation so the first screen shows a verdict before the long analysis.

**Step 3: Improve dimension readability**

- Make the five dimensions easier to scan:
  - stronger labels
  - clearer spacing
  - less wall-of-text feel on mobile

**Step 4: Keep save/export actions visible**

- Ensure save and export remain present, but do not visually overpower the verdict.

**Step 5: Verify screenshot-worthiness**

Manual check:
- Score one name on mobile width.
- The first screen should be understandable and shareable without scrolling deep into long prose.

**Step 6: Commit**

```bash
git add src/pages/scoring.js src/styles/scoring.css src/api/openrouter.js
git commit -m "feat: add verdict-led scoring results"
```

### Task 7: Promote Collection and Comparison Into the Main Journey

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/src/pages/landing.js`
- Modify: `/Users/liuwei/workspace/wenming/src/pages/generation.js`
- Modify: `/Users/liuwei/workspace/wenming/src/pages/scoring.js`
- Modify: `/Users/liuwei/workspace/wenming/src/pages/collection.js`
- Modify: `/Users/liuwei/workspace/wenming/src/styles/collection.css`

**Step 1: Mention collection/compare/export on landing**

- Add a short capability line:
  - save candidates
  - compare 2 to 3 names
  - export a report for family discussion

**Step 2: Make save actions feel central**

- In generate and score flows, keep save actions obvious and understandable.
- Use wording that supports decision-making, not only storage.

**Step 3: Upgrade compare page from layout to recommendation**

- Add a generated or deterministic compare summary above the grid:
  - which option is safest
  - which option is most distinctive
  - which option is most balanced

**Step 4: Verify the loop**

Manual check:
- Generate names.
- Save two names.
- Open `#/collection`.
- Compare them.
- Confirm the flow feels like a natural next step, not a hidden utility route.

**Step 5: Commit**

```bash
git add src/pages/landing.js src/pages/generation.js src/pages/scoring.js src/pages/collection.js src/styles/collection.css
git commit -m "feat: connect collection and compare to the core journey"
```

### Task 8: Final Polish, Verification, and Regression Pass

**Files:**
- Verify: `/Users/liuwei/workspace/wenming/src/pages/landing.js`
- Verify: `/Users/liuwei/workspace/wenming/src/pages/generation.js`
- Verify: `/Users/liuwei/workspace/wenming/src/pages/scoring.js`
- Verify: `/Users/liuwei/workspace/wenming/src/pages/collection.js`
- Verify: `/Users/liuwei/workspace/wenming/src/styles/*.css`
- Verify: `/Users/liuwei/workspace/wenming/src/api/openrouter.js`

**Step 1: Desktop verification**

- Check landing, generate, score, collection, compare, export on desktop width.

**Step 2: Mobile verification**

- Check the same routes on phone width.
- Pay special attention to:
  - hero spacing
  - card stacking
  - radar chart overflow
  - long text readability

**Step 3: Regression verification**

Run: `cd /Users/liuwei/workspace/wenming && npm run build`
Expected: successful build.

**Step 4: Manual smoke sequence**

- `#/`
- `#/generate`
- generate 1 batch
- save 2 names
- `#/collection`
- compare 2 names
- `#/score`
- score 1 name
- export 1 report

**Step 5: Commit**

```bash
git add src docs/plans/2026-03-18-p0-attraction-refresh.md package.json package-lock.json index.html
git commit -m "chore: complete p0 attraction refresh"
```

## Suggested Execution Order

1. Task 1
2. Task 2
3. Task 3
4. Task 4
5. Task 5
6. Task 6
7. Task 7
8. Task 8

## Scope Guardrails

- Do not add a backend in this phase.
- Do not add payments in this phase.
- Do not introduce a frontend framework migration.
- Do not add user accounts in this phase.
- Do not expand beyond attraction, trial, trust, and comparison.

## Success Criteria

- Build passes cleanly.
- Landing page communicates differentiation within 5 seconds.
- First generation can be triggered with minimal input.
- Result pages help users decide, not just admire.
- Save / compare / export are visible parts of the product story.
- Mobile layouts remain readable and deliberate.
