/**
 * 生日选择器 — 年/月/日 三联下拉
 * 适合宝宝起名场景：年份范围窄，选择直觉
 */

import { getSavedBirthday, saveBirthday, getInstantTianganDizhi } from '../utils/cultural.js';

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = CURRENT_YEAR - 50;
const MAX_YEAR = CURRENT_YEAR + 1; // 允许预产期

function daysInMonth(year, month) {
  if (!year || !month) return 31;
  return new Date(year, month, 0).getDate();
}

function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * 渲染生日选择器 HTML
 * @param {string} idPrefix - ID 前缀，避免页面内冲突（如 'score' / 'gen'）
 * @returns {string} HTML
 */
export function renderBirthdayPicker(idPrefix) {
  const saved = getSavedBirthday();
  let savedYear = '', savedMonth = '', savedDay = '';
  if (saved) {
    const parts = saved.split('-');
    savedYear = parts[0] || '';
    savedMonth = String(Number(parts[1])) || '';
    savedDay = String(Number(parts[2])) || '';
  }

  // 年份选项（倒序，最近的年份在前）
  const yearOptions = [`<option value="">年</option>`];
  for (let y = MAX_YEAR; y >= MIN_YEAR; y--) {
    const sel = String(y) === savedYear ? ' selected' : '';
    yearOptions.push(`<option value="${y}"${sel}>${y}年</option>`);
  }

  // 月份选项
  const monthOptions = [`<option value="">月</option>`];
  for (let m = 1; m <= 12; m++) {
    const sel = String(m) === savedMonth ? ' selected' : '';
    monthOptions.push(`<option value="${m}"${sel}>${m}月</option>`);
  }

  // 日选项（初始根据已选年月）
  const maxDay = (savedYear && savedMonth) ? daysInMonth(Number(savedYear), Number(savedMonth)) : 31;
  const dayOptions = [`<option value="">日</option>`];
  for (let d = 1; d <= maxDay; d++) {
    const sel = String(d) === savedDay ? ' selected' : '';
    dayOptions.push(`<option value="${d}"${sel}>${d}日</option>`);
  }

  const feedback = saved ? (getInstantTianganDizhi(saved) || '') : '';

  return `
    <div class="birthday-picker" id="${idPrefix}-birthday-picker">
      <label class="birthday-picker__label">
        宝宝生日 <span class="optional">(选填，用于生肖分析)</span>
      </label>
      <div class="birthday-picker__selects">
        <select class="birthday-picker__select" id="${idPrefix}-bd-year" aria-label="出生年份">
          ${yearOptions.join('')}
        </select>
        <select class="birthday-picker__select" id="${idPrefix}-bd-month" aria-label="出生月份">
          ${monthOptions.join('')}
        </select>
        <select class="birthday-picker__select" id="${idPrefix}-bd-day" aria-label="出生日期">
          ${dayOptions.join('')}
        </select>
      </div>
      <div class="birthday-feedback" id="${idPrefix}-birthday-feedback">${feedback}</div>
    </div>
  `;
}

/**
 * 绑定生日选择器事件
 * @param {string} idPrefix
 */
export function bindBirthdayPicker(idPrefix) {
  const yearEl = document.getElementById(`${idPrefix}-bd-year`);
  const monthEl = document.getElementById(`${idPrefix}-bd-month`);
  const dayEl = document.getElementById(`${idPrefix}-bd-day`);
  const feedbackEl = document.getElementById(`${idPrefix}-birthday-feedback`);

  if (!yearEl || !monthEl || !dayEl) return;

  function updateDayOptions() {
    const year = Number(yearEl.value);
    const month = Number(monthEl.value);
    const currentDay = Number(dayEl.value);
    const max = daysInMonth(year, month);

    // 保留当前选中日，只调整范围
    dayEl.innerHTML = `<option value="">日</option>`;
    for (let d = 1; d <= max; d++) {
      const sel = d === currentDay ? ' selected' : '';
      dayEl.innerHTML += `<option value="${d}"${sel}>${d}日</option>`;
    }
  }

  function syncValue() {
    const y = yearEl.value;
    const m = monthEl.value;
    const d = dayEl.value;

    if (y && m && d) {
      const dateStr = `${y}-${pad(Number(m))}-${pad(Number(d))}`;
      saveBirthday(dateStr);
      feedbackEl.textContent = getInstantTianganDizhi(dateStr) || '';
    } else {
      if (!y && !m && !d) {
        saveBirthday(null);
      }
      feedbackEl.textContent = '';
    }
  }

  yearEl.addEventListener('change', () => { updateDayOptions(); syncValue(); });
  monthEl.addEventListener('change', () => { updateDayOptions(); syncValue(); });
  dayEl.addEventListener('change', syncValue);
}
