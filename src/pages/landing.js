import '../styles/landing.css';

export function renderLanding(container) {
  container.innerHTML = `
    <div class="landing-page">
      <div class="hero">
        <h1 class="title">问名</h1>
        <p class="slogan">大雅大俗，新文人起名</p>
      </div>
      
      <div class="entry-cards">
        <a href="javascript:void(0)" onclick="alert('给宝宝取名 - 功能即将上线')" class="entry-card" style="opacity: 0.7;">
          <h3>给宝宝取名</h3>
          <p>输入姓氏偏好，推敲 8 个好名字（开发中）</p>
        </a>
        <a href="#/score" class="entry-card">
          <h3>看看名字好不好</h3>
          <p>输入已有名字，获取新文人 5 维专属打分</p>
        </a>
      </div>

      <div class="footer-names">
        <span>林半亩</span>
        <span>沈田野</span>
        <span>杨见山</span>
        <span>汪大川</span>
        <span>陈修远</span>
      </div>
    </div>
  `;
}
