import test from 'node:test';
import assert from 'node:assert/strict';

import { renderCollection } from './collection.js';

test('renderCollection uses naming-centered language instead of book metaphors in the empty state', () => {
  const container = { innerHTML: '' };

  global.localStorage = {
    getItem() {
      return '[]';
    },
  };

  renderCollection(container);

  assert.match(container.innerHTML, /名字夹里还没有候选/);
  assert.doesNotMatch(container.innerHTML, /藏书阁/);
});

test('renderCollection uses the shared compare CTA wording in list view', () => {
  const container = { innerHTML: '' };

  global.localStorage = {
    getItem() {
      return JSON.stringify([
        { full_name: '林见山', score: 92, route: '大雅', one_liner: '轻静耐看。' },
        { full_name: '林春生', score: 88, route: '大俗', one_liner: '自然有生机。' },
      ]);
    },
  };

  global.document = {
    querySelectorAll() {
      return [];
    },
    getElementById() {
      return {
        addEventListener() {},
      };
    },
  };

  global.window = {};

  renderCollection(container);

  assert.match(container.innerHTML, /去看比较摘要/);
});
