// 第 4 章：色彩的感覺與應用（第 17～20 關）
import { HUES12, hsvHex, hexToHsv, greyForL, contrastRatio, hslToRgb, rgbToHex, hueDistance, pick, shuffle, randInt } from '../color-utils.js';
import { swatch, paletteStrip, surroundPair, textSample, ratioBar, venn, wheel12 } from '../visuals.js';
import { choice } from './common.js';

// ---------- 第 17 關：同時對比 ----------
function greyIllusionQ() {
  const L = randInt(42, 58);
  const same = Math.random() < 0.5;
  const blackLeft = Math.random() < 0.5;
  // 不一樣的時候，讓「白底上的方塊」真的比較亮，專門破解錯覺
  const onBlack = greyForL(L);
  const onWhite = same ? onBlack : greyForL(L + 9);
  const visual = blackLeft ? surroundPair('#000', onBlack, '#fff', onWhite) : surroundPair('#fff', onWhite, '#000', onBlack);
  const answer = same ? 2 : blackLeft ? 1 : 0;
  return {
    ...choice('中間兩個小方塊，哪一個比較亮？', ['左邊比較亮', '右邊比較亮', '一樣亮'], answer,
      same ? '它們其實一模一樣！黑底讓灰色看起來變亮，白底讓它看起來變暗。'
        : '這次白底上的方塊真的比較亮，只是被背景「壓暗」了，看起來差不多。眼睛很容易被背景騙！', visual),
    fixedOrder: true,
  };
}

function hueIllusionQ() {
  const h = randInt(0, 359);
  const inner = hsvHex(h, 0.55, 0.8);
  const same = Math.random() < 0.6;
  const other = same ? inner : hsvHex(h + 18, 0.55, 0.8);
  const visual = surroundPair(hsvHex(h - 40, 0.9, 0.9), inner, hsvHex(h + 40, 0.9, 0.9), other);
  return {
    ...choice('中間兩個小方塊，顏色一樣嗎？', ['一樣', '不一樣'], same ? 0 : 1,
      same ? '一模一樣！周圍的顏色會把中間的顏色「推」向相反的方向，所以看起來不同。' : '這次真的不一樣。判斷顏色時，最好把它們放在同樣的背景上比較。', visual),
    fixedOrder: true,
  };
}

function greyMatchSurroundQ() {
  const L = randInt(40, 60);
  const flip = Math.random() < 0.5;
  return {
    type: 'mix', mode: 'grey', target: greyForL(L), start: [0.5], step: 1, scoreBy: 'L',
    surround: flip ? { target: '#000', mine: '#fff' } : { target: '#fff', mine: '#000' },
    prompt: '背景不同的情況下，調出和目標「一樣亮」的灰色',
    explain: `目標的明度是 ${L}。黑底會讓灰色看起來比較亮，白底會讓它看起來比較暗，所以憑感覺常會調錯。`,
  };
}

// ---------- 第 18 關：對比與可讀性 ----------
function readableQ() {
  const hue = randInt(0, 359);
  const dark = Math.random() < 0.4;
  const bg = rgbToHex(hslToRgb(hue, 0.5, dark ? 0.15 : 0.92));
  const ls = dark ? [0.3, 0.45, 0.6, 0.95] : [0.8, 0.65, 0.5, 0.15];
  const fgs = ls.map((l) => rgbToHex(hslToRgb(hue, 0.6, l)));
  return choice('哪一組文字最容易閱讀？', fgs.map((fg) => ({ sample: { fg, bg } })), 3,
    `最容易讀的那組對比度約 ${contrastRatio(fgs[3], bg).toFixed(1)} : 1。文字和背景的明度差越大，越容易閱讀。`);
}

function contrastFixQ() {
  const hue = randInt(0, 359);
  const dark = Math.random() < 0.4;
  const bgL = dark ? 0.18 : 0.9;
  return {
    type: 'contrast', bg: rgbToHex(hslToRgb(hue, 0.35, bgL)), hue: (hue + randInt(0, 1) * 180) % 360, sat: 0.7,
    start: dark ? 0.3 : 0.7, min: 4.5,
    prompt: '文字太難讀了！調整文字的明度，讓對比度達到 4.5 : 1',
    explain: '一般文字的對比度至少要 4.5 : 1（WCAG 標準）。背景亮，文字就要夠暗；背景暗，文字就要夠亮。',
  };
}

function passQ() {
  const hue = randInt(0, 359);
  const bg = rgbToHex(hslToRgb(hue, 0.4, 0.93));
  const ok = Math.random() < 0.5;
  const fg = rgbToHex(hslToRgb(hue, 0.6, ok ? randInt(12, 25) / 100 : randInt(55, 68) / 100));
  const r = contrastRatio(fg, bg);
  return {
    ...choice('這組文字的對比度，有沒有達到一般文字的標準（4.5 : 1）？', ['有達到', '沒有達到'], r >= 4.5 ? 0 : 1,
      `這組的對比度是 ${r.toFixed(1)} : 1。`, textSample(fg, bg)),
    fixedOrder: true,
  };
}

const a11yConcept = [
  () => choice('WCAG 建議一般大小的文字，對比度至少要多少？', ['4.5 : 1', '1.5 : 1', '2 : 1', '21 : 1'], 0, '一般文字 4.5 : 1，大字（約 24px 以上）3 : 1。黑字白底是最高的 21 : 1。'),
  () => choice('紅綠色弱的人，最難分辨哪一組顏色？',
    [{ palette: ['#d32f2f', '#388e3c'] }, { palette: ['#1e63d6', '#ffc107'] }, { palette: ['#000000', '#ffffff'] }, { palette: ['#1e63d6', '#ff7a00'] }], 0,
    '紅綠色弱是最常見的色覺差異（約 8% 男性）。不要只用紅、綠區分重要資訊，可以再加上圖示或文字。'),
  () => choice('文字能不能看清楚，最主要取決於文字和背景的？', ['明度差', '色相差', '誰比較鮮豔', '字型大小以外都不重要'], 0, '明度差才是關鍵。色相不同但一樣亮的顏色（例如紅字配綠底），反而很難讀。'),
];

// ---------- 第 19 關：色彩心理 + 60-30-10 ----------
const FEELINGS = [
  { color: '#e53935', label: '熱情、危險' },
  { color: '#1e63d6', label: '冷靜、信任' },
  { color: '#43a047', label: '自然、健康' },
  { color: '#fdd835', label: '快樂、注意' },
  { color: '#7e57c2', label: '神秘、優雅' },
  { color: '#212121', label: '正式、力量' },
];

function feelingQ() {
  const set = pick(FEELINGS, 4);
  return {
    type: 'classify',
    categories: set.map((f) => ({ label: f.label })),
    items: set.map((f, i) => ({ color: f.color, cat: i })),
    prompt: '把顏色放進它最常帶給人的感覺',
    explain: '顏色的感覺來自生活經驗：紅色像火和血、藍色像天空和海、綠色像植物。不過也會因文化而不同。',
  };
}

const BRANDS = [
  ['銀行 App 想給人「安全、值得信任」的感覺，主色最適合用？', 1],
  ['有機蔬菜品牌想給人「天然、健康」的感覺，主色最適合用？', 2],
  ['兒童樂園的海報想要「快樂、活潑」，主色最適合用？', 3],
  ['消防和警告標誌，最常用哪個顏色吸引注意？', 0],
];
function brandQ() {
  const [q, ans] = pick(BRANDS, 1)[0];
  const opts = [0, 1, 2, 3].map((i) => ({ label: FEELINGS[i].label.split('、')[0], color: FEELINGS[i].color }));
  return choice(q, opts, ans, `${FEELINGS[ans].label.replace('、', '和')}是${['紅', '藍', '綠', '黃'][ans]}色最常給人的感覺。`);
}

function ratioPaintQ() {
  const h = randInt(0, 359);
  const main = hsvHex(h, 0.07, 0.97);
  const second = hsvHex(h, 0.3, 0.85);
  const accent = hsvHex(h + 180, 0.9, 0.9);
  return {
    type: 'paint', scene: 'ui', palette: shuffle([main, second, accent]),
    prompt: '用 60-30-10 法則替 App 畫面上色：背景、卡片、按鈕各用一個顏色',
    explain: '60% 主色放最大面積（背景，通常最淡最低調）；30% 輔助色放卡片；10% 強調色（最鮮豔）放在最重要的按鈕上。',
    check(fills) {
      const want = { page: main, card: second, button: accent };
      const ok = Object.keys(want).filter((k) => fills[k] === want[k]);
      const used = new Set(Object.values(fills)).size;
      const notes = [
        fills.page === main ? '✓ 背景用最淡的主色' : '✗ 背景（60%）應該用最淡、最低調的顏色',
        fills.card === second ? '✓ 卡片用輔助色' : '✗ 卡片（30%）應該用中間的輔助色',
        fills.button === accent ? '✓ 按鈕用最鮮豔的強調色' : '✗ 按鈕（10%）應該用最鮮豔的強調色',
      ];
      if (used < 3) notes.push('記得三個顏色都要用到');
      return { score: ok.length / 3, correct: ok.length === 3, detail: notes.join('；') };
    },
  };
}

const ratioConcept = () => choice('在 60-30-10 法則中，「10%」的強調色通常用在哪裡？', ['按鈕、重點標示等最重要的地方', '整個背景', '所有文字', '不重要的角落'], 0,
  '強調色面積最小、最鮮豔，要放在最希望被看到的地方。');

// ---------- 第 20 關：畢業大考 ----------
function finalPaintQ() {
  const h = randInt(0, 11) * 30;
  const hues = [h, h + 180, h + 90];
  const hueName = (d) => HUES12[(d / 30) % 12].name;
  const groups = hues.map((d) => ({ label: hueName(d), colors: [hsvHex(d, 0.3, 1), hsvHex(d, 0.9, 0.95), hsvHex(d, 0.85, 0.5)] }));
  const [A, B] = groups;
  const family = (hex) => {
    const [hh] = hexToHsv(hex);
    return hues.map((d) => hueDistance(hh, d)).reduce((best, dist, i, arr) => (dist < arr[best] ? i : best), 0);
  };
  const vivid = (hex) => { const [, s, v] = hexToHsv(hex); return s * v; };
  return {
    type: 'paint', scene: 'poster', groups: shuffle(groups),
    prompt: '畢業作品：用「互補色」設計海報，而且面積最小的太陽要最鮮豔',
    explain: '互補色配色只用正對面的兩個色相（可以用它們的淺色、深色）。最小的面積放最鮮豔的顏色，就是強調色。',
    example: { sky: A.colors[0], mountain: B.colors[2], ground: A.colors[2], sun: B.colors[1] },
    exampleNote: `範例只用了互補的「${A.label}」和「${B.label}」兩組（相差 180°），太陽用最鮮豔的${B.label}。「${groups[2].label}」不是它們的互補色，不能用。`,
    check(fills, regions) {
      const cols = regions.map((r) => fills[r.id]);
      const fams = cols.map(family);
      const set = new Set(fams);
      const onlyPair = !set.has(2);
      const both = set.has(0) && set.has(1);
      const sunVivid = regions.every((r) => r.id === 'sun' || vivid(fills.sun) >= vivid(fills[r.id]));
      const score = (onlyPair ? 0.4 : 0) + (onlyPair && both ? 0.3 : 0) + (sunVivid ? 0.3 : 0);
      const used = [...set].map((i) => groups[i].label).join('、');
      const notes = [
        `你用了 ${new Set(cols).size} 個顏色，屬於 ${set.size} 個色相（${used}）`,
        onlyPair ? (both ? '✓ 只用了一組互補色' : '✗ 只用了一個色相，要把互補的兩個色相都用上') : `✗ 用到了「${groups[2].label}」，它不是這組的互補色`,
        sunVivid ? '✓ 太陽是最鮮豔的強調色' : '✗ 太陽（最小面積）應該用最鮮豔的顏色',
      ];
      return { score, correct: score >= 0.99, detail: notes.join('；') };
    },
  };
}

export function finalLevel(levels) {
  const from = (ids, n) => pick(ids, n).map((id) => levels[id].challenge()[0]);
  return {
    learn: [
      { title: '光與顏料', body: '光是<b>加法混色</b>（RGB，越混越亮）；顏料是<b>減法混色</b>（CMY，越混越暗）。它們的原色剛好互為對方的二次色。', visual: `<div class="sw-row">${venn('light')}${venn('pigment')}</div>` },
      { title: '顏色的三個屬性', body: '<b>色相</b>（什麼顏色）、<b>明度</b>（多亮）、<b>彩度</b>（多鮮豔）。加白、加黑、加灰會做出淺色調、暗色調和濁色調。', visual: paletteStrip([hsvHex(200), hsvHex(200, 0.4, 1), hsvHex(200, 1, 0.5), hsvHex(200, 0.3, 0.6)]) },
      { title: '配色關係', body: '<b>單色、類似色</b>和諧穩定；<b>互補色、分裂互補</b>對比強烈；<b>三角、四角配色</b>豐富活潑。都是用色相環上的位置找顏色。', visual: wheel12({ lit: 'all', labels: false }) },
      { title: '實際應用', body: '注意<b>背景會影響顏色</b>、文字要有足夠的<b>明度對比</b>、用 <b>60-30-10</b> 分配面積，並善用顏色帶給人的感覺。準備好了就來挑戰吧！', visual: ratioBar([['#eef1f5', 60, '60%'], ['#9fb3c8', 30, '30%'], ['#ff6b35', 10, '10%']]) },
    ],
    practice: () => [from([3, 4, 5], 1)[0], from([7, 8, 9], 1)[0], finalPaintQ()],
    challenge: () => [...shuffle(from([2, 3, 4, 6, 7, 8, 9, 10, 12, 13, 14, 15, 17, 18], 7)), finalPaintQ()],
  };
}

// ---------- 關卡定義 ----------
export const CH4 = {
  17: {
    learn: [
      { title: '顏色會騙人', body: '下面兩個小方塊是<b>一模一樣的灰色</b>。放在黑底上看起來比較亮，放在白底上看起來比較暗。這叫做<b>同時對比</b>。', visual: surroundPair('#000', '#808080', '#fff', '#808080') },
      { title: '色相也會被影響', body: '中間兩個方塊也是<b>同一個顏色</b>！周圍的顏色會把它「推」向相反的方向：在紅底上看起來偏黃，在黃底上看起來偏紅。', visual: surroundPair('#e0301e', '#f08a24', '#f5d000', '#f08a24') },
      { title: '所以要在實際背景上判斷', body: '同一個顏色放在不同的地方，看起來會不一樣。選色時，一定要<b>放在實際的背景上</b>看效果，不要只看調色盤。', visual: surroundPair('#1e3a8a', '#6fa8dc', '#fdf6e3', '#6fa8dc') },
    ],
    practice: () => [greyIllusionQ(), hueIllusionQ(), greyMatchSurroundQ()],
    challenge: () => shuffle([greyIllusionQ(), greyIllusionQ(), hueIllusionQ(), hueIllusionQ(), greyMatchSurroundQ(), greyMatchSurroundQ()]),
  },
  18: {
    learn: [
      { title: '看得清楚靠明度對比', body: '文字好不好讀，主要看文字和背景的<b>明度差</b>，不是色相差。紅字配綠底色相差很多，但明度接近，反而很難讀。', visual: textSample('#e53935', '#43a047', '很難讀') + textSample('#111111', '#fdd835', '很清楚') },
      { title: '對比度數字', body: '對比度從 1 : 1（完全一樣）到 21 : 1（黑白）。國際網頁無障礙標準 WCAG 建議：<b>一般文字至少 4.5 : 1</b>，大字至少 3 : 1。', visual: textSample('#bbbbbb', '#ffffff', '1.9 : 1 太淡') + textSample('#767676', '#ffffff', '4.5 : 1 及格') + textSample('#000000', '#ffffff', '21 : 1 最高') },
      { title: '不要只靠顏色', body: '約 8% 的男性有<b>色覺差異</b>（最常見是紅綠色弱）。重要資訊除了顏色，還要加上<b>文字、圖示或形狀</b>，讓每個人都看得懂。', visual: paletteStrip(['#d32f2f', '#388e3c'], ['✗ 錯誤', '✓ 正確']) },
    ],
    practice: () => [readableQ(), passQ(), contrastFixQ()],
    challenge: () => shuffle([readableQ(), readableQ(), passQ(), contrastFixQ(), contrastFixQ(), pick(a11yConcept, 1)[0]()]),
  },
  19: {
    learn: [
      { title: '顏色帶來的感覺', body: '顏色會讓人產生聯想：<b>紅</b>熱情、危險；<b>藍</b>冷靜、信任；<b>綠</b>自然、健康；<b>黃</b>快樂、注意；<b>紫</b>神秘、優雅；<b>黑</b>正式、力量。', visual: paletteStrip(FEELINGS.map((f) => f.color), ['熱情', '信任', '自然', '快樂', '神秘', '力量']) },
      { title: '文化也有影響', body: '同一個顏色在不同文化裡意思可能不同。例如白色在西方代表婚禮的純潔，在東方傳統卻常用於喪禮。設計時要考慮<b>看的人是誰</b>。', visual: `<div class="sw-row">${swatch('#ffffff', '白')}${swatch('#d32f2f', '紅')}</div>` },
      { title: '60-30-10 法則', body: '分配顏色面積的好方法：<b>60% 主色</b>（背景、大面積）、<b>30% 輔助色</b>（次要區塊）、<b>10% 強調色</b>（重點）。', visual: ratioBar([['#eef1f5', 60, '主色 60%'], ['#9fb3c8', 30, '輔助 30%'], ['#ff6b35', 10, '10%']]) },
      { title: '強調色要最鮮豔', body: '10% 的強調色通常是<b>最鮮豔、最有對比</b>的顏色，放在按鈕或最重要的地方，一眼就能看到。', visual: paletteStrip(['#eef1f5', '#eef1f5', '#9fb3c8', '#ff6b35']) },
    ],
    practice: () => [feelingQ(), brandQ(), ratioPaintQ()],
    challenge: () => shuffle([feelingQ(), feelingQ(), brandQ(), brandQ(), ratioPaintQ(), ratioConcept()]),
  },
};

