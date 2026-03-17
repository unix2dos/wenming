const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export async function generateNames(preferences) {
  const { surname, gender, style, excludeWords, specificWords, freeDescription } = preferences;

  let prompt = `用户偏好：姓氏：${surname}，性别：${gender}`;
  if (style && style !== '不限') prompt += `，风格：大${style}`;
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

输出：8 个名字的严格 JSON 数组格式，没有任何 Markdown 包裹，字段包含 full_name, route (只能是"大雅"或"大俗"), score, one_liner, dimensions(包含sound, shape, style, classic, practical)。示例输出：
[{"full_name":"林见山","route":"大雅","score":95,"one_liner":"见山是山，见水是水，禅意幽远","dimensions":{"sound":18,"shape":19,"style":20,"classic":19,"practical":19}}]`;

  return await fetchOpenRouterAPI(systemPrompt, prompt);
}

export async function scoreName(fullName) {
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

  return await fetchOpenRouterAPI(systemPrompt, prompt);
}

async function fetchOpenRouterAPI(systemPrompt, userPrompt) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("API Error:", err);
      throw new Error("LLM Error");
    }

    const data = await response.json();
    let content = data.choices[0].message.content;

    if (content.startsWith('\`\`\`json')) {
      content = content.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
    } else if (content.startsWith('\`\`\`')) {
      content = content.replace(/^\`\`\`\n/, '').replace(/\n\`\`\`$/, '');
    }

    return JSON.parse(content);
  } catch (err) {
    console.error(err);
    throw new Error('LLM JSON parse or fetch failed.');
  }
}
