import test from 'node:test';
import assert from 'node:assert/strict';

import { estimateNameFrequency } from './surnames.js';

test('estimateNameFrequency omits exact counts when the given name is not in the curated dataset', () => {
  assert.equal(estimateNameFrequency('刘', '清川'), null);
});

test('estimateNameFrequency keeps exact counts for curated names', () => {
  assert.deepEqual(estimateNameFrequency('刘', '浩宇'), {
    estimate: 3605,
    tier: '较常见',
    tierIndex: 1,
  });
});
