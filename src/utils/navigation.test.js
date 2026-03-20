import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BACK_LABEL,
  createHandlerBackTarget,
  createRouteBackTarget,
  renderBackAction,
  resolveBackTarget,
} from './navigation.js';

test('createRouteBackTarget models a route-based back action', () => {
  assert.deepEqual(createRouteBackTarget('#/'), {
    kind: 'route',
    href: '#/',
    label: BACK_LABEL,
  });
});

test('createHandlerBackTarget models a handler-based back action', () => {
  let invoked = 0;
  const target = createHandlerBackTarget(() => {
    invoked += 1;
  });

  assert.equal(target.kind, 'handler');
  assert.equal(target.label, BACK_LABEL);
  target.onBack();
  assert.equal(invoked, 1);
});

test('resolveBackTarget returns fixed-parent routes for top-level pages', () => {
  assert.deepEqual(resolveBackTarget({ page: 'score', state: 'input' }), createRouteBackTarget('#/'));
  assert.deepEqual(resolveBackTarget({ page: 'generate', state: 'loading' }), createRouteBackTarget('#/'));
  assert.deepEqual(resolveBackTarget({ page: 'collection', state: 'list' }), createRouteBackTarget('#/'));
  assert.deepEqual(resolveBackTarget({ page: 'test', state: 'question' }), createRouteBackTarget('#/'));
  assert.deepEqual(resolveBackTarget({ page: 'share' }), createRouteBackTarget('#/'));
});

test('resolveBackTarget returns handler actions for in-feature result states', () => {
  let scoringCalls = 0;
  let generationCalls = 0;
  let collectionCalls = 0;
  let testCalls = 0;

  const scoringTarget = resolveBackTarget({
    page: 'score',
    state: 'result',
    onBack: () => {
      scoringCalls += 1;
    },
  });
  const generationTarget = resolveBackTarget({
    page: 'generate',
    state: 'result',
    onBack: () => {
      generationCalls += 1;
    },
  });
  const collectionTarget = resolveBackTarget({
    page: 'collection',
    state: 'compare',
    onBack: () => {
      collectionCalls += 1;
    },
  });
  const testTarget = resolveBackTarget({
    page: 'test',
    state: 'result',
    onBack: () => {
      testCalls += 1;
    },
  });

  assert.equal(scoringTarget.kind, 'handler');
  assert.equal(generationTarget.kind, 'handler');
  assert.equal(collectionTarget.kind, 'handler');
  assert.equal(testTarget.kind, 'handler');

  scoringTarget.onBack();
  generationTarget.onBack();
  collectionTarget.onBack();
  testTarget.onBack();

  assert.equal(scoringCalls, 1);
  assert.equal(generationCalls, 1);
  assert.equal(collectionCalls, 1);
  assert.equal(testCalls, 1);
});

test('resolveBackTarget sends compare-report back to collection only with local compare context', () => {
  assert.deepEqual(
    resolveBackTarget({ page: 'compare-report', hasCompareContext: true }),
    createRouteBackTarget('#/collection'),
  );
  assert.deepEqual(
    resolveBackTarget({ page: 'compare-report', hasCompareContext: false }),
    createRouteBackTarget('#/'),
  );
});

test('renderBackAction renders the shared label for both target types', () => {
  const routeHtml = renderBackAction(createRouteBackTarget('#/'), { icon: 'arrow-left' });
  const handlerHtml = renderBackAction(createHandlerBackTarget(() => {}), {
    id: 'demo-back',
    icon: 'arrow-left',
  });

  assert.match(routeHtml, /返回上一层/);
  assert.match(handlerHtml, /返回上一层/);
  assert.match(routeHtml, /href="#\/"/);
  assert.match(handlerHtml, /id="demo-back"/);
});
