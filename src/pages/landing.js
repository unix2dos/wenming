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
          <p class="hero-kicker">问名 · 去玄学化的中文起名工具</p>
          <h1 class="title">不算命，不堆典，给宝宝一个经得住时间的名字。</h1>
          <p class="hero-summary">
            用常用字做高级组合，按「大雅 / 大俗」两条审美路线，帮你从好听、好写、耐看、实用四个层面做判断。
          </p>
          <div class="value-pills">
            <span>不用生僻字</span>
            <span>不走玄学</span>
            <span>重审美判断</span>
          </div>
        </div>
        <div class="hero-proof">
          <div class="proof-card">
            <div class="proof-eyebrow">你最终会得到什么</div>
            <ul class="proof-list">
              <li>一次生成 8 个候选名</li>
              <li>每个名字都有路线、分数与保留理由</li>
              <li>可收藏、横向对比、导出卷宗给家人讨论</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="entry-section">
        <p class="slogan">不是算八字，而是帮你做名字审美判断。</p>
        <div class="entry-cards">
          <a href="#/generate" class="entry-card entry-card-primary">
            <div class="entry-card-tag">主入口</div>
            <h3>给宝宝取名</h3>
            <p>先用姓氏快速试一轮，再按气质、避讳字和偏好细调候选名。</p>
          </a>
          <a href="#/score" class="entry-card">
            <div class="entry-card-tag">辅助入口</div>
            <h3>看看名字好不好</h3>
            <p>输入已有名字，拿到五维打分、路线判断和是否值得保留的结论。</p>
          </a>
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

      <section class="support-section">
        <div class="support-item">
          <strong>生成</strong>
          <span>先看 8 个名字的整体气质和取舍空间。</span>
        </div>
        <div class="support-item">
          <strong>收藏对比</strong>
          <span>把心动候选名收进藏书阁，横向比较再做决定。</span>
        </div>
        <div class="support-item">
          <strong>导出讨论</strong>
          <span>把结果整理成卷宗，直接发给家人讨论。</span>
        </div>
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
