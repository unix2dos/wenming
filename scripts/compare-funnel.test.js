import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCompareFunnelQuery, buildCompareFunnelArgs, formatCompareFunnelResults } from './compare-funnel.mjs';

test('buildCompareFunnelQuery includes the core compare funnel events', () => {
  const sql = buildCompareFunnelQuery({ days: 7 });

  assert.match(sql, /share_clicked/);
  assert.match(sql, /summary_report_opened/);
  assert.match(sql, /shared_report_cta_clicked/);
  assert.match(sql, /partner_copy_clicked/);
  assert.match(sql, /upgrade_clicked/);
  assert.match(sql, /payment_completed/);
  assert.match(sql, /-7 day/);
});

test('buildCompareFunnelArgs builds a remote wrangler command with config and query', () => {
  const args = buildCompareFunnelArgs({
    databaseName: 'wenming',
    remote: true,
    days: 14,
    configPath: 'wrangler.jsonc',
  });

  assert.deepEqual(args.slice(0, 6), [
    'wrangler',
    'd1',
    'execute',
    'wenming',
    '--remote',
    '--config',
  ]);
  assert.equal(args[6], 'wrangler.jsonc');
  assert.equal(args[7], '--command');
  assert.match(args[8], /-14 day/);
  assert.equal(args[9], '--json');
});

test('formatCompareFunnelResults returns a helpful empty message', () => {
  const output = formatCompareFunnelResults([], { days: 7 });

  assert.match(output, /最近 7 天还没有可用的比较漏斗事件/);
});

test('formatCompareFunnelResults includes the open-to-test column', () => {
  const output = formatCompareFunnelResults([
    {
      day: '2026-03-19',
      share_clicks: 10,
      summary_opens: 8,
      partner_copy_clicks: 5,
      shared_report_cta_clicks: 3,
      upgrade_clicks: 4,
      payments: 2,
      share_to_open: 0.8,
      open_to_copy: 0.625,
      open_to_test: 0.375,
      open_to_upgrade: 0.5,
      upgrade_to_pay: 0.5,
    },
  ]);

  assert.match(output, /open->copy/);
  assert.match(output, /open->test/);
  assert.match(output, /0.625/);
  assert.match(output, /0.375/);
});
