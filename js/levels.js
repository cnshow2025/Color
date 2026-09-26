// 關卡資料：20 關的名單 + 已完成關卡的教學卡片與題目
import { HUES12, KIND_NAMES, hsvHex, rgbToHex, pick, shuffle, randInt } from './color-utils.js';
import { swatch, swatchRow, equation, venn, rainbowBar, wheel12, hueRing } from './visuals.js';

export const CHAPTERS = [
  { id: 1, name: '顏色從哪裡來', levels: [1, 2, 3, 4, 5] },
  { id: 2, name: '顏色的三個屬性', levels: [6, 7, 8, 9, 10] },
  { id: 3, name: '配色關係', levels: [11, 12, 13, 14, 15, 16] },
  { id: 4, name: '色彩的感覺與應用', levels: [17, 18, 19, 20] },
];

// ---------- 題目產生小工具 ----------
const choice = (prompt, options, answer, explain, visual) => ({
  type: 'choice', prompt, explain, visual,
  options: options.map((o) => (typeof o === 'string' ? { label: o } : o)),
  answer,
});

const mixQ = (mode, target, prompt, explain, step = 5) => ({
  type: 'mix', mode, target, prompt, explain, step,
});

const C = { R: '#ff0000', G: '#00ff00', B: '#0000ff', C: '#00ffff', M: '#ff00ff', Y: '#ffff00', W: '#ffffff', K: '#000000' };

// ---------- 第 1 關：光與色 ----------
function dominantLightQ() {
  const k = randInt(0, 2);
  const rgb = [randInt(0, 110), randInt(0, 110), randInt(0, 110)];
  rgb[k] = randInt(210, 255);
  const names = ['紅光', '綠光', '藍光'];
  return choice('這個顏色裡，哪一種光最多？',
    [{ label: '紅光 R', color: C.R }, { label: '綠光 G', color: C.G }, { label: '藍光 B', color: C.B }],
    k, `螢幕上的每個顏色都是 R、G、B 三種光的組合。這個顏色的${names[k]}最強，所以看起來偏${names[k][0]}。`,
    swatch(rgbToHex(rgb), '', 'lg'));
}

const L1_POOL = () => [
  choice('光的三原色是哪三個？', ['紅、綠、藍', '紅、黃、藍', '青、洋紅、黃', '黑、白、灰'], 0,
    '光的三原色是紅(R)、綠(G)、藍(B)，對應眼睛裡三種感光細胞。'),
  choice('香蕉看起來是黃色，是因為香蕉……', ['反射了黃色的光', '吸收了黃色的光', '自己會發出黃光', '眼睛只看得到黃色'], 0,
    '物體會吸收一部分的光，把剩下的反射到我們眼睛。香蕉反射的光讓我們看到黃色。'),
  choice('在完全沒有光的房間裡，紅蘋果看起來是？', ['黑色（看不見顏色）', '紅色', '白色', '灰紅色'], 0,
    '沒有光就沒有東西可以反射，所以看不到任何顏色。顏色是光帶來的！'),
  choice('白色的紙張會……', ['反射幾乎所有顏色的光', '吸收所有顏色的光', '只反射白光', '只反射藍光'], 0,
    '白色物體把各種顏色的光都反射回來，混在一起就是白色。'),
  choice('黑色的衣服在太陽下比較熱，是因為它……', ['吸收了大部分的光', '反射了大部分的光', '會發光', '比較厚'], 0,
    '黑色物體吸收幾乎所有的光，光的能量變成熱，所以摸起來比較熱。'),
  choice('手機螢幕上的每個像素，是由哪三種小燈組成？', ['紅、綠、藍', '紅、黃、藍', '白、黑、灰', '青、洋紅、黃'], 0,
    '螢幕用 R、G、B 三種小燈調整亮度，就能組出各種顏色。'),
  choice('用三稜鏡把陽光分開，會看到什麼？', ['彩虹般的各種顏色', '只有白色', '只有紅色', '變成黑色'], 0,
    '陽光（白光）其實包含了彩虹裡所有顏色的光，三稜鏡把它們分開了。'),
];

// ---------- 第 2 關：加法混色 ----------
const LIGHT_TARGETS = [
  { hex: '#ffff00', name: '黃色', how: '紅光 + 綠光' },
  { hex: '#00ffff', name: '青色', how: '綠光 + 藍光' },
  { hex: '#ff00ff', name: '洋紅色', how: '紅光 + 藍光' },
  { hex: '#ffffff', name: '白色', how: '紅 + 綠 + 藍三種光全開' },
  { hex: rgbToHex([255, 128, 0]), name: '橙色', how: '紅光全開 + 綠光一半' },
  { hex: rgbToHex([128, 0, 255]), name: '紫色', how: '藍光全開 + 紅光一半' },
  { hex: rgbToHex([0, 128, 255]), name: '天藍色', how: '藍光全開 + 綠光一半' },
  { hex: rgbToHex([128, 128, 128]), name: '灰色', how: '三種光都開一半' },
  { hex: rgbToHex([255, 128, 191]), name: '粉紅色', how: '紅光全開 + 綠光一半 + 藍光 75%' },
];
const lightMixQ = (t) => mixQ('light', t.hex, `調整三種光，混出「${t.name}」`, `${t.name} = ${t.how}。光疊加得越多越亮。`);

// ---------- 第 3 關：減法混色 ----------
const PIGMENT_TARGETS = [
  { hex: '#ff0000', name: '紅色', how: '洋紅 + 黃' },
  { hex: '#00ff00', name: '綠色', how: '青 + 黃' },
  { hex: '#0000ff', name: '藍色', how: '青 + 洋紅' },
  { hex: '#000000', name: '黑色', how: '青 + 洋紅 + 黃 全部加滿' },
  { hex: rgbToHex([255, 128, 0]), name: '橙色', how: '黃 100% + 洋紅 50%' },
  { hex: rgbToHex([128, 0, 255]), name: '紫色', how: '洋紅 100% + 青 50%' },
  { hex: rgbToHex([179, 102, 0]), name: '棕色', how: '黃 100% + 洋紅 60% + 青 30%' },
  { hex: rgbToHex([255, 128, 128]), name: '淺紅色', how: '洋紅 50% + 黃 50%（顏料少一點就比較淡）' },
];
const pigmentMixQ = (t) => mixQ('pigment', t.hex, `調整三種顏料，混出「${t.name}」`, `${t.name} = ${t.how}。顏料加得越多越暗。`);

// ---------- 第 4 關：原色、二次色、三次色 ----------
const PRIMARY = HUES12.filter((x) => x.kind === 'primary').map((x) => x.index);
const SECONDARY = HUES12.filter((x) => x.kind === 'secondary').map((x) => x.index);
const TERTIARY = HUES12.filter((x) => x.kind === 'tertiary').map((x) => x.index);

function slotQ(target, lit, withName) {
  const t = HUES12[target];
  const why = t.kind === 'tertiary' ? `${t.name}是三次色，由「${t.mix}」混成，所以夾在它們兩個中間。`
    : t.kind === 'secondary' ? `${t.name}是二次色，由「${t.mix}」混成，所以在這兩個原色的正中間。`
    : `${t.name}是原色。`;
  return {
    type: 'wheel', mode: 'slots', target, lit,
    prompt: withName ? `把「${t.name}」放進色相環正確的位置` : '這塊顏色應該放在色相環的哪一格？',
    pieceLabel: withName ? t.name : null,
    explain: why,
  };
}

function kindQ(idx) {
  const t = HUES12[idx];
  const kinds = ['primary', 'secondary', 'tertiary'];
  const q = choice('這個顏色屬於哪一類？（以顏料三原色 CMY 為原色）',
    kinds.map((k) => KIND_NAMES[k]), kinds.indexOf(t.kind),
    t.kind === 'primary' ? `${t.name}是原色，不能由其他顏色混出來。` : `${t.name}＝${t.mix}，是${KIND_NAMES[t.kind]}。`,
    swatch(t.hex, '', 'lg'));
  return { ...q, fixedOrder: true };
}

function mixNameQ(idx) {
  const t = HUES12[idx];
  const wrong = pick(HUES12.filter((x) => x.index !== idx && x.kind === t.kind), 3);
  const opts = shuffle([t, ...wrong]);
  return choice(`${t.mix} ＝ ？`, opts.map((o) => ({ label: o.name, color: o.hex })),
    opts.indexOf(t), `${t.mix} 混合後得到${t.name}，它是${KIND_NAMES[t.kind]}。`);
}

// ---------- 第 5 關：色相環 ----------
function hueSortQ(count) {
  // 從紅色 0° 開始，挑出彼此至少相隔 25° 的色相
  const hues = [0];
  let guard = 0;
  while (hues.length < count && guard++ < 500) {
    const d = randInt(20, 340);
    if (hues.every((x) => Math.abs(x - d) >= 25) && 360 - d >= 25) hues.push(d);
  }
  hues.sort((a, b) => a - b);
  return {
    type: 'sort', items: hues.map((d) => hsvHex(d)), fixedFirst: true, ends: ['紅 0°', '順時針 → 360°'],
    prompt: '從紅色開始，依照色相環「順時針」的順序排好',
    explain: '色相環的順序和彩虹一樣：紅 → 橙 → 黃 → 綠 → 青 → 藍 → 紫 → 洋紅，再回到紅。',
  };
}

function hueTapQ(deg) {
  const d = deg ?? randInt(0, 359);
  return {
    type: 'wheel', mode: 'hue', target: d,
    prompt: '這個顏色在色相環上的哪個位置？',
    explain: '記住幾個關鍵角度：紅 0°、黃 60°、綠 120°、青 180°、藍 240°、洋紅 300°。',
  };
}

function hueAngleQ() {
  const keys = [[0, '紅'], [60, '黃'], [120, '綠'], [180, '青'], [240, '藍'], [300, '洋紅']];
  const [deg, name] = keys[randInt(0, keys.length - 1)];
  const opts = shuffle(keys).slice(0, 4);
  if (!opts.some(([d]) => d === deg)) opts[0] = [deg, name];
  const final = shuffle(opts);
  return choice(`色相環上 ${deg}° 是什麼顏色？`, final.map(([d, n]) => ({ label: n, color: hsvHex(d) })),
    final.findIndex(([d]) => d === deg), `紅 0°、黃 60°、綠 120°、青 180°、藍 240°、洋紅 300°，每 60° 換一個主要色相。`);
}

// ---------- 關卡定義 ----------
const IMPLEMENTED = {
  1: {
    learn: [
      { title: '顏色其實是光', body: '沒有光，就看不到顏色。陽光看起來是白色，但它其實包含了彩虹裡的所有顏色。牛頓用三稜鏡把白光分開，看到了紅、橙、黃、綠、藍、紫。', visual: rainbowBar() },
      { title: '物體為什麼有顏色？', body: '物體會<b>吸收</b>一部分的光，把剩下的<b>反射</b>到我們眼睛。紅蘋果吸收了大部分的光，只反射紅光；白紙反射所有的光；黑衣服則幾乎全部吸收。', visual: swatchRow([['#d62828', '反射紅光'], ['#ffffff', '全部反射'], ['#111111', '全部吸收']]) },
      { title: '光的三原色 RGB', body: '眼睛的視網膜上有三種感光細胞，分別對<b>紅 R</b>、<b>綠 G</b>、<b>藍 B</b> 的光最敏感。所以只要用這三種光調整強弱，就能組合出幾乎所有顏色。手機、電視螢幕就是這樣運作的。', visual: swatchRow([[C.R, '紅 R'], [C.G, '綠 G'], [C.B, '藍 B']]) },
    ],
    practice: () => [...L1_POOL().slice(0, 3), dominantLightQ()],
    challenge: () => shuffle([...pick(L1_POOL(), 4), dominantLightQ(), dominantLightQ()]),
  },
  2: {
    learn: [
      { title: '光越加越亮', body: '把不同顏色的光照在同一個地方，亮度會<b>相加</b>，所以叫做<b>加法混色</b>。螢幕、舞台燈光、投影機都是用這個原理。', visual: venn('light') },
      { title: '兩兩相加', body: '紅光 + 綠光 = <b>黃</b>；綠光 + 藍光 = <b>青</b>；藍光 + 紅光 = <b>洋紅</b>；三種光全部加在一起 = <b>白</b>。', visual: equation([[C.R, '紅'], [C.G, '綠']], [C.Y, '黃']) + equation([[C.G, '綠'], [C.B, '藍']], [C.C, '青']) + equation([[C.B, '藍'], [C.R, '紅']], [C.M, '洋紅']) },
      { title: '調整強弱，顏色更多', body: '每一種光不只是「開」或「關」，還可以調整亮度。例如紅光全開、綠光開一半，就會得到<b>橙色</b>。接下來換你動手試試看！', visual: equation([[C.R, '紅 100%'], ['#008000', '綠 50%']], ['#ff8000', '橙']) },
    ],
    practice: () => [lightMixQ(LIGHT_TARGETS[0]), lightMixQ(LIGHT_TARGETS[3]),
      choice('綠光 + 藍光 ＝ ？', [{ label: '青', color: C.C }, { label: '黃', color: C.Y }, { label: '洋紅', color: C.M }, { label: '白', color: C.W }], 0, '綠光 + 藍光 = 青（Cyan）。')],
    challenge: () => shuffle([
      ...pick(LIGHT_TARGETS.slice(0, 4), 2).map(lightMixQ),
      ...pick(LIGHT_TARGETS.slice(4), 2).map(lightMixQ),
      choice('紅光 + 綠光 ＝ ？', [{ label: '黃', color: C.Y }, { label: '棕', color: '#8b5a2b' }, { label: '青', color: C.C }, { label: '白', color: C.W }], 0, '紅光 + 綠光 = 黃。和顏料不一樣，光混在一起會變亮！'),
      choice('為什麼叫「加法」混色？', ['光疊加時亮度會相加，越混越亮', '要用加號計算顏色', '顏色會越混越暗', '只能加兩種顏色'], 0, '光疊在一起，亮度相加，越混越亮，三原色全加就是白色。'),
    ]),
  },
  3: {
    learn: [
      { title: '顏料越混越暗', body: '顏料自己不會發光，它是<b>吸收（減去）</b>一部分光，把剩下的反射出來。混入越多顏料，被吸走的光越多，顏色就越暗，所以叫做<b>減法混色</b>。', visual: venn('pigment') },
      { title: '顏料三原色 CMY', body: '<b>青 C</b> 吸收紅光、<b>洋紅 M</b> 吸收綠光、<b>黃 Y</b> 吸收藍光。印表機的墨水就是 C、M、Y 再加上黑色 K（CMYK）。', visual: swatchRow([[C.C, '青 C：吸收紅'], [C.M, '洋紅 M：吸收綠'], [C.Y, '黃 Y：吸收藍']]) },
      { title: '兩兩相混', body: '洋紅 + 黃 = <b>紅</b>；青 + 黃 = <b>綠</b>；青 + 洋紅 = <b>藍</b>；三種全部加滿 ≈ <b>黑</b>。有沒有發現？顏料混出來的正好是光的三原色！', visual: equation([[C.M, '洋紅'], [C.Y, '黃']], [C.R, '紅']) + equation([[C.C, '青'], [C.Y, '黃']], [C.G, '綠']) + equation([[C.C, '青'], [C.M, '洋紅']], [C.B, '藍']) },
      { title: '那「紅黃藍」呢？', body: '美術課常說的三原色是<b>紅、黃、藍（RYB）</b>，這是早期畫家的經驗說法。用它混不出鮮豔的青色和洋紅。現代印刷和色彩科學使用更準確的 <b>CMY</b>，本遊戲也以 CMY 為主。', visual: swatchRow([['#e03131', '紅'], ['#ffd43b', '黃'], ['#1c56b8', '藍']]) },
    ],
    practice: () => [pigmentMixQ(PIGMENT_TARGETS[0]), pigmentMixQ(PIGMENT_TARGETS[1]),
      choice('青色顏料吸收了哪一種光？', [{ label: '紅光', color: C.R }, { label: '綠光', color: C.G }, { label: '藍光', color: C.B }], 0, '青 = 白光 − 紅光，所以青色顏料把紅光吸收掉了。', swatch(C.C, '青', 'lg'))],
    challenge: () => shuffle([
      ...pick(PIGMENT_TARGETS.slice(0, 4), 2).map(pigmentMixQ),
      ...pick(PIGMENT_TARGETS.slice(4), 2).map(pigmentMixQ),
      choice('印表機墨水 CMYK 中的 K 代表？', ['黑色', '藍色', '粉紅色', '白色'], 0, 'K 是黑色（Key）。CMY 混出來的黑不夠純又浪費墨水，所以另外加黑色墨水。'),
      choice('顏料混得越多，顏色會？', ['越暗', '越亮', '不變', '變成白色'], 0, '每多一種顏料就多吸收一部分光，反射回來的光越少，所以越暗。'),
    ]),
  },
  4: {
    learn: [
      { title: '原色', body: '<b>原色</b>是不能用其他顏色混出來的顏色。本遊戲的色相環用顏料三原色<b>青、洋紅、黃</b>當作原色。', visual: wheel12({ lit: PRIMARY }) },
      { title: '二次色', body: '兩個原色混合得到<b>二次色</b>：洋紅 + 黃 = 紅、青 + 黃 = 綠、青 + 洋紅 = 藍。它們剛好是光的三原色——光和顏料的原色正好互為對方的二次色！', visual: wheel12({ lit: [...PRIMARY, ...SECONDARY] }) },
      { title: '三次色', body: '原色 + 旁邊的二次色 = <b>三次色</b>，例如黃 + 紅 = 橙、黃 + 綠 = 黃綠。6 個三次色補進空格，就完成了 <b>12 色相環</b>。', visual: wheel12({ lit: 'all' }) },
    ],
    practice: () => [slotQ(1, [...PRIMARY, ...SECONDARY], true), slotQ(4, PRIMARY, true), mixNameQ(pick(TERTIARY, 1)[0])],
    challenge: () => {
      const ts = pick(TERTIARY, 2);
      const sc = pick(SECONDARY, 1);
      return shuffle([
        slotQ(ts[0], [...PRIMARY, ...SECONDARY], false),
        slotQ(sc[0], PRIMARY, false),
        slotQ(ts[1], PRIMARY, false),
        kindQ(pick(TERTIARY, 1)[0]),
        kindQ(pick([...PRIMARY, ...SECONDARY], 1)[0]),
        mixNameQ(pick([...SECONDARY, ...TERTIARY], 1)[0]),
      ]);
    },
  },
  5: {
    learn: [
      { title: '色相 Hue', body: '<b>色相</b>就是「顏色的種類」：紅、橙、黃、綠、藍、紫……把色相依照彩虹的順序排成一圈，最後的洋紅又接回紅色，就成了<b>色相環</b>。', visual: hueRing() },
      { title: '用角度表示色相', body: '色相可以用 0°～360° 表示：<b>紅 0°、黃 60°、綠 120°、青 180°、藍 240°、洋紅 300°</b>。每轉 60° 就換一個主要色相。', visual: hueRing([[0, '紅 0°'], [60, '黃 60°'], [120, '綠 120°'], [180, '青 180°'], [240, '藍 240°'], [300, '洋紅 300°']]) },
      { title: '為什麼要學色相環？', body: '後面的配色技巧，像是<b>互補色、類似色、三角配色</b>，都是用色相環上的「位置關係」找顏色。所以先把色相環記熟，後面就輕鬆了！', visual: wheel12({ lit: 'all', labels: false }) },
    ],
    practice: () => [hueSortQ(5), hueTapQ(60), hueAngleQ()],
    challenge: () => shuffle([hueSortQ(6), hueSortQ(7), hueTapQ(), hueTapQ(), hueTapQ(), hueAngleQ()]),
  },
};

const TITLES = [
  '光與色', '加法混色', '減法混色', '原色、二次色、三次色', '色相環',
  '明度', '彩度', '色調', 'HSB 綜合調色', '冷色與暖色',
  '單色配色', '類似色', '互補色', '分裂互補', '三角配色', '四角配色',
  '同時對比', '對比與可讀性', '色彩心理與比例', '畢業大考',
];

const SUBTITLES = [
  '顏色從哪裡來？認識光的三原色', '光越混越亮', '顏料越混越暗', '12 色相環的組成', '色相的順序與角度',
  '顏色的亮與暗', '鮮豔與灰濁', '加白、加灰、加黑', '用三個數值描述顏色', '顏色的溫度感',
  '同一色相做出層次', '色相環上的鄰居', '對比最強的一對', '比互補柔和的對比', '相隔 120° 的三個顏色', '四個顏色的平衡',
  '顏色會騙人', '文字看得清楚嗎？', '情緒與 60-30-10', '綜合設計挑戰',
];

export const LEVELS = TITLES.map((title, i) => {
  const id = i + 1;
  const chapter = CHAPTERS.find((c) => c.levels.includes(id)).id;
  return { id, chapter, title, subtitle: SUBTITLES[i], hue: i * 18, ...(IMPLEMENTED[id] || {}), ready: !!IMPLEMENTED[id] };
});
