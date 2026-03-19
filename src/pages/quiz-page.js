import '../styles/test.css';
import {
  buildHashRoute,
  calculateQuizResult,
  encodeShareState,
  quizQuestions,
} from '../utils/direction-quiz.js';
import { trackEvent } from '../utils/analytics.js';

function buildShareUrl(result) {
  const query = encodeShareState({
    profileId: result.profile.id,
    acceptanceId: result.acceptance.id,
  });
  return `${window.location.origin}${window.location.pathname}#/share?${query}`;
}

async function shareResult(result) {
  const url = buildShareUrl(result);
  const title = `我们家起名更偏${result.profile.camp} · ${result.profile.type}`;
  const text = `${result.profile.summary} ${result.profile.names.join(' / ')}`;

  if (window.isSecureContext && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return '分享链接已复制，发给伴侣看看。';
  }

  if (navigator.share) {
    await navigator.share({ title, text, url });
    return '已调用系统分享面板。';
  }

  window.prompt('复制这个链接发给伴侣：', url);
  return '已打开复制链接窗口。';
}

export function renderTest(container) {
  const state = {
    currentIndex: 0,
    answers: [],
    result: null,
  };

  function renderQuestion() {
    const question = quizQuestions[state.currentIndex];
    const progress = ((state.currentIndex + 1) / quizQuestions.length) * 100;

    container.innerHTML = `
      <div class="test-page">
        <div class="test-topbar">
          <a href="#/" class="text-link">返回首页</a>
          <span class="test-progress-copy">${state.currentIndex + 1} / ${quizQuestions.length}</span>
        </div>

        <div class="test-shell">
          <div class="test-progress-track">
            <div class="test-progress-fill" style="width: ${progress}%;"></div>
          </div>

          <div class="test-card">
            <p class="test-kicker">不用生辰八字，先找命名方向</p>
            <h1 class="test-question">${question.prompt}</h1>

            <div class="test-options">
              ${question.options.map((option) => `
                <button type="button" class="test-option" data-option="${option.id}">
                  <span class="test-option-key">${option.id.toUpperCase()}</span>
                  <span class="test-option-copy">${option.label}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('.test-option').forEach((button) => {
      button.addEventListener('click', () => {
        state.answers[state.currentIndex] = button.dataset.option;

        if (state.currentIndex === quizQuestions.length - 1) {
          state.result = calculateQuizResult(state.answers);
          void trackEvent('quiz_completed', {
            page: 'test-result',
            payload: {
              profileId: state.result.profile.id,
              acceptanceId: state.result.acceptance.id,
            },
          });
          renderResult();
          return;
        }

        state.currentIndex += 1;
        renderQuestion();
      });
    });
  }

  function renderResult() {
    const { profile, acceptance } = state.result;
    const routeClass = profile.camp === '大雅' ? 'da-ya' : 'da-su';
    const generateHref = buildHashRoute('#/generate', {
      profile: profile.id,
      acceptance: acceptance.id,
    });

    container.innerHTML = `
      <div class="test-page">
        <div class="test-topbar">
          <a href="#/" class="text-link">返回首页</a>
          <button type="button" id="restart-quiz" class="btn-text text-link">重新测试</button>
        </div>

        <div class="result-shell">
          <section class="result-hero-card">
            <span class="pill ${routeClass}">偏${profile.camp}</span>
            <h1 class="result-type">${profile.type}</h1>
            <p class="result-summary">${profile.summary}</p>
            <p class="result-description">${profile.description}</p>
            <div class="sample-chip-row">
              ${profile.names.map((name) => `<span class="sample-chip">${name}</span>`).join('')}
            </div>

            <div class="result-actions">
              <button type="button" id="share-result" class="btn">发给伴侣看看</button>
              <a href="${generateHref}" class="btn btn-secondary">按这个方向起名</a>
            </div>
            <p id="share-notice" class="result-notice"></p>
          </section>

          <section class="result-detail-card">
            <h2>为什么是你？</h2>
            <ul class="result-bullet-list">
              ${profile.bullets.map((bullet) => `<li>${bullet}</li>`).join('')}
            </ul>
          </section>

          <section class="result-detail-card">
            <h2>家人接受度</h2>
            <div class="acceptance-row">
              <strong>${acceptance.label}</strong>
              <span>${acceptance.summary}</span>
            </div>
            <p class="family-note">${profile.familyNote}</p>
          </section>

          <section class="result-detail-card">
            <h2>文化底色</h2>
            <p>这一路子的名字更偏 <strong>${profile.culture}</strong>，不是玄学判断，而是更接近你们会长期喜欢的审美方向。</p>
            <a href="#/score" class="text-link result-inline-link">已经有名字了？看看名字好不好</a>
          </section>
        </div>
      </div>
    `;

    document.getElementById('restart-quiz').addEventListener('click', () => {
      state.currentIndex = 0;
      state.answers = [];
      state.result = null;
      renderQuestion();
    });

    document.getElementById('share-result').addEventListener('click', async () => {
      const notice = document.getElementById('share-notice');
      notice.textContent = '正在准备分享链接...';
      void trackEvent('share_clicked', {
        page: 'test-result',
        payload: {
          shareType: 'quiz_result',
          profileId: state.result.profile.id,
        },
      });

      try {
        notice.textContent = await shareResult(state.result);
      } catch (error) {
        if (error?.name === 'AbortError') {
          notice.textContent = '已取消分享。';
          return;
        }
        notice.textContent = '分享失败，请稍后重试。';
      }
    });

    const generateLink = container.querySelector(`a[href="${generateHref}"]`);
    generateLink?.addEventListener('click', () => {
      void trackEvent('quiz_generate_clicked', {
        page: 'test-result',
        payload: {
          profileId: profile.id,
          acceptanceId: acceptance.id,
        },
      });
    });
  }

  renderQuestion();
}
