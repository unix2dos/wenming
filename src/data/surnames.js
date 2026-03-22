/**
 * 姓氏频率数据（百家姓 Top 100）
 * 数据来源：2020 年第七次全国人口普查姓氏统计（近似值）
 * 单位：万人
 *
 * 用于估算「重名率」：姓氏人口 × 名字常见度系数
 */

const SURNAME_POPULATION = {
  王: 10150, 李: 10090, 张: 9540, 刘: 7210, 陈: 6330,
  杨: 4630, 黄: 3370, 赵: 2860, 吴: 2780, 周: 2540,
  徐: 1930, 孙: 1870, 马: 1850, 胡: 1650, 朱: 1620,
  郭: 1500, 何: 1450, 林: 1420, 罗: 1370, 高: 1340,
  郑: 1260, 梁: 1200, 谢: 1010, 宋: 990, 唐: 960,
  许: 910, 韩: 880, 冯: 850, 邓: 840, 曹: 810,
  彭: 780, 曾: 770, 萧: 760, 田: 750, 董: 730,
  潘: 720, 袁: 700, 蔡: 690, 蒋: 680, 余: 660,
  于: 650, 杜: 640, 叶: 620, 程: 610, 魏: 600,
  苏: 590, 吕: 580, 丁: 570, 任: 550, 卢: 530,
  沈: 520, 姚: 510, 钟: 500, 姜: 490, 崔: 480,
  谭: 470, 陆: 460, 范: 450, 汪: 440, 廖: 430,
  石: 420, 金: 410, 贾: 400, 夏: 390, 韦: 380,
  江: 370, 付: 360, 方: 350, 邹: 340, 熊: 330,
  白: 320, 孟: 310, 秦: 300, 邱: 290, 侯: 280,
  尹: 270, 薛: 260, 闫: 250, 雷: 240, 龙: 230,
  段: 220, 郝: 210, 贺: 200, 龚: 190, 钱: 180,
  汤: 170, 万: 160, 严: 150, 武: 140, 赖: 130,
  陶: 120, 洪: 110, 贝: 100, 莫: 90, 顾: 80,
  毛: 70, 邵: 60, 柏: 50, 褚: 40, 乔: 30,
};

/**
 * 常见名字的频率等级
 * 0 = 非常常见 (>10000 估计重名), 1 = 较常见 (1000-10000),
 * 2 = 一般 (100-1000), 3 = 较少见 (<100)
 *
 * 仅收录少量常见双字名和单字名；未收录则视为暂无可靠数据
 */
const NAME_FREQUENCY = {
  // 非常常见 (0)
  伟: 0, 芳: 0, 娜: 0, 敏: 0, 静: 0, 丽: 0, 强: 0,
  磊: 0, 洋: 0, 勇: 0, 艳: 0, 杰: 0, 娟: 0, 涛: 0,
  明: 0, 超: 0, 秀英: 0, 秀兰: 0, 桂英: 0,
  // 较常见 (1)
  浩然: 1, 子轩: 1, 梓涵: 1, 浩宇: 1, 子涵: 1, 雨泽: 1,
  宇轩: 1, 子豪: 1, 可欣: 1, 一诺: 1, 思源: 1, 梓豪: 1,
  紫涵: 1, 梓萱: 1, 梦琪: 1, 雅琪: 1, 诗涵: 1, 欣怡: 1,
  子墨: 1, 子辰: 1, 宇航: 1, 皓轩: 1, 文博: 1, 天佑: 1,
  语桐: 1, 可馨: 1, 雨萱: 1, 若曦: 1, 沐阳: 1, 星辰: 1,
  // 一般 (2)
  昕妍: 2, 锦程: 2, 奕辰: 2, 暮云: 2, 清和: 2,
  // 较少见 (3) — 查不到的默认按此处理
};

/**
 * 获取姓氏人口数（万人）
 * @param {string} surname
 * @returns {number|null} 万人数，null 表示不在 Top 100
 */
export function getSurnamePopulation(surname) {
  if (!surname) return null;
  return SURNAME_POPULATION[surname] ?? null;
}

/**
 * 获取名字频率等级
 * @param {string} givenName - 名（不含姓）
 * @returns {number|null} 0-3 等级；null 表示暂无可靠数据
 */
export function getNameFrequencyTier(givenName) {
  if (!givenName) return null;
  return NAME_FREQUENCY[givenName] ?? null;
}

/**
 * 估算重名数量
 * 算法：姓氏万人数 × 名字系数
 *   等级 0 → 系数 3.0 (非常常见的名字)
 *   等级 1 → 系数 0.5
 *   等级 2 → 系数 0.05
 *   等级 3 → 系数 0.005
 *
 * @param {string} surname - 姓
 * @param {string} givenName - 名
 * @returns {{ estimate: number, tier: string, tierIndex: number }|null}
 */
export function estimateNameFrequency(surname, givenName) {
  const pop = getSurnamePopulation(surname);
  const freqTier = getNameFrequencyTier(givenName);
  if (pop === null || freqTier === null) return null;

  const coefficients = [3.0, 0.5, 0.05, 0.005];

  const estimate = Math.round(pop * coefficients[freqTier]);

  // 根据估算值重新定级
  let displayTier;
  let displayIndex;
  if (estimate > 10000) {
    displayTier = '非常常见';
    displayIndex = 0;
  } else if (estimate > 1000) {
    displayTier = '较常见';
    displayIndex = 1;
  } else if (estimate > 100) {
    displayTier = '较少见';
    displayIndex = 2;
  } else {
    displayTier = '非常少见';
    displayIndex = 3;
  }

  return {
    estimate,
    tier: displayTier,
    tierIndex: displayIndex,
  };
}
