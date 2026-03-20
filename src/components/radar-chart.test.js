import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeRadarDimensions, renderRadarChart } from './radar-chart.js';

test('normalizeRadarDimensions fills missing radar keys with default median values', () => {
  assert.deepEqual(normalizeRadarDimensions({
    sound: { score: 18, analysis: '顺口' },
    shape: { score: 16 },
  }), {
    sound: { score: 18, analysis: '顺口' },
    shape: { score: 16, analysis: '' },
    style: { score: 10, analysis: '' },
    classic: { score: 10, analysis: '' },
    practical: { score: 10, analysis: '' },
  });
});

test('renderRadarChart normalizes partial dimension input before drawing', () => {
  const fillTextCalls = [];

  global.window = {
    devicePixelRatio: 1,
  };

  global.document = {
    getElementById(id) {
      if (id !== 'radar-canvas') {
        return null;
      }

      return {
        width: 0,
        height: 0,
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
            scale() {},
            fillText(text) {
              fillTextCalls.push(text);
            },
          };
        },
      };
    },
  };

  assert.doesNotThrow(() => {
    renderRadarChart('radar-canvas', {
      sound: { score: 18, analysis: '顺口' },
    });
  });

  assert.deepEqual(fillTextCalls.filter((value) => typeof value === 'number').sort((left, right) => left - right), [10, 10, 10, 10, 18]);
  assert.ok(!fillTextCalls.includes(undefined));
});
