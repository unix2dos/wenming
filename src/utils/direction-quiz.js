const acceptanceLevels = {
  low: {
    id: 'low',
    label: '更看重自己一眼喜欢',
    summary: '更有个性，家人沟通需要多解释一句。',
  },
  medium: {
    id: 'medium',
    label: '有味道，也要说得通',
    summary: '兼顾个人审美与日常接受度。',
  },
  high: {
    id: 'high',
    label: '顺耳稳妥，家人更容易接受',
    summary: '更适合做家庭讨论时的共识起点。',
  },
};

export const resultProfiles = {
  yazheng: {
    id: 'yazheng',
    camp: '大雅',
    type: '雅正型',
    culture: '偏儒',
    summary: '端正耐看，越念越有味道。',
    description: '你们更容易被那些端正、耐看、不过分张扬的名字打动。',
    names: ['知言', '修远', '见初'],
    familyNote: '常用字更多，读起来更稳，更顺耳。',
    bullets: [
      '你更在意名字的长期耐看度。',
      '你会天然警惕太花、太用力的字面表达。',
      '你偏好常用字，但不想落入俗套。',
    ],
    style: '大雅',
  },
  kongming: {
    id: 'kongming',
    camp: '大雅',
    type: '空明型',
    culture: '偏佛',
    summary: '清净留白，轻盈但不寡淡。',
    description: '你们喜欢的名字，多半不靠堆砌寓意取胜，而是轻一点、静一点，留一点余味。',
    names: ['清和', '闻溪', '见山'],
    familyNote: '清爽克制，需要一句话解释其美感。',
    bullets: [
      '你喜欢轻一点、静一点的名字气息。',
      '你不希望寓意直白到一眼看完。',
      '你会为“有余味”的名字停下来多看一眼。',
    ],
    style: '大雅',
  },
  tianzhen: {
    id: 'tianzhen',
    camp: '大俗',
    type: '天真型',
    culture: '偏道',
    summary: '有生机，有人间感，不故作高深。',
    description: '你们更喜欢有生机、有人间感的名字，不故作高深。',
    names: ['春生', '大川', '田野'],
    familyNote: '记忆点更强，建议强调常用字与自然感。',
    bullets: [
      '你喜欢名字里带一点风、野气和生命力。',
      '你不爱故作高深的文绉表达。',
      '你更容易记住有画面感、有人间气的名字。',
    ],
    style: '大俗',
  },
};

export const quizQuestions = [
  {
    id: 'scene',
    prompt: '如果把名字想成一幅画，你更喜欢哪种感觉？',
    options: [
      { id: 'a', label: '灯下翻书，安静端正', profileId: 'yazheng' },
      { id: 'b', label: '雨后空山，轻淡有余味', profileId: 'kongming' },
      { id: 'c', label: '风过田野，自然有生气', profileId: 'tianzhen' },
    ],
  },
  {
    id: 'examples',
    prompt: '下面三组名字，你第一眼更偏向哪组？',
    options: [
      { id: 'a', label: '知言 / 修远 / 见初', profileId: 'yazheng' },
      { id: 'b', label: '清和 / 闻溪 / 见山', profileId: 'kongming' },
      { id: 'c', label: '春生 / 大川 / 田野', profileId: 'tianzhen' },
    ],
  },
  {
    id: 'avoid',
    prompt: '你最不想要哪种名字？',
    options: [
      { id: 'a', label: '太文绉绉，像故意显得有文化', profileId: 'tianzhen' },
      { id: 'b', label: '太轻太淡，听完记不住', profileId: 'yazheng' },
      { id: 'c', label: '太直白，像一眼看完没余味', profileId: 'kongming' },
    ],
  },
  {
    id: 'family',
    prompt: '给宝宝起名时，你更在意什么？',
    options: [
      { id: 'a', label: '我一眼就喜欢', acceptanceId: 'low' },
      { id: 'b', label: '有味道，但不要太难懂', acceptanceId: 'medium' },
      { id: 'c', label: '长辈一听顺耳，也容易接受', acceptanceId: 'high' },
    ],
  },
  {
    id: 'future',
    prompt: '你更希望孩子长大后，这个名字给人的感觉是？',
    options: [
      { id: 'a', label: '端正、克制、可靠', profileId: 'yazheng' },
      { id: 'b', label: '清净、轻盈、有余味', profileId: 'kongming' },
      { id: 'c', label: '生动、自然、有生命力', profileId: 'tianzhen' },
    ],
  },
];

function findOption(question, optionId) {
  return question.options.find((option) => option.id === optionId);
}

function resolveWinningProfile(scores, decisiveOrder) {
  const values = Object.values(scores);
  const maxScore = Math.max(...values);
  const tiedProfiles = Object.keys(scores).filter((profileId) => scores[profileId] === maxScore);

  if (tiedProfiles.length === 1) {
    return tiedProfiles[0];
  }

  for (let index = decisiveOrder.length - 1; index >= 0; index -= 1) {
    const candidate = decisiveOrder[index];
    if (tiedProfiles.includes(candidate)) {
      return candidate;
    }
  }

  return tiedProfiles[0];
}

export function calculateQuizResult(answerIds = []) {
  const scores = {
    yazheng: 0,
    kongming: 0,
    tianzhen: 0,
  };
  const decisiveOrder = [];
  let acceptanceId = 'medium';

  quizQuestions.forEach((question, index) => {
    const option = findOption(question, answerIds[index]);
    if (!option) {
      return;
    }

    if (option.profileId) {
      scores[option.profileId] += 1;
      decisiveOrder.push(option.profileId);
    }

    if (option.acceptanceId) {
      acceptanceId = option.acceptanceId;
    }
  });

  const winnerId = resolveWinningProfile(scores, decisiveOrder);

  return {
    profile: resultProfiles[winnerId],
    acceptance: acceptanceLevels[acceptanceId],
    scores,
  };
}

export function encodeShareState({ profileId, acceptanceId }) {
  const params = new URLSearchParams();
  params.set('profile', profileId);
  params.set('acceptance', acceptanceId);
  return params.toString();
}

export function decodeShareState(value = '') {
  const normalized = value.startsWith('?') ? value.slice(1) : value;
  const params = new URLSearchParams(normalized);
  return {
    profileId: params.get('profile') || 'yazheng',
    acceptanceId: params.get('acceptance') || 'medium',
  };
}

export function buildHashRoute(route, params = {}) {
  const search = new URLSearchParams(params).toString();
  return search ? `${route}?${search}` : route;
}

export function parseHashQuery(hash = window.location.hash) {
  const queryIndex = hash.indexOf('?');
  const rawQuery = queryIndex >= 0 ? hash.slice(queryIndex + 1) : '';
  return new URLSearchParams(rawQuery);
}

export function getGenerationPreset(profileId) {
  const profile = resultProfiles[profileId] || resultProfiles.yazheng;
  const freeDescriptions = {
    yazheng: '希望名字端正耐看，不过分张扬，越念越有味道。',
    kongming: '希望名字轻盈清净，带一点留白和余味，不要太直白。',
    tianzhen: '希望名字自然有生机，有人间感和生命力，不故作高深。',
  };

  return {
    profile,
    style: profile.style,
    freeDescription: freeDescriptions[profile.id],
  };
}

export function getAcceptanceProfile(acceptanceId) {
  return acceptanceLevels[acceptanceId] || acceptanceLevels.medium;
}
