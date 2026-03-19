import test from 'node:test';
import assert from 'node:assert/strict';

import { renderScoring } from './scoring.js';

test('renderScoring shows a stronger report structure in the result state', () => {
  const container = { innerHTML: '' };
  const elements = new Map();

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
    querySelectorAll() {
      return [];
    },
  };

  global.window = {};
  global.setTimeout = (fn) => {
    fn();
    return 0;
  };

  global.localStorage = {
    getItem() {
      return JSON.stringify([
        { full_name: '林春生', score: 88, route: '大俗', one_liner: '自然有生机。' },
        { full_name: '林清和', score: 89, route: '大雅', one_liner: '清润安静。' },
      ]);
    },
    setItem() {},
  };

  const formListeners = {};
  const scoreForm = {
    addEventListener(type, handler) {
      formListeners[type] = handler;
    },
  };
  const nameInput = { value: '林见山' };
  const loadingRoot = { innerHTML: '' };
  const cancelBtn = {
    addEventListener() {},
  };
  const reScoreBtn = {
    addEventListener() {},
  };
  const saveBtn = {
    textContent: '',
    style: {},
    addEventListener() {},
  };
  const exportBtn = {
    textContent: '',
    disabled: false,
    addEventListener() {},
  };
  const radarCanvas = {
    width: 300,
    height: 300,
    getBoundingClientRect() {
      return {
        width: 300,
        height: 300,
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
        arc() {},
        fillText() {},
        save() {},
        restore() {},
        scale() {},
        setLineDash() {},
        measureText() {
          return { width: 20 };
        },
      };
    },
  };

  elements.set('score-form', scoreForm);
  elements.set('name-input', nameInput);
  elements.set('loading-root', loadingRoot);
  elements.set('cancel-btn', cancelBtn);
  elements.set('re-score-btn', reScoreBtn);
  elements.set('score-save-btn', saveBtn);
  elements.set('score-export-btn', exportBtn);
  elements.set('radar-canvas', radarCanvas);

  renderScoring(container);

  global.fetch = async () => ({
    ok: true,
    async json() {
      return {
        total_score: 91,
        route: '大雅',
        route_reason: '整体气质更克制耐看。',
        dimensions: {
          sound: { score: 18, analysis: '顺口' },
          shape: { score: 18, analysis: '匀称' },
          style: { score: 19, analysis: '有余味' },
          classic: { score: 18, analysis: '温润' },
          practical: { score: 18, analysis: '常用字' },
        },
        overall_comment: '气质完整，长期使用更稳。',
      };
    },
  });

  return formListeners.submit({
    preventDefault() {},
  }).then(() => {
    assert.match(container.innerHTML, /综合判断/);
    assert.match(container.innerHTML, /适合作为正式候选/);
    assert.match(container.innerHTML, /维度拆解/);
    assert.match(container.innerHTML, /去看比较摘要/);
    assert.match(container.innerHTML, /升级后会拿到/);
    assert.match(container.innerHTML, /可升级完整报告/);
    assert.match(container.innerHTML, /推荐排序/);
    assert.doesNotMatch(container.innerHTML, /¥19\.9/);
  });
});
