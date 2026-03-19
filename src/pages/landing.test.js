import test from 'node:test';
import assert from 'node:assert/strict';

import { renderLanding } from './landing.js';

test('renderLanding keeps the hero focused on starting the test', () => {
  const container = { innerHTML: '' };

  renderLanding(container);

  const heroMatch = container.innerHTML.match(/<section class="landing-hero">([\s\S]*?)<\/section>/);

  assert.ok(heroMatch, 'expected landing hero section to render');

  const heroMarkup = heroMatch[1];

  assert.match(heroMarkup, /先测方向，再起名/);
  assert.match(heroMarkup, /href="#\/test" class="btn"/);
  assert.doesNotMatch(heroMarkup, /直接起名/);
  assert.doesNotMatch(heroMarkup, /landing-trust-strip/);
  assert.doesNotMatch(container.innerHTML, /为什么先测/);
  assert.doesNotMatch(container.innerHTML, /适合谁来测/);
  assert.match(container.innerHTML, /landing-direct-entry/);
  assert.match(container.innerHTML, /完整比较报告/);
  assert.match(container.innerHTML, /先看免费摘要/);
  assert.match(container.innerHTML, /先把 2 到 3 个候选名放进来/);
  assert.match(container.innerHTML, /先录入候选名/);
  assert.doesNotMatch(container.innerHTML, /¥19\.9/);
});
