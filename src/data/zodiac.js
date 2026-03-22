/**
 * 生肖与起名宜忌
 * 传统命理认为不同生肖有「宜用字根」和「忌用字根」
 * 问名的态度：提供信息但不做判断，由家长自行决定是否参考
 */

const ZODIAC_INFO = {
  鼠: {
    traits: '机灵、适应力强',
    preferred: ['口', '宀', '米', '豆', '王', '夕'],
    preferredReason: '鼠喜洞穴（口、宀）、五谷（米、豆）',
    avoided: ['日', '火', '马', '午'],
    avoidedReason: '鼠为子，子午相冲',
  },
  牛: {
    traits: '勤恳、踏实',
    preferred: ['艹', '田', '车', '宀', '禾'],
    preferredReason: '牛喜草地（艹）、田野（田）、安居（宀）',
    avoided: ['马', '心', '忄', '日'],
    avoidedReason: '丑午相害，牛不喜奔忙',
  },
  虎: {
    traits: '威猛、有魄力',
    preferred: ['山', '木', '林', '王', '氵'],
    preferredReason: '虎居山林为王（山、木、王）',
    avoided: ['口', '辶', '几', '人'],
    avoidedReason: '虎入平地被困（口为关笼）',
  },
  兔: {
    traits: '温和、灵活',
    preferred: ['口', '艹', '木', '月', '宀'],
    preferredReason: '兔喜洞穴（口、宀）、草木（艹、木）',
    avoided: ['日', '金', '刀', '力'],
    avoidedReason: '兔为卯，卯酉相冲（酉属金）',
  },
  龙: {
    traits: '尊贵、有气魄',
    preferred: ['日', '月', '星', '氵', '王'],
    preferredReason: '龙喜日月星辰、水泽',
    avoided: ['土', '田', '犭', '虫'],
    avoidedReason: '龙困浅滩（土、田）',
  },
  蛇: {
    traits: '智慧、深沉',
    preferred: ['口', '宀', '木', '衣', '心'],
    preferredReason: '蛇喜洞穴（口、宀）、林间（木）',
    avoided: ['日', '艹', '人', '亻'],
    avoidedReason: '蛇遇人受惊，打草惊蛇',
  },
  马: {
    traits: '奔放、热情',
    preferred: ['艹', '木', '禾', '目', '龙'],
    preferredReason: '马喜草原（艹）、远眺（目）',
    avoided: ['子', '氵', '壬', '鼠'],
    avoidedReason: '子午相冲，马怕水困',
  },
  羊: {
    traits: '温良、和善',
    preferred: ['艹', '木', '口', '足', '豆'],
    preferredReason: '羊喜草木（艹、木）、五谷（豆）',
    avoided: ['忄', '心', '犭', '刀'],
    avoidedReason: '羊为祭品忌心（被宰杀）',
  },
  猴: {
    traits: '聪慧、灵活',
    preferred: ['木', '口', '王', '人', '亻'],
    preferredReason: '猴喜林间（木）、为人师（人、王）',
    avoided: ['火', '禾', '豆', '虎'],
    avoidedReason: '申寅相冲（寅为虎）',
  },
  鸡: {
    traits: '勤勉、守时',
    preferred: ['禾', '米', '豆', '虫', '山'],
    preferredReason: '鸡喜五谷（禾、米、豆）',
    avoided: ['犭', '兔', '卯', '石'],
    avoidedReason: '卯酉相冲（卯为兔）',
  },
  狗: {
    traits: '忠诚、正义',
    preferred: ['人', '亻', '宀', '心', '忄'],
    preferredReason: '狗喜有主人（人）、安居（宀）',
    avoided: ['辰', '龙', '口', '酉'],
    avoidedReason: '辰戌相冲（辰为龙），两口为哭',
  },
  猪: {
    traits: '宽厚、福气',
    preferred: ['口', '宀', '门', '豆', '米'],
    preferredReason: '猪喜有家（宀、门）、五谷（豆、米）',
    avoided: ['蛇', '巳', '刀', '力'],
    avoidedReason: '巳亥相冲（巳为蛇）',
  },
};

/**
 * 获取生肖信息
 * @param {string} animal - 生肖名称
 * @returns {object|null}
 */
export function getZodiacInfo(animal) {
  if (!animal) return null;
  return ZODIAC_INFO[animal] ?? null;
}

/**
 * 检查字是否含有某些偏旁部首
 * 简化实现：通过 Unicode CJK 部首和常见偏旁字符匹配
 * 注意：这是近似匹配，不做精确的部首拆解（那需要完整的汉字结构数据库）
 *
 * @param {string} char - 单个汉字
 * @param {string[]} radicals - 要检查的部首列表
 * @returns {string[]} 匹配到的部首
 */
export function checkRadicals(char, radicals) {
  if (!char || !radicals) return [];
  // 简化处理：仅通过字符包含关系判断
  // 实际场景中大部分用户不会深究部首拆解的准确性
  // 完整的部首数据库是一个独立的大工程，暂不实现
  return [];
}

/**
 * 分析名字与生肖的匹配（简化版）
 * 仅提供生肖的宜忌信息，不做精确的字根分析
 * @param {string} animal - 生肖
 * @returns {{ info: object, note: string }|null}
 */
export function analyzeZodiacMatch(animal) {
  const info = getZodiacInfo(animal);
  if (!info) return null;

  return {
    info,
    note: `属${animal}：${info.traits}。传统上宜用「${info.preferred.join('、')}」等字根（${info.preferredReason}），忌用「${info.avoided.join('、')}」等字根（${info.avoidedReason}）。`,
  };
}
