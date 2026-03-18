import '../styles/landing.css';
import { resultProfiles } from '../utils/direction-quiz.js';

const previewProfiles = [
  resultProfiles.yazheng,
  resultProfiles.kongming,
  resultProfiles.tianzhen,
];

export function renderLanding(container) {
  container.innerHTML = `
    <div class="landing-page">
      <header class="landing-header">
        <div class="brand-mark">问名</div>
        <a href="#/score" class="text-link landing-inline-link">已有名字？看看名字好不好</a>
      </header>

      <section class="landing-hero">
        <div class="landing-hero-copy">
          <h1 class="landing-title">先测方向，再起名</h1>
          <p class="landing-subtitle">用 30 秒先找到你们更合拍的命名方向。</p>
        </div>

        <div class="landing-primary-action">
          <a href="#/test" class="btn">开始测试</a>
        </div>
      </section>

      <section class="landing-section landing-preview-section">
        <div class="landing-section-head">
          <h2>三个命名原型预览</h2>
        </div>

        <div class="preview-grid">
          ${previewProfiles.map((profile) => `
            <article class="preview-card">
              <span class="pill ${profile.camp === '大雅' ? 'da-ya' : 'da-su'}">偏${profile.camp}</span>
              <h3>${profile.type}</h3>
              <p class="preview-summary">${profile.summary}</p>
              <div class="sample-chip-row">
                ${profile.names.map((name) => `<span class="sample-chip">${name}</span>`).join('')}
              </div>
            </article>
          `).join('')}
        </div>
      </section>

      <section class="landing-direct-entry">
        <div class="landing-direct-copy">
          <h2>已经有明确方向了？</h2>
          <p>也可以直接输入姓氏与偏好开始起名。</p>
        </div>
        <a href="#/generate" class="btn btn-secondary">直接起名</a>
      </section>
    </div>
  `;
}
