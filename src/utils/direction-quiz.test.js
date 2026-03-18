import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateQuizResult,
  decodeShareState,
  encodeShareState,
  getGenerationPreset,
} from './direction-quiz.js';

test('calculateQuizResult returns 雅正型 for mostly A answers', () => {
  const result = calculateQuizResult(['a', 'a', 'b', 'c', 'a']);

  assert.equal(result.profile.id, 'yazheng');
  assert.equal(result.profile.camp, '大雅');
  assert.equal(result.acceptance.id, 'high');
});

test('calculateQuizResult returns 空明型 for mostly B answers', () => {
  const result = calculateQuizResult(['b', 'b', 'c', 'b', 'b']);

  assert.equal(result.profile.id, 'kongming');
  assert.equal(result.profile.camp, '大雅');
  assert.equal(result.acceptance.id, 'medium');
});

test('calculateQuizResult returns 天真型 for mostly C answers', () => {
  const result = calculateQuizResult(['c', 'c', 'a', 'a', 'c']);

  assert.equal(result.profile.id, 'tianzhen');
  assert.equal(result.profile.camp, '大俗');
  assert.equal(result.acceptance.id, 'low');
});

test('encodeShareState and decodeShareState round trip result payload', () => {
  const encoded = encodeShareState({
    profileId: 'kongming',
    acceptanceId: 'medium',
  });

  const decoded = decodeShareState(encoded);

  assert.deepEqual(decoded, {
    profileId: 'kongming',
    acceptanceId: 'medium',
  });
});

test('getGenerationPreset maps quiz result to generation style and helper copy', () => {
  assert.deepEqual(getGenerationPreset('yazheng').style, '大雅');
  assert.deepEqual(getGenerationPreset('kongming').style, '大雅');
  assert.deepEqual(getGenerationPreset('tianzhen').style, '大俗');
  assert.match(getGenerationPreset('yazheng').freeDescription, /端正|耐看/);
});
