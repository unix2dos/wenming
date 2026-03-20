import test from 'node:test';
import assert from 'node:assert/strict';

import { renderCollection, renderCollectionCompareView } from './collection.js';

test('renderCollection uses naming-centered language instead of book metaphors in the empty state', () => {
  const container = { innerHTML: '' };

  global.localStorage = {
    getItem() {
      return '[]';
    },
  };

  renderCollection(container);

  assert.match(container.innerHTML, /返回上一层/);
  assert.doesNotMatch(container.innerHTML, /返回首页/);
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

  assert.match(container.innerHTML, /返回上一层/);
  assert.doesNotMatch(container.innerHTML, /返回首页/);
  assert.match(container.innerHTML, /去看比较摘要/);
});

test('renderCollectionCompareView tolerates partial dimensions in compare cards', () => {
  const container = { innerHTML: '' };
  const elements = new Map();
  let onBackCalls = 0;

  global.document = {
    getElementById(id) {
      return elements.get(id);
    },
    querySelectorAll() {
      return [];
    },
  };

  global.window = {};
  global.setTimeout = (fn) => {
    fn();
    return 0;
  };

  const backToList = {
    addEventListener(type, handler) {
      if (type === 'click') {
        this.onClick = handler;
      }
    },
    click() {
      this.onClick?.();
    },
  };
  const radar0 = {
    width: 0,
    height: 0,
    getBoundingClientRect() {
      return {
        width: 250,
        height: 250,
      };
    },
    getContext() {
      return {
        clearRect() {},
        beginPath() {},
        moveTo() {},
        lineTo() {},
        closePath() {},
        stroke() {},
        fill() {},
        scale() {},
        fillText() {},
      };
    },
  };
  const radar1 = {
    width: 0,
    height: 0,
    getBoundingClientRect() {
      return {
        width: 250,
        height: 250,
      };
    },
    getContext() {
      return {
        clearRect() {},
        beginPath() {},
        moveTo() {},
        lineTo() {},
        closePath() {},
        stroke() {},
        fill() {},
        scale() {},
        fillText() {},
      };
    },
  };

  elements.set('collection-back-btn', backToList);
  elements.set('compare-radar-0', radar0);
  elements.set('compare-radar-1', radar1);

  assert.doesNotThrow(() => {
    renderCollectionCompareView(container, [
      {
        full_name: '林见山',
        score: 92,
        route: '大雅',
        one_liner: '轻静耐看。',
        dimensions: {
          sound: { score: 18, analysis: '顺口' },
          shape: { analysis: '匀称' },
        },
      },
      {
        full_name: '林春生',
        score: 88,
        route: '大俗',
        one_liner: '自然有生机。',
        dimensions: {
          sound: {},
          practical: { score: 17 },
        },
      },
    ], {
      onBack: () => {
        onBackCalls += 1;
      },
    });
  });

  assert.match(container.innerHTML, /名字横向鉴赏/);
  assert.match(container.innerHTML, /返回上一层/);
  assert.doesNotMatch(container.innerHTML, /返回名字夹/);
  assert.doesNotMatch(container.innerHTML, /undefined/);

  elements.get('collection-back-btn').click();
  assert.equal(onBackCalls, 1);
});
