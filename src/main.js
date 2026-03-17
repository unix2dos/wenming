import './styles/variables.css';
import './styles/base.css';

const app = document.getElementById('app');

function router() {
  const hash = window.location.hash;
  app.innerHTML = ''; // Basic clear

  if (hash === '' || hash === '#/') {
    app.innerHTML = '<h1>问名 - Landing</h1>';
  } else if (hash === '#/score') {
    app.innerHTML = '<h1>问名 - Scoring</h1>';
  } else {
    // 404 fallback to landing
    window.location.hash = '#/';
  }
}

// Listen to hash changes
window.addEventListener('hashchange', router);

// Initialize routing
document.addEventListener('DOMContentLoaded', router);
