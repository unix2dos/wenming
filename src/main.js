import './styles/variables.css';
import './styles/base.css';
import { renderLanding } from './pages/landing.js';
import { renderScoring } from './pages/scoring.js';
import { renderGeneration } from './pages/generation.js';
import { renderCollection } from './pages/collection.js';
import { renderTest } from './pages/quiz-page.js';
import { renderShare } from './pages/share.js';
import { renderCompareReport } from './pages/compare-report.js';

const app = document.getElementById('app');

function router() {
  const hash = window.location.hash || '#/';
  const route = hash.split('?')[0] || '#/';
  app.innerHTML = ''; // Basic clear

  if (route === '#/') {
    renderLanding(app);
  } else if (route === '#/score') {
    renderScoring(app);
  } else if (route === '#/generate') {
    renderGeneration(app);
  } else if (route === '#/collection') {
    renderCollection(app);
  } else if (route === '#/test') {
    renderTest(app);
  } else if (route === '#/share') {
    renderShare(app);
  } else if (route === '#/compare-report') {
    renderCompareReport(app);
  } else {
    // 404 fallback to landing
    window.location.hash = '#/';
  }
}

// Listen to hash changes
window.addEventListener('hashchange', router);

// Initialize routing
document.addEventListener('DOMContentLoaded', router);
