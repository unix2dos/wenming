import test from 'node:test';
import assert from 'node:assert/strict';

import { renderShare } from './share.js';

test('renderShare uses the shared back label and no legacy home copy', () => {
  const container = {
    innerHTML: '',
    querySelector() {
      return null;
    },
  };

  global.window = {
    location: {
      hash: '#/share',
    },
  };

  renderShare(container);

  assert.match(container.innerHTML, /返回上一层/);
  assert.doesNotMatch(container.innerHTML, /返回首页/);
});
