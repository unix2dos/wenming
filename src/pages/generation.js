import '../styles/generation.css';
import { generateNames } from '../api/openrouter.js';
import { renderLoading } from '../components/loading.js';
import { renderRadarChart } from '../components/radar-chart.js';
import { saveName, removeName, isNameSaved } from '../utils/storage.js';
import { exportElementAsPDF } from '../utils/export.js';

export function renderGeneration(container) {
  let state = {
    step: 'input', // 'input', 'loading', 'result'
    error: null,
    data: null, // Array of 8 names
    selectedStyle: '不限',
    selectedDetail: null // For modal
  };

  function render() {
    if (state.step === 'input') {
      container.innerHTML = `
        <div class="generation-page">
          <div class="header-back" style="display:flex; justify-content:space-between;">
            <a href="#/">&larr; 返回首页</a>
            <a href="#/collection">📚 我的藏书阁</a>
          </div>
          <div class="form-section">
            <h2>为宝宝求个好名</h2>
            <form id="gen-form" class="gen-form">
              <div class="form-group">
                <label for="surname">宝宝姓氏</label>
                <input type="text" id="surname" class="input-underline" placeholder="例如: 林" required maxlength="2" autocomplete="off" />
              </div>
              
              <div class="form-group">
                <label>性别</label>
                <div class="radio-group">
                  <label><input type="radio" name="gender" value="男" required> 男孩</label>
                  <label><input type="radio" name="gender" value="女" required> 女孩</label>
                  <label><input type="radio" name="gender" value="未知" checked> 尚未可知</label>
                </div>
              </div>

              <div class="form-group">
                <label>风格偏好</label>
                <div class="style-cards" id="style-selector">
                  <div class="style-card ${state.selectedStyle === '大雅' ? 'selected' : ''}" data-style="大雅">
                    <h4>大雅</h4>
                    <p>禅意水墨，意象含蓄</p>
                    <p style="font-size:0.75rem; color:#A0AEC0;">如: 见山, 修远</p>
                  </div>
                  <div class="style-card ${state.selectedStyle === '大俗' ? 'selected' : ''}" data-style="大俗">
                    <h4>大俗</h4>
                    <p>质朴原野，生命力蓬勃</p>
                    <p style="font-size:0.75rem; color:#A0AEC0;">如: 田野, 大川</p>
                  </div>
                  <div class="style-card ${state.selectedStyle === '不限' ? 'selected' : ''}" data-style="不限">
                    <h4>兼容并蓄</h4>
                    <p>大雅大俗皆可</p>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label for="specific">指定辈分或必含字 <span class="optional">(选填)</span></label>
                <input type="text" id="specific" class="input-underline" placeholder="例如: 中间的字必须是'文'" autocomplete="off" />
              </div>

              <div class="form-group">
                <label for="exclude">排除忌讳字 <span class="optional">(选填)</span></label>
                <input type="text" id="exclude" class="input-underline" placeholder="例如: 排除水旁，排除'国'字" autocomplete="off" />
              </div>

              <div class="form-group">
                <label for="freeDesc">自由描述期待 <span class="optional">(选填)</span></label>
                <textarea id="freeDesc" class="textarea-underline" rows="2" placeholder="例如: 希望有秋天的感觉，或者像古诗词里的悠远意境"></textarea>
              </div>

              ${state.error ? `<div class="error-message" style="text-align:center;">${state.error}</div>` : ''}

              <div class="gen-actions">
                <button type="submit" class="btn">研墨推敲 (生成8个名字)</button>
              </div>
            </form>
          </div>
        </div>
      `;

      // Style selector logic
      document.querySelectorAll('.style-card').forEach(card => {
        card.addEventListener('click', (e) => {
          state.selectedStyle = e.currentTarget.dataset.style;
          // Optimistic visual update
          document.querySelectorAll('.style-card').forEach(c => c.classList.remove('selected'));
          e.currentTarget.classList.add('selected');
        });
      });

      // Submit logic
      document.getElementById('gen-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const preferences = {
          surname: document.getElementById('surname').value.trim(),
          gender: document.querySelector('input[name="gender"]:checked').value,
          style: state.selectedStyle,
          specificWords: document.getElementById('specific').value.trim(),
          excludeWords: document.getElementById('exclude').value.trim(),
          freeDescription: document.getElementById('freeDesc').value.trim()
        };
        
        state.step = 'loading';
        state.error = null;
        render();

        try {
          const result = await generateNames(preferences);
          if (!Array.isArray(result) || result.length === 0) {
            throw new Error("AI 返回了错误的数据格式");
          }
          state.data = result;
          state.step = 'result';
        } catch (err) {
          state.error = "起名过程遇到阻碍，请检查 API 配置或重试。";
          console.error(err);
          state.step = 'input';
        }
        render();
      });

    } else if (state.step === 'loading') {

      container.innerHTML = `
        <div class="generation-page">
          <div class="header-back">
            <a href="javascript:void(0)" id="cancel-btn">&larr; 打断推敲</a>
          </div>
          <div id="loading-root"></div>
        </div>
      `;
      renderLoading(document.getElementById('loading-root'), "AI 正在研墨... 取山野之息，酝文人之雅");
      document.getElementById('cancel-btn').addEventListener('click', () => {
        state.step = 'input';
        render();
      });

    } else if (state.step === 'result') {

      container.innerHTML = `
        <div class="generation-page">
          <div class="header-back" style="display:flex; justify-content:space-between;">
            <a href="javascript:void(0)" id="re-gen-btn">&larr; 换一批 / 重新起名</a>
            <a href="#/collection">📚 我的藏书阁</a>
          </div>
          
          <div class="results-section">
            <div class="results-header">
              <h2>为您推敲的 8 个佳名</h2>
              <p class="slogan" style="font-size:0.95rem;">点击卡片查看详细五维打分</p>
            </div>
            
            <div class="results-grid">
              ${state.data.map((item, idx) => {
                const routeClass = item.route === '大雅' ? 'da-ya' : 'da-su';
                return `
                  <div class="name-card" data-idx="${idx}">
                    <div class="name-card-title">${item.full_name}</div>
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

          <!-- Detail Modal -->
          <div id="detail-modal" class="detail-modal">
            <div class="detail-content" id="detail-content">
              <!-- Injected by JS -->
            </div>
          </div>
        </div>
      `;

      // re-gen btn
      document.getElementById('re-gen-btn').addEventListener('click', () => {
        state.step = 'input';
        state.data = null;
        render();
      });

      // Card click handling
      document.querySelectorAll('.name-card').forEach(card => {
        card.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.dataset.idx, 10);
          openDetailModal(state.data[idx]);
        });
      });
    }
  }

  function openDetailModal(nameData) {
    const modal = document.getElementById('detail-modal');
    const content = document.getElementById('detail-content');
    const routeClass = nameData.route === '大雅' ? 'da-ya' : 'da-su';
    
    const isSaved = isNameSaved(nameData.full_name);
    
    // We reuse the scoring UI visually in the modal
    content.innerHTML = `
      <button class="modal-close no-export" id="modal-close">&times;</button>
      <div id="modal-export-area">
        <div style="text-align:center; margin-bottom: 24px;">
          <div class="result-name" style="font-size: 2.5rem; margin-bottom:8px;">${nameData.full_name}</div>
          <div class="result-meta">
            <div class="total-score" style="font-size: 1.5rem;">${nameData.score}<span> / 100</span></div>
            <span class="pill ${routeClass}">${nameData.route}</span>
          </div>
          <div class="overall-comment" style="font-size:1rem; margin-top:16px;">"${nameData.one_liner}"</div>
        </div>
        <div class="radar-container" style="margin: 24px 0;">
          <canvas id="modal-radar-canvas" style="width: 250px; height: 250px; margin: 0 auto; display:block;"></canvas>
        </div>
        <div style="text-align:center; color:#A0AEC0; font-size:0.85rem;">生成简报中未包含详细单项解析，仅供快速概览雷达分布。若需深究，可前往「看看名字好不好」。</div>
      </div>
      
      <div class="modal-actions no-export" style="display:flex; justify-content:center; gap:16px; margin-top:32px;">
        <button id="modal-save-btn" class="btn" style="background-color: ${isSaved ? '#A0AEC0' : 'var(--color-ouhe)'};">
          ${isSaved ? '已在藏书阁' : '收进藏书阁'}
        </button>
        <button id="modal-export-btn" class="btn" style="background-color: var(--color-zhuqing);">
          导出为解读卷宗
        </button>
      </div>
    `;
    
    modal.classList.add('active');
    
    setTimeout(() => {
      renderRadarChart('modal-radar-canvas', nameData.dimensions);
    }, 50);

    // Binds
    document.getElementById('modal-close').addEventListener('click', () => {
      modal.classList.remove('active');
    });
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });

    const saveBtn = document.getElementById('modal-save-btn');
    saveBtn.addEventListener('click', () => {
      if (isNameSaved(nameData.full_name)) {
        removeName(nameData.full_name);
        saveBtn.textContent = '收进藏书阁';
        saveBtn.style.backgroundColor = 'var(--color-ouhe)';
      } else {
        saveName(nameData);
        saveBtn.textContent = '已在藏书阁';
        saveBtn.style.backgroundColor = '#A0AEC0';
      }
    });

    const exportBtn = document.getElementById('modal-export-btn');
    exportBtn.addEventListener('click', async () => {
      exportBtn.textContent = '生成中...';
      exportBtn.disabled = true;
      try {
        await exportElementAsPDF('detail-content', `${nameData.full_name}_新文人起名简报.pdf`);
      } catch (e) {
        alert("导出失败");
      }
      exportBtn.textContent = '导出为解读卷宗';
      exportBtn.disabled = false;
    });

  }

  render();
}
