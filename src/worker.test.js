import test from 'node:test';
import assert from 'node:assert/strict';


import { createWorkerHandler } from './worker.js';

function createD1Spy() {
  const statements = [];
  const reportRequests = new Map();
  const paymentOrders = new Map();

  function findPaymentByReportId(reportId) {
    return [...paymentOrders.values()].find((item) => item.report_id === reportId) || null;
  }

  return {
    statements,
    prepare(sql) {
      return {
        bind(...params) {
          return {
            async run() {
              statements.push({ sql, params });

              if (sql.includes('INSERT INTO report_requests')) {
                const [report_id, session_id, source_type, selected_names_json, summary_json, report_status, created_at, updated_at] = params;
                reportRequests.set(report_id, {
                  report_id,
                  session_id,
                  source_type,
                  selected_names_json,
                  summary_json,
                  full_report_json: null,
                  report_status,
                  created_at,
                  updated_at,
                });
              }

              if (sql.includes('INSERT INTO payment_orders')) {
                const [
                  order_id,
                  report_id,
                  provider,
                  provider_checkout_id,
                  provider_order_id,
                  amount_cents,
                  currency,
                  payment_status,
                  customer_email,
                  raw_payload_json,
                  created_at,
                  paid_at,
                ] = params;

                paymentOrders.set(order_id, {
                  order_id,
                  report_id,
                  provider,
                  provider_checkout_id,
                  provider_order_id,
                  amount_cents,
                  currency,
                  payment_status,
                  customer_email,
                  raw_payload_json,
                  created_at,
                  paid_at,
                });
              }

              if (sql.includes('UPDATE payment_orders')) {
                const [provider_order_id, payment_status, customer_email, raw_payload_json, paid_at, report_id] = params;
                const existing = findPaymentByReportId(report_id);
                if (existing) {
                  existing.provider_order_id = provider_order_id;
                  existing.payment_status = payment_status;
                  existing.customer_email = customer_email;
                  existing.raw_payload_json = raw_payload_json;
                  existing.paid_at = paid_at;
                }
              }

              if (sql.includes('UPDATE report_requests')) {
                if (sql.includes('full_report_json')) {
                  const [full_report_json, report_status, updated_at, report_id] = params;
                  const existing = reportRequests.get(report_id);
                  if (existing) {
                    existing.full_report_json = full_report_json;
                    existing.report_status = report_status;
                    existing.updated_at = updated_at;
                  }
                } else {
                  const [report_status, updated_at, report_id] = params;
                  const existing = reportRequests.get(report_id);
                  if (existing) {
                    existing.report_status = report_status;
                    existing.updated_at = updated_at;
                  }
                }
              }

              return {
                success: true,
                meta: {
                  changes: 1,
                },
              };
            },
            async first() {
              if (sql.includes('SELECT report_id') && sql.includes('FROM report_requests')) {
                const [reportId] = params;
                return reportRequests.get(reportId) || null;
              }

              if (sql.includes('SELECT order_id') && sql.includes('FROM payment_orders')) {
                const [reportId] = params;
                return findPaymentByReportId(reportId);
              }

              return null;
            },
          };
        },
      };
    },
  };
}

function createGenerateFetchResponse() {
  return {
    ok: true,
    async json() {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
                names: [
                  {
                    full_name: '林见山',
                    route: '大雅',
                    score: 92,
                    one_liner: '轻静耐看，有留白。',
                    dimensions: {
                      sound: { score: 18, analysis: '顺口' },
                      shape: { score: 18, analysis: '匀称' },
                      style: { score: 19, analysis: '有余味' },
                      classic: { score: 19, analysis: '克制' },
                      practical: { score: 18, analysis: '常用字' },
                    },
                  },
                ],
              }),
            },
          },
        ],
      };
    },
  };
}

function createCompareSummaryFetchResponse() {
  return {
    ok: true,
    async json() {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
                recommendation: {
                  chosen_name: '林见山',
                  headline: '林见山更稳，更耐看，也更像会被长期选中的那个。',
                  summary: '它的整体气质更完整，兼顾留白感与可解释性。',
                },
                cards: [
                  {
                    full_name: '林见山',
                    verdict: '更成立',
                    literary_note: '轻静克制，有余味。',
                    risk_note: '风格偏清，需要家庭审美接受度。',
                  },
                  {
                    full_name: '林春生',
                    verdict: '更有生机',
                    literary_note: '自然直给，记忆点强。',
                    risk_note: '画面感强，也更挑偏好。',
                  },
                ],
                upgrade_teaser: '完整报告会给出横向排序、推荐结论与传统维度补充。',
              }),
            },
          },
        ],
      };
    },
  };
}

function createMalformedCompareSummaryFetchResponse() {
  return {
    ok: true,
    async json() {
      return {
        choices: [
          {
            message: {
              content: '{"recommendation":{"chosen_name":"林见山","headline":"坏 JSON","summary":"少了结束引号}}',
            },
          },
        ],
      };
    },
  };
}

function createCompareFullFetchResponse() {
  return {
    ok: true,
    async json() {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
                recommendation: {
                  chosen_name: '林见山',
                  conclusion: '林见山是这组里更稳妥也更耐看的选择。',
                },
                ranking: [
                  { full_name: '林见山', rank: 1, reason: '气质完整，留白自然。' },
                  { full_name: '林春生', rank: 2, reason: '更有生机，但风格更挑人。' },
                ],
                deep_analysis: [
                  {
                    full_name: '林见山',
                    why_it_works: '声气轻稳，字面干净，长期使用不容易腻。',
                    literary_note: '有山水留白感，不故作高深。',
                    practical_note: '日常称呼和书写都比较顺。',
                    traditional_note: '字义取向平和，适合做保守推荐。',
                  },
                ],
              }),
            },
          },
        ],
      };
    },
  };
}



function createSequentialFetch(...responses) {
  let index = 0;

  return async () => {
    const response = responses[index];
    index += 1;
    return response;
  };
}

test('events endpoint persists a structured user event into D1', async () => {
  const db = createD1Spy();
  const handler = createWorkerHandler();
  const request = new Request('https://example.com/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId: 'session-123',
      eventName: 'upgrade_clicked',
      page: 'compare-report',
      payload: {
        source: 'result-card',
      },
    }),
  });

  const response = await handler.fetch(request, { DB: db });
  const body = await response.json();

  assert.equal(response.status, 202);
  assert.equal(body.ok, true);
  assert.equal(db.statements.length, 1);
  assert.match(db.statements[0].sql, /INSERT INTO event_logs/);
  assert.equal(db.statements[0].params[1], 'session-123');
  assert.equal(db.statements[0].params[3], 'upgrade_clicked');
});

test('events endpoint rejects invalid payloads', async () => {
  const db = createD1Spy();
  const handler = createWorkerHandler();
  const request = new Request('https://example.com/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventName: '',
    }),
  });

  const response = await handler.fetch(request, { DB: db });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.match(body.error, /event/i);
  assert.equal(db.statements.length, 0);
});

test('generate endpoint logs completion events without changing the API response', async () => {
  const db = createD1Spy();
  const handler = createWorkerHandler(async () => createGenerateFetchResponse());
  const request = new Request('https://example.com/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-wenming-session-id': 'session-generate',
    },
    body: JSON.stringify({
      surname: '林',
      gender: '女',
      style: '大雅',
    }),
  });

  const response = await handler.fetch(request, {
    DB: db,
    OPENROUTER_API_KEY: 'test-key',
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(Array.isArray(body), true);
  assert.equal(body[0].full_name, '林见山');
  assert.equal(db.statements.length, 1);
  assert.match(db.statements[0].sql, /INSERT INTO event_logs/);
  assert.equal(db.statements[0].params[1], 'session-generate');
  assert.equal(db.statements[0].params[3], 'generate_completed');
});

test('generate endpoint uses OPENROUTER_MODEL when provided', async () => {
  const db = createD1Spy();
  const handler = createWorkerHandler(async (_url, init) => {
    const payload = JSON.parse(init.body);
    assert.equal(payload.model, 'custom/model');
    return createGenerateFetchResponse();
  });
  const request = new Request('https://example.com/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      surname: '林',
      gender: '女',
      style: '大雅',
    }),
  });

  const response = await handler.fetch(request, {
    DB: db,
    OPENROUTER_API_KEY: 'test-key',
    OPENROUTER_MODEL: 'custom/model',
  });

  assert.equal(response.status, 200);
});

test('report summary endpoint returns a persisted summary report for selected names', async () => {
  const db = createD1Spy();
  const handler = createWorkerHandler(async () => createCompareSummaryFetchResponse());
  const request = new Request('https://example.com/api/report/summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-wenming-session-id': 'session-compare',
    },
    body: JSON.stringify({
      selectedNames: [
        {
          full_name: '林见山',
          route: '大雅',
          score: 92,
          one_liner: '轻静耐看，有留白。',
        },
        {
          full_name: '林春生',
          route: '大俗',
          score: 89,
          one_liner: '自然有生机，记忆点强。',
        },
      ],
      sourceType: 'collection',
    }),
  });

  const response = await handler.fetch(request, {
    DB: db,
    OPENROUTER_API_KEY: 'test-key',
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(typeof body.reportId, 'string');
  assert.equal(body.summary.recommendation.chosen_name, '林见山');
  assert.equal(db.statements.length, 2);
  assert.match(db.statements[0].sql, /INSERT INTO report_requests/);
  assert.match(db.statements[1].sql, /INSERT INTO event_logs/);
  assert.equal(db.statements[1].params[3], 'compare_started');
});

test('report summary endpoint retries once when OpenRouter returns malformed JSON content', async () => {
  const db = createD1Spy();
  const handler = createWorkerHandler(createSequentialFetch(
    createMalformedCompareSummaryFetchResponse(),
    createCompareSummaryFetchResponse(),
  ));
  const request = new Request('https://example.com/api/report/summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-wenming-session-id': 'session-compare-retry',
    },
    body: JSON.stringify({
      selectedNames: [
        {
          full_name: '林见山',
          route: '大雅',
          score: 92,
          one_liner: '轻静耐看，有留白。',
        },
        {
          full_name: '林春生',
          route: '大俗',
          score: 89,
          one_liner: '自然有生机，记忆点强。',
        },
      ],
      sourceType: 'collection',
    }),
  });

  const response = await handler.fetch(request, {
    DB: db,
    OPENROUTER_API_KEY: 'test-key',
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.summary.recommendation.chosen_name, '林见山');
});

test('report summary endpoint rejects compare requests outside the 2-3 name range', async () => {
  const db = createD1Spy();
  const handler = createWorkerHandler(async () => createCompareSummaryFetchResponse());
  const request = new Request('https://example.com/api/report/summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      selectedNames: [
        {
          full_name: '林见山',
        },
      ],
    }),
  });

  const response = await handler.fetch(request, {
    DB: db,
    OPENROUTER_API_KEY: 'test-key',
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.match(body.error, /2.*3/);
  assert.equal(db.statements.length, 0);
});

test('report summary GET endpoint returns a persisted summary by report id', async () => {
  const db = createD1Spy();
  const handler = createWorkerHandler(async () => createCompareSummaryFetchResponse());
  const createResponse = await handler.fetch(new Request('https://example.com/api/report/summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-wenming-session-id': 'session-summary-get',
    },
    body: JSON.stringify({
      selectedNames: [
        { full_name: '林见山', route: '大雅', score: 92, one_liner: '轻静耐看，有留白。' },
        { full_name: '林春生', route: '大俗', score: 89, one_liner: '自然有生机，记忆点强。' },
      ],
      sourceType: 'collection',
    }),
  }), {
    DB: db,
    OPENROUTER_API_KEY: 'test-key',
  });
  const createdBody = await createResponse.json();

  const response = await handler.fetch(new Request(`https://example.com/api/report/summary?report_id=${createdBody.reportId}`, {
    method: 'GET',
  }), {
    DB: db,
    OPENROUTER_API_KEY: 'test-key',
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.reportId, createdBody.reportId);
  assert.equal(body.summary.recommendation.chosen_name, '林见山');
});

test('full report endpoint returns a free report without payment (限免)', async () => {
  const db = createD1Spy();
  const handler = createWorkerHandler(createSequentialFetch(
    createCompareSummaryFetchResponse(),
    createCompareFullFetchResponse(),
  ));
  const summaryResponse = await handler.fetch(new Request('https://example.com/api/report/summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-wenming-session-id': 'session-full',
    },
    body: JSON.stringify({
      selectedNames: [
        { full_name: '林见山', route: '大雅' },
        { full_name: '林春生', route: '大俗' },
      ],
      sourceType: 'collection',
    }),
  }), {
    DB: db,
    OPENROUTER_API_KEY: 'test-key',
  });
  const summaryBody = await summaryResponse.json();

  const response = await handler.fetch(new Request(`https://example.com/api/report/full?report_id=${summaryBody.reportId}`, {
    method: 'GET',
    headers: {
      'x-wenming-session-id': 'session-full',
    },
  }), {
    DB: db,
    OPENROUTER_API_KEY: 'test-key',
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.reportId, summaryBody.reportId);
  assert.equal(body.fullReport.recommendation.chosen_name, '林见山');
  assert.ok(db.statements.some((item) => item.sql.includes('full_report_json')));
});
