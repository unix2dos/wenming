import '../styles/compare-report.css';
import { renderLoading } from '../components/loading.js';
import { getOrCreateSessionId, trackEvent } from '../utils/analytics.js';
import { exportElementAsPDF } from '../utils/export.js';
import {
  clearPendingCompareNames,
  getPendingCompareNames as defaultGetPendingCompareNames,
} from '../utils/compare-session.js';
import {
  COMPARE_REPORT_POINTS,
  COMPARE_REPORT_PRODUCT_NAME,
  COMPARE_REPORT_UPGRADE_LABEL,
  COMPARE_REPORT_UPGRADE_RESULTS,
} from '../utils/compare-offer-copy.js';

export function parseCompareReportState(hash) {
  const sourceHash = typeof hash === 'string'
    ? hash
    : (typeof window !== 'undefined' ? window.location.hash : '#/compare-report');
  const queryIndex = sourceHash.indexOf('?');
  const rawQuery = queryIndex >= 0 ? sourceHash.slice(queryIndex + 1) : '';
  const params = new URLSearchParams(rawQuery);

  return {
    reportId: params.get('report_id'),
    paid: params.get('paid') === '1',
  };
}

function resolveAppOrigin(appOrigin) {
  if (typeof appOrigin === 'string' && appOrigin.trim().length > 0) {
    return appOrigin.trim().replace(/\/$/, '');
  }

  if (typeof window !== 'undefined' && typeof window.location?.origin === 'string') {
    return window.location.origin;
  }

  return 'https://wenming.local';
}

export function buildCompareSharePayload(report, options = {}) {
  const recommendation = report?.recommendation || {};
  const chosenName = recommendation.chosen_name || '这个名字';
  const stage = report?.stage === 'full' ? 'full' : 'summary';
  const appOrigin = resolveAppOrigin(options.appOrigin);
  const url = `${appOrigin}/#/compare-report?report_id=${encodeURIComponent(report?.reportId || '')}`;
  const summaryLine = stage === 'summary'
    ? recommendation.headline || recommendation.summary || `我当前更偏向「${chosenName}」。`
    : `我在问名做了一轮候选比较，当前更偏向「${chosenName}」。`;

  return {
    title: '问名候选比较',
    text: `我当前更偏向「${chosenName}」。${summaryLine}`,
    url,
  };
}

export function buildPartnerShareText(report, options = {}) {
  const payload = buildCompareSharePayload(report, options);
  const chosenName = report?.recommendation?.chosen_name || '这个名字';

  return [
    `我这轮更偏向「${chosenName}」。`,
    '你也看看这份比较摘要，适合我们先快速对齐一轮。',
    payload.url,
  ].join('\n');
}

async function handleShareCompareReport(report, options = {}) {
  const payload = buildCompareSharePayload(report, options);
  const trackEventImpl = options.trackEventImpl || trackEvent;

  await trackEventImpl('share_clicked', {
    page: 'compare-report',
    reportId: report?.reportId || null,
    payload: {
      stage: report?.stage || 'summary',
      target: 'compare-report-card',
    },
  });

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      await navigator.share(payload);
      return true;
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${payload.title}\n${payload.text}\n${payload.url}`);
      window.alert('结果卡链接已复制，可以直接发给家人或朋友。');
      return true;
    }

    window.alert('当前环境不支持自动分享，请复制地址栏链接。');
    return false;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return false;
    }

    window.alert(error instanceof Error ? error.message : '分享失败，请稍后再试。');
    return false;
  }
}

async function handleCopyPartnerMessage(report, options = {}) {
  const trackEventImpl = options.trackEventImpl || trackEvent;
  const text = buildPartnerShareText(report, options);

  await trackEventImpl('partner_copy_clicked', {
    page: 'compare-report',
    reportId: report?.reportId || null,
    payload: {
      stage: report?.stage || 'summary',
      target: 'partner-copy',
    },
  });

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      window.alert('给伴侣的话术已复制，可以直接发出去。');
      return true;
    }

    window.alert('当前环境不支持自动复制，请手动复制页面链接。');
    return false;
  } catch (error) {
    window.alert(error instanceof Error ? error.message : '复制失败，请稍后再试。');
    return false;
  }
}

function updateShareableRoute(reportId) {
  if (!reportId || typeof window === 'undefined' || !window.history?.replaceState) {
    return;
  }

  const nextHash = `#/compare-report?report_id=${encodeURIComponent(reportId)}`;
  window.history.replaceState(null, '', nextHash);
}

function renderEmptyState(container) {
  container.innerHTML = `
    <div class="compare-report-page">
      <div class="compare-report-topbar">
        <a href="#/collection" class="text-link">返回收藏列表</a>
      </div>

      <div class="compare-report-shell">
        <section class="compare-report-card compare-report-empty">
          <h1>先去挑 2 到 3 个名字</h1>
          <p>从收藏列表里勾选几组候选名，再回来做横向比较。</p>
          <a href="#/collection" class="btn">去选名字</a>
        </section>
      </div>
    </div>
  `;
}

function renderLoadingState(container) {
  container.innerHTML = `
    <div class="compare-report-page">
      <div class="compare-report-topbar">
        <a href="#/collection" class="text-link">返回收藏列表</a>
      </div>
      <div id="compare-report-loading"></div>
    </div>
  `;

  if (typeof document !== 'undefined') {
    renderLoading(document.getElementById('compare-report-loading'), '正在比对这些名字的风骨与成立度…');
  }
}

function renderErrorState(container, message) {
  container.innerHTML = `
    <div class="compare-report-page">
      <div class="compare-report-topbar">
        <a href="#/collection" class="text-link">返回收藏列表</a>
      </div>

      <div class="compare-report-shell">
        <section class="compare-report-card compare-report-empty">
          <h1>比较失败</h1>
          <p>${message}</p>
          <button id="retry-compare-report" class="btn">再试一次</button>
        </section>
      </div>
    </div>
  `;
}

function renderSummaryState(container, report, selectedNames, options = {}) {
  const recommendation = report.summary?.recommendation || {};
  const cards = Array.isArray(report.summary?.cards) ? report.summary.cards : [];
  const upgradeTeaser = report.summary?.upgrade_teaser || '解锁完整横向排序、推荐结论与传统维度补充。';
  const isSharedLanding = Boolean(options.isSharedLanding);
  const trackEventImpl = options.trackEventImpl || trackEvent;
  const partnerSharePreview = isSharedLanding
    ? buildPartnerShareText({
      reportId: report.reportId,
      stage: 'summary',
      recommendation,
    }, {
      appOrigin: options.appOrigin,
    }).replaceAll('\n', '<br>')
    : '';

  container.innerHTML = `
    <div class="compare-report-page${isSharedLanding ? ' compare-report-page-share-mode' : ''}">
      <div class="compare-report-topbar">
        <a href="#/collection" class="text-link">返回收藏列表</a>
      </div>

      <div class="compare-report-shell">
        <div class="compare-report-toolbar no-export">
          <button id="compare-report-share-btn" class="btn btn-secondary">分享结果卡</button>
          ${isSharedLanding ? '<button id="compare-report-copy-btn" class="btn btn-secondary">复制给伴侣的话术</button>' : ''}
        </div>

        <section class="compare-report-card compare-report-hero">
          <p class="compare-report-kicker">比较摘要</p>
          <div class="compare-report-cover-band">
            <span>第一候选</span>
            <span>适合截图转发</span>
          </div>
          <h1>${recommendation.headline || '这组名字已经拉开差距了。'}</h1>
          <p class="compare-report-summary">${recommendation.summary || ''}</p>
          ${isSharedLanding ? '<p class="compare-report-share-hint">截图这一屏，或者复制下方话术发给伴侣，先把这一轮判断对齐。</p>' : ''}
          <div class="compare-report-cover-name">${recommendation.chosen_name || '待补充'}</div>
          <div class="compare-report-chip-row">
            ${selectedNames.map((item) => `<span class="sample-chip">${item.full_name}</span>`).join('')}
          </div>
        </section>

        <section class="compare-report-card">
          <p class="compare-report-kicker">当前判断</p>
          <h2>当前更推荐</h2>
          <p class="compare-report-recommendation-copy">这组候选里，目前更偏向：</p>
          <div class="compare-report-recommendation">${recommendation.chosen_name || '待补充'}</div>
        </section>

        ${isSharedLanding ? `
          <section class="compare-report-card compare-report-share-entry">
            <h2>我也想做一轮比较</h2>
            <p>适合截图转发给伴侣或家人，也适合你自己顺手留作这一轮的候选结论。</p>
            <p>看完这组结果后，你也可以先测方向，再把自己的 2 到 3 个候选名拉进来做完整比较。</p>
            <div class="compare-report-partner-copy-card">
              <div class="compare-report-mini-label">可以直接发给伴侣</div>
              <p>${partnerSharePreview}</p>
            </div>
            <a href="#/test" id="shared-report-cta" class="btn btn-secondary">让伴侣也测一下</a>
          </section>
        ` : ''}

        <section class="compare-report-grid">
          ${cards.map((card) => `
            <article class="compare-report-card compare-report-name-card">
              <h3>${card.full_name}</h3>
              <p class="compare-report-verdict">${card.verdict}</p>
              <p class="compare-report-note">${card.literary_note}</p>
              <p class="compare-report-risk">${card.risk_note}</p>
            </article>
          `).join('')}
        </section>

        <section class="compare-report-card compare-report-upgrade">
          <div class="compare-report-upgrade-head">
            <div class="compare-report-upgrade-intro">
              <p class="compare-report-kicker">限免开放</p>
              <h2>${COMPARE_REPORT_PRODUCT_NAME}</h2>
              <p class="compare-report-upgrade-context">完整报告包含横向排序、推荐结论与逐名拆解，现在可以直接查看。</p>
            </div>
          </div>
          <div class="compare-report-upgrade-list">
            ${COMPARE_REPORT_POINTS.map((point) => `<span>${point}</span>`).join('')}
          </div>
          <button id="upgrade-compare-report" class="btn">查看完整报告</button>
        </section>
      </div>
    </div>
  `;

  if (typeof document === 'undefined') {
    return;
  }

  document.getElementById('compare-report-share-btn')?.addEventListener('click', async () => {
    await handleShareCompareReport({
      reportId: report.reportId,
      stage: 'summary',
      recommendation,
    }, {
      trackEventImpl,
      appOrigin: options.appOrigin,
    });
  });

  document.getElementById('compare-report-copy-btn')?.addEventListener('click', async () => {
    await handleCopyPartnerMessage({
      reportId: report.reportId,
      stage: 'summary',
      recommendation,
    }, {
      trackEventImpl,
      appOrigin: options.appOrigin,
    });
  });

  document.getElementById('shared-report-cta')?.addEventListener('click', async () => {
    await trackEventImpl('shared_report_cta_clicked', {
      page: 'compare-report',
      reportId: report.reportId,
      payload: {
        target: 'test',
        entry: 'shared-link',
      },
    });
  });

  document.getElementById('upgrade-compare-report')?.addEventListener('click', async () => {
    await trackEventImpl('upgrade_clicked', {
      page: 'compare-report',
      reportId: report.reportId,
      payload: {
        selectedCount: selectedNames.length,
        stage: 'summary',
      },
    });

    window.location.hash = `#/compare-report?report_id=${encodeURIComponent(report.reportId)}&paid=1`;
    window.location.reload();
  });
}

function renderFullState(container, reportId, fullReport, options = {}) {
  const recommendation = fullReport?.recommendation || {};
  const ranking = Array.isArray(fullReport?.ranking) ? fullReport.ranking : [];
  const deepAnalysis = Array.isArray(fullReport?.deep_analysis) ? fullReport.deep_analysis : [];
  const trackEventImpl = options.trackEventImpl || trackEvent;

  container.innerHTML = `
    <div class="compare-report-page">
      <div class="compare-report-topbar">
        <a href="#/collection" class="text-link">返回收藏列表</a>
      </div>

      <div class="compare-report-shell" id="compare-report-export-area">
        <div class="compare-report-toolbar no-export">
          <button id="compare-report-share-btn" class="btn btn-secondary">分享结果卡</button>
          <button id="compare-report-export-btn" class="btn btn-secondary">导出完整报告</button>
        </div>

        <section class="compare-report-card compare-report-hero">
          <p class="compare-report-kicker">${COMPARE_REPORT_PRODUCT_NAME}</p>
          <div class="compare-report-cover-band">
            <span>No.1 推荐</span>
            <span>付费交付物</span>
          </div>
          <h1>${recommendation.chosen_name || '完整报告'}</h1>
          <p class="compare-report-recommendation-copy">这份报告适合拿给家人讨论，先看结论，再看逐名拆解。</p>
          <div class="compare-report-section-label">总推荐结论</div>
          <p class="compare-report-summary">${recommendation.conclusion || ''}</p>
        </section>

        <section class="compare-report-card compare-report-ranking-card">
          <h2>推荐排序</h2>
          <div class="compare-report-ranking-list">
            ${ranking.map((item) => `
              <div class="compare-report-ranking-item">
                <strong>No.${item.rank} ${item.full_name}</strong>
                <p>排序理由：${item.reason}</p>
              </div>
            `).join('')}
          </div>
        </section>

        <section class="compare-report-analysis-shell">
          <div class="compare-report-section-heading">
            <h2>逐名拆解</h2>
            <p>把每个名字为什么成立、哪里需要留意，拆给你看。</p>
          </div>

          <section class="compare-report-grid">
          ${deepAnalysis.map((item) => `
            <article class="compare-report-card compare-report-name-card">
              <h3>${item.full_name}</h3>
              <div class="compare-report-mini-label">为什么成立</div>
              <p class="compare-report-note">${item.why_it_works}</p>
              <div class="compare-report-mini-label">文学与意境</div>
              <p class="compare-report-note">${item.literary_note}</p>
              <div class="compare-report-mini-label">实用判断</div>
              <p class="compare-report-note">${item.practical_note}</p>
              <div class="compare-report-mini-label">传统维度补充</div>
              <p class="compare-report-risk">${item.traditional_note}</p>
            </article>
          `).join('')}
          </section>
        </section>
      </div>
    </div>
  `;

  if (typeof window !== 'undefined') {
    void trackEventImpl('full_report_opened', {
      page: 'compare-report',
      reportId,
      payload: {
        rankingCount: ranking.length,
      },
    });
  }

  if (typeof document === 'undefined') {
    return;
  }

  document.getElementById('compare-report-share-btn')?.addEventListener('click', async () => {
    await handleShareCompareReport({
      reportId,
      stage: 'full',
      recommendation,
    }, {
      trackEventImpl,
      appOrigin: options.appOrigin,
    });
  });

  document.getElementById('compare-report-export-btn')?.addEventListener('click', async () => {
    const exportBtn = document.getElementById('compare-report-export-btn');
    if (!exportBtn) {
      return;
    }

    exportBtn.textContent = '生成中...';
    exportBtn.disabled = true;

    try {
      await exportElementAsPDF(
        'compare-report-export-area',
        `${recommendation.chosen_name || '问名'}_完整比较报告.pdf`,
      );

      await trackEventImpl('full_report_exported', {
        page: 'compare-report',
        reportId,
        payload: {
          chosenName: recommendation.chosen_name || '',
        },
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '导出失败');
    } finally {
      exportBtn.textContent = '导出完整报告';
      exportBtn.disabled = false;
    }
  });
}

export function renderCompareReport(container, dependencies = {}) {
  const getPendingCompareNames = dependencies.getPendingCompareNames || defaultGetPendingCompareNames;
  const fetchImpl = dependencies.fetchImpl || globalThis.fetch?.bind(globalThis);
  const trackEventImpl = dependencies.trackEventImpl || trackEvent;
  const routeState = parseCompareReportState(dependencies.hash);
  const selectedNames = getPendingCompareNames();

  if (routeState.reportId && routeState.paid) {
    renderLoadingState(container);

    if (!fetchImpl) {
      renderErrorState(container, '当前环境不支持完整报告请求。');
      return Promise.resolve();
    }

    return fetchImpl(`/api/report/full?report_id=${encodeURIComponent(routeState.reportId)}`, {
      method: 'GET',
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.error || '完整报告获取失败。');
        }
        return response.json();
      })
      .then((body) => {
        renderFullState(container, body.reportId, body.fullReport, {
          trackEventImpl,
          appOrigin: dependencies.appOrigin,
        });
      })
      .catch((error) => {
        renderErrorState(container, error instanceof Error ? error.message : '完整报告获取失败。');
      });
  }

  if (routeState.reportId) {
    renderLoadingState(container);

    if (!fetchImpl) {
      renderErrorState(container, '当前环境不支持比较请求。');
      return Promise.resolve();
    }

    return fetchImpl(`/api/report/summary?report_id=${encodeURIComponent(routeState.reportId)}`, {
      method: 'GET',
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.error || '比较摘要获取失败。');
        }
        return response.json();
      })
      .then((body) => {
        void trackEventImpl('summary_report_opened', {
          page: 'compare-report',
          reportId: body.reportId,
          payload: {
            entry: 'shared-link',
            selectedCount: Array.isArray(body.selectedNames) ? body.selectedNames.length : 0,
          },
        });

        renderSummaryState(container, body, Array.isArray(body.selectedNames) ? body.selectedNames : [], {
          isSharedLanding: true,
          trackEventImpl,
          appOrigin: dependencies.appOrigin,
        });
      })
      .catch((error) => {
        renderErrorState(container, error instanceof Error ? error.message : '比较摘要获取失败。');
      });
  }

  if (selectedNames.length < 2) {
    renderEmptyState(container);
    return Promise.resolve();
  }

  renderLoadingState(container);

  if (!fetchImpl) {
    renderErrorState(container, '当前环境不支持比较请求。');
    return Promise.resolve();
  }

  const sessionId = getOrCreateSessionId();

  return fetchImpl('/api/report/summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-wenming-session-id': sessionId,
    },
    body: JSON.stringify({
      sessionId,
      selectedNames,
      sourceType: 'collection',
    }),
  })
    .then(async (response) => {
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || '比较摘要生成失败。');
      }
      return response.json();
    })
    .then((report) => {
      clearPendingCompareNames();
      updateShareableRoute(report.reportId);
      renderSummaryState(container, report, selectedNames, {
        trackEventImpl,
        appOrigin: dependencies.appOrigin,
      });
    })
    .catch((error) => {
      renderErrorState(container, error instanceof Error ? error.message : '比较摘要生成失败。');
      if (typeof document !== 'undefined') {
        document.getElementById('retry-compare-report')?.addEventListener('click', () => {
          void renderCompareReport(container, dependencies);
        });
      }
    });
}
