import '../styles/scoring.css';
import { scoreName } from '../api/openrouter.js';
import { renderLoading } from '../components/loading.js';
import { renderRadarChart } from '../components/radar-chart.js';
import { saveName, removeName, isNameSaved } from '../utils/storage.js';
import { exportElementAsPDF } from '../utils/export.js';

export function renderScoring(container) {
  let state = {
    step: 'input', // 'input', 'loading', 'result'
    error: null,
    data: null,
  };

  function render() {
    if (state.step === 'input') {
      container.innerHTML = `
        <div class="scoring-page">
          <div class="header-back" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">
            <a href="#/" style="display:inline-flex; align-items:center; gap:4px;"><i data-lucide="arrow-left" style="width:1.2em; height:1.2em;"></i> 返回首页</a>
            <a href="#/collection" style="display:inline-flex; align-items:center; gap:4px;"><i data-lucide="library" style="width:1.2em; height:1.2em;"></i> 我的藏书阁</a>
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
          state.error = "打分失败，请稍后重试或检查配置。";
          state.step = 'input';
        }
        render();
      });
    } else if (state.step === 'loading') {
      container.innerHTML = `
        <div class="scoring-page">
          <div class="header-back" style="margin-bottom: 24px;">
            <button id="cancel-btn" class="btn-text" style="display:inline-flex; align-items:center; gap:4px;"><i data-lucide="arrow-left" style="width:1.2em; height:1.2em;"></i> 取消返回</button>
          </div>
          <div id="loading-root"></div>
        </div>
      `;
      renderLoading(document.getElementById('loading-root'));
      document.getElementById('cancel-btn').addEventListener('click', () => {
        // Soft cancel (doesn't actually abort API request but visually returns)
        state.step = 'input';
        render();
      });
    } else if (state.step === 'result') {
      const d = state.data;
      const routeClass = d.route === '大雅' ? 'da-ya' : 'da-su';
      const isSaved = isNameSaved(d.full_name);
      
      container.innerHTML = `
        <div class="scoring-page">
          <div class="header-back" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">
            <button id="re-score-btn" class="btn-text" style="display:inline-flex; align-items:center; gap:4px;"><i data-lucide="arrow-right" style="width:1.2em; height:1.2em;"></i> 测下一个名字</button>
            <a href="#/collection" style="display:inline-flex; align-items:center; gap:4px;"><i data-lucide="library" style="width:1.2em; height:1.2em;"></i> 我的藏书阁</a>
          </div>
          
          <div class="result-card" id="scoring-result-card">
            <div id="scoring-export-area">
              <div class="result-header">
                <div class="result-name">${d.full_name}</div>
                <div class="result-meta">
                  <div class="total-score">${d.total_score}<span> / 100</span></div>
                  <span class="pill ${routeClass}">${d.route}</span>
                </div>
                <div class="route-reason">${d.route_reason}</div>
                <div class="overall-comment">"${d.overall_comment}"</div>
              </div>

              <div class="radar-container">
                <canvas id="radar-canvas" style="width: 300px; height: 300px;"></canvas>
              </div>

              <div class="dimensions-list">
                ${renderDimItem('音韵', d.dimensions.sound)}
                ${renderDimItem('字形', d.dimensions.shape)}
                ${renderDimItem('意境', d.dimensions.style)}
                ${renderDimItem('风骨', d.dimensions.classic)}
                ${renderDimItem('实用', d.dimensions.practical)}
              </div>
            </div>

            <!-- Actions -->
            <div class="modal-actions no-export" style="display:flex; justify-content:center; gap:16px; margin-top:48px;">
              <button id="score-save-btn" class="btn" style="background-color: ${isSaved ? '#A0AEC0' : 'var(--color-ouhe)'};">
                ${isSaved ? '已在藏书阁' : '收进藏书阁'}
              </button>
              <button id="score-export-btn" class="btn" style="background-color: var(--color-zhuqing);">
                导出解读报告
              </button>
            </div>

          </div>
        </div>
      `;

      // Render chart after DOM update
      setTimeout(() => {
        renderRadarChart('radar-canvas', d.dimensions);
      }, 50);

      document.getElementById('re-score-btn').addEventListener('click', () => {
        state.step = 'input';
        state.data = null;
        render();
      });

      const saveBtn = document.getElementById('score-save-btn');
      saveBtn.addEventListener('click', () => {
        // Need to mock one_liner if the API didn't return one directly here for scoring vs generation
        const savePayload = {
          full_name: d.full_name,
          score: d.total_score,
          route: d.route,
          one_liner: d.overall_comment,
          dimensions: d.dimensions
        };

        if (isNameSaved(d.full_name)) {
          removeName(d.full_name);
          saveBtn.textContent = '收进藏书阁';
          saveBtn.style.backgroundColor = 'var(--color-ouhe)';
        } else {
          saveName(savePayload);
          saveBtn.textContent = '已在藏书阁';
          saveBtn.style.backgroundColor = '#A0AEC0';
        }
      });

      const exportBtn = document.getElementById('score-export-btn');
      exportBtn.addEventListener('click', async () => {
        exportBtn.textContent = '生成中...';
        exportBtn.disabled = true;
        try {
          // Export the entire card div
          await exportElementAsPDF('scoring-result-card', `${d.full_name}_新文人起名简述.pdf`);
        } catch (e) {
          alert("导出失败");
        }
        exportBtn.textContent = '导出解读报告';
        exportBtn.disabled = false;
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
