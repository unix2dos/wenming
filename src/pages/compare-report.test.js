import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCompareSharePayload, buildPartnerShareText, parseCompareReportState, renderCompareReport } from './compare-report.js';

test('renderCompareReport shows an empty state when no compare names are available', async () => {
  const container = { innerHTML: '' };

  await renderCompareReport(container, {
    getPendingCompareNames: () => [],
  });

  assert.match(container.innerHTML, /先去挑 2 到 3 个名字/);
  assert.match(container.innerHTML, /href="#\/collection"/);
});

test('parseCompareReportState extracts a paid report id from the hash route', () => {
  const state = parseCompareReportState('#/compare-report?report_id=report-123&paid=1');

  assert.deepEqual(state, {
    reportId: 'report-123',
    paid: true,
  });
});

test('buildCompareSharePayload always points to the public summary URL', () => {
  const payload = buildCompareSharePayload(
    {
      reportId: 'report-123',
      stage: 'full',
      recommendation: {
        chosen_name: '林见山',
        headline: '林见山更稳，更像最后会留下来的那个。',
        summary: '它更适合做这一轮的第一候选。',
      },
    },
    {
      appOrigin: 'https://wenming.test',
    },
  );

  assert.equal(payload.url, 'https://wenming.test/#/compare-report?report_id=report-123');
  assert.match(payload.text, /林见山/);
  assert.doesNotMatch(payload.url, /paid=1/);
});

test('buildPartnerShareText gives a direct message for a partner to review', () => {
  const text = buildPartnerShareText({
    reportId: 'report-123',
    recommendation: {
      chosen_name: '林见山',
      headline: '林见山更稳，更像最后会留下来的那个。',
    },
  }, {
    appOrigin: 'https://wenming.test',
  });

  assert.match(text, /林见山/);
  assert.match(text, /wenming\.test\/#\/compare-report\?report_id=report-123/);
  assert.match(text, /你也看看/);
});

test('renderCompareReport summary state shows price framing and deliverables', async () => {
  const container = { innerHTML: '' };

  await renderCompareReport(container, {
    getPendingCompareNames: () => [
      { full_name: '林见山', route: '大雅', score: 92, one_liner: '轻静耐看，有留白。' },
      { full_name: '林春生', route: '大俗', score: 89, one_liner: '自然有生机，记忆点强。' },
    ],
    fetchImpl: async (url) => {
      assert.equal(url, '/api/report/summary');
      return {
        ok: true,
        async json() {
          return {
            reportId: 'report-summary',
            summary: {
              recommendation: {
                chosen_name: '林见山',
                headline: '林见山更稳，更像最后会留下来的那个。',
                summary: '它更适合做这一轮的第一候选。',
              },
              cards: [],
              upgrade_teaser: '完整报告会给出排序、推荐结论与传统维度补充。',
            },
          };
        },
      };
    },
  });

  assert.match(container.innerHTML, /¥19.9/);
  assert.match(container.innerHTML, /看完摘要再决定/);
  assert.match(container.innerHTML, /一次解锁/);
  assert.match(container.innerHTML, /升级后会拿到/);
  assert.match(container.innerHTML, /升级完整报告/);
  assert.match(container.innerHTML, /推荐排序/);
  assert.match(container.innerHTML, /传统维度补充/);
});

test('renderCompareReport fetches a persisted summary by report id and shows a share action', async () => {
  const container = { innerHTML: '' };
  const trackedEvents = [];

  await renderCompareReport(container, {
    hash: '#/compare-report?report_id=report-summary',
    trackEventImpl: async (eventName, options) => {
      trackedEvents.push({ eventName, options });
      return true;
    },
    fetchImpl: async (url) => {
      assert.equal(url, '/api/report/summary?report_id=report-summary');
      return {
        ok: true,
        async json() {
          return {
            reportId: 'report-summary',
            summary: {
              recommendation: {
                chosen_name: '林见山',
                headline: '林见山更稳，更像最后会留下来的那个。',
                summary: '它更适合做这一轮的第一候选。',
              },
              cards: [],
              upgrade_teaser: '完整报告会给出排序、推荐结论与传统维度补充。',
            },
          };
        },
      };
    },
    getPendingCompareNames: () => [],
  });

  assert.match(container.innerHTML, /林见山更稳/);
  assert.match(container.innerHTML, /分享结果卡/);
  assert.match(container.innerHTML, /compare-report-page-share-mode/);
  assert.match(container.innerHTML, /我也想做一轮比较/);
  assert.match(container.innerHTML, /让伴侣也测一下/);
  assert.match(container.innerHTML, /复制给伴侣的话术/);
  assert.match(container.innerHTML, /可以直接发给伴侣/);
  assert.match(container.innerHTML, /这组候选里，目前更偏向/);
  assert.match(container.innerHTML, /截图这一屏，或者复制下方话术发给伴侣/);
  assert.match(container.innerHTML, /适合截图转发给伴侣或家人/);
  assert.match(container.innerHTML, /第一候选/);
  assert.match(container.innerHTML, /适合截图转发/);
  assert.deepEqual(trackedEvents[0], {
    eventName: 'summary_report_opened',
    options: {
      page: 'compare-report',
      reportId: 'report-summary',
      payload: {
        entry: 'shared-link',
        selectedCount: 0,
      },
    },
  });
});

test('renderCompareReport fetches the full report when a paid report id is present in the route', async () => {
  const container = { innerHTML: '' };

  await renderCompareReport(container, {
    hash: '#/compare-report?report_id=report-123&paid=1',
    fetchImpl: async (url) => {
      assert.equal(url, '/api/report/full?report_id=report-123');
      return {
        ok: true,
        async json() {
          return {
            reportId: 'report-123',
            fullReport: {
              recommendation: {
                chosen_name: '林见山',
                conclusion: '林见山是更稳妥的那一个。',
              },
              ranking: [
                { full_name: '林见山', rank: 1, reason: '更完整。' },
                { full_name: '林春生', rank: 2, reason: '更挑风格。' },
              ],
              deep_analysis: [
                {
                  full_name: '林见山',
                  why_it_works: '声气轻稳，长期耐看。',
                  literary_note: '留白自然，不故作高深。',
                  practical_note: '称呼顺，书写压力小。',
                  traditional_note: '字义取向平和，适合做保守推荐。',
                },
              ],
            },
          };
        },
      };
    },
    getPendingCompareNames: () => [],
  });

  assert.match(container.innerHTML, /完整比较报告/);
  assert.match(container.innerHTML, /分享结果卡/);
  assert.match(container.innerHTML, /No\.1 推荐/);
  assert.match(container.innerHTML, /这份报告适合拿给家人讨论/);
  assert.match(container.innerHTML, /总推荐结论/);
  assert.match(container.innerHTML, /导出完整报告/);
  assert.match(container.innerHTML, /逐名拆解/);
  assert.match(container.innerHTML, /传统维度补充/);
  assert.match(container.innerHTML, /林见山是更稳妥的那一个/);
});
