import '../styles/landing.css';
import { resultProfiles } from '../utils/direction-quiz.js';
import { trackEvent } from '../utils/analytics.js';
import {
  COMPARE_REPORT_FREE_SUMMARY,
  COMPARE_REPORT_INPUT_LABEL,
  COMPARE_REPORT_POINTS,
  COMPARE_REPORT_PRODUCT_NAME,
} from '../utils/compare-offer-copy.js';

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

      <section class="landing-section landing-compare-offer">
        <div class="landing-compare-copy">
          <p class="landing-offer-kicker">适合已经有 2 到 3 个候选名的人</p>
          <h2>${COMPARE_REPORT_PRODUCT_NAME}</h2>
          <p>${COMPARE_REPORT_FREE_SUMMARY}，再决定要不要升级${COMPARE_REPORT_PRODUCT_NAME}。适合拿给伴侣或家人，做最后一轮拍板。</p>
          <div class="landing-compare-points">
            ${COMPARE_REPORT_POINTS.map((point) => `<span>${point}</span>`).join('')}
          </div>
        </div>

        <div class="landing-compare-cta-panel">
          <div class="landing-compare-cta-kicker">先把 2 到 3 个候选名放进来</div>
          <div class="landing-compare-cta-title">${COMPARE_REPORT_FREE_SUMMARY}</div>
          <div class="landing-compare-cta-note">先看推荐倾向和交付物结构，确认这轮比较值得继续，再决定要不要升级${COMPARE_REPORT_PRODUCT_NAME}。</div>
          <a href="#/score" class="btn">${COMPARE_REPORT_INPUT_LABEL}</a>
        </div>
      </section>
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

  const compareCta = typeof container.querySelector === 'function'
    ? container.querySelector('.landing-compare-cta-panel a[href="#/score"]')
    : null;
  compareCta?.addEventListener('click', () => {
    void trackEvent('landing_cta_clicked', {
      page: 'landing',
      payload: {
        target: 'score',
        entry: 'compare-offer',
      },
    });
  });
}
