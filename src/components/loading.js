export function renderLoading(container, text = "推敲起名中... 好名字值得等待") {
  const css = `
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-4xl) 0;
      min-height: 200px;
    }
    .ink-drop {
      width: 40px;
      height: 40px;
      background-color: var(--color-dai);
      border-radius: 50%;
      animation: inkPulse 2.5s infinite ease-in-out;
      opacity: 0.6;
      filter: blur(4px);
      margin-bottom: var(--spacing-lg);
    }
    .loading-text {
      color: var(--color-dai);
      font-size: 1.1rem;
      font-family: var(--font-body);
      animation: fadeInOut 2.5s infinite ease-in-out;
      letter-spacing: 1px;
    }
    @keyframes inkPulse {
      0% { transform: scale(0.8); opacity: 0.4; filter: blur(4px); }
      50% { transform: scale(1.6); opacity: 0.1; filter: blur(6px); }
      100% { transform: scale(0.8); opacity: 0.4; filter: blur(4px); }
    }
    @keyframes fadeInOut {
      0% { opacity: 0.3; }
      50% { opacity: 0.8; }
      100% { opacity: 0.3; }
    }
  `;

  if (!document.getElementById('loading-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'loading-styles';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  container.innerHTML = `
    <div class="loading-container">
      <div class="ink-drop"></div>
      <div class="loading-text">${text}</div>
    </div>
  `;
}
