import test from 'node:test';
import assert from 'node:assert/strict';

import { renderCulturalBoard } from './cultural-board.js';

test('renderCulturalBoard hides the expand action when collapsed mode has no extra content', () => {
  const html = renderCulturalBoard({
    homophones: [],
    wuxing: {
      chars: [
        { char: '清', element: '水' },
        { char: '川', element: null },
      ],
      relations: [],
    },
    lunar: null,
    zodiac: null,
    frequency: null,
    hasBirthday: false,
  }, { collapsed: true, culturalNote: null });

  assert.doesNotMatch(html, /展开全部/);
});

test('renderCulturalBoard keeps the expand action when collapsed mode hides zodiac guidance', () => {
  const html = renderCulturalBoard({
    homophones: [],
    wuxing: {
      chars: [
        { char: '清', element: '水' },
        { char: '川', element: '金' },
      ],
      relations: [],
    },
    lunar: {
      tianganDizhi: '丙午',
      zodiac: '马',
    },
    zodiac: {
      note: '马年取名宜舒展明快。',
    },
    frequency: null,
    hasBirthday: true,
  }, { collapsed: true, culturalNote: null });

  assert.match(html, /展开全部/);
});
