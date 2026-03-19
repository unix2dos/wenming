import test from 'node:test';
import assert from 'node:assert/strict';

import { buildScoreCompareCandidates } from './scoring.js';

test('buildScoreCompareCandidates keeps the current scored name first and fills from saved names', () => {
  const selected = buildScoreCompareCandidates(
    {
      full_name: '林见山',
      total_score: 91,
      route: '大雅',
      overall_comment: '气质完整，长期使用更稳。',
      dimensions: {},
    },
    [
      { full_name: '林春生', score: 88, route: '大俗', one_liner: '自然有生机。' },
      { full_name: '林见山', score: 91, route: '大雅', one_liner: '重复项。' },
      { full_name: '林清和', score: 89, route: '大雅', one_liner: '清润安静。' },
    ],
  );

  assert.deepEqual(selected.map((item) => item.full_name), ['林见山', '林春生', '林清和']);
});
