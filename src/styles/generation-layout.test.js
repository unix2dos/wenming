import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const generationCss = fs.readFileSync(new URL('./generation.css', import.meta.url), 'utf8');

test('generation compare offer keeps extra vertical spacing below the candidate grid', () => {
  assert.match(generationCss, /\.generation-compare-offer\.compact\s*{[\s\S]*margin-top:\s*var\(--spacing-2xl\);/);
});

test('generation result cards define a dedicated mini radar block', () => {
  assert.match(generationCss, /\.name-card-radar\s*{/);
  assert.match(generationCss, /\.name-card-radar-canvas\s*{/);
});
