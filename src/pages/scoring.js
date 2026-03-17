import '../styles/scoring.css';
import { scoreName } from '../api/openrouter.js';
import { renderLoading } from '../components/loading.js';
import { renderRadarChart } from '../components/radar-chart.js';

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
          <div class="header-back">
            <a href="#/">&larr; 返回首页</a>
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
          state.data = { name, ...result };
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
          <div class="header-back">
            <a href="javascript:void(0)" id="cancel-btn">&larr; 取消返回</a>
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
      
      container.innerHTML = `
        <div class="scoring-page">
          <div class="header-back">
            <a href="javascript:void(0)" id="re-score-btn">&larr; 测下一个名字</a>
          </div>
          
          <div class="result-card">
            <div class="result-header">
              <div class="result-name">${d.name}</div>
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
