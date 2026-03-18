import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const landingCss = fs.readFileSync(new URL('./landing.css', import.meta.url), 'utf8');

test('landing hero allows the desktop title to stay on one line', () => {
  assert.match(landingCss, /\.landing-hero\s*{[\s\S]*max-width:\s*1040px;/);
  assert.match(landingCss, /\.landing-hero-copy\s*{[\s\S]*max-width:\s*980px;/);
  assert.match(landingCss, /\.landing-title\s*{[\s\S]*max-width:\s*none;/);
});
