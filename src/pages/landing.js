import '../styles/landing.css';
import { resultProfiles } from '../utils/direction-quiz.js';
import { trackEvent } from '../utils/analytics.js';

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
        <div class="landing-hero-content">
          <div class="landing-hero-copy">
            <h1 class="landing-title">先测方向，再起名</h1>
            <p class="landing-subtitle">用 30 秒先找到你们更合拍的命名方向。</p>
          </div>

          <div class="landing-primary-action">
            <a href="#/test" class="btn">开始测试</a>
          </div>
        </div>
      </section>

      <section class="landing-section landing-preview-section">
        <div class="landing-section-head">
          <p class="landing-section-lead">不知哪种风格适合宝宝？我们将名字凝练为三大美学原型——</p>
          <h2>命名原型一览</h2>
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

      <footer class="landing-footer-cta">
        <p>已在心中描摹好方向？</p>
        <a href="#/generate" class="landing-footer-link">跳过测试，直接起名 <span>&rarr;</span></a>
      </footer>
    </div>
  `;

  const primaryCta = typeof container.querySelector === 'function'
    ? container.querySelector('a[href="#/test"]')
    : null;
  primaryCta?.addEventListener('click', () => {
    void trackEvent('landing_cta_clicked', {
      page: 'landing',
      payload: {
        target: 'test',
      },
    });
  });
}
