import test from 'node:test';
import assert from 'node:assert/strict';

import { quizQuestions } from '../utils/direction-quiz.js';
import { renderTest } from './quiz-page.js';

function createOptionButton(optionId) {
  const handlers = {};
  return {
    dataset: { option: optionId },
    addEventListener(type, handler) {
      handlers[type] = handler;
    },
    click() {
      handlers.click?.({});
    },
  };
}

test('renderTest keeps the shared back label in question and result states', () => {
  const container = {
    innerHTML: '',
    querySelector() {
      return null;
    },
  };
  const elements = new Map();
  const optionButtons = ['a', 'b', 'c'].map(createOptionButton);

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
    querySelector(selector) {
      if (selector === '.advanced-panel') {
        return null;
      }

      return null;
    },
    querySelectorAll(selector) {
      if (selector === '.test-option') {
        return optionButtons;
      }

      return [];
    },
  };

  global.window = {
    location: {
      origin: 'https://wenming.test',
      pathname: '/app',
    },
  };
  global.fetch = async () => ({
    ok: true,
    async json() {
      return {};
    },
  });

  elements.set('share-result', {
    addEventListener() {},
  });
  elements.set('test-back-btn', {
    addEventListener() {},
  });

  renderTest(container);

  assert.match(container.innerHTML, /返回上一层/);
  assert.match(container.innerHTML, /test-question/);
  assert.doesNotMatch(container.innerHTML, /重新测试/);

  for (let index = 0; index < quizQuestions.length; index += 1) {
    optionButtons[0].click();
  }

  assert.match(container.innerHTML, /返回上一层/);
  assert.match(container.innerHTML, /result-shell/);
  assert.match(container.innerHTML, /id="test-back-btn"/);
  assert.doesNotMatch(container.innerHTML, /重新测试/);
});
