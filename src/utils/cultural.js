/**
 * 传统文化视角 — 统一计算入口
 * 整合五行、生肖、天干地支、重名率、谐音检测
 */

import { analyzeNameWuxing, wuxingRelation } from '../data/wuxing.js';
import { getLunarInfo } from '../data/lunar-dates.js';
import { analyzeZodiacMatch } from '../data/zodiac.js';
import { detectHomophones } from '../data/homophones.js';
import { estimateNameFrequency } from '../data/surnames.js';

const BIRTHDAY_KEY = 'wenming_birthday';

/**
 * 保存生日到 localStorage（跨页面共享）
 * @param {string} dateStr - 'YYYY-MM-DD' 格式
 */
export function saveBirthday(dateStr) {
  if (dateStr) {
    localStorage.setItem(BIRTHDAY_KEY, dateStr);
  } else {
    localStorage.removeItem(BIRTHDAY_KEY);
  }
}

/**
 * 读取已保存的生日
 * @returns {string|null}
 */
export function getSavedBirthday() {
  return localStorage.getItem(BIRTHDAY_KEY) || null;
}

/**
 * 生成完整的文化分析数据
 * 所有计算均在前端完成，不依赖 LLM
 *
 * @param {string} fullName - 完整姓名（如 "张梓涵"）
 * @param {string} surname - 姓（如 "张"）
 * @param {string|null} birthday - 'YYYY-MM-DD' 格式，可选
 * @returns {object} 文化分析结果
 */
export function analyzeCultural(fullName, surname, birthday) {
  const givenName = fullName.replace(surname, '');

  // 1. 五行分析
  const wuxingResult = analyzeNameWuxing(givenName);
  const wuxingRelations = [];
  if (wuxingResult.length === 2) {
    const rel = wuxingRelation(wuxingResult[0].element, wuxingResult[1].element);
    if (rel) {
      wuxingRelations.push({
        pair: `${wuxingResult[0].char}(${wuxingResult[0].element}) — ${wuxingResult[1].char}(${wuxingResult[1].element})`,
        relation: rel,
      });
    }
  }

  // 2. 天干地支 + 生肖（需要生日）
  let lunarInfo = null;
  let zodiacMatch = null;
  if (birthday) {
    lunarInfo = getLunarInfo(birthday);
    if (lunarInfo) {
      zodiacMatch = analyzeZodiacMatch(lunarInfo.zodiac);
    }
  }

  // 3. 重名率估算
  const frequency = estimateNameFrequency(surname, givenName);

  // 4. 谐音检测
  const homophones = detectHomophones(fullName, surname);

  return {
    wuxing: {
      chars: wuxingResult,
      relations: wuxingRelations,
    },
    lunar: lunarInfo,
    zodiac: zodiacMatch,
    frequency,
    homophones,
    hasBirthday: !!birthday,
  };
}

/**
 * 生成天干地支即时反馈文本（用于生日输入旁边的提示）
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {string|null} 如 "甲辰年 · 属龙"
 */
export function getInstantTianganDizhi(dateStr) {
  const info = getLunarInfo(dateStr);
  if (!info) return null;
  return `${info.tianganDizhi}年 · 属${info.zodiac}`;
}
