import test from 'node:test';
import assert from 'node:assert/strict';

import { renderGeneration, selectTopGenerationCandidates, summarizeGenerationResults } from './generation.js';

test('summarizeGenerationResults picks the lead candidate and frames the next action', () => {
  const summary = summarizeGenerationResults([
    {
      full_name: '林见山',
      score: 92,
      one_liner: '轻静耐看，有留白。',
    },
    {
      full_name: '林春生',
      score: 88,
      one_liner: '自然有生机，记忆点强。',
    },
    {
      full_name: '林清和',
      score: 90,
      one_liner: '清润安静，读来温和。',
    },
  ]);

  assert.equal(summary.leadName, '林见山');
  assert.match(summary.headline, /先收 2 到 3 个/);
  assert.match(summary.summary, /92分/);
});

test('selectTopGenerationCandidates keeps the top three candidates by score', () => {
  const selected = selectTopGenerationCandidates([
    { full_name: '林见山', score: 92 },
    { full_name: '林春生', score: 88 },
    { full_name: '林清和', score: 90 },
    { full_name: '林知言', score: 85 },
  ]);

  assert.deepEqual(selected.map((item) => item.full_name), ['林见山', '林清和', '林春生']);
});

test('renderGeneration result state frames the compare report as a paid product', async () => {
  const container = { innerHTML: '' };
  const elements = new Map();
  const formListeners = {};

  global.document = {
    head: {
      appendChild() {},
    },
    createElement() {
      return {
        id: '',
        textContent: '',
      };
    },
    getElementById(id) {
      return elements.get(id);
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
  };

  global.window = {
    location: {
      hash: '#/generate',
    },
  };
  global.localStorage = {
    getItem() {
      return '[]';
    },
    setItem() {},
  };

  const genForm = {
    addEventListener(type, handler) {
      formListeners[type] = handler;
    },
  };
  const surname = {
    value: '林',
    addEventListener() {},
  };
  const specific = {
    value: '',
    addEventListener() {},
  };
  const exclude = {
    value: '',
    addEventListener() {},
  };
  const freeDesc = {
    value: '',
    addEventListener() {},
  };
  const loadingRoot = { innerHTML: '' };
  const cancelBtn = { addEventListener() {} };
  const reGenBtn = { addEventListener() {} };
  const topCompareBtn = { addEventListener() {} };
  const detailModal = {};
  const detailContent = {};

  elements.set('gen-form', genForm);
  elements.set('surname', surname);
  elements.set('specific', specific);
  elements.set('exclude', exclude);
  elements.set('freeDesc', freeDesc);
  elements.set('loading-root', loadingRoot);
  elements.set('cancel-btn', cancelBtn);
  elements.set('re-gen-btn', reGenBtn);
  elements.set('top-generation-compare-btn', topCompareBtn);
  elements.set('detail-modal', detailModal);
  elements.set('detail-content', detailContent);

  global.fetch = async () => ({
    ok: true,
    async json() {
      return [
        { full_name: '林见山', score: 92, route: '大雅', one_liner: '轻静耐看，有留白。' },
        { full_name: '林清和', score: 90, route: '大雅', one_liner: '清润安静，读来温和。' },
        { full_name: '林春生', score: 88, route: '大俗', one_liner: '自然有生机，记忆点强。' },
      ];
    },
  });

  renderGeneration(container);

  await formListeners.submit({
    preventDefault() {},
  });

  assert.match(container.innerHTML, /完整比较报告/);
  assert.match(container.innerHTML, /先看免费摘要/);
  assert.match(container.innerHTML, /可升级完整报告/);
  assert.match(container.innerHTML, /去看比较摘要/);
  assert.match(container.innerHTML, /去名字夹选候选/);
  assert.doesNotMatch(container.innerHTML, /¥19\.9/);
});
