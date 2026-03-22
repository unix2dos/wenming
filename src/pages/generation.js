import '../styles/generation.css';
import '../styles/cultural.css';
import { generateNames } from '../api/openrouter.js';
import { renderLoading } from '../components/loading.js';
import { normalizeRadarDimensions, renderRadarChart } from '../components/radar-chart.js';
import { renderCulturalBoard, bindCulturalBoardEvents } from '../components/cultural-board.js';
import { saveName, removeName, isNameSaved } from '../utils/storage.js';
import { exportElementAsPDF } from '../utils/export.js';
import { formatApiErrorMessage } from '../utils/api-error.js';
import { getAcceptanceProfile, getGenerationPreset, parseHashQuery } from '../utils/direction-quiz.js';
import { setPendingCompareNames } from '../utils/compare-session.js';
import { renderBackAction, resolveBackTarget } from '../utils/navigation.js';
import { analyzeCultural, getSavedBirthday, saveBirthday, getInstantTianganDizhi } from '../utils/cultural.js';
import {
  COMPARE_REPORT_POINTS,
  COMPARE_REPORT_PRODUCT_NAME,
  COMPARE_REPORT_UPSELL_NAME,
  COMPARE_REPORT_VIEW_SUMMARY_LABEL,
} from '../utils/compare-offer-copy.js';

function escapeAttr(value = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function renderMiniRadarLegend() {
  return `
    <div class="name-card-radar-legend" aria-hidden="true">
      <span>音</span>
      <span>形</span>
      <span>意</span>
      <span>骨</span>
      <span>实</span>
    </div>
  `;
}

export function selectTopGenerationCandidates(results = [], limit = 3) {
  if (!Array.isArray(results) || limit <= 0) {
    return [];
  }

  return [...results]
    .sort((left, right) => (right.score ?? 0) - (left.score ?? 0))
    .slice(0, limit);
}

export function renderGeneration(container) {
  const query = parseHashQuery();
  const presetProfileId = query.get('profile');
  const preset = presetProfileId ? getGenerationPreset(presetProfileId) : null;
  const acceptance = getAcceptanceProfile(query.get('acceptance'));

  let state = {
    step: 'input',
    error: null,
    data: null,
    selectedStyle: preset?.style || '不限',
    advancedOpen: false,
    form: {
      surname: '',
      gender: '未知',
      specificWords: '',
      excludeWords: '',
      freeDescription: preset?.freeDescription || '',
    },
  };

  function renderInput() {
    const helperTitle = preset
      ? `沿着${preset.profile.camp} · ${preset.profile.type}起名`
      : '为宝宝求个好名';
    const helperCopy = preset
      ? `先沿你们测出的方向起名，会比直接生成一批随机候选更像“你们会真正选中的名字”。`
      : '输入姓氏与偏好，推敲出更贴近你们审美方向的候选名。';

    container.innerHTML = `
      <div class="generation-page">
        <div class="header-back generation-topbar">
          ${renderBackAction(resolveBackTarget({ page: 'generate', state: 'input' }))}
          <div class="generation-topbar-links">
            <a href="#/test" class="text-link">测命名方向</a>
            <a href="#/collection" class="text-link">我的名字夹</a>
          </div>
        </div>

        ${preset ? `
          <section class="direction-panel">
            <div class="direction-panel-copy">
              <span class="pill ${preset.profile.camp === '大雅' ? 'da-ya' : 'da-su'}">偏${preset.profile.camp}</span>
              <h2>${preset.profile.type}</h2>
              <p>${preset.profile.summary}</p>
              <div class="sample-chip-row">
                ${preset.profile.names.map((name) => `<span class="sample-chip">${name}</span>`).join('')}
              </div>
            </div>
            <div class="direction-panel-note">
              <p class="direction-panel-label">家人接受度</p>
              <strong>${acceptance.label}</strong>
              <span>${acceptance.summary}</span>
            </div>
          </section>
        ` : ''}

        <div class="form-section">
          <div class="generation-heading">
            <h1>${helperTitle}</h1>
            <p>${helperCopy}</p>
          </div>

          <form id="gen-form" class="gen-form">
            <div class="basic-row">
              <div class="form-group basic-surname-group">
                <label for="surname">宝宝姓氏</label>
                <input type="text" id="surname" class="input-underline" placeholder="例如：林" required maxlength="2" autocomplete="off" value="${escapeAttr(state.form.surname)}" />
              </div>

              <div class="form-group basic-gender-group">
                <label>性别</label>
                <div class="gender-options" role="radiogroup" aria-label="宝宝性别">
                  <label class="gender-option">
                    <input type="radio" name="gender" value="男" ${state.form.gender === '男' ? 'checked' : ''}>
                    <span>男孩</span>
                  </label>
                  <label class="gender-option">
                    <input type="radio" name="gender" value="女" ${state.form.gender === '女' ? 'checked' : ''}>
                    <span>女孩</span>
                  </label>
                  <label class="gender-option">
                    <input type="radio" name="gender" value="未知" ${state.form.gender === '未知' ? 'checked' : ''}>
                    <span>尚未可知</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="gen-birthday" style="font-size:13px; color:var(--color-yanhui);">宝宝生日 <span class="optional">(选填，用于生肖分析)</span></label>
              <input type="date" id="gen-birthday" class="input-underline" value="${getSavedBirthday() || ''}" />
              <div class="birthday-feedback" id="gen-birthday-feedback">${getSavedBirthday() ? (getInstantTianganDizhi(getSavedBirthday()) || '') : ''}</div>
            </div>

            <div class="form-group">
              <label for="freeDesc">自由描述期待 <span class="optional">(选填)</span></label>
              <textarea id="freeDesc" class="textarea-underline" rows="3" placeholder="例如：希望名字有秋天的感觉，或者像古诗里的悠远意境">${escapeAttr(state.form.freeDescription)}</textarea>
            </div>

            <details class="advanced-panel" ${state.advancedOpen ? 'open' : ''}>
              <summary id="advanced-toggle" class="advanced-summary">
                <div class="advanced-summary-left">
                  <span class="advanced-summary-title">高级设置</span>
                  <span class="advanced-summary-copy">风格偏好、指定字、排除字</span>
                </div>
                <div class="advanced-summary-icon">
                  <i data-lucide="chevron-down"></i>
                </div>
              </summary>

              <div class="advanced-content">
                <div class="form-group">
                  <label>风格偏好</label>
                  <div class="style-cards" id="style-selector">
                    <div class="style-card ${state.selectedStyle === '大雅' ? 'selected' : ''}" data-style="大雅">
                      <h4>大雅</h4>
                      <p>端正、留白、耐看</p>
                      <p class="style-card-example">如：见初、清和</p>
                    </div>
                    <div class="style-card ${state.selectedStyle === '大俗' ? 'selected' : ''}" data-style="大俗">
                      <h4>大俗</h4>
                      <p>自然、有劲、有人间感</p>
                      <p class="style-card-example">如：春生、大川</p>
                    </div>
                    <div class="style-card ${state.selectedStyle === '不限' ? 'selected' : ''}" data-style="不限">
                      <h4>不限</h4>
                      <p>先看一批方向混合的候选</p>
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label for="specific">指定辈分或必含字 <span class="optional">(选填)</span></label>
                  <input type="text" id="specific" class="input-underline" placeholder="例如：中间的字必须是“文”" autocomplete="off" value="${escapeAttr(state.form.specificWords)}" />
                </div>

                <div class="form-group">
                  <label for="exclude">排除忌讳字 <span class="optional">(选填)</span></label>
                  <input type="text" id="exclude" class="input-underline" placeholder="例如：排除水旁，排除“国”字" autocomplete="off" value="${escapeAttr(state.form.excludeWords)}" />
                </div>
              </div>
            </details>

            ${state.error ? `<div class="error-message generation-error">${state.error}</div>` : ''}

            <div class="gen-actions">
              <button type="submit" class="btn">沿着这一路子起名</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.querySelectorAll('.style-card').forEach((card) => {
      card.addEventListener('click', (event) => {
        state.selectedStyle = event.currentTarget.dataset.style;
        document.querySelectorAll('.style-card').forEach((current) => current.classList.remove('selected'));
        event.currentTarget.classList.add('selected');
      });
    });

    const advancedPanel = document.querySelector('.advanced-panel');
    if (advancedPanel) {
      advancedPanel.addEventListener('toggle', () => {
        state.advancedOpen = advancedPanel.open;
      });
    }

    // Birthday instant feedback
    const genBirthdayInput = document.getElementById('gen-birthday');
    const genBirthdayFeedback = document.getElementById('gen-birthday-feedback');
    genBirthdayInput.addEventListener('change', () => {
      const val = genBirthdayInput.value;
      saveBirthday(val);
      genBirthdayFeedback.textContent = val ? (getInstantTianganDizhi(val) || '') : '';
    });

    document.getElementById('surname').addEventListener('input', (event) => {
      state.form.surname = event.target.value;
    });
    document.getElementById('specific').addEventListener('input', (event) => {
      state.form.specificWords = event.target.value;
    });
    document.getElementById('exclude').addEventListener('input', (event) => {
      state.form.excludeWords = event.target.value;
    });
    document.getElementById('freeDesc').addEventListener('input', (event) => {
      state.form.freeDescription = event.target.value;
    });
    document.querySelectorAll('input[name="gender"]').forEach((radio) => {
      radio.addEventListener('change', (event) => {
        state.form.gender = event.target.value;
      });
    });

    document.getElementById('gen-form').addEventListener('submit', async (event) => {
      event.preventDefault();

      const preferences = {
        surname: state.form.surname.trim(),
        gender: state.form.gender,
        style: state.selectedStyle,
        specificWords: state.form.specificWords.trim(),
        excludeWords: state.form.excludeWords.trim(),
        freeDescription: state.form.freeDescription.trim(),
      };

      state.step = 'loading';
      state.error = null;
      render();

      try {
        const result = await generateNames(preferences);
        if (!Array.isArray(result) || result.length === 0) {
          throw new Error('AI 返回了错误的数据格式');
        }
        state.data = result;
        state.step = 'result';
      } catch (error) {
        state.error = formatApiErrorMessage(error, '起名');
        state.step = 'input';
      }

      render();
    });
  }

  function renderLoadingState() {
    const backTarget = resolveBackTarget({ page: 'generate', state: 'loading' });
    container.innerHTML = `
      <div class="generation-page">
        <div class="header-back generation-topbar">
          ${renderBackAction(backTarget)}
        </div>
        <div id="loading-root"></div>
      </div>
    `;

    renderLoading(
      document.getElementById('loading-root'),
      preset ? '沿着你们测出的方向推敲候选名…' : 'AI 正在推敲候选名…'
    );
  }

  function renderResultState() {
    const compareCandidates = selectTopGenerationCandidates(state.data);
    const comparePreview = compareCandidates.map((item) => item.full_name).join(' / ');
    const sortedData = [...state.data].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const backTarget = resolveBackTarget({
      page: 'generate',
      state: 'result',
      onBack: () => {
        state.step = 'input';
        state.data = null;
        render();
      },
    });

    container.innerHTML = `
      <div class="generation-page">
        <div class="header-back generation-topbar">
          ${renderBackAction(backTarget, { id: 'generation-back-btn' })}
          <div class="generation-topbar-links">
            <a href="#/test" class="text-link">重测方向</a>
            <a href="#/collection" class="text-link">我的名字夹</a>
          </div>
        </div>

        <div class="results-section">
          <div class="results-header">
            <h2>${preset ? `沿着${preset.profile.type}推敲出的候选名` : '为您推敲的候选名'}</h2>
            <p class="results-subtitle">点开单个名字查看成立理由、维度分布与收藏动作。</p>
          </div>

          <div class="results-grid">
            ${sortedData.map((item, index) => {
              const routeClass = item.route === '大雅' ? 'da-ya' : 'da-su';
              const topClass = index === 0 ? ' top-rank' : '';
              return `
                <div class="name-card${topClass}" data-idx="${state.data.indexOf(item)}">
                  <div class="name-card-title">${item.full_name}</div>
                  <div class="name-card-meta">
                    <span class="name-card-score">${item.score}分</span>
                    <span class="pill ${routeClass}">${item.route}</span>
                  </div>
                  <div class="name-card-radar">
                    <canvas id="candidate-radar-${index}" class="name-card-radar-canvas"></canvas>
                    ${renderMiniRadarLegend()}
                  </div>
                  <div class="name-card-desc">"${item.one_liner}"</div>
                </div>
              `;
            }).join('')}
          </div>

          ${compareCandidates.length >= 2 ? `
            <section class="generation-compare-offer compact">
              <div class="generation-compare-copy">
                <p class="generation-results-kicker">${COMPARE_REPORT_UPSELL_NAME}</p>
                <h3>${comparePreview} 已值得进入最后一轮比较</h3>
                <p>先看免费摘要，了解当前更偏向哪个名字，再决定要不要升级${COMPARE_REPORT_PRODUCT_NAME}。</p>
                <div class="generation-compare-points">
                  ${COMPARE_REPORT_POINTS.map((point) => `<span>${point}</span>`).join('')}
                </div>
              </div>
              <div class="generation-compare-cta-inline">
                <button id="generation-compare-offer-btn" class="btn">${COMPARE_REPORT_VIEW_SUMMARY_LABEL}</button>
              </div>
            </section>
          ` : ''}
        </div>

        <div id="detail-modal" class="detail-modal">
          <div class="detail-content" id="detail-content"></div>
        </div>
      </div>
    `;

    document.getElementById('generation-compare-offer-btn')?.addEventListener('click', () => {
      setPendingCompareNames(compareCandidates);
      window.location.hash = '#/compare-report';
    });

    document.getElementById('generation-back-btn')?.addEventListener('click', backTarget.onBack);

    setTimeout(() => {
      sortedData.forEach((item, index) => {
        renderRadarChart(`candidate-radar-${index}`, item.dimensions, {
          showAxisLabels: false,
          showAxisScores: false,
          padding: 18,
        });
      });
    }, 0);

    document.querySelectorAll('.name-card').forEach((card) => {
      card.addEventListener('click', (event) => {
        const index = Number(event.currentTarget.dataset.idx);
        openDetailModal(state.data[index]);
      });
    });
  }

  function render() {
    if (state.step === 'input') {
      renderInput();
    } else if (state.step === 'loading') {
      renderLoadingState();
    } else if (state.step === 'result') {
      renderResultState();
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

function openDetailModal(nameData) {
    const modal = document.getElementById('detail-modal');
    const content = document.getElementById('detail-content');
    const routeClass = nameData.route === '大雅' ? 'da-ya' : 'da-su';
    const saved = isNameSaved(nameData.full_name);
    const dimensions = normalizeRadarDimensions(nameData.dimensions);

    content.innerHTML = `
      <button class="modal-close no-export" id="modal-close">&times;</button>
      <div id="modal-export-area">
      <div class="generation-modal-header">
          <div class="result-name modal-name">${nameData.full_name}</div>
          <div class="result-meta">
            <div class="total-score modal-score">${nameData.score}<span> / 100</span></div>
            <span class="pill ${routeClass}">${nameData.route}</span>
          </div>
          <div class="generation-modal-section-label">综合判断</div>
          <div class="overall-comment modal-comment">"${nameData.one_liner}"</div>
        </div>
        <div class="radar-container generation-modal-radar">
          <canvas id="modal-radar-canvas" style="width: 250px; height: 250px; margin: 0 auto; display:block;"></canvas>
        </div>
        <div class="generation-modal-note">这里先给你一轮专业摘要，用来判断这个名字是否值得进入最终比较。</div>
        ${(() => {
          const surname = state.form.surname || nameData.full_name.charAt(0);
          const cultural = analyzeCultural(nameData.full_name, surname, getSavedBirthday());
          return renderCulturalBoard(cultural, { collapsed: true, culturalNote: nameData.cultural_note || null });
        })()}
      </div>

      <div class="modal-actions no-export generation-modal-actions">
        <button id="modal-save-btn" class="btn" style="background-color: ${saved ? '#A0AEC0' : 'var(--color-ouhe)'};">
          ${saved ? '已在名字夹' : '加入名字夹'}
        </button>
        <button id="modal-export-btn" class="btn" style="background-color: var(--color-zhuqing);">
          导出结果简报
        </button>
      </div>
    `;

    modal.classList.add('active');

    setTimeout(() => {
      renderRadarChart('modal-radar-canvas', dimensions);
    }, 50);

    // Bind cultural board interactions in modal
    bindCulturalBoardEvents(content);

    document.getElementById('modal-close').addEventListener('click', () => {
      modal.classList.remove('active');
    });

    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.classList.remove('active');
      }
    });

    const saveBtn = document.getElementById('modal-save-btn');
    saveBtn.addEventListener('click', () => {
      if (isNameSaved(nameData.full_name)) {
        removeName(nameData.full_name);
        saveBtn.textContent = '加入名字夹';
        saveBtn.style.backgroundColor = 'var(--color-ouhe)';
      } else {
        saveName({
          ...nameData,
          dimensions,
        });
        saveBtn.textContent = '已在名字夹';
        saveBtn.style.backgroundColor = '#A0AEC0';
      }
    });

    const exportBtn = document.getElementById('modal-export-btn');
    exportBtn.addEventListener('click', async () => {
      exportBtn.textContent = '生成中...';
      exportBtn.disabled = true;
      try {
        await exportElementAsPDF('detail-content', `${nameData.full_name}_名字结果简报.pdf`);
      } catch {
        alert('导出失败');
      }
      exportBtn.textContent = '导出结果简报';
      exportBtn.disabled = false;
    });
  }

  render();
}
