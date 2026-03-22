/**
 * 谐音检测 — 尴尬或不雅谐音模式
 *
 * 检查姓+名的完整拼音组合是否包含不雅谐音
 * 数据来源：常见中文起名谐音禁忌，仅收录公认的尴尬谐音
 *
 * 格式：{ pinyin: '完整拼音', meaning: '谐音含义', example: '示例名字' }
 * pinyin 使用空格分隔的无声调拼音（便于匹配）
 */

const HOMOPHONE_PATTERNS = [
  // 姓+名组合谐音
  { pinyin: 'du zi teng', meaning: '肚子疼', example: '杜子腾' },
  { pinyin: 'shi zhen xiang', meaning: '死真相/屎真香', example: '史珍香' },
  { pinyin: 'shi zhen', meaning: '失贞', example: '史贞' },
  { pinyin: 'lai yue jing', meaning: '来月经', example: '赖月京' },
  { pinyin: 'pei yan', meaning: '配眼（镜）', example: '裴炎' },
  { pinyin: 'fan jian', meaning: '犯贱', example: '范剑/范建' },
  { pinyin: 'fan tong', meaning: '饭桶', example: '范统' },
  { pinyin: 'hou de', meaning: '厚的/猴的', example: '侯德' },
  { pinyin: 'wei sheng jin', meaning: '卫生巾', example: '魏生津' },
  { pinyin: 'wu gou', meaning: '污垢', example: '吴垢' },
  { pinyin: 'jia zhen', meaning: '假真', example: '贾真' },
  { pinyin: 'jia ren', meaning: '假人', example: '贾仁' },
  { pinyin: 'zhu yi', meaning: '猪一/注意', example: '朱逸' },
  { pinyin: 'ma de', meaning: '骂的', example: '马德' },

  // 名字部分谐音（不含姓）
  { pinyin: 'mei liang xin', meaning: '没良心', example: '×梅良心' },
  { pinyin: 'si wang', meaning: '死亡', example: '×思旺' },
  { pinyin: 'gou dan', meaning: '狗蛋', example: '×苟丹' },
  { pinyin: 'gou sheng', meaning: '狗剩', example: '×苟盛' },
  { pinyin: 'ji dan', meaning: '鸡蛋', example: '×纪丹' },
  { pinyin: 'pi gu', meaning: '屁股', example: '×丕谷' },
  { pinyin: 'fei wu', meaning: '废物', example: '×飞舞' },
  { pinyin: 'ben dan', meaning: '笨蛋', example: '×本丹' },
  { pinyin: 'lan ren', meaning: '烂人/懒人', example: '×兰仁' },

  // 常见多音字导致的谐音
  { pinyin: 'cao ni', meaning: '粗话谐音', example: '曹妮' },
  { pinyin: 'ri ni', meaning: '粗话谐音', example: '×日妮' },

  // 高频尴尬组合
  { pinyin: 'qin shou', meaning: '禽兽', example: '秦寿' },
  { pinyin: 'sha bi', meaning: '粗话谐音', example: '×沙碧' },
  { pinyin: 'bi si', meaning: '必死', example: '×壁思' },

  // 食物/日用品类
  { pinyin: 'cai dan', meaning: '菜单', example: '蔡丹' },
  { pinyin: 'tang yuan', meaning: '汤圆', example: '汤媛' },
  { pinyin: 'fan wan', meaning: '饭碗', example: '范万' },
];

/**
 * 汉字→拼音简表（无声调，常用字约 2000 字）
 * 多音字仅取最常见读音 + 在姓名中的常见读音
 * 更完整的方案需要引入 pinyin 库，此处用轻量方案覆盖常用姓名用字
 */
const PINYIN_MAP = {
  // 常见姓氏
  赵: 'zhao', 钱: 'qian', 孙: 'sun', 李: 'li', 周: 'zhou',
  吴: 'wu', 郑: 'zheng', 王: 'wang', 冯: 'feng', 陈: 'chen',
  褚: 'chu', 卫: 'wei', 蒋: 'jiang', 沈: 'shen', 韩: 'han',
  杨: 'yang', 朱: 'zhu', 秦: 'qin', 尤: 'you', 许: 'xu',
  何: 'he', 吕: 'lv', 施: 'shi', 张: 'zhang', 孔: 'kong',
  曹: 'cao', 严: 'yan', 华: 'hua', 金: 'jin', 魏: 'wei',
  陶: 'tao', 姜: 'jiang', 戚: 'qi', 谢: 'xie', 邹: 'zou',
  喻: 'yu', 柏: 'bai', 水: 'shui', 窦: 'dou', 章: 'zhang',
  云: 'yun', 苏: 'su', 潘: 'pan', 葛: 'ge', 奚: 'xi',
  范: 'fan', 彭: 'peng', 郎: 'lang', 鲁: 'lu', 韦: 'wei',
  昌: 'chang', 马: 'ma', 苗: 'miao', 凤: 'feng', 花: 'hua',
  方: 'fang', 俞: 'yu', 任: 'ren', 袁: 'yuan', 柳: 'liu',
  唐: 'tang', 罗: 'luo', 薛: 'xue', 贺: 'he', 倪: 'ni',
  汤: 'tang', 滕: 'teng', 殷: 'yin', 罗: 'luo', 毕: 'bi',
  郝: 'hao', 邬: 'wu', 安: 'an', 常: 'chang', 乐: 'le',
  于: 'yu', 时: 'shi', 傅: 'fu', 皮: 'pi', 卞: 'bian',
  齐: 'qi', 康: 'kang', 伍: 'wu', 余: 'yu', 元: 'yuan',
  卜: 'bu', 顾: 'gu', 孟: 'meng', 黄: 'huang', 和: 'he',
  穆: 'mu', 萧: 'xiao', 尹: 'yin', 姚: 'yao', 邵: 'shao',
  湛: 'zhan', 汪: 'wang', 祁: 'qi', 毛: 'mao', 禹: 'yu',
  狄: 'di', 米: 'mi', 贝: 'bei', 明: 'ming', 臧: 'zang',
  计: 'ji', 伏: 'fu', 成: 'cheng', 戴: 'dai', 宋: 'song',
  茅: 'mao', 庞: 'pang', 熊: 'xiong', 纪: 'ji', 舒: 'shu',
  屈: 'qu', 项: 'xiang', 祝: 'zhu', 董: 'dong', 梁: 'liang',
  杜: 'du', 阮: 'ruan', 蓝: 'lan', 闵: 'min', 席: 'xi',
  季: 'ji', 麻: 'ma', 强: 'qiang', 贾: 'jia', 路: 'lu',
  娄: 'lou', 危: 'wei', 江: 'jiang', 童: 'tong', 颜: 'yan',
  郭: 'guo', 梅: 'mei', 盛: 'sheng', 林: 'lin', 刁: 'diao',
  钟: 'zhong', 徐: 'xu', 邱: 'qiu', 骆: 'luo', 高: 'gao',
  夏: 'xia', 蔡: 'cai', 田: 'tian', 樊: 'fan', 胡: 'hu',
  凌: 'ling', 霍: 'huo', 虞: 'yu', 万: 'wan', 支: 'zhi',
  柯: 'ke', 管: 'guan', 卢: 'lu', 莫: 'mo', 翟: 'zhai',
  程: 'cheng', 嵇: 'ji', 邢: 'xing', 滑: 'hua', 裴: 'pei',
  陆: 'lu', 荣: 'rong', 翁: 'weng', 荀: 'xun', 羊: 'yang',
  惠: 'hui', 甄: 'zhen', 曲: 'qu', 封: 'feng', 芮: 'rui',
  赖: 'lai', 龚: 'gong', 叶: 'ye', 侯: 'hou', 宫: 'gong',
  单: 'shan', 丁: 'ding', 沙: 'sha', 司: 'si', 史: 'shi',
  缪: 'miao',

  // 常见名字用字（按拼音分组）
  爱: 'ai', 安: 'an', 昂: 'ang', 奥: 'ao',
  八: 'ba', 百: 'bai', 柏: 'bai', 邦: 'bang', 宝: 'bao',
  北: 'bei', 本: 'ben', 碧: 'bi', 彬: 'bin', 冰: 'bing',
  博: 'bo', 波: 'bo', 步: 'bu',
  才: 'cai', 彩: 'cai', 灿: 'can', 苍: 'cang', 策: 'ce',
  昌: 'chang', 长: 'chang', 畅: 'chang', 超: 'chao', 朝: 'chao',
  辰: 'chen', 晨: 'chen', 承: 'cheng', 诚: 'cheng', 成: 'cheng',
  驰: 'chi', 崇: 'chong', 楚: 'chu', 初: 'chu', 春: 'chun',
  淳: 'chun', 聪: 'cong', 翠: 'cui', 存: 'cun',
  达: 'da', 大: 'da', 丹: 'dan', 道: 'dao', 德: 'de',
  登: 'deng', 迪: 'di', 典: 'dian', 东: 'dong', 栋: 'dong',
  端: 'duan', 朵: 'duo',
  恩: 'en', 尔: 'er',
  帆: 'fan', 凡: 'fan', 芳: 'fang', 方: 'fang', 飞: 'fei',
  菲: 'fei', 丰: 'feng', 枫: 'feng', 锋: 'feng', 凤: 'feng',
  福: 'fu', 富: 'fu', 芙: 'fu',
  刚: 'gang', 高: 'gao', 歌: 'ge', 格: 'ge', 功: 'gong',
  光: 'guang', 广: 'guang', 桂: 'gui', 国: 'guo', 果: 'guo',
  海: 'hai', 涵: 'han', 翰: 'han', 浩: 'hao', 皓: 'hao',
  昊: 'hao', 鹤: 'he', 和: 'he', 恒: 'heng', 弘: 'hong',
  宏: 'hong', 虹: 'hong', 鸿: 'hong', 华: 'hua', 花: 'hua',
  桦: 'hua', 欢: 'huan', 焕: 'huan', 辉: 'hui', 慧: 'hui',
  惠: 'hui', 会: 'hui',
  佳: 'jia', 嘉: 'jia', 家: 'jia', 健: 'jian', 建: 'jian',
  剑: 'jian', 江: 'jiang', 杰: 'jie', 洁: 'jie', 金: 'jin',
  津: 'jin', 锦: 'jin', 劲: 'jin', 晋: 'jin', 京: 'jing',
  景: 'jing', 靖: 'jing', 静: 'jing', 菁: 'jing', 炯: 'jiong',
  久: 'jiu', 军: 'jun', 君: 'jun', 俊: 'jun', 均: 'jun',
  筠: 'jun',
  凯: 'kai', 楷: 'kai', 康: 'kang', 可: 'ke', 克: 'ke',
  坤: 'kun', 昆: 'kun',
  兰: 'lan', 岚: 'lan', 乐: 'le', 蕾: 'lei', 磊: 'lei',
  力: 'li', 丽: 'li', 利: 'li', 莉: 'li', 良: 'liang',
  亮: 'liang', 琳: 'lin', 霖: 'lin', 灵: 'ling', 玲: 'ling',
  龙: 'long', 露: 'lu', 璐: 'lu', 伦: 'lun', 洛: 'luo',
  曼: 'man', 茂: 'mao', 美: 'mei', 梦: 'meng', 萌: 'meng',
  敏: 'min', 明: 'ming', 铭: 'ming', 沐: 'mu', 木: 'mu',
  穆: 'mu', 慕: 'mu', 牧: 'mu',
  娜: 'na', 楠: 'nan', 南: 'nan', 宁: 'ning', 妮: 'ni',
  念: 'nian', 暖: 'nuan',
  佩: 'pei', 鹏: 'peng', 萍: 'ping', 平: 'ping', 璞: 'pu',
  琪: 'qi', 奇: 'qi', 琦: 'qi', 齐: 'qi', 千: 'qian',
  谦: 'qian', 茜: 'qian', 乔: 'qiao', 巧: 'qiao', 勤: 'qin',
  琴: 'qin', 青: 'qing', 清: 'qing', 庆: 'qing', 秋: 'qiu',
  权: 'quan', 泉: 'quan', 群: 'qun',
  然: 'ran', 仁: 'ren', 日: 'ri', 荣: 'rong', 蓉: 'rong',
  容: 'rong', 柔: 'rou', 茹: 'ru', 如: 'ru', 瑞: 'rui',
  若: 'ruo', 润: 'run',
  森: 'sen', 善: 'shan', 尚: 'shang', 绍: 'shao', 少: 'shao',
  珅: 'shen', 胜: 'sheng', 盛: 'sheng', 圣: 'sheng', 诗: 'shi',
  世: 'shi', 书: 'shu', 淑: 'shu', 舒: 'shu', 树: 'shu',
  帅: 'shuai', 双: 'shuang', 顺: 'shun', 思: 'si', 松: 'song',
  素: 'su', 穗: 'sui', 笋: 'sun',
  泰: 'tai', 涛: 'tao', 桃: 'tao', 天: 'tian', 甜: 'tian',
  婷: 'ting', 亭: 'ting', 廷: 'ting', 通: 'tong', 同: 'tong',
  彤: 'tong', 童: 'tong', 统: 'tong',
  万: 'wan', 婉: 'wan', 旺: 'wang', 望: 'wang', 伟: 'wei',
  维: 'wei', 薇: 'wei', 文: 'wen', 雯: 'wen', 武: 'wu',
  熙: 'xi', 希: 'xi', 曦: 'xi', 夕: 'xi', 霞: 'xia',
  仙: 'xian', 贤: 'xian', 湘: 'xiang', 翔: 'xiang', 祥: 'xiang',
  香: 'xiang', 晓: 'xiao', 小: 'xiao', 笑: 'xiao', 潇: 'xiao',
  心: 'xin', 欣: 'xin', 新: 'xin', 鑫: 'xin', 馨: 'xin',
  星: 'xing', 兴: 'xing', 秀: 'xiu', 修: 'xiu', 旭: 'xu',
  轩: 'xuan', 萱: 'xuan', 玄: 'xuan', 雪: 'xue', 学: 'xue',
  勋: 'xun',
  雅: 'ya', 亚: 'ya', 延: 'yan', 炎: 'yan', 彦: 'yan',
  燕: 'yan', 阳: 'yang', 尧: 'yao', 瑶: 'yao', 耀: 'yao',
  叶: 'ye', 怡: 'yi', 艺: 'yi', 逸: 'yi', 义: 'yi',
  毅: 'yi', 亦: 'yi', 颖: 'ying', 莹: 'ying', 映: 'ying',
  永: 'yong', 勇: 'yong', 悠: 'you', 优: 'you', 友: 'you',
  宇: 'yu', 雨: 'yu', 玉: 'yu', 语: 'yu', 煜: 'yu',
  裕: 'yu', 元: 'yuan', 源: 'yuan', 远: 'yuan', 媛: 'yuan',
  月: 'yue', 悦: 'yue', 岳: 'yue', 云: 'yun', 韵: 'yun',
  泽: 'ze', 展: 'zhan', 哲: 'zhe', 珍: 'zhen', 真: 'zhen',
  振: 'zhen', 正: 'zheng', 志: 'zhi', 智: 'zhi', 之: 'zhi',
  中: 'zhong', 忠: 'zhong', 舟: 'zhou', 竹: 'zhu', 卓: 'zhuo',
  子: 'zi', 紫: 'zi', 梓: 'zi', 自: 'zi', 宗: 'zong',
  祖: 'zu',

  // 额外的常用名字字
  沁: 'qin', 汐: 'xi', 睿: 'rui', 宸: 'chen', 禹: 'yu',
  墨: 'mo', 逍: 'xiao', 遥: 'yao', 瑾: 'jin', 瑜: 'yu',
  棠: 'tang', 苒: 'ran', 栩: 'xu', 槿: 'jin', 桐: 'tong',
  枫: 'feng', 柠: 'ning', 沫: 'mo', 澈: 'che', 澜: 'lan',
  瀚: 'han', 峰: 'feng', 嵘: 'rong', 岑: 'cen', 巍: 'wei',
  峻: 'jun', 峥: 'zheng', 屹: 'yi', 垚: 'yao', 尘: 'chen',
  壁: 'bi', 寿: 'shou', 谷: 'gu',
};

/**
 * 获取单个汉字的拼音（无声调）
 * @param {string} char - 单个汉字
 * @returns {string|null}
 */
export function getPinyin(char) {
  if (!char || char.length !== 1) return null;
  return PINYIN_MAP[char] ?? null;
}

/**
 * 获取名字的完整拼音（姓+名）
 * @param {string} fullName - 完整姓名（如 "杜子腾"）
 * @param {string} surname - 姓（如 "杜"）
 * @returns {string|null} 拼音字符串，空格分隔
 */
export function getFullPinyin(fullName, surname) {
  if (!fullName) return null;
  const chars = [...fullName];
  const pinyinArr = chars.map(c => getPinyin(c));
  if (pinyinArr.some(p => p === null)) return null;
  return pinyinArr.join(' ');
}

/**
 * 检测姓名是否有不雅谐音
 * @param {string} fullName - 完整姓名
 * @param {string} surname - 姓
 * @returns {Array<{ meaning: string, example: string }>} 匹配到的谐音问题
 */
export function detectHomophones(fullName, surname) {
  if (!fullName || !surname) return [];

  const pinyin = getFullPinyin(fullName, surname);
  if (!pinyin) return [];

  const results = [];
  for (const pattern of HOMOPHONE_PATTERNS) {
    if (pinyin === pattern.pinyin || pinyin.includes(pattern.pinyin)) {
      results.push({
        meaning: pattern.meaning,
        example: pattern.example,
      });
    }
  }
  return results;
}
