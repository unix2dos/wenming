import test from 'node:test';
import assert from 'node:assert/strict';

import { QuotaLimiter, createWorkerHandler, extractJsonContent } from '../src/worker.js';

function createMemoryState() {
  const store = new Map();
  return {
    storage: {
      async get(key) {
        return store.get(key);
      },
      async put(key, value) {
        store.set(key, value);
      },
    },
  };
}

test('extractJsonContent strips fenced json blocks', () => {
  const content = '```json\n{"ok":true}\n```';
  assert.equal(extractJsonContent(content), '{"ok":true}');
});

test('worker proxies generate requests through OpenRouter and normalizes names payload', async () => {
  let upstreamRequest = null;

  const handler = createWorkerHandler(async (url, init) => {
    upstreamRequest = { url, init };

    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: '{"names":[{"full_name":"林见山","route":"大雅","score":95,"one_liner":"山水有余韵","dimensions":{"sound":18,"shape":19,"style":20,"classic":19,"practical":19}}]}',
            },
          },
        ],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  });

  const response = await handler.fetch(
    new Request('https://wenming.example/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        surname: '林',
        gender: '男',
        style: '大雅',
      }),
    }),
    { OPENROUTER_API_KEY: 'test-secret' },
  );

  assert.equal(response.status, 200);
  assert.equal(upstreamRequest.url, 'https://openrouter.ai/api/v1/chat/completions');
  assert.match(upstreamRequest.init.headers.Authorization, /^Bearer /);

  const payload = await response.json();
  assert.equal(Array.isArray(payload), true);
  assert.equal(payload[0].full_name, '林见山');
});

test('worker returns 500 when OPENROUTER_API_KEY is missing', async () => {
  const handler = createWorkerHandler();
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    const response = await handler.fetch(
      new Request('https://wenming.example/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: '林见山' }),
      }),
      {},
    );

    assert.equal(response.status, 500);

    const payload = await response.json();
    assert.match(payload.error, /OPENROUTER_API_KEY/);
  } finally {
    console.error = originalConsoleError;
  }
});

test('worker returns 429 when burst limiter blocks generate requests', async () => {
  const handler = createWorkerHandler(async () => {
    throw new Error('upstream should not be called');
  });

  const response = await handler.fetch(
    new Request('https://wenming.example/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '203.0.113.8',
      },
      body: JSON.stringify({ surname: '林' }),
    }),
    {
      OPENROUTER_API_KEY: 'test-secret',
      GENERATE_BURST_LIMITER: {
        limit: async () => ({ success: false }),
      },
    },
  );

  assert.equal(response.status, 429);
  const payload = await response.json();
  assert.equal(payload.limitType, 'burst');
});

test('worker returns 429 when quota limiter blocks score requests', async () => {
  const handler = createWorkerHandler(async () => {
    throw new Error('upstream should not be called');
  });

  const response = await handler.fetch(
    new Request('https://wenming.example/api/score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '203.0.113.9',
      },
      body: JSON.stringify({ fullName: '林见山' }),
    }),
    {
      OPENROUTER_API_KEY: 'test-secret',
      SCORE_BURST_LIMITER: {
        limit: async () => ({ success: true }),
      },
      QUOTA_LIMITER: {
        idFromName: (name) => name,
        get: () => ({
          fetch: async () =>
            new Response(JSON.stringify({
              allowed: false,
              limitType: 'quota',
              retryAfter: 600,
              error: '今日请求次数已达上限，请明天再试。',
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }),
        }),
      },
    },
  );

  assert.equal(response.status, 429);
  const payload = await response.json();
  assert.equal(payload.limitType, 'quota');
});

test('quota limiter blocks generate after five requests in ten minutes', async () => {
  const limiter = new QuotaLimiter(createMemoryState(), {});
  let response = null;

  for (let index = 0; index < 5; index += 1) {
    response = await limiter.fetch(
      new Request('https://quota.example/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeKey: 'generate',
          now: 1_000,
        }),
      }),
    );

    const payload = await response.json();
    assert.equal(payload.allowed, true);
  }

  response = await limiter.fetch(
    new Request('https://quota.example/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routeKey: 'generate',
        now: 1_001,
      }),
    }),
  );

  assert.equal(response.status, 429);
  const blockedPayload = await response.json();
  assert.equal(blockedPayload.limitType, 'quota');
});
