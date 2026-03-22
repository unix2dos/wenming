/**
 * 传统文化视角 — 渲染组件
 * 将 analyzeCultural() 的结果渲染为 HTML
 */

/**
 * 渲染文化视角板块 HTML
 * @param {object} cultural - analyzeCultural() 返回的结果
 * @param {object} options
 * @param {boolean} options.collapsed - 是否默认折叠（用于 modal）
 * @param {string|null} options.culturalNote - LLM 返回的「问名的看法」
 * @returns {string} HTML 字符串
 */
export function renderCulturalBoard(cultural, { collapsed = false, culturalNote = null } = {}) {
  if (!cultural) return '';

  const sections = [];
  const hasExpandableContent = collapsed && Boolean(cultural.zodiac || culturalNote);

  // 谐音警告（最先展示）
  if (cultural.homophones.length > 0) {
    sections.push(renderHomophones(cultural.homophones));
  }

  // 五行
  sections.push(renderWuxing(cultural.wuxing));

  // 天干地支 + 生肖
  if (cultural.lunar) {
    sections.push(renderLunar(cultural.lunar));
  }

  // 生肖宜忌
  if (cultural.zodiac) {
    sections.push(renderZodiac(cultural.zodiac));
  }

  // 无生日提示
  if (!cultural.hasBirthday) {
    sections.push(`<p class="cultural-birthday-hint">填写生日后可查看生肖宜忌与天干地支</p>`);
  }

  // 重名率
  sections.push(renderFrequency(cultural.frequency));

  // 问名的看法（LLM 评语，可折叠）
  if (culturalNote) {
    sections.push(renderCulturalNote(culturalNote));
  }

  const collapsedClass = collapsed ? ' cultural-board--collapsed' : '';

  return `
    <div class="cultural-board${collapsedClass}">
      <h3 class="cultural-board__title">传统文化视角</h3>
      ${sections.join('')}
      ${hasExpandableContent ? `
        <button class="cultural-board__expand" data-action="expand-cultural">
          展开全部 ▸
        </button>
      ` : ''}
    </div>
  `;
}

function renderWuxing(wuxing) {
  if (!wuxing || !wuxing.chars || wuxing.chars.length === 0) return '';

  const charTags = wuxing.chars.map(c => {
    const unknownClass = c.element ? '' : ' cultural-wuxing__char--unknown';
    const elementText = c.element || '暂无定论';
    return `
      <span class="cultural-wuxing__char${unknownClass}">
        <span class="cultural-wuxing__char-name">${c.char}</span>
        <span class="cultural-wuxing__char-element">${elementText}</span>
      </span>
    `;
  }).join('');

  const relationText = wuxing.relations.length > 0
    ? `<p class="cultural-wuxing__relation">${wuxing.relations.map(r => `${r.pair}：${r.relation}`).join('；')}</p>`
    : '';

  return `
    <div class="cultural-wuxing">
      <div class="cultural-wuxing__chars">${charTags}</div>
      ${relationText}
    </div>
  `;
}

function renderLunar(lunar) {
  return `
    <div class="cultural-lunar">
      <p class="cultural-lunar__text">${lunar.tianganDizhi}年 · 属${lunar.zodiac}</p>
      <span class="cultural-lunar__label">农历年份 · 生肖</span>
    </div>
  `;
}

function renderZodiac(zodiac) {
  return `
    <div class="cultural-zodiac">
      <p class="cultural-zodiac__note">${zodiac.note}</p>
    </div>
  `;
}

function renderFrequency(frequency) {
  if (!frequency) return '';

  if (frequency.estimate === null) {
    return `
      <div class="cultural-frequency">
        <p class="cultural-frequency__nodata">重名率暂无数据</p>
      </div>
    `;
  }

  // 根据等级决定 bar 宽度
  const widthMap = [100, 70, 40, 15]; // 0=非常常见, 1=较常见, 2=较少见, 3=非常少见
  const barWidth = widthMap[frequency.tierIndex] ?? 40;

  const estimateText = frequency.estimate > 0
    ? `全国约 ${frequency.estimate.toLocaleString()} 人同名`
    : '';

  return `
    <div class="cultural-frequency">
      <div class="cultural-frequency__header">
        <span class="cultural-frequency__label">重名率</span>
        <span class="cultural-frequency__tier">${frequency.tier}</span>
      </div>
      <div class="cultural-frequency__bar">
        <div class="cultural-frequency__bar-fill" style="width: ${barWidth}%;"></div>
      </div>
      ${estimateText ? `<p class="cultural-frequency__estimate">${estimateText}</p>` : ''}
    </div>
  `;
}

function renderHomophones(homophones) {
  const warnings = homophones.map(h =>
    `「${h.meaning}」`
  ).join('、');

  return `
    <div class="cultural-homophone">
      <p class="cultural-homophone__text">⚠ 谐音提醒：此名可能谐音 ${warnings}，建议留意</p>
    </div>
  `;
}

function renderCulturalNote(note) {
  return `
    <div class="cultural-note">
      <button class="cultural-note__toggle" data-action="toggle-note">
        <span class="cultural-note__toggle-icon">▸</span>
        问名的看法
      </button>
      <div class="cultural-note__content" style="display: none;">
        ${note}
      </div>
    </div>
  `;
}

/**
 * 绑定文化板块的交互事件
 * 在 innerHTML 渲染后调用
 * @param {HTMLElement} container - 包含 .cultural-board 的容器
 */
export function bindCulturalBoardEvents(container) {
  if (!container || typeof container.querySelector !== 'function') {
    return;
  }

  // 展开/折叠整个板块（modal 用）
  container.querySelector('[data-action="expand-cultural"]')?.addEventListener('click', (e) => {
    const board = e.target.closest('.cultural-board');
    board.classList.remove('cultural-board--collapsed');
    e.target.remove();
  });

  // 展开/折叠「问名的看法」
  container.querySelector('[data-action="toggle-note"]')?.addEventListener('click', (e) => {
    const noteSection = e.target.closest('.cultural-note');
    const content = noteSection.querySelector('.cultural-note__content');
    const icon = noteSection.querySelector('.cultural-note__toggle-icon');

    if (content.style.display === 'none') {
      content.style.display = 'block';
      icon.classList.add('cultural-note__toggle-icon--expanded');
    } else {
      content.style.display = 'none';
      icon.classList.remove('cultural-note__toggle-icon--expanded');
    }
  });
}
