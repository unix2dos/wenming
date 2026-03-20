import '../styles/collection.css';
import { getSavedNames, removeName } from '../utils/storage.js';
import { normalizeRadarDimensions, renderRadarChart } from '../components/radar-chart.js';
import { setPendingCompareNames } from '../utils/compare-session.js';
import { COMPARE_REPORT_VIEW_SUMMARY_LABEL } from '../utils/compare-offer-copy.js';
import { renderBackAction, resolveBackTarget } from '../utils/navigation.js';

export function renderCollectionCompareView(container, selectedNames = [], options = {}) {
  const normalizedNames = selectedNames.map((item) => ({
    ...item,
    dimensions: normalizeRadarDimensions(item.dimensions),
  }));
  const onBack = options.onBack || (() => {});
  const backTarget = resolveBackTarget({
    page: 'collection',
    state: 'compare',
    onBack,
  });

  container.innerHTML = `
    <div class="collection-page">
      <div class="header-back" style="margin-bottom: 24px;">
        ${renderBackAction(backTarget, { id: 'collection-back-btn' })}
      </div>

      <div class="compare-view">
        <h2 style="text-align:center; font-size:2rem; color: var(--color-dai); margin-bottom: 32px">名字横向鉴赏</h2>

        <div class="compare-grid">
          ${normalizedNames.map((item, i) => {
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

  setTimeout(() => {
    normalizedNames.forEach((item, i) => {
      renderRadarChart(`compare-radar-${i}`, item.dimensions);
    });
  }, 50);

  document.getElementById('collection-back-btn')?.addEventListener('click', backTarget.onBack);

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

export function renderCollection(container) {
  let state = {
    view: 'list', // 'list', 'compare'
    names: getSavedNames(),
    compareSelection: new Set()
  };

  function render() {
    if (state.names.length === 0) {
      const backTarget = resolveBackTarget({ page: 'collection', state: 'list' });
      container.innerHTML = `
        <div class="collection-page">
          <div class="header-back" style="margin-bottom: 24px;">
            ${renderBackAction(backTarget)}
          </div>
          <div class="empty-state">
            <h3>名字夹里还没有候选</h3>
            <p>去推敲几个名字，把真正想反复比较的候选留在这里。</p>
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
      const backTarget = resolveBackTarget({ page: 'collection', state: 'list' });

      container.innerHTML = `
        <div class="collection-page">
          <div class="header-back" style="margin-bottom: 16px;">
            ${renderBackAction(backTarget)}
          </div>
          <div class="collection-header">
            <h2>我的名字夹</h2>
            <div class="collection-actions">
              <span class="compare-hint">已选 ${selectedCount}/3 个进行对比</span>
              <button id="start-compare-btn" class="btn" style="background-color: var(--color-zhuqing);" ${canCompare ? '' : 'disabled'}>
                ${COMPARE_REPORT_VIEW_SUMMARY_LABEL}
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
                  <button class="col-remove" data-name="${item.full_name}" title="移出名字夹">&times;</button>
                  
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
          const selectedNames = state.names.filter((item) => state.compareSelection.has(item.full_name));
          setPendingCompareNames(selectedNames);
          window.location.hash = '#/compare-report';
        }
      });

    } else if (state.view === 'compare') {
      const selectedNames = state.names.filter(n => state.compareSelection.has(n.full_name));
      renderCollectionCompareView(container, selectedNames, {
        onBack: () => {
          state.view = 'list';
          render();
        },
      });
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  render();
}
