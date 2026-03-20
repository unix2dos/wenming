import '../styles/scoring.css';
import { scoreName } from '../api/openrouter.js';
import { renderLoading } from '../components/loading.js';
import { normalizeRadarDimensions, renderRadarChart } from '../components/radar-chart.js';
import { saveName, removeName, isNameSaved, getSavedNames } from '../utils/storage.js';
import { exportElementAsPDF } from '../utils/export.js';
import { formatApiErrorMessage } from '../utils/api-error.js';
import { setPendingCompareNames } from '../utils/compare-session.js';
import { renderBackAction, resolveBackTarget } from '../utils/navigation.js';
import {
  COMPARE_REPORT_PICK_CANDIDATES_LABEL,
  COMPARE_REPORT_POINTS,
  COMPARE_REPORT_PRODUCT_NAME,
  COMPARE_REPORT_UPGRADE_RESULTS,
  COMPARE_REPORT_UPSELL_NAME,
  COMPARE_REPORT_VIEW_SUMMARY_LABEL,
} from '../utils/compare-offer-copy.js';

export function buildScoreCompareCandidates(currentScoreResult, savedNames = [], limit = 3) {
  const candidates = [];
  const seen = new Set();

  const appendCandidate = (item, fallbackComment) => {
    if (!item?.full_name || seen.has(item.full_name) || candidates.length >= limit) {
      return;
    }

    seen.add(item.full_name);
    candidates.push({
      full_name: item.full_name,
      score: item.score ?? item.total_score ?? null,
      route: item.route ?? '',
      one_liner: item.one_liner ?? item.overall_comment ?? fallbackComment ?? '',
      dimensions: normalizeRadarDimensions(item.dimensions),
    });
  };

  appendCandidate(currentScoreResult, currentScoreResult?.overall_comment);
  savedNames.forEach((item) => appendCandidate(item));

  return candidates;
}

export function renderScoring(container) {
  let state = {
    step: 'input', // 'input', 'loading', 'result'
    error: null,
    data: null,
  };

  function render() {
    if (state.step === 'input') {
      const backTarget = resolveBackTarget({ page: 'score', state: 'input' });
      container.innerHTML = `
        <div class="scoring-page">
          <div class="header-back" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">
            ${renderBackAction(backTarget)}
            <a href="#/collection" style="display:inline-flex; align-items:center; gap:4px;"><i data-lucide="library" style="width:1.2em; height:1.2em;"></i> 我的名字夹</a>
          </div>
          <div class="input-section">
            <h2>看看名字好不好</h2>
            <form id="score-form" class="input-group">
              <input type="text" id="name-input" class="input-underline" placeholder="输入名字 (例如: 林半亩)" required maxlength="4" autocomplete="off" />
              <button type="submit" class="btn">推敲打分</button>
            </form>
            ${state.error ? `<div class="error-message">${state.error}</div>` : ''}
          </div>
        </div>
      `;

      document.getElementById('score-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name-input').value.trim();
        if (!name) return;
        
        state.step = 'loading';
        state.error = null;
        render();

        try {
          const result = await scoreName(name);
          state.data = { full_name: name, ...result }; // ensure full_name key matches storage logic
          state.step = 'result';
        } catch (err) {
          state.error = formatApiErrorMessage(err, '打分');
          state.step = 'input';
        }
        render();
      });
    } else if (state.step === 'loading') {
      const backTarget = resolveBackTarget({ page: 'score', state: 'loading' });
      container.innerHTML = `
        <div class="scoring-page">
          <div class="header-back" style="margin-bottom: 24px;">
            ${renderBackAction(backTarget)}
          </div>
          <div id="loading-root"></div>
        </div>
      `;
      renderLoading(document.getElementById('loading-root'));
    } else if (state.step === 'result') {
      const d = state.data;
      const dimensions = normalizeRadarDimensions(d.dimensions);
      const routeClass = d.route === '大雅' ? 'da-ya' : 'da-su';
      const isSaved = isNameSaved(d.full_name);
      const compareCandidates = buildScoreCompareCandidates(d, getSavedNames());
      const canCompare = compareCandidates.length >= 2;
      const backTarget = resolveBackTarget({
        page: 'score',
        state: 'result',
        onBack: () => {
          state.step = 'input';
          state.data = null;
          render();
        },
      });
      
      container.innerHTML = `
        <div class="scoring-page">
          <div class="header-back" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">
            ${renderBackAction(backTarget, { id: 'score-back-btn' })}
            <a href="#/collection" style="display:inline-flex; align-items:center; gap:4px;"><i data-lucide="library" style="width:1.2em; height:1.2em;"></i> 我的名字夹</a>
          </div>
          
          <div class="result-card" id="scoring-result-card">
            <div id="scoring-export-area">
              <div class="result-header">
                <div class="result-name">${d.full_name}</div>
                <div class="result-meta">
                  <div class="total-score">${d.total_score}<span> / 100</span></div>
                  <span class="pill ${routeClass}">${d.route}</span>
                </div>
                <div class="result-section-label">综合判断</div>
                <div class="route-reason">${d.route_reason}</div>
                <div class="result-conclusion-chip">${d.total_score >= 88 ? '适合作为正式候选' : d.total_score >= 75 ? '值得继续比较' : '建议谨慎采用'}</div>
                <div class="overall-comment">"${d.overall_comment}"</div>
              </div>

              <div class="radar-container">
                <canvas id="radar-canvas" style="width: 300px; height: 300px;"></canvas>
              </div>

              <div class="dimensions-list">
                <h3 class="result-section-label">维度拆解</h3>
                ${renderDimItem('音韵', dimensions.sound)}
                ${renderDimItem('字形', dimensions.shape)}
                ${renderDimItem('意境', dimensions.style)}
                ${renderDimItem('风骨', dimensions.classic)}
                ${renderDimItem('实用', dimensions.practical)}
              </div>

              ${canCompare ? `
                <section class="score-compare-offer">
                  <div class="score-compare-copy">
                    <p class="score-compare-kicker">${COMPARE_REPORT_UPSELL_NAME}</p>
                    <h3>${COMPARE_REPORT_UPGRADE_RESULTS}</h3>
                    <p>适合已经有 2 到 3 个候选名、准备做最后决策的时候打开。先去看比较摘要，再决定要不要继续升级${COMPARE_REPORT_PRODUCT_NAME}。</p>
                  </div>
                  <div class="score-compare-points">
                    ${COMPARE_REPORT_POINTS.map((point) => `<span>${point}</span>`).join('')}
                  </div>
                </section>
              ` : ''}
            </div>

            <!-- Actions -->
            <div class="modal-actions no-export" style="display:flex; justify-content:center; gap:16px; margin-top:48px; flex-wrap: wrap;">
              <button id="score-save-btn" class="btn" style="background-color: ${isSaved ? '#A0AEC0' : 'var(--color-ouhe)'};">
                ${isSaved ? '已在名字夹' : '加入名字夹'}
              </button>
              <button id="score-export-btn" class="btn" style="background-color: var(--color-zhuqing);">
                导出结果简报
              </button>
              ${canCompare ? `
                <button id="score-compare-btn" class="btn btn-secondary">
                  ${COMPARE_REPORT_VIEW_SUMMARY_LABEL}
                </button>
              ` : `
                <a href="#/collection" class="btn btn-secondary">${COMPARE_REPORT_PICK_CANDIDATES_LABEL}</a>
              `}
            </div>

          </div>
        </div>
      `;

      // Render chart after DOM update
      setTimeout(() => {
        renderRadarChart('radar-canvas', dimensions);
      }, 50);

      document.getElementById('score-back-btn')?.addEventListener('click', backTarget.onBack);

      const saveBtn = document.getElementById('score-save-btn');
      saveBtn.addEventListener('click', () => {
        // Need to mock one_liner if the API didn't return one directly here for scoring vs generation
        const savePayload = {
          full_name: d.full_name,
          score: d.total_score,
          route: d.route,
          one_liner: d.overall_comment,
          dimensions,
        };

        if (isNameSaved(d.full_name)) {
          removeName(d.full_name);
          saveBtn.textContent = '加入名字夹';
          saveBtn.style.backgroundColor = 'var(--color-ouhe)';
        } else {
          saveName(savePayload);
          saveBtn.textContent = '已在名字夹';
          saveBtn.style.backgroundColor = '#A0AEC0';
        }
      });

      const exportBtn = document.getElementById('score-export-btn');
      exportBtn.addEventListener('click', async () => {
        exportBtn.textContent = '生成中...';
        exportBtn.disabled = true;
        try {
          // Export the entire card div
          await exportElementAsPDF('scoring-result-card', `${d.full_name}_名字结果简报.pdf`);
        } catch (e) {
          alert("导出失败");
        }
        exportBtn.textContent = '导出结果简报';
        exportBtn.disabled = false;
      });

      document.getElementById('score-compare-btn')?.addEventListener('click', () => {
        setPendingCompareNames(compareCandidates);
        window.location.hash = '#/compare-report';
      });
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function renderDimItem(label, dimData) {
    if (!dimData) return '';
    return `
      <div class="dimension-item">
        <div class="dim-name">${label}</div>
        <div class="dim-score">${dimData.score}</div>
        <div class="dim-analysis">${dimData.analysis}</div>
      </div>
    `;
  }

  render();
}
