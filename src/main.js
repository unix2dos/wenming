import './styles/variables.css';
import './styles/base.css';
import { renderLanding } from './pages/landing.js';
import { renderScoring } from './pages/scoring.js';
import { renderGeneration } from './pages/generation.js';
import { renderCollection } from './pages/collection.js';

const app = document.getElementById('app');

function router() {
  const hash = window.location.hash;
  app.innerHTML = ''; // Basic clear

  if (hash === '' || hash === '#/') {
    renderLanding(app);
  } else if (hash === '#/score') {
    renderScoring(app);
  } else if (hash === '#/generate') {
    renderGeneration(app);
  } else if (hash === '#/collection') {
    renderCollection(app);
  } else {
    // 404 fallback to landing
    window.location.hash = '#/';
  }
}

// Listen to hash changes
window.addEventListener('hashchange', router);

// Initialize routing
document.addEventListener('DOMContentLoaded', router);
