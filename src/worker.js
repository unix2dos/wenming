const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const LEMON_SQUEEZY_API_URL = 'https://api.lemonsqueezy.com/v1/checkouts';
const OPENROUTER_MODEL = 'google/gemini-2.5-flash';
const OPENROUTER_PARSE_MAX_ATTEMPTS = 2;
const TEN_MINUTES_MS = 10 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const BURST_RETRY_AFTER_SECONDS = 60;
const EVENT_LOG_INSERT_SQL = `
  INSERT INTO event_logs (
    event_id,
    session_id,
    report_id,
    event_name,
    page,
    payload_json,
    created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`;
const REPORT_REQUEST_INSERT_SQL = `
  INSERT INTO report_requests (
    report_id,
    session_id,
    source_type,
    selected_names_json,
    summary_json,
    report_status,
    created_at,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;
const REPORT_REQUEST_SELECT_SQL = `
  SELECT report_id, session_id, source_type, selected_names_json, summary_json, full_report_json, report_status, created_at, updated_at
  FROM report_requests
  WHERE report_id = ?
  LIMIT 1
`;
const REPORT_REQUEST_UPDATE_STATUS_SQL = `
  UPDATE report_requests
  SET report_status = ?, updated_at = ?
  WHERE report_id = ?
`;
const REPORT_REQUEST_UPDATE_FULL_SQL = `
  UPDATE report_requests
  SET full_report_json = ?, report_status = ?, updated_at = ?
  WHERE report_id = ?
`;
const PAYMENT_ORDER_INSERT_SQL = `
  INSERT INTO payment_orders (
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
    paid_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
const PAYMENT_ORDER_SELECT_SQL = `
  SELECT order_id, report_id, provider, provider_checkout_id, provider_order_id, amount_cents, currency, payment_status, customer_email, raw_payload_json, created_at, paid_at
  FROM payment_orders
  WHERE report_id = ?
  ORDER BY created_at DESC
  LIMIT 1
`;
const PAYMENT_ORDER_UPDATE_PAID_SQL = `
  UPDATE payment_orders
  SET provider_order_id = ?, payment_status = ?, customer_email = ?, raw_payload_json = ?, paid_at = ?
  WHERE report_id = ?
`;

const ROUTE_POLICIES = {
  '/api/generate': {
    routeKey: 'generate',
    burstBinding: 'GENERATE_BURST_LIMITER',
    shortLimit: 5,
    dayLimit: 15,
    shortError: '10 分钟内起名次数过多，请稍后再试。',
    dayError: '今日起名次数已达上限，请明天再试。',
  },
  '/api/score': {
    routeKey: 'score',
    burstBinding: 'SCORE_BURST_LIMITER',
    shortLimit: 15,
    dayLimit: 60,
    shortError: '10 分钟内打分次数过多，请稍后再试。',
    dayError: '今日打分次数已达上限，请明天再试。',
  },
};

function jsonResponse(payload, init = {}) {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(payload), {
    ...init,
    headers,
  });
}

function getClientId(request) {
  const cfConnectingIp = request.headers.get('CF-Connecting-IP');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return 'unknown';
}

function getSessionId(request, payload = null) {
  const headerSessionId = request.headers.get('x-wenming-session-id');
  if (headerSessionId) {
    return headerSessionId.trim();
  }

  if (typeof payload?.sessionId === 'string' && payload.sessionId.trim().length > 0) {
    return payload.sessionId.trim();
  }

  if (typeof payload?.session_id === 'string' && payload.session_id.trim().length > 0) {
    return payload.session_id.trim();
  }

  return getClientId(request);
}

function rateLimitResponse(result) {
  const retryAfter = String(result.retryAfter ?? BURST_RETRY_AFTER_SECONDS);
  return jsonResponse(
    {
      error: result.error || '请求过于频繁，请稍后再试。',
      retryAfter: Number(retryAfter),
      limitType: result.limitType || 'burst',
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter,
      },
    },
  );
}

function getRoutePolicy(pathname) {
  return ROUTE_POLICIES[pathname] || null;
}

function resetWindowIfExpired(windowState, now, windowMs) {
  if (!windowState || typeof windowState.startedAt !== 'number' || now >= windowState.startedAt + windowMs) {
    return {
      startedAt: now,
      count: 0,
    };
  }

  return windowState;
}

function toRetryAfter(startedAt, now, windowMs) {
  return Math.max(1, Math.ceil((startedAt + windowMs - now) / 1000));
}

async function enforceBurstLimit(request, env, pathname, clientId) {
  const policy = getRoutePolicy(pathname);
  if (!policy) {
    return null;
  }

  const limiter = env[policy.burstBinding];
  if (!limiter?.limit) {
    return null;
  }

  const outcome = await limiter.limit({
    key: `${clientId}:${policy.routeKey}`,
  });

  if (outcome?.success === false) {
    return {
      error: '请求过于频繁，请稍后再试。',
      retryAfter: BURST_RETRY_AFTER_SECONDS,
      limitType: 'burst',
    };
  }

  return null;
}

async function enforceQuotaLimit(env, pathname, clientId) {
  const policy = getRoutePolicy(pathname);
  if (!policy) {
    return null;
  }

  const namespace = env.QUOTA_LIMITER;
  if (!namespace?.idFromName || !namespace?.get) {
    return null;
  }

  const id = namespace.idFromName(clientId);
  const stub = namespace.get(id);
  const response = await stub.fetch(
    new Request('https://quota.internal/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        routeKey: policy.routeKey,
      }),
    }),
  );

  const result = await response.json();
  if (response.ok && result.allowed) {
    return null;
  }

  return result;
}

function buildGeneratePrompt(preferences) {
  const { surname, gender, style, excludeWords, specificWords, freeDescription } = preferences;

  let prompt = `用户偏好：姓氏：${surname}，性别：${gender || '未知'}`;
  if (style && style !== '不限') prompt += `，风格：${style}`;
  if (excludeWords) prompt += `，排除字：${excludeWords}`;
  if (specificWords) prompt += `，辈分字或必含字：${specificWords}`;
  if (freeDescription) prompt += `，自由描述：${freeDescription}`;

  const systemPrompt = `角色：中文起名大师，精通古典文学与民国文人命名风格。
硬性约束：
1. 只用常用字（3500 字范围），不使用生僻字
2. 不使用多音字（乐/行/重/朝等）
3. 回避近 10 年烂大街名字（梓涵/子涵/浩然/欣怡/雨桐/可馨/诗涵/梓萱/一诺/奕辰/沐辰/若汐/语桐等）
4. 回避谐音陷阱
5. 2 字名或 3 字名（含姓）

审美标准：
- 大雅路线：意象含蓄、想象空间大、禅意水墨。参考：林徽因/沈从文/杨绛 | 示例：见山/修远/半亩/听泉
- 大俗路线：画面质朴、生命力蓬勃、接地气有力量。参考：沈从文湘西/汪曾祺乡土 | 示例：田野/麦田/大川/春生

推荐策略：
- 选"大雅"：6 雅 2 俗 | 选"大俗"：2 雅 6 俗 | 选"不限"：4-4
- 分数有梯度，风格有变化

输出：请返回严格 JSON。优先返回对象格式 {"names":[...]}；若直接返回数组也可。每个名字字段包含 full_name, route (只能是"大雅"或"大俗"), score, one_liner, dimensions(包含sound, shape, style, classic, practical)。`;

  return { systemPrompt, userPrompt: prompt };
}

function buildScorePrompt(fullName) {
  const prompt = `名字：${fullName}。请详细打分。`;

  const systemPrompt = `5 维评分（每项 0-20，总分 100）：
1. 音韵搭配：声调组合、声母搭配、朗读节奏 (18-20=极舒适, <14=拗口)
2. 字形美感：结构搭配变化、笔画均衡 (18-20=变化均衡, <14=单调失衡)
3. 大雅大俗：判路线(大雅或大俗)，然后依据该路线特点打分(大雅留白大、大俗生命力强)
4. 民国风骨：温润克制、不造作
5. 实用性：含生僻字≤10，含多音字≤12，检查谐音/重名

要求：temperature=0，禁止泛泛而谈。
输出：严格的 JSON 对象格式，没有任何 Markdown 包裹，字段如下：
{
  "total_score": 90,
  "route": "大雅" (或"大俗"),
  "route_reason": "判定路线的原因",
  "dimensions": {
    "sound": {"score": 18, "analysis": "分析"},
    "shape": {"score": 18, "analysis": "分析"},
    "style": {"score": 18, "analysis": "分析"},
    "classic": {"score": 18, "analysis": "分析"},
    "practical": {"score": 18, "analysis": "分析"}
  },
  "overall_comment": "总体评价"
}`;

  return { systemPrompt, userPrompt: prompt };
}

function buildCompareSummaryPrompt(selectedNames, sourceType) {
  const normalizedNames = selectedNames
    .map((item, index) => `${index + 1}. ${item.full_name}｜路线：${item.route || '未标注'}｜分数：${item.score ?? '未知'}｜一句话：${item.one_liner || '暂无'}`)
    .join('\n');

  return {
    systemPrompt: `角色：资深中文命名顾问，擅长比较 2-3 个中文名字，并给出克制、专业、可解释的判断。
要求：
1. 结论明确，说出当前更推荐哪个名字
2. 逐个解释每个名字为什么成立
3. 语言要像真的懂命名的人写的，不空泛，不堆辞藻
4. 需要兼顾审美、长期耐看度、日常接受度
5. 输出严格 JSON，不要 Markdown

JSON 结构：
{
  "recommendation": {
    "chosen_name": "当前更推荐的名字",
    "headline": "一句结论",
    "summary": "80 字内的总判断"
  },
  "cards": [
    {
      "full_name": "名字",
      "verdict": "一句短判断",
      "literary_note": "文学/意境分析",
      "risk_note": "风险或边界提示"
    }
  ],
  "upgrade_teaser": "一句话说明完整报告会补充什么"
}`,
    userPrompt: `比较来源：${sourceType || 'unknown'}。\n请比较以下候选名，并输出摘要版比较报告：\n${normalizedNames}`,
  };
}

function buildCompareFullPrompt(selectedNames, summary) {
  const normalizedNames = selectedNames
    .map((item, index) => `${index + 1}. ${item.full_name}｜路线：${item.route || '未标注'}｜分数：${item.score ?? '未知'}｜一句话：${item.one_liner || '暂无'}`)
    .join('\n');

  return {
    systemPrompt: `角色：资深中文命名顾问，负责输出可以付费交付的完整比较报告。
要求：
1. 明确给出最终推荐
2. 给出候选排序与排序理由
3. 逐个名字解释其成立原因、文学分析、实用分析、传统维度补充
4. 语言专业克制，不空泛，不说套话
5. 输出严格 JSON，不要 Markdown

JSON 结构：
{
  "recommendation": {
    "chosen_name": "最终推荐名",
    "conclusion": "总判断"
  },
  "ranking": [
    {
      "full_name": "名字",
      "rank": 1,
      "reason": "排序理由"
    }
  ],
  "deep_analysis": [
    {
      "full_name": "名字",
      "why_it_works": "为什么成立",
      "literary_note": "文学分析",
      "practical_note": "实用分析",
      "traditional_note": "传统维度补充"
    }
  ]
}`,
    userPrompt: `摘要判断：${JSON.stringify(summary || {})}\n请基于以下候选名输出完整比较报告：\n${normalizedNames}`,
  };
}

export function extractJsonContent(content) {
  if (typeof content !== 'string') {
    throw new Error('LLM 返回内容缺失。');
  }

  if (content.startsWith('```json')) {
    return content.replace(/^```json\n/, '').replace(/\n```$/, '');
  }

  if (content.startsWith('```')) {
    return content.replace(/^```\n/, '').replace(/\n```$/, '');
  }

  return content;
}

function normalizeGenerateResult(parsed) {
  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (Array.isArray(parsed?.names)) {
    return parsed.names;
  }

  if (Array.isArray(parsed?.results)) {
    return parsed.results;
  }

  throw new Error('起名返回格式不正确。');
}

async function fetchOpenRouter(promptPayload, env, fetchImpl) {
  const apiKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('Cloudflare secret OPENROUTER_API_KEY 未配置。');
  }

  let lastError = null;

  for (let attempt = 0; attempt < OPENROUTER_PARSE_MAX_ATTEMPTS; attempt += 1) {
    const response = await fetchImpl(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        temperature: 0,
        messages: [
          { role: 'system', content: promptPayload.systemPrompt },
          { role: 'user', content: promptPayload.userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'OpenRouter 请求失败。');
    }

    try {
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      return JSON.parse(extractJsonContent(content));
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === OPENROUTER_PARSE_MAX_ATTEMPTS - 1;
      if (!(error instanceof SyntaxError) || isLastAttempt) {
        break;
      }
    }
  }

  throw lastError instanceof Error
    ? new Error(`OpenRouter JSON 解析失败：${lastError.message}`)
    : new Error('OpenRouter JSON 解析失败。');
}

function validateEventPayload(payload) {
  return typeof payload?.eventName === 'string' && payload.eventName.trim().length > 0;
}

async function insertEventLog(env, event) {
  if (!env?.DB?.prepare) {
    throw new Error('Cloudflare D1 绑定 DB 未配置。');
  }

  const eventId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  const createdAt = new Date().toISOString();
  const page = typeof event.page === 'string' && event.page.trim().length > 0 ? event.page.trim() : null;
  const reportId = typeof event.reportId === 'string' && event.reportId.trim().length > 0 ? event.reportId.trim() : null;

  await env.DB.prepare(EVENT_LOG_INSERT_SQL)
    .bind(
      eventId,
      event.sessionId,
      reportId,
      event.eventName,
      page,
      JSON.stringify(event.payload ?? {}),
      createdAt,
    )
    .run();

  return {
    ok: true,
    eventId,
    createdAt,
  };
}

async function safeInsertEventLog(env, event) {
  if (!env?.DB?.prepare) {
    return null;
  }

  try {
    return await insertEventLog(env, event);
  } catch (error) {
    console.error('event_log_failed', error);
    return null;
  }
}

function validateGeneratePayload(payload) {
  return typeof payload?.surname === 'string' && payload.surname.trim().length > 0;
}

function validateScorePayload(payload) {
  return typeof payload?.fullName === 'string' && payload.fullName.trim().length > 0;
}

function validateCompareSummaryPayload(payload) {
  if (!Array.isArray(payload?.selectedNames)) {
    return false;
  }

  if (payload.selectedNames.length < 2 || payload.selectedNames.length > 3) {
    return false;
  }

  return payload.selectedNames.every((item) => typeof item?.full_name === 'string' && item.full_name.trim().length > 0);
}

function validateCheckoutPayload(payload) {
  return typeof payload?.reportId === 'string' && payload.reportId.trim().length > 0;
}

function parseStoredJson(value, fallback = null) {
  if (typeof value !== 'string' || value.length === 0) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeCompareSelection(selectedNames) {
  return selectedNames.map((item) => ({
    full_name: item.full_name.trim(),
    route: typeof item.route === 'string' ? item.route : null,
    score: typeof item.score === 'number' ? item.score : null,
    one_liner: typeof item.one_liner === 'string' ? item.one_liner : null,
  }));
}

async function createReportRequest(env, payload) {
  if (!env?.DB?.prepare) {
    throw new Error('Cloudflare D1 绑定 DB 未配置。');
  }

  const reportId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  const createdAt = new Date().toISOString();

  await env.DB.prepare(REPORT_REQUEST_INSERT_SQL)
    .bind(
      reportId,
      payload.sessionId,
      payload.sourceType,
      JSON.stringify(payload.selectedNames),
      JSON.stringify(payload.summary),
      payload.reportStatus ?? 'summary_ready',
      createdAt,
      createdAt,
    )
    .run();

  return {
    reportId,
    createdAt,
  };
}

async function getReportRequest(env, reportId) {
  if (!env?.DB?.prepare) {
    throw new Error('Cloudflare D1 绑定 DB 未配置。');
  }

  return env.DB.prepare(REPORT_REQUEST_SELECT_SQL)
    .bind(reportId)
    .first();
}

async function createPaymentOrder(env, payload) {
  if (!env?.DB?.prepare) {
    throw new Error('Cloudflare D1 绑定 DB 未配置。');
  }

  const orderId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  const createdAt = new Date().toISOString();
  await env.DB.prepare(PAYMENT_ORDER_INSERT_SQL)
    .bind(
      orderId,
      payload.reportId,
      payload.provider,
      payload.providerCheckoutId,
      payload.providerOrderId ?? null,
      payload.amountCents ?? 0,
      payload.currency ?? 'USD',
      payload.paymentStatus ?? 'created',
      payload.customerEmail ?? null,
      payload.rawPayloadJson ?? null,
      createdAt,
      payload.paidAt ?? null,
    )
    .run();

  return {
    orderId,
    createdAt,
  };
}

async function getPaymentOrderByReportId(env, reportId) {
  if (!env?.DB?.prepare) {
    throw new Error('Cloudflare D1 绑定 DB 未配置。');
  }

  return env.DB.prepare(PAYMENT_ORDER_SELECT_SQL)
    .bind(reportId)
    .first();
}

async function markPaymentOrderPaid(env, payload) {
  await env.DB.prepare(PAYMENT_ORDER_UPDATE_PAID_SQL)
    .bind(
      payload.providerOrderId,
      'paid',
      payload.customerEmail ?? null,
      payload.rawPayloadJson ?? null,
      payload.paidAt,
      payload.reportId,
    )
    .run();
}

async function updateReportStatus(env, reportId, status) {
  await env.DB.prepare(REPORT_REQUEST_UPDATE_STATUS_SQL)
    .bind(status, new Date().toISOString(), reportId)
    .run();
}

async function storeFullReport(env, reportId, fullReport) {
  await env.DB.prepare(REPORT_REQUEST_UPDATE_FULL_SQL)
    .bind(JSON.stringify(fullReport), 'unlocked', new Date().toISOString(), reportId)
    .run();
}

function ensureLemonSqueezyEnv(env) {
  const missing = [
    'LEMON_SQUEEZY_API_KEY',
    'LEMON_SQUEEZY_STORE_ID',
    'LEMON_SQUEEZY_VARIANT_ID',
  ].filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(`Lemon Squeezy 配置未完成：缺少 ${missing.join('、')}。`);
  }
}

function getAppOrigin(request, env) {
  if (typeof env?.PUBLIC_APP_URL === 'string' && env.PUBLIC_APP_URL.trim().length > 0) {
    return env.PUBLIC_APP_URL.trim().replace(/\/$/, '');
  }

  return new URL(request.url).origin;
}

async function createLemonSqueezyCheckout(request, env, report, fetchImpl) {
  ensureLemonSqueezyEnv(env);

  const redirectUrl = `${getAppOrigin(request, env)}/#/compare-report?report_id=${encodeURIComponent(report.report_id)}&paid=1`;
  const response = await fetchImpl(LEMON_SQUEEZY_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.LEMON_SQUEEZY_API_KEY}`,
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            custom: {
              report_id: report.report_id,
              session_id: report.session_id,
            },
          },
          product_options: {
            redirect_url: redirectUrl,
          },
          checkout_options: {
            embed: false,
            media: false,
            logo: true,
          },
          preview: true,
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: String(env.LEMON_SQUEEZY_STORE_ID),
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: String(env.LEMON_SQUEEZY_VARIANT_ID),
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Lemon Squeezy checkout 创建失败。');
  }

  const body = await response.json();
  const checkoutUrl = body?.data?.attributes?.url;
  if (typeof checkoutUrl !== 'string' || checkoutUrl.length === 0) {
    throw new Error('Lemon Squeezy checkout URL 缺失。');
  }

  return {
    checkoutUrl,
    providerCheckoutId: body?.data?.id ?? null,
    amountCents: Number(body?.data?.attributes?.preview?.total ?? 0),
    currency: body?.data?.attributes?.preview?.currency ?? 'USD',
  };
}

async function hmacSha256Hex(secret, bodyText) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(bodyText));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyLemonSqueezySignature(request, secret, bodyText) {
  const actual = request.headers.get('x-signature');
  if (!actual) {
    return false;
  }

  const expected = await hmacSha256Hex(secret, bodyText);
  return actual === expected;
}

async function handleGenerate(request, env, fetchImpl) {
  const payload = await request.json();
  if (!validateGeneratePayload(payload)) {
    return jsonResponse({ error: '请输入宝宝姓氏后再起名。' }, { status: 400 });
  }

  const result = await fetchOpenRouter(buildGeneratePrompt(payload), env, fetchImpl);
  const names = normalizeGenerateResult(result);

  await safeInsertEventLog(env, {
    sessionId: getSessionId(request, payload),
    eventName: 'generate_completed',
    page: 'generation',
    payload: {
      surname: payload.surname?.trim?.() || '',
      resultCount: names.length,
      style: payload.style || '不限',
    },
  });

  return jsonResponse(names);
}

async function handleScore(request, env, fetchImpl) {
  const payload = await request.json();
  if (!validateScorePayload(payload)) {
    return jsonResponse({ error: '请输入完整名字后再打分。' }, { status: 400 });
  }

  const result = await fetchOpenRouter(buildScorePrompt(payload.fullName.trim()), env, fetchImpl);

  await safeInsertEventLog(env, {
    sessionId: getSessionId(request, payload),
    eventName: 'score_completed',
    page: 'scoring',
    payload: {
      fullName: payload.fullName.trim(),
      route: result?.route || null,
      totalScore: result?.total_score ?? null,
    },
  });

  return jsonResponse(result);
}

async function handleEventLog(request, env) {
  const payload = await request.json();
  if (!validateEventPayload(payload)) {
    return jsonResponse({ error: 'eventName 必填。' }, { status: 400 });
  }

  const result = await insertEventLog(env, {
    sessionId: getSessionId(request, payload),
    reportId: payload.reportId,
    eventName: payload.eventName.trim(),
    page: payload.page,
    payload: payload.payload,
  });

  return jsonResponse(result, { status: 202 });
}

async function handleCompareSummary(request, env, fetchImpl) {
  const payload = await request.json();
  if (!validateCompareSummaryPayload(payload)) {
    return jsonResponse({ error: '请选择 2 到 3 个名字再进行比较。' }, { status: 400 });
  }

  const selectedNames = normalizeCompareSelection(payload.selectedNames);
  const summary = await fetchOpenRouter(
    buildCompareSummaryPrompt(selectedNames, payload.sourceType || 'manual'),
    env,
    fetchImpl,
  );
  const sessionId = getSessionId(request, payload);
  const report = await createReportRequest(env, {
    sessionId,
    sourceType: payload.sourceType || 'manual',
    selectedNames,
    summary,
    reportStatus: 'summary_ready',
  });

  await safeInsertEventLog(env, {
    sessionId,
    reportId: report.reportId,
    eventName: 'compare_started',
    page: 'compare-report',
    payload: {
      selectedCount: selectedNames.length,
      sourceType: payload.sourceType || 'manual',
    },
  });

  return jsonResponse({
    reportId: report.reportId,
    selectedNames,
    summary,
  });
}

async function handleGetCompareSummary(request, env) {
  const url = new URL(request.url);
  const reportId = url.searchParams.get('report_id');
  if (!reportId) {
    return jsonResponse({ error: 'report_id 必填。' }, { status: 400 });
  }

  const report = await getReportRequest(env, reportId);
  if (!report) {
    return jsonResponse({ error: '比较报告不存在。' }, { status: 404 });
  }

  return jsonResponse({
    reportId,
    selectedNames: parseStoredJson(report.selected_names_json, []),
    summary: parseStoredJson(report.summary_json, {}),
  });
}

async function handleCheckoutCreate(request, env, fetchImpl) {
  const payload = await request.json();
  if (!validateCheckoutPayload(payload)) {
    return jsonResponse({ error: 'reportId 必填。' }, { status: 400 });
  }

  const report = await getReportRequest(env, payload.reportId.trim());
  if (!report) {
    return jsonResponse({ error: '比较报告不存在。' }, { status: 404 });
  }

  const checkout = await createLemonSqueezyCheckout(request, env, report, fetchImpl);

  await createPaymentOrder(env, {
    reportId: report.report_id,
    provider: 'lemonsqueezy',
    providerCheckoutId: checkout.providerCheckoutId,
    amountCents: checkout.amountCents,
    currency: checkout.currency,
    paymentStatus: 'created',
  });

  await safeInsertEventLog(env, {
    sessionId: report.session_id,
    reportId: report.report_id,
    eventName: 'checkout_created',
    page: 'compare-report',
    payload: {
      provider: 'lemonsqueezy',
      amountCents: checkout.amountCents,
      currency: checkout.currency,
    },
  });

  return jsonResponse({
    checkoutUrl: checkout.checkoutUrl,
    providerCheckoutId: checkout.providerCheckoutId,
  });
}

async function handleLemonSqueezyWebhook(request, env) {
  if (!env.LEMON_SQUEEZY_WEBHOOK_SECRET) {
    return jsonResponse({ error: 'Lemon Squeezy webhook secret 未配置：缺少 LEMON_SQUEEZY_WEBHOOK_SECRET。' }, { status: 500 });
  }

  const bodyText = await request.text();
  const isValid = await verifyLemonSqueezySignature(request, env.LEMON_SQUEEZY_WEBHOOK_SECRET, bodyText);
  if (!isValid) {
    return jsonResponse({ error: 'Webhook 签名校验失败。' }, { status: 401 });
  }

  const payload = JSON.parse(bodyText);
  const eventName = payload?.meta?.event_name || request.headers.get('x-event-name');
  if (eventName !== 'order_created') {
    return jsonResponse({ ok: true, ignored: true });
  }

  const reportId = payload?.meta?.custom_data?.report_id;
  const sessionId = payload?.meta?.custom_data?.session_id || 'unknown';
  if (typeof reportId !== 'string' || reportId.trim().length === 0) {
    return jsonResponse({ error: 'Webhook 缺少 report_id。' }, { status: 400 });
  }

  const paidAt = new Date().toISOString();
  await markPaymentOrderPaid(env, {
    reportId: reportId.trim(),
    providerOrderId: String(payload?.data?.id ?? ''),
    customerEmail: payload?.data?.attributes?.user_email ?? null,
    rawPayloadJson: bodyText,
    paidAt,
  });
  await updateReportStatus(env, reportId.trim(), 'paid');

  await safeInsertEventLog(env, {
    sessionId,
    reportId: reportId.trim(),
    eventName: 'payment_completed',
    page: 'compare-report',
    payload: {
      provider: 'lemonsqueezy',
      providerOrderId: String(payload?.data?.id ?? ''),
    },
  });

  return jsonResponse({ ok: true });
}

async function handleFullReport(request, env, fetchImpl) {
  const url = new URL(request.url);
  const reportId = url.searchParams.get('report_id');
  if (!reportId) {
    return jsonResponse({ error: 'report_id 必填。' }, { status: 400 });
  }

  const report = await getReportRequest(env, reportId);
  if (!report) {
    return jsonResponse({ error: '比较报告不存在。' }, { status: 404 });
  }

  const paymentOrder = await getPaymentOrderByReportId(env, reportId);
  if (!paymentOrder || paymentOrder.payment_status !== 'paid') {
    return jsonResponse({ error: '完整报告尚未解锁。' }, { status: 402 });
  }

  const cachedFullReport = parseStoredJson(report.full_report_json);
  if (cachedFullReport) {
    return jsonResponse({
      reportId,
      fullReport: cachedFullReport,
    });
  }

  const selectedNames = parseStoredJson(report.selected_names_json, []);
  const summary = parseStoredJson(report.summary_json, {});
  const fullReport = await fetchOpenRouter(buildCompareFullPrompt(selectedNames, summary), env, fetchImpl);
  await storeFullReport(env, reportId, fullReport);

  await safeInsertEventLog(env, {
    sessionId: report.session_id,
    reportId,
    eventName: 'full_report_viewed',
    page: 'compare-report',
    payload: {
      selectedCount: Array.isArray(selectedNames) ? selectedNames.length : 0,
    },
  });

  return jsonResponse({
    reportId,
    fullReport,
  });
}

async function evaluateQuota(storage, routeKey, now = Date.now()) {
  const policy = Object.values(ROUTE_POLICIES).find((item) => item.routeKey === routeKey);
  if (!policy) {
    return {
      allowed: false,
      error: '未知限流路由。',
      retryAfter: BURST_RETRY_AFTER_SECONDS,
      limitType: 'quota',
    };
  }

  const currentState = (await storage.get(routeKey)) || {};
  const tenMinute = resetWindowIfExpired(currentState.tenMinute, now, TEN_MINUTES_MS);
  const day = resetWindowIfExpired(currentState.day, now, DAY_MS);

  if (day.count >= policy.dayLimit) {
    return {
      allowed: false,
      error: policy.dayError,
      retryAfter: toRetryAfter(day.startedAt, now, DAY_MS),
      limitType: 'quota',
    };
  }

  if (tenMinute.count >= policy.shortLimit) {
    return {
      allowed: false,
      error: policy.shortError,
      retryAfter: toRetryAfter(tenMinute.startedAt, now, TEN_MINUTES_MS),
      limitType: 'quota',
    };
  }

  await storage.put(routeKey, {
    tenMinute: {
      startedAt: tenMinute.startedAt,
      count: tenMinute.count + 1,
    },
    day: {
      startedAt: day.startedAt,
      count: day.count + 1,
    },
  });

  return {
    allowed: true,
  };
}

export class QuotaLimiter {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.storage = state.storage;
  }

  async fetch(request) {
    if (request.method !== 'POST') {
      return jsonResponse({ error: '只支持 POST 请求。' }, { status: 405 });
    }

    const payload = await request.json();
    const routeKey = payload?.routeKey;
    const now = typeof payload?.now === 'number' ? payload.now : Date.now();
    const result = await evaluateQuota(this.storage, routeKey, now);

    return jsonResponse(result, {
      status: result.allowed ? 200 : 429,
    });
  }
}

export function createWorkerHandler(fetchImpl = fetch) {
  return {
    async fetch(request, env) {
      const url = new URL(request.url);

      if (!url.pathname.startsWith('/api/')) {
        return new Response('Not Found', { status: 404 });
      }

      try {
        if (url.pathname === '/api/report/full') {
          if (request.method !== 'GET') {
            return jsonResponse({ error: '只支持 GET 请求。' }, { status: 405 });
          }

          return await handleFullReport(request, env, fetchImpl);
        }

        if (url.pathname === '/api/report/summary' && request.method === 'GET') {
          return await handleGetCompareSummary(request, env);
        }

        if (request.method !== 'POST') {
          return jsonResponse({ error: '只支持 POST 请求。' }, { status: 405 });
        }

        const clientId = getClientId(request);
        const burstVerdict = await enforceBurstLimit(request, env, url.pathname, clientId);
        if (burstVerdict) {
          return rateLimitResponse(burstVerdict);
        }

        const quotaVerdict = await enforceQuotaLimit(env, url.pathname, clientId);
        if (quotaVerdict) {
          return rateLimitResponse(quotaVerdict);
        }

        if (url.pathname === '/api/generate') {
          return await handleGenerate(request, env, fetchImpl);
        }

        if (url.pathname === '/api/score') {
          return await handleScore(request, env, fetchImpl);
        }

        if (url.pathname === '/api/events') {
          return await handleEventLog(request, env);
        }

        if (url.pathname === '/api/report/summary') {
          return await handleCompareSummary(request, env, fetchImpl);
        }

        if (url.pathname === '/api/checkout/compare-report') {
          return await handleCheckoutCreate(request, env, fetchImpl);
        }

        if (url.pathname === '/api/webhooks/lemonsqueezy') {
          return await handleLemonSqueezyWebhook(request, env);
        }

        return jsonResponse({ error: '接口不存在。' }, { status: 404 });
      } catch (error) {
        console.error(error);
        return jsonResponse(
          { error: error instanceof Error ? error.message : '服务处理失败。' },
          { status: 500 },
        );
      }
    },
  };
}

export default createWorkerHandler();
