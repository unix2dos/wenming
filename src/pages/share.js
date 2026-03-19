import '../styles/share.css';
import {
  buildHashRoute,
  decodeShareState,
  getAcceptanceProfile,
  parseHashQuery,
  resultProfiles,
} from '../utils/direction-quiz.js';
import { trackEvent } from '../utils/analytics.js';

export function renderShare(container) {
  const query = parseHashQuery();
  const { profileId, acceptanceId } = decodeShareState(query.toString());
  const profile = resultProfiles[profileId] || resultProfiles.yazheng;
  const acceptance = getAcceptanceProfile(acceptanceId);
  const routeClass = profile.camp === '大雅' ? 'da-ya' : 'da-su';
  const generateHref = buildHashRoute('#/generate', {
    profile: profile.id,
    acceptance: acceptance.id,
  });

  container.innerHTML = `
    <div class="share-page">
      <div class="share-topbar">
        <a href="#/" class="text-link">返回首页</a>
      </div>

      <div class="share-shell">
        <section class="share-hero-card">
          <p class="share-kicker">TA 的结果</p>
          <span class="pill ${routeClass}">偏${profile.camp}</span>
          <h1 class="share-type">${profile.type}</h1>
          <p class="share-summary">${profile.summary}</p>
          <div class="sample-chip-row">
            ${profile.names.map((name) => `<span class="sample-chip">${name}</span>`).join('')}
          </div>
        </section>

        <section class="share-detail-card">
          <h2>你们会是同一路子吗？</h2>
          <p>${profile.description}</p>
          <div class="share-actions">
            <a href="#/test" class="btn">我也测一下</a>
            <a href="${generateHref}" class="btn btn-secondary">按 TA 的方向起名</a>
          </div>
        </section>

        <section class="share-detail-card">
          <h2>这一路子的名字特点</h2>
          <ul class="share-bullet-list">
            ${profile.bullets.map((bullet) => `<li>${bullet}</li>`).join('')}
          </ul>
          <p class="share-acceptance">家人接受度：<strong>${acceptance.label}</strong> · ${profile.familyNote}</p>
        </section>
      </div>
    </div>
  `;

  const testLink = container.querySelector('a[href="#/test"]');
  testLink?.addEventListener('click', () => {
    void trackEvent('share_cta_clicked', {
      page: 'share',
      payload: {
        target: 'test',
        profileId: profile.id,
      },
    });
  });

  const generateLink = container.querySelector(`a[href="${generateHref}"]`);
  generateLink?.addEventListener('click', () => {
    void trackEvent('share_cta_clicked', {
      page: 'share',
      payload: {
        target: 'generate',
        profileId: profile.id,
        acceptanceId: acceptance.id,
      },
    });
  });
}
