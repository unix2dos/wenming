# Homepage Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the landing page into a minimal test-start page with a single dominant CTA.

**Architecture:** Keep routing and page ownership unchanged. Update only the landing page template and stylesheet so the hero becomes a focused launch section, move preview cards below the fold, and turn direct generation into a light secondary entry.

**Tech Stack:** Vanilla JS, hash routing, plain CSS

---

### Task 1: Capture the approved homepage structure

**Files:**
- Create: `/Users/liuwei/workspace/wenming/docs/plans/2026-03-19-homepage-redesign-design.md`
- Modify: `/Users/liuwei/workspace/wenming/docs/plans/2026-03-19-homepage-redesign.md`

**Step 1: Confirm the structural contract**

Use the approved rules:
- hero keeps brand, weak scoring link, action title, one-line subtitle, primary `开始测试`
- preview moves below the fold
- homepage keeps only one below-fold business entry: light `直接起名`

**Step 2: Preserve scope boundaries**

Do not change:
- test flow
- result flow
- generation flow
- routing logic

### Task 2: Rewrite landing page markup

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/src/pages/landing.js`

**Step 1: Remove conflicting hero content**

Delete from hero:
- direct generate button
- trust strip chips

**Step 2: Replace the hero copy**

Set:
- short action-oriented title
- one-line subtitle
- one primary CTA `开始测试`

**Step 3: Keep the top-right weak entry**

Retain only:
- `已有名字？看看名字好不好`

**Step 4: Simplify below-the-fold sections**

Keep only:
- preview section
- lightweight direct-generate section

Delete:
- why-test note card
- who-should-test scene card

### Task 3: Rebalance landing page styles

**Files:**
- Modify: `/Users/liuwei/workspace/wenming/src/styles/landing.css`

**Step 1: Tighten hero height and text scale**

Update hero rules so:
- title weight stays strong but no longer dominates the viewport
- hero width becomes narrower
- spacing emphasizes CTA focus

**Step 2: Remove styles for deleted modules**

Delete obsolete styles for:
- trust strip
- grid explanation section
- note card
- scene card

**Step 3: Add styles for the light direct entry**

Add a compact section with:
- short heading
- one supporting sentence
- secondary button

**Step 4: Keep preview section below the fold**

Ensure preview cards remain intact but visually secondary to the hero.

### Task 4: Verify the homepage contract

**Files:**
- Modify: none

**Step 1: Build the app**

Run:
```bash
npm run build
```

Expected:
- successful production build

**Step 2: Smoke-check the landing page structure**

Verify in browser:
- hero has only one main CTA
- preview is below the fold
- `直接起名` appears only as a light secondary entry
- no `为什么先测` or `适合谁来测` blocks remain

**Step 3: Check responsive behavior**

Verify:
- desktop hero title does not overwhelm
- mobile hero remains readable
- top-right weak link remains accessible

### Task 5: Summarize outcome

**Files:**
- Modify: none

**Step 1: Report what changed**

Summarize:
- hero simplification
- below-fold content reduction
- direct-generate demotion

**Step 2: Report verification**

Include:
- build result
- structure smoke-check result
