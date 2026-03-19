import test from 'node:test';
import assert from 'node:assert/strict';

import { getOrCreateSessionId, trackEvent } from './analytics.js';

function createStorage(initial = {}) {
  const store = new Map(Object.entries(initial));

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
}

test('getOrCreateSessionId returns a stable session id once created', () => {
  const storage = createStorage();
  const cryptoStub = {
    randomUUID() {
      return 'session-abc';
    },
  };

  const first = getOrCreateSessionId({ storage, cryptoImpl: cryptoStub });
  const second = getOrCreateSessionId({ storage, cryptoImpl: cryptoStub });

  assert.equal(first, 'session-abc');
  assert.equal(second, 'session-abc');
});

test('trackEvent posts structured payloads to the worker events API', async () => {
  const calls = [];
  const storage = createStorage();
  const cryptoStub = {
    randomUUID() {
      return 'session-track';
    },
  };

  const ok = await trackEvent('quiz_completed', {
    page: 'test-result',
    payload: {
      profileId: 'yazheng',
    },
    storage,
    cryptoImpl: cryptoStub,
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
      };
    },
  });

  assert.equal(ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/events');
  assert.equal(calls[0].init.headers['x-wenming-session-id'], 'session-track');

  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.sessionId, 'session-track');
  assert.equal(body.eventName, 'quiz_completed');
  assert.equal(body.page, 'test-result');
  assert.deepEqual(body.payload, {
    profileId: 'yazheng',
  });
});
