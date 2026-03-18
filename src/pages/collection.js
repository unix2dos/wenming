import '../styles/collection.css';
import { getSavedNames, removeName } from '../utils/storage.js';
import { renderRadarChart } from '../components/radar-chart.js';

export function renderCollection(container) {
  let state = {
    view: 'list', // 'list', 'compare'
    names: getSavedNames(),
    compareSelection: new Set()
  };

  function render() {
    if (state.names.length === 0) {
      container.innerHTML = `
        <div class="collection-page">
          <div class="header-back" style="margin-bottom: 24px;">
            <a href="#/" style="display:inline-flex; align-items:center; gap:4px;"><i data-lucide="arrow-left" style="width:1.2em; height:1.2em;"></i> 返回首页</a>
          </div>
          <div class="empty-state">
            <h3>藏书阁空空如也</h3>
            <p>去推敲几个好名字，遇到心仪的便可收录于此。</p>
            <div style="margin-top: 32px; display:flex; gap:16px; justify-content:center;">
              <a href="#/generate" class="btn">给宝宝取名</a>
              <a href="#/score" class="btn" style="background-color: var(--color-zhuqing);">打分已知名字</a>
            </div>
          </div>
        </div>
      `;
      return;
    }

    if (state.view === 'list') {
      const selectedCount = state.compareSelection.size;
      const canCompare = selectedCount >= 2 && selectedCount <= 3;
      
      container.innerHTML = `
        <div class="collection-page">
          <div class="header-back" style="margin-bottom: 16px;">
            <a href="#/" style="display:inline-flex; align-items:center; gap:4px;"><i data-lucide="arrow-left" style="width:1.2em; height:1.2em;"></i> 返回首页</a>
          </div>
          <div class="collection-header">
            <h2>我的藏书阁</h2>
            <div class="collection-actions">
              <span class="compare-hint">已选 ${selectedCount}/3 个进行对比</span>
              <button id="start-compare-btn" class="btn" style="background-color: var(--color-zhuqing);" ${canCompare ? '' : 'disabled'}>
                横向对比
              </button>
            </div>
          </div>
          
          <div class="collection-grid">
            ${state.names.map(item => {
              const routeClass = item.route === '大雅' ? 'da-ya' : 'da-su';
              const isSelected = state.compareSelection.has(item.full_name);
              return `
                <div class="col-card ${isSelected ? 'selected-compare' : ''}">
                  <input type="checkbox" class="col-checkbox" data-name="${item.full_name}" ${isSelected ? 'checked' : ''}>
                  <button class="col-remove" data-name="${item.full_name}" title="移出藏书阁">&times;</button>
                  
                  <div class="name-card-title" style="margin-top: 16px;">${item.full_name}</div>
                  <div class="name-card-meta">
                    <span class="name-card-score">${item.score}分</span>
                    <span class="pill ${routeClass}">${item.route}</span>
                  </div>
                  <div class="name-card-desc">"${item.one_liner}"</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      // Binds for list
      document.querySelectorAll('.col-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const name = e.target.dataset.name;
          if (e.target.checked) {
            if (state.compareSelection.size >= 3) {
              alert('最多选择 3 个名字进行对比。');
              e.target.checked = false;
              return;
            }
            state.compareSelection.add(name);
          } else {
            state.compareSelection.delete(name);
          }
          render();
        });
      });

      document.querySelectorAll('.col-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const name = e.currentTarget.dataset.name;
          removeName(name);
          state.names = getSavedNames();
          state.compareSelection.delete(name);
          render();
        });
      });

      document.getElementById('start-compare-btn').addEventListener('click', () => {
        if (state.compareSelection.size >= 2) {
          state.view = 'compare';
          render();
        }
      });

    } else if (state.view === 'compare') {
      const selectedNames = state.names.filter(n => state.compareSelection.has(n.full_name));

      container.innerHTML = `
        <div class="collection-page">
          <div class="header-back" style="margin-bottom: 24px;">
            <button id="back-to-list" class="btn-text" style="display:inline-flex; align-items:center; gap:4px;"><i data-lucide="arrow-left" style="width:1.2em; height:1.2em;"></i> 返回藏书阁列表</button>
          </div>
          
          <div class="compare-view">
            <h2 style="text-align:center; font-size:2rem; color: var(--color-dai); margin-bottom: 32px">名字横向鉴赏</h2>
            
            <div class="compare-grid">
              ${selectedNames.map((item, i) => {
                const routeClass = item.route === '大雅' ? 'da-ya' : 'da-su';
                return `
                  <div class="compare-item">
                    <div class="result-name" style="font-size: 2.5rem; margin-bottom:8px;">${item.full_name}</div>
                    <div class="result-meta" style="margin-bottom:16px;">
                      <div class="total-score" style="font-size: 1.5rem;">${item.score}<span> / 100</span></div>
                      <span class="pill ${routeClass}">${item.route}</span>
                    </div>
                    
                    <div class="radar-container" style="margin: 24px 0;">
                      <canvas id="compare-radar-${i}" style="width: 250px; height: 250px; margin: 0 auto; display:block;"></canvas>
                    </div>
                    
                    <div class="overall-comment" style="font-size:0.95rem; margin-top:16px; text-align:left;">
                      "${item.one_liner}"
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;

      // Render charts
      setTimeout(() => {
        selectedNames.forEach((item, i) => {
          renderRadarChart(`compare-radar-${i}`, item.dimensions);
        });
      }, 50);

      document.getElementById('back-to-list').addEventListener('click', () => {
        state.view = 'list';
        render();
      });
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  render();
}
