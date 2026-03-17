import '../styles/landing.css';

export function renderLanding(container) {
  const previewNames = [
    {
      name: '林见山',
      routeClass: 'da-ya',
      routeLabel: '大雅',
      note: '留白很大，安静但不软弱，适合气质清朗的家庭。'
    },
    {
      name: '林春生',
      routeClass: 'da-su',
      routeLabel: '大俗',
      note: '有泥土感和生命力，不网红，但很耐看。'
    },
    {
      name: '林半亩',
      routeClass: 'da-ya',
      routeLabel: '打分样例',
      note: '输入已有名字，也能得到五维判断、收藏、对比与导出。'
    }
  ];

  container.innerHTML = `
    <div class="landing-page">
      <section class="hero">
        <div class="hero-copy">
          <p class="hero-kicker">问名</p>
          <h1 class="title">不靠玄学，给宝宝起一个经得住时间的名字。</h1>
          <p class="hero-summary">
            用常用字做审美判断，不堆典、不生僻，帮你从气质、音韵、字形和实用性里挑出真正值得留下的名字。
          </p>
          <div class="value-pills">
            <span>不用生僻字</span>
            <span>不走八字玄学</span>
            <span>重审美判断</span>
          </div>
          <div class="hero-actions">
            <a href="#/generate" class="btn hero-btn hero-btn-primary">给宝宝取名</a>
            <a href="#/score" class="btn hero-btn hero-btn-secondary">看看名字好不好</a>
          </div>
        </div>
      </section>

      <section class="preview-section">
        <div class="section-heading">
          <h2>结果不会只说“都很好”。</h2>
          <p>你会直接看到哪些名字值得留下，哪些名字有风格但更挑人。</p>
        </div>

        <div class="preview-grid">
          ${previewNames.map((item) => `
            <article class="preview-card">
              <div class="preview-card-top">
                <div class="preview-name">${item.name}</div>
                <span class="pill ${item.routeClass}">${item.routeLabel}</span>
              </div>
              <p class="preview-note">${item.note}</p>
            </article>
          `).join('')}
        </div>
      </section>

      <section class="support-bar">
        <p>可收藏候选名，可横向对比，也可导出结果给家人一起讨论。</p>
      </section>

      <div class="footer-names" aria-hidden="true">
        <span>见山</span>
        <span>修远</span>
        <span>田野</span>
        <span>春生</span>
        <span>听泉</span>
      </div>
    </div>
  `;
}
