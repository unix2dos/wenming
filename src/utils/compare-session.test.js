import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clearCompareFlowContext,
  clearPendingCompareNames,
  getCompareFlowContext,
  getPendingCompareNames,
  setCompareFlowContext,
  setPendingCompareNames,
} from './compare-session.js';

function createStorage(initial = {}) {
  const store = new Map(Object.entries(initial));

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

test('compare session stores and restores pending compare names', () => {
  const storage = createStorage();
  const names = [
    { full_name: '林见山', score: 92 },
    { full_name: '林春生', score: 89 },
  ];

  setPendingCompareNames(names, storage);

  assert.deepEqual(getPendingCompareNames(storage), names);

  clearPendingCompareNames(storage);

  assert.deepEqual(getPendingCompareNames(storage), []);
});

test('compare flow context survives refresh within the same tab storage', () => {
  const storage = createStorage();

  setCompareFlowContext({ reportId: 'report-summary', source: 'collection' }, storage);

  assert.deepEqual(getCompareFlowContext(storage), {
    reportId: 'report-summary',
    source: 'collection',
  });

  clearCompareFlowContext(storage);

  assert.equal(getCompareFlowContext(storage), null);
});
