import test from 'node:test';
import assert from 'node:assert/strict';

import { formatApiErrorMessage } from '../src/utils/api-error.js';

test('formatApiErrorMessage formats burst rate limit with retry time', () => {
  const message = formatApiErrorMessage(
    {
      status: 429,
      retryAfter: 60,
      limitType: 'burst',
      message: '请求过于频繁，请稍后再试。',
    },
    '起名',
  );

  assert.equal(message, '请求太快了，请在 1 分钟后再试。');
});

test('formatApiErrorMessage keeps quota limit message for daily cap', () => {
  const message = formatApiErrorMessage(
    {
      status: 429,
      retryAfter: 3600,
      limitType: 'quota',
      message: '今日起名次数已达上限，请明天再试。',
    },
    '起名',
  );

  assert.equal(message, '今日起名次数已达上限，请明天再试。');
});
