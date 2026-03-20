import test from 'node:test';
import assert from 'node:assert/strict';

import { renderGeneration, selectTopGenerationCandidates } from './generation.js';

test('selectTopGenerationCandidates keeps the top three candidates by score', () => {
  const selected = selectTopGenerationCandidates([
    { full_name: '林见山', score: 92 },
    { full_name: '林春生', score: 88 },
    { full_name: '林清和', score: 90 },
    { full_name: '林知言', score: 85 },
  ]);

  assert.deepEqual(selected.map((item) => item.full_name), ['林见山', '林清和', '林春生']);
});

test('renderGeneration input and loading states use the shared back label', async () => {
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

  const pendingFetch = new Promise(() => {});

  global.fetch = async () => pendingFetch;

  renderGeneration(container);

  assert.match(container.innerHTML, /返回上一层/);
  assert.match(container.innerHTML, /沿着这一路子起名/);
  assert.doesNotMatch(container.innerHTML, /返回首页|打断推敲/);

  void formListeners.submit({
    preventDefault() {},
  });

  assert.match(container.innerHTML, /返回上一层/);
  assert.match(container.innerHTML, /loading-root/);
  assert.doesNotMatch(container.innerHTML, /返回首页|打断推敲/);
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

  assert.match(container.innerHTML, /返回上一层/);
  assert.doesNotMatch(container.innerHTML, /返回首页|打断推敲|换一批 \/ 重新起名/);
  assert.match(container.innerHTML, /完整比较报告/);
  assert.match(container.innerHTML, /先看免费摘要/);
  assert.match(container.innerHTML, /可升级完整报告/);
  assert.match(container.innerHTML, /去看比较摘要/);
  assert.doesNotMatch(container.innerHTML, /本轮结论/);
  assert.doesNotMatch(container.innerHTML, /去名字夹选候选/);
  assert.doesNotMatch(container.innerHTML, /¥19\.9/);
});

test('renderGeneration detail modal tolerates partial dimension data', async () => {
  const container = { innerHTML: '' };
  const elements = new Map();
  const formListeners = {};
  let nameCardClick = null;
  let saveClick = null;
  let savedNamesJson = '[]';

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
    querySelectorAll(selector) {
      if (selector === '.name-card') {
        return [{
          dataset: { idx: '0' },
          addEventListener(type, handler) {
            if (type === 'click') {
              nameCardClick = handler;
            }
          },
        }];
      }

      return [];
    },
  };

  global.window = {
    location: {
      hash: '#/generate',
    },
  };
  global.setTimeout = (fn) => {
    fn();
    return 0;
  };
  global.localStorage = {
    getItem() {
      return savedNamesJson;
    },
    setItem(key, value) {
      if (key === 'wenming_saved_names') {
        savedNamesJson = value;
      }
    },
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
  const detailModal = {
    classList: {
      add() {},
      remove() {},
    },
    addEventListener() {},
  };
  const modalClose = { addEventListener() {} };
  const modalSaveBtn = {
    textContent: '',
    style: {},
    addEventListener(type, handler) {
      if (type === 'click') {
        saveClick = handler;
      }
    },
  };
  const modalExportBtn = { addEventListener() {}, textContent: '', disabled: false };
  const detailContent = { innerHTML: '' };
  const radarCanvas = {
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
  elements.set('modal-close', modalClose);
  elements.set('modal-save-btn', modalSaveBtn);
  elements.set('modal-export-btn', modalExportBtn);
  elements.set('detail-content', detailContent);
  elements.set('modal-radar-canvas', radarCanvas);

  global.fetch = async () => ({
    ok: true,
    async json() {
      return [
        {
          full_name: '林见山',
          score: 92,
          route: '大雅',
          one_liner: '轻静耐看，有留白。',
          dimensions: {
            sound: { score: 18, analysis: '顺口' },
            shape: { analysis: '匀称' },
            style: { score: 19 },
            classic: {},
          },
        },
      ];
    },
  });

  renderGeneration(container);

  await formListeners.submit({
    preventDefault() {},
  });

  assert.doesNotThrow(() => {
    nameCardClick({
      currentTarget: {
        dataset: {
          idx: '0',
        },
      },
    });
  });
  assert.match(detailContent.innerHTML, /林见山/);
  assert.doesNotMatch(detailContent.innerHTML, /undefined/);

  assert.doesNotThrow(() => {
    saveClick();
  });

  const savedNames = JSON.parse(savedNamesJson);
  assert.equal(savedNames[0].full_name, '林见山');
  assert.equal(savedNames[0].dimensions.shape.score, 10);
  assert.equal(savedNames[0].dimensions.classic.score, 10);
});
