// 第 2 章：顏色的三個屬性（第 6～10 關）
import { HUES12, hsvHex, lightness, greyForL, tintMix, pick, shuffle, randInt } from '../color-utils.js';
import { swatch, paletteStrip, svSquare, hueRing } from '../visuals.js';
import { choice } from './common.js';

// ---------- 第 6 關：明度 ----------
// 產生 n 個明度彼此相差至少 gap 的顏色（由暗到亮）
function valueColors(n, gap, grey = false) {
  const out = [];
  for (let guard = 0; out.length < n && guard < 3000; guard++) {
    const c = grey ? greyForL(randInt(6, 96)) : hsvHex(randInt(0, 359), randInt(45, 100) / 100, randInt(30, 100) / 100);
    const L = lightness(c);
    if (out.every((o) => Math.abs(o.L - L) >= gap)) out.push({ c, L });
  }
  return out.sort((a, b) => a.L - b.L).map((o) => o.c);
}

const valueSortQ = (grey) => ({
  type: 'sort', items: valueColors(grey ? 6 : 5, grey ? 11 : 13, grey), ends: ['暗', '亮'],
  prompt: grey ? '把灰色由暗到亮排好' : '不管色相，只看明暗：由暗到亮排好',
  explain: grey ? '明度就是亮暗程度，最暗是黑、最亮是白。' : '判斷彩色的明度時，可以瞇起眼睛，或想像把它轉成黑白照片。',
});

function brighterQ() {
  const [a, b] = valueColors(2, 15);
  const f = (c) => Math.round(lightness(c));
  return choice('哪一個顏色比較亮（明度比較高）？', [{ color: a }, { color: b }], 1,
    `轉成黑白來看：暗的那個明度約 ${f(a)}，亮的那個約 ${f(b)}（0 = 黑、100 = 白）。`);
}

function greyEquivQ() {
  const c = hsvHex(randInt(0, 359), randInt(60, 100) / 100, randInt(50, 100) / 100);
  const L = lightness(c);
  const offsets = shuffle([-30, -15, 15, 30].filter((d) => L + d >= 4 && L + d <= 98)).slice(0, 3);
  return choice('把這個顏色拍成黑白照片，會最接近哪一個灰色？', [{ color: greyForL(L) }, ...offsets.map((d) => ({ color: greyForL(L + d) }))], 0,
    '每個顏色都有自己的明度。黃色很亮、藍色和紫色比較暗，轉成黑白後差別就很明顯。', swatch(c, '', 'lg'));
}

function greyMatchQ() {
  const c = hsvHex(randInt(0, 359), randInt(70, 100) / 100, randInt(55, 100) / 100);
  return {
    type: 'mix', mode: 'grey', target: c, scoreBy: 'L', start: [0.5], step: 1,
    prompt: '調一個灰色，讓它和目標顏色「一樣亮」',
    explain: '只比較明暗、不管色相。這是畫家常做的練習：看出每個顏色的明度。',
  };
}

// ---------- 第 7 關：彩度 ----------
function satSortQ() {
  const hue = randInt(0, 359);
  const ss = [0.08, 0.3, 0.52, 0.76, 1].map((s) => Math.min(1, s + randInt(-3, 3) / 100));
  return {
    type: 'sort', items: ss.map((s) => hsvHex(hue, s, 0.85)), ends: ['灰濁', '鮮豔'],
    prompt: '由灰濁到鮮豔排好（彩度由低到高）',
    explain: '彩度越高顏色越純、越鮮豔；彩度越低越接近灰色。',
  };
}

function vividQ(most) {
  const hue = randInt(0, 359);
  const ss = shuffle([0.15, 0.4, 0.65, 1]);
  const target = most ? 1 : 0.15;
  return choice(most ? '哪一個顏色最鮮豔（彩度最高）？' : '哪一個顏色最灰濁（彩度最低）？',
    ss.map((s) => ({ color: hsvHex(hue, s, 0.85) })), ss.indexOf(target),
    '這四個顏色的色相和亮度差不多，差別只在「混了多少灰」。');
}

function satMixQ() {
  const hue = randInt(0, 35) * 10;
  const s = randInt(4, 18) * 5 / 100;
  return {
    type: 'mix', mode: 'hsv', channels: ['s'], base: { h: hue, s: 0, v: 0.9 }, target: hsvHex(hue, s, 0.9), start: [0],
    prompt: '只調整彩度（飽和度），做出和目標一樣的顏色',
    explain: `目標的飽和度是 ${Math.round(s * 100)}%。飽和度 0% 是灰色，100% 是最鮮豔的純色。`,
  };
}

const satUseQ = () => {
  const hue = randInt(0, 359);
  return choice('網頁背景都是低彩度的灰色調，想讓「購買」按鈕最顯眼，按鈕應該用？',
    [{ label: '高彩度的鮮豔色', color: hsvHex(hue, 1, 0.95) }, { label: '低彩度的灰色調', color: hsvHex(hue, 0.15, 0.7) }], 0,
    '在一片低彩度裡，高彩度的顏色最搶眼，所以常用來標示重點。');
};

const satConceptQ = () => choice('在純色顏料裡混入一點它的「互補色」，彩度會？', ['降低，變得比較灰濁', '提高，變得更鮮豔', '完全不變', '變成白色'], 0,
  '互補色會互相抵消，混在一起彩度就降低了。畫家常用這個方法調出自然的灰色調。');

// ---------- 第 8 關：色調 ----------
const TONE_KINDS = [
  { label: '加白（Tint 淺色調）', w: 0.5, k: 0 },
  { label: '加黑（Shade 暗色調）', w: 0, k: 0.5 },
  { label: '加灰（Tone 濁色調）', w: 0.3, k: 0.3 },
];

function toneKindQ() {
  const base = pick(HUES12, 1)[0];
  const kind = randInt(0, 2);
  const t = TONE_KINDS[kind];
  const d = randInt(-10, 10) / 100;
  const v = tintMix(base.hex, t.w && t.w + d, t.k && t.k + d);
  return {
    ...choice('右邊的顏色，是左邊的純色加了什麼？', TONE_KINDS.map((x) => x.label), kind,
      '加白變淡、變柔和；加黑變深、變沉重；加灰（同時加白和黑）會變得含蓄、低調。',
      `<div class="eq">${swatch(base.hex, '純色')}<span class="eq-op">→</span>${swatch(v, '?')}</div>`),
    fixedOrder: true,
  };
}

function tintMixQ() {
  const base = pick(HUES12, 1)[0];
  let w = 0, k = 0;
  while (w + k === 0 || w + k > 0.8) { w = randInt(0, 6) / 10; k = randInt(0, 6) / 10; }
  return {
    type: 'mix', mode: 'tint', baseHex: base.hex, target: tintMix(base.hex, w, k), start: [0, 0],
    prompt: `在${base.name}裡加白、加黑，調出目標顏色`,
    explain: `目標是加了 ${Math.round(w * 100)}% 白、${Math.round(k * 100)}% 黑。只加白＝Tint，只加黑＝Shade，兩個都加＝Tone。`,
  };
}

function toneScaleQ() {
  const base = pick(HUES12, 1)[0];
  const items = [
    tintMix(base.hex, 0.75, 0), tintMix(base.hex, 0.5, 0), tintMix(base.hex, 0.25, 0), base.hex,
    tintMix(base.hex, 0, 0.3), tintMix(base.hex, 0, 0.55), tintMix(base.hex, 0, 0.8),
  ];
  return {
    type: 'sort', items, ends: ['最淺', '最深'],
    prompt: `把${base.name}的各種色調由淺到深排好`,
    explain: '越多白越淺（Tint），越多黑越深（Shade），中間是純色。',
  };
}

// ---------- 第 9 關：HSB ----------
function hsbMixQ(channels) {
  const h = randInt(0, 35) * 10;
  const s = randInt(6, 20) * 5 / 100;
  const v = randInt(10, 20) * 5 / 100;
  const base = { h, s, v };
  const start = channels.map((c) => (c === 'h' ? 0 : c === 's' ? 0.5 : 1));
  const names = { h: '色相', s: '飽和度', v: '明度' };
  return {
    type: 'mix', mode: 'hsv', channels, base, target: hsvHex(h, s, v), start,
    prompt: `調整${channels.map((c) => names[c]).join('、')}，做出目標顏色`,
    explain: `目標是 H ${h}°、S ${Math.round(s * 100)}%、B ${Math.round(v * 100)}%。先找色相，再調飽和度，最後調明度。`,
  };
}

function hsbReadQ() {
  const h = randInt(0, 11) * 30;
  const s = pick([0.4, 1], 1)[0];
  const v = pick([0.5, 1], 1)[0];
  const opts = [
    { color: hsvHex(h, s, v) },
    { color: hsvHex(h + 120, s, v) },
    { color: hsvHex(h, s === 1 ? 0.4 : 1, v) },
    { color: hsvHex(h, s, v === 1 ? 0.5 : 1) },
  ];
  return choice(`H ${h}°、S ${s * 100}%、B ${v * 100}% 是哪一個顏色？`, opts, 0,
    `H 決定是什麼顏色（${h}° 在色相環上的位置），S 決定鮮不鮮豔，B 決定亮不亮。`);
}

const hsbConcept = [
  () => choice('想讓一個顏色「變暗」，主要調整哪一個數值？', ['B 明度', 'H 色相', 'S 飽和度'], 0, 'B（Brightness）控制亮暗，降到 0% 就是黑色。'),
  () => choice('想讓顏色變得「灰濁、不鮮豔」，主要調整哪一個數值？', ['S 飽和度', 'H 色相', 'B 明度'], 0, 'S（Saturation）控制鮮豔程度，降到 0% 就變成灰色。'),
  () => choice('想把紅色換成藍色，主要調整哪一個數值？', ['H 色相', 'S 飽和度', 'B 明度'], 0, 'H（Hue）是色相環上的角度：紅 0°、藍 240°。'),
];

// ---------- 第 10 關：冷暖 ----------
const WARM = [0, 10, 20, 30, 40, 50, 345];
const COOL = [175, 185, 195, 205, 215, 225, 235];

function warmCoolQ() {
  const mk = (hs, cat) => pick(hs, 4).map((hh) => ({ color: hsvHex(hh, randInt(60, 100) / 100, randInt(75, 100) / 100), cat }));
  return {
    type: 'classify', categories: [{ label: '暖色 🔥' }, { label: '冷色 ❄️' }],
    items: [...mk(WARM, 0), ...mk(COOL, 1)],
    prompt: '把顏色分成暖色和冷色',
    explain: '紅、橙、黃讓人聯想到火和太陽，是暖色；青、藍讓人聯想到水和冰，是冷色。',
  };
}

function warmPaletteQ() {
  const pal = (hs) => hs.map((hh, i) => hsvHex(hh, 0.75 + (i % 2) * 0.2, 0.95 - (i % 3) * 0.12));
  const opts = [
    { palette: pal([0, 25, 45, 15]) },
    { palette: pal([190, 210, 230, 200]) },
    { palette: pal([120, 280, 150, 260]) },
  ];
  return choice('哪一組配色感覺最溫暖？', opts, 0, '由紅、橙、黃組成的配色最溫暖。第三組是綠和紫，屬於不冷不熱的中性色。');
}

const coolConcept = [
  () => choice('畫遠方的山，通常會用哪種顏色，讓它看起來比較遠？',
    [{ label: '偏藍的冷灰色', color: '#8fa6bf' }, { label: '鮮紅色', color: '#e53935' }, { label: '橙黃色', color: '#ffb300' }, { label: '深棕色', color: '#5d4037' }], 0,
    '冷色看起來會往後退，暖色會往前跑。加上空氣的影響，遠山看起來偏藍偏灰。'),
  () => choice('兩個一樣大的色塊，哪一個看起來比較靠近你？',
    [{ label: '紅橙色', color: '#ff5722' }, { label: '藍色', color: '#1e63d6' }], 0,
    '暖色是「前進色」，看起來比較近、比較大；冷色是「後退色」。'),
  () => choice('綠色和紫色通常被歸類為？', ['中性色（要看偏向哪一邊）', '一定是暖色', '一定是冷色', '無彩色'], 0,
    '綠和紫介於冷暖之間：黃綠偏暖、藍綠偏冷；紅紫偏暖、藍紫偏冷。'),
];

// ---------- 關卡定義 ----------
export const CH2 = {
  6: {
    learn: [
      { title: '什麼是明度？', body: '<b>明度</b>是顏色的明亮程度。最亮的是白色，最暗的是黑色，中間是一階一階的灰色，稱為<b>灰階</b>。', visual: paletteStrip([0, 12, 25, 37, 50, 62, 75, 87, 100].map(greyForL)) },
      { title: '每個色相的明度都不同', body: '純色也有亮暗之分。<b>黃色很亮</b>，<b>藍色和紫色很暗</b>。下面是純色和它們轉成黑白後的樣子：', visual: paletteStrip(HUES12.filter((_, i) => i % 2 === 0).map((x) => x.hex)) + paletteStrip(HUES12.filter((_, i) => i % 2 === 0).map((x) => greyForL(lightness(x.hex)))) },
      { title: '為什麼明度最重要？', body: '畫面清不清楚、有沒有層次，主要靠<b>明度對比</b>。小技巧：<b>瞇起眼睛</b>或把作品轉成黑白照片，就能檢查明度安排得好不好。', visual: `<div class="sw-row">${swatch('#ffeb3b', '黃（亮）')}${swatch('#1e3a8a', '深藍（暗）')}</div>` },
    ],
    practice: () => [valueSortQ(true), brighterQ(), greyEquivQ()],
    challenge: () => shuffle([valueSortQ(true), valueSortQ(false), brighterQ(), greyEquivQ(), greyMatchQ(), brighterQ()]),
  },
  7: {
    learn: [
      { title: '彩度（飽和度）', body: '<b>彩度</b>是顏色的鮮豔程度。純色的彩度最高；混入越多灰色，彩度越低，顏色越灰濁。', visual: paletteStrip([1, 0.8, 0.6, 0.4, 0.2, 0].map((s) => hsvHex(210, s, 0.85)), ['鮮', '', '', '', '', '灰']) },
      { title: '怎麼降低彩度？', body: '方法有兩種：<b>加灰色</b>，或者<b>加入一點互補色</b>。降低彩度的顏色看起來比較沉穩、自然、有質感。', visual: paletteStrip([1, 0.7, 0.45, 0.25].map((s) => hsvHex(10, s, 0.85))) },
      { title: '彩度的用途', body: '<b>高彩度</b>吸引目光，適合用在重點；<b>低彩度</b>低調沉穩，適合當背景。在一片低彩度裡放一點高彩度，重點就出來了！', visual: paletteStrip([hsvHex(30, 0.12, 0.8), hsvHex(200, 0.1, 0.7), hsvHex(0, 1, 0.95), hsvHex(90, 0.1, 0.75)]) },
    ],
    practice: () => [vividQ(true), satSortQ(), satMixQ()],
    challenge: () => shuffle([satSortQ(), vividQ(true), vividQ(false), satMixQ(), satUseQ(), satConceptQ()]),
  },
  8: {
    learn: [
      { title: 'Tint 淺色調＝加白', body: '在純色裡加<b>白色</b>，顏色變淡、變柔和，就是<b>淺色調（Tint）</b>。粉紅色就是紅色的淺色調，常給人溫柔、夢幻的感覺。', visual: paletteStrip([0, 0.2, 0.4, 0.6, 0.8].map((w) => tintMix('#ff0000', w, 0))) },
      { title: 'Shade 暗色調＝加黑', body: '在純色裡加<b>黑色</b>，顏色變深、變沉重，就是<b>暗色調（Shade）</b>。例如酒紅、深藍，給人穩重、成熟的感覺。', visual: paletteStrip([0, 0.2, 0.4, 0.6, 0.8].map((k) => tintMix('#ff0000', 0, k))) },
      { title: 'Tone 濁色調＝加灰', body: '同時加白和黑（也就是加<b>灰色</b>），就是<b>濁色調（Tone）</b>。顏色變得含蓄、低調、有高級感，莫蘭迪色就屬於這一類。', visual: paletteStrip([0, 0.15, 0.25, 0.35, 0.45].map((g) => tintMix('#ff0000', g, g))) },
    ],
    practice: () => [toneKindQ(), toneKindQ(), tintMixQ()],
    challenge: () => shuffle([toneKindQ(), toneKindQ(), toneKindQ(), tintMixQ(), tintMixQ(), toneScaleQ()]),
  },
  9: {
    learn: [
      { title: '用三個數字描述顏色', body: '<b>H 色相</b>（0～360°）：色相環上的位置。<br><b>S 飽和度</b>（0～100%）：鮮不鮮豔。<br><b>B 明度</b>（0～100%）：亮不亮。<br>設計軟體裡常看到的 HSB（或 HSV）就是這三個數字。', visual: hueRing([[0, 'H 0°'], [120, '120°'], [240, '240°']]) },
      { title: '取色器的祕密', body: '取色器通常是一個方塊加一條色相條：先在色相條上選<b>色相</b>，再在方塊裡<b>往右</b>提高飽和度、<b>往上</b>提高明度。', visual: svSquare(hsvHex(210)) },
      { title: '調色三步驟', body: '① 先找對<b>色相</b>（是什麼顏色）<br>② 再調<b>飽和度</b>（鮮豔還是灰濁）<br>③ 最後調<b>明度</b>（亮還是暗）<br>照這個順序，就能又快又準地調出想要的顏色。', visual: paletteStrip([hsvHex(210, 1, 1), hsvHex(210, 0.6, 1), hsvHex(210, 0.6, 0.7)], ['H', '+S', '+B']) },
    ],
    practice: () => [hsbMixQ(['h']), hsbReadQ(), hsbMixQ(['s', 'v'])],
    challenge: () => shuffle([hsbMixQ(['h', 's', 'v']), hsbMixQ(['h', 's', 'v']), hsbMixQ(['s', 'v']), hsbReadQ(), hsbReadQ(), pick(hsbConcept, 1)[0]()]),
  },
  10: {
    learn: [
      { title: '暖色', body: '<b>紅、橙、黃</b>讓人聯想到火焰和太陽，感覺溫暖、熱情、有活力，稱為<b>暖色</b>。', visual: paletteStrip([0, 15, 30, 45, 55].map((d) => hsvHex(d, 0.9, 1))) },
      { title: '冷色', body: '<b>青、藍</b>讓人聯想到海水和冰，感覺涼爽、冷靜、理性，稱為<b>冷色</b>。', visual: paletteStrip([180, 195, 210, 225, 240].map((d) => hsvHex(d, 0.9, 0.95))) },
      { title: '中性色', body: '<b>綠色和紫色</b>介於冷暖之間，要看偏向哪一邊：黃綠偏暖、藍綠偏冷。黑、白、灰沒有色相，稱為<b>無彩色</b>。', visual: paletteStrip([90, 120, 150, 270, 300].map((d) => hsvHex(d, 0.8, 0.9))) },
      { title: '前進色與後退色', body: '暖色看起來比較<b>近</b>、比較大，叫<b>前進色</b>；冷色看起來比較<b>遠</b>，叫<b>後退色</b>。所以風景畫裡的遠山常畫成偏藍的顏色。', visual: `<div class="sw-row">${swatch('#ff5722', '前進')}${swatch('#1e63d6', '後退')}</div>` },
    ],
    practice: () => [warmCoolQ(), warmPaletteQ(), coolConcept[1]()],
    challenge: () => shuffle([warmCoolQ(), warmCoolQ(), warmPaletteQ(), ...coolConcept.map((f) => f())]),
  },
};
