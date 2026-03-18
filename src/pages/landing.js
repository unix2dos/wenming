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
        <p class="landing-eyebrow">不靠生辰八字，先找命名方向</p>
        <h1 class="landing-title">测你家起名更偏大雅还是大俗</h1>
        <p class="landing-subtitle">先找到你们更合拍的命名方向，再决定名字往哪边走。</p>

        <div class="landing-actions">
          <a href="#/test" class="btn">开始测试</a>
          <a href="#/generate" class="btn btn-secondary">直接起名</a>
        </div>

        <div class="landing-trust-strip">
          <span>不走玄学</span>
          <span>先测方向</span>
          <span>再去起名</span>
        </div>
      </section>

      <section class="landing-section">
        <div class="landing-section-head">
          <p class="landing-section-kicker">测完你会得到</p>
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

      <section class="landing-grid-section">
        <article class="landing-note-card">
          <p class="landing-section-kicker">为什么先测，再起名？</p>
          <h2>很多人不是缺名字，而是还没想清楚到底喜欢哪一路。</h2>
          <p>先把方向对齐，再去生成名字，结果会更像“你们会选中的名字”，而不是一批看完就忘的候选。</p>
        </article>

        <article class="landing-scene-card">
          <p class="landing-section-kicker">适合谁来测？</p>
          <ul class="landing-scene-list">
            <li>你和伴侣总是喜欢不同风格</li>
            <li>不想一上来就掉进玄学起名</li>
            <li>想先找方向，再慢慢挑名字</li>
          </ul>
          <a href="#/test" class="text-link landing-inline-link">先测方向，再决定名字往哪边走</a>
        </article>
      </section>
    </div>
  `;
}
