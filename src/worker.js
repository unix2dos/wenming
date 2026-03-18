const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'google/gemini-2.5-flash';
const TEN_MINUTES_MS = 10 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const BURST_RETRY_AFTER_SECONDS = 60;

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

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  return JSON.parse(extractJsonContent(content));
}

function validateGeneratePayload(payload) {
  return typeof payload?.surname === 'string' && payload.surname.trim().length > 0;
}

function validateScorePayload(payload) {
  return typeof payload?.fullName === 'string' && payload.fullName.trim().length > 0;
}

async function handleGenerate(request, env, fetchImpl) {
  const payload = await request.json();
  if (!validateGeneratePayload(payload)) {
    return jsonResponse({ error: '请输入宝宝姓氏后再起名。' }, { status: 400 });
  }

  const result = await fetchOpenRouter(buildGeneratePrompt(payload), env, fetchImpl);
  return jsonResponse(normalizeGenerateResult(result));
}

async function handleScore(request, env, fetchImpl) {
  const payload = await request.json();
  if (!validateScorePayload(payload)) {
    return jsonResponse({ error: '请输入完整名字后再打分。' }, { status: 400 });
  }

  const result = await fetchOpenRouter(buildScorePrompt(payload.fullName.trim()), env, fetchImpl);
  return jsonResponse(result);
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

      if (request.method !== 'POST') {
        return jsonResponse({ error: '只支持 POST 请求。' }, { status: 405 });
      }

      try {
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
