// 第 3 章：配色關係（第 11～16 關）
import { HUES12, hsvHex, hexToHsv, hueDistance, lightness, tintMix, pick, shuffle, randInt } from '../color-utils.js';
import { swatch, paletteStrip, wheel12, ratioBar } from '../visuals.js';
import { choice } from './common.js';

const mod12 = (i) => ((i % 12) + 12) % 12;

// 各種配色在 12 色相環上的格子
export const SCHEMES = {
  mono: { name: '單色配色', of: (b) => [b] },
  analog: { name: '類似色', of: (b) => [b - 1, b, b + 1].map(mod12) },
  comp: { name: '互補色', of: (b) => [b, b + 6].map(mod12) },
  split: { name: '分裂互補', of: (b) => [b, b + 5, b + 7].map(mod12) },
  triad: { name: '三角配色', of: (b) => [b, b + 4, b + 8].map(mod12) },
  square: { name: '四角配色', of: (b) => [b, b + 3, b + 6, b + 9].map(mod12) },
};

// 把一組格子做成好看一點的配色（略為調整飽和度與明度）
export function schemePalette(type, b) {
  if (type === 'mono') {
    const hex = HUES12[b].hex;
    return [tintMix(hex, 0.7, 0), tintMix(hex, 0.35, 0), hex, tintMix(hex, 0, 0.35), tintMix(hex, 0, 0.6)];
  }
  return SCHEMES[type].of(b).map((i, k) => hsvHex(HUES12[i].deg, [0.85, 0.7, 0.95, 0.75][k % 4], [0.95, 0.85, 0.9, 0.8][k % 4]));
}

function identifyQ(type, others) {
  const b = randInt(0, 11);
  const types = shuffle([type, ...pick(others.filter((t) => t !== type), 3)]);
  return {
    ...choice('這組配色是哪一種？', types.map((t) => SCHEMES[t].name), types.indexOf(type),
      `它們在色相環上的位置：${SCHEMES[type].of(b).map((i) => HUES12[i].name).join('、')}，這是「${SCHEMES[type].name}」。`,
      paletteStrip(schemePalette(type, b))),
  };
}

function whichPaletteQ(type, others) {
  const types = shuffle([type, ...pick(others.filter((t) => t !== type), 2)]);
  return choice(`哪一組是「${SCHEMES[type].name}」？`, types.map((t) => ({ palette: schemePalette(t, randInt(0, 11)) })), types.indexOf(type),
    `找出它們在色相環上的位置關係，就能判斷是哪一種配色。`);
}

function pickQ(type, b = randInt(0, 11)) {
  const all = SCHEMES[type].of(b);
  const given = type === 'rect' ? [b, mod12(b + 2)] : [b];
  const answer = all.filter((i) => !given.includes(i));
  const tips = {
    analog: '類似色是色相環上左右相鄰的顏色。',
    comp: '互補色在色相環的正對面，相差 180°（隔 6 格）。',
    split: '分裂互補是「互補色的左右兩格」，相差 150° 和 210°。',
    triad: '三角配色每隔 120°（隔 4 格）取一個顏色。',
    square: '正方形四角配色每隔 90°（隔 3 格）取一個顏色。',
  };
  const names = given.map((i) => HUES12[i].name).join('、');
  return {
    type: 'wheel', mode: 'pick', given, answer,
    prompt: `以★「${names}」為主色，選出${SCHEMES[type].name}的另外 ${answer.length} 個顏色`,
    explain: tips[type],
  };
}

// 上色題用：判斷顏色屬於哪個色相（12 格）
const hueIndex = (hex) => Math.round(hexToHsv(hex)[0] / 30) % 12;

// ---------- 第 11 關：單色配色 ----------
function monoPaintQ() {
  const hues = pick([0, 2, 4, 6, 8, 10], 3);
  // 每組：淺色、純色、兩個暗色（黃、綠、青本身很亮，加白後和純色幾乎一樣亮，所以多給暗色）
  const groups = hues.map((i) => {
    const hex = HUES12[i].hex;
    return { label: `${HUES12[i].name}色系`, colors: [tintMix(hex, 0.6, 0), hex, tintMix(hex, 0, 0.35), tintMix(hex, 0, 0.65)] };
  });
  const ex = groups[0].colors;
  return {
    type: 'paint', scene: 'poster', groups,
    prompt: '用「單色配色」替風景上色：只能從同一組色系挑顏色，而且要有深有淺',
    explain: '單色配色只用一個色相，靠明度（深淺）變化做出層次。至少要用 3 種深淺，畫面才不會平平的。',
    example: { sky: ex[0], mountain: ex[2], ground: ex[3], sun: ex[1] },
    exampleNote: `範例只用了「${groups[0].label}」的 4 個深淺：天空最淺、太陽是純色、山比較深、地面最深。`,
    check(fills, regions) {
      const cols = regions.map((r) => fills[r.id]);
      const idx = cols.map(hueIndex);
      const counts = {};
      idx.forEach((i) => (counts[i] = (counts[i] || 0) + 1));
      const same = Math.max(...Object.values(counts));
      const usedHues = Object.keys(counts).map((i) => HUES12[i].name);
      const nColors = new Set(cols).size;
      const Ls = [...new Set(cols)].map(lightness).sort((a, b) => a - b);
      let levels = Ls.length ? 1 : 0;
      for (let k = 1; k < Ls.length; k++) if (Ls[k] - Ls[k - 1] >= 8) levels++;
      const score = (same === cols.length ? 0.7 : (same / cols.length) * 0.4) + (levels >= 3 ? 0.3 : levels === 2 ? 0.15 : 0);
      const notes = [];
      notes.push(same === cols.length
        ? `✓ ${nColors} 個顏色都屬於同一個色相（${usedHues[0]}）`
        : `✗ 你用了 ${nColors} 個顏色，但它們屬於 ${usedHues.length} 種色相（${usedHues.join('、')}）。單色配色的顏色都要來自同一組色系`);
      notes.push(levels >= 3 ? `✓ 有 ${levels} 種深淺，層次豐富` : `✗ 只有 ${levels} 種深淺，至少要 3 種`);
      return { score, correct: score >= 0.99, detail: notes.join('；') };
    },
  };
}

function monoSortQ() {
  const b = randInt(0, 11);
  const hex = HUES12[b].hex;
  return {
    type: 'sort', items: [tintMix(hex, 0, 0.7), tintMix(hex, 0, 0.4), hex, tintMix(hex, 0.4, 0), tintMix(hex, 0.75, 0)], ends: ['深', '淺'],
    prompt: '這組單色配色，由深到淺排好',
    explain: '單色配色的每個顏色都是同一個色相，只是加了不同份量的黑或白。',
  };
}

// ---------- 第 13 關：互補色 ----------
function compTimedQ() {
  const b = randInt(0, 11);
  const t = HUES12[mod12(b + 6)];
  const wrong = pick(HUES12.filter((x) => ![b, t.index].includes(x.index)), 3);
  const opts = [t, ...wrong];
  return {
    ...choice(`快！「${HUES12[b].name}」的互補色是？`, opts.map((o) => ({ label: o.name, color: o.hex })), 0,
      `${HUES12[b].name}（${HUES12[b].deg}°）的正對面是${t.name}（${t.deg}°）。`, swatch(HUES12[b].hex, HUES12[b].name, 'md')),
    timeLimit: 8,
  };
}

function compHueQ() {
  const d = randInt(0, 359);
  return {
    type: 'wheel', mode: 'hue', target: (d + 180) % 360, show: hsvHex(d),
    caption: '中間是題目顏色，點出它的「互補色」位置',
    prompt: '這個顏色的互補色，在色相環的哪裡？',
    explain: `題目顏色在 ${d}°，互補色在正對面：${d} + 180 = ${(d + 180) % 360}°。`,
  };
}

const compConcept = [
  () => choice('把一對互補色的顏料混在一起，會變成？', ['灰色或接近黑色（彩度降低）', '更鮮豔的顏色', '白色', '第三個原色'], 0,
    '互補色會互相抵消，混合後彩度降低，變成灰色或深褐色。'),
  () => choice('一對互補色並排放在一起，會有什麼效果？', ['互相襯托，兩個都顯得更鮮豔', '兩個都變暗', '看起來沒有差別', '顏色會混在一起'], 0,
    '互補色是對比最強的組合，放在一起會讓彼此看起來更鮮明。'),
  () => choice('盯著紅色看 30 秒，再看白牆，會看到什麼顏色的殘影？', [{ label: '青色', color: '#00ffff' }, { label: '紅色', color: '#ff0000' }, { label: '黃色', color: '#ffff00' }, { label: '黑色', color: '#000000' }], 0,
    '眼睛的紅色感光細胞累了，看白色時紅光感覺變弱，就出現了紅色的互補色：青色。'),
];

// ---------- 第 15 關：三角配色上色 ----------
function triadPaintQ() {
  const groups = HUES12.map((x) => ({ label: x.name, colors: [hsvHex(x.deg, 0.85, 0.95), hsvHex(x.deg, 0.35, 1)] }));
  const b = randInt(0, 3);
  const [A, B, Cc] = [b, b + 4, b + 8].map((i) => groups[i]);
  return {
    type: 'paint', scene: 'poster', groups, groupCols: 3,
    prompt: '用「三角配色」替風景上色：剛好用 3 個在色相環上相隔 120° 的色相',
    explain: '三角配色是在色相環上畫一個正三角形。每一組色相有鮮豔和淺色兩個版本，可以混著用，但總共只能用 3 組。',
    example: { sky: A.colors[1], mountain: B.colors[0], ground: Cc.colors[0], sun: A.colors[0] },
    exampleNote: `範例用了「${A.label}、${B.label}、${Cc.label}」三組，它們在色相環上正好相隔 120°（隔 4 格）。`,
    check(fills, regions) {
      const cols = regions.map((r) => fills[r.id]);
      const set = [...new Set(cols.map(hueIndex))];
      let pairs = 0;
      for (let a = 0; a < set.length; a++) for (let c = a + 1; c < set.length; c++) {
        if (hueDistance(set[a] * 30, set[c] * 30) === 120) pairs++;
      }
      let score;
      if (set.length === 3) score = pairs / 3;
      else if (set.length < 3) score = 0.3 * pairs;
      else score = Math.max(0, pairs / 3 - 0.3);
      const names = set.map((i) => HUES12[i].name).join('、');
      const ok = set.length === 3 && pairs === 3;
      return {
        score, correct: ok,
        detail: `你用了 ${new Set(cols).size} 個顏色，屬於 ${set.length} 個色相（${names}）` +
          (ok ? '，剛好是正三角形！' : '。三角配色要剛好 3 個色相，彼此相隔 120°。'),
      };
    },
  };
}

// ---------- 關卡定義 ----------
const ALL = ['mono', 'analog', 'comp', 'split', 'triad', 'square'];

export const CH3 = {
  11: {
    learn: [
      { title: '單色配色', body: '只用<b>一個色相</b>，靠加白、加黑做出深淺變化。這是最簡單、最不容易出錯的配色。', visual: paletteStrip(schemePalette('mono', 8)) },
      { title: '祕訣：拉開明度', body: '單色配色最怕<b>太平淡</b>。記得同時使用很淺、中間、很深的顏色，明度差距拉開，層次就出來了。', visual: paletteStrip(schemePalette('mono', 0).slice(1, 4)) + paletteStrip(schemePalette('mono', 0)) },
      { title: '生活中的單色配色', body: '一身深淺不同的藍色牛仔穿搭、只用咖啡色系的咖啡廳、深淺綠的森林插畫……都是單色配色，感覺<b>統一、和諧、安靜</b>。', visual: paletteStrip(schemePalette('mono', 4)) },
    ],
    practice: () => [whichPaletteQ('mono', ALL), monoSortQ(), monoPaintQ()],
    challenge: () => shuffle([whichPaletteQ('mono', ALL), identifyQ('mono', ALL), monoSortQ(), monoPaintQ(), monoPaintQ()]),
  },
  12: {
    learn: [
      { title: '類似色', body: '色相環上<b>左右相鄰</b>的 2～4 個顏色，彼此大約在 90° 以內，就是<b>類似色</b>。', visual: wheel12({ lit: SCHEMES.analog.of(1) }) },
      { title: '像大自然一樣和諧', body: '類似色常出現在大自然：秋天的楓葉（紅、橙、黃）、海洋（青綠、青、天藍）。因為色相接近，看起來<b>自然又舒服</b>。', visual: paletteStrip(schemePalette('analog', 1)) + paletteStrip(schemePalette('analog', 6)) },
      { title: '一主兩輔', body: '使用類似色時，選<b>一個當主色</b>用最大面積，另外兩個當輔助色，畫面會更有重心。', visual: ratioBar([[hsvHex(210, 0.8, 0.9), 60, '主色'], [hsvHex(180, 0.7, 0.85), 30, '輔助'], [hsvHex(240, 0.9, 0.9), 10, '輔助']]) },
    ],
    practice: () => [pickQ('analog'), whichPaletteQ('analog', ALL), identifyQ('analog', ALL)],
    challenge: () => shuffle([pickQ('analog'), pickQ('analog'), identifyQ('analog', ALL), whichPaletteQ('analog', ALL),
      choice('類似色的色相，通常在色相環上多少度以內？', ['大約 90° 以內', '剛好 180°', '剛好 120°', '360°'], 0, '類似色是相鄰的顏色，大約在 90° 範圍內。')]),
  },
  13: {
    learn: [
      { title: '互補色', body: '色相環上<b>正對面</b>（相差 180°）的兩個顏色是<b>互補色</b>。在本遊戲的色相環上：<b>紅↔青、黃↔藍、綠↔洋紅</b>。', visual: wheel12({ lit: [2, 8] }) },
      { title: '對比最強的組合', body: '互補色放在一起會<b>互相襯托</b>，兩個都顯得更鮮豔，非常醒目。但如果混在一起，會互相抵消變成灰色。', visual: `<div class="sw-row">${swatch('#ffd000', '黃')}${swatch('#2046d8', '藍')}</div>` },
      { title: '美術課的色相環不一樣？', body: '傳統美術用<b>紅黃藍（RYB）</b>色相環，互補色是<b>紅↔綠、黃↔紫、藍↔橙</b>。原因是兩種色相環的原色不同。畫水彩、油畫時常用 RYB 的說法；螢幕和印刷則用本遊戲的色相環。', visual: paletteStrip(['#e03131', '#2f9e44', '#ffd43b', '#7048e8', '#1c56b8', '#f76707'], ['紅', '綠', '黃', '紫', '藍', '橙']) },
      { title: '使用技巧', body: '互補色對比很強，<b>兩色面積一樣大會很刺眼</b>。建議一個當主色、一個當少量的點綴，或降低其中一個的彩度。', visual: ratioBar([[hsvHex(220, 0.7, 0.6), 85, '主色'], [hsvHex(40, 1, 1), 15, '點綴']]) },
    ],
    practice: () => [pickQ('comp'), compTimedQ(), compHueQ()],
    challenge: () => shuffle([pickQ('comp'), compTimedQ(), compTimedQ(), compHueQ(), compHueQ(), pick(compConcept, 1)[0](), identifyQ('comp', ALL)]),
  },
  14: {
    learn: [
      { title: '分裂互補', body: '選一個主色，<b>不用它的互補色</b>，而是用<b>互補色左右兩側</b>的兩個顏色（相差 150° 和 210°）。', visual: wheel12({ lit: SCHEMES.split.of(0) }) },
      { title: '對比強但比較溫和', body: '分裂互補保留了強烈的對比，但沒有互補色那麼刺眼，<b>更容易搭配</b>，很適合初學者。', visual: paletteStrip(schemePalette('split', 0)) + paletteStrip(schemePalette('split', 8)) },
    ],
    practice: () => [pickQ('split'), identifyQ('split', ALL)],
    challenge: () => shuffle([pickQ('split'), pickQ('split'), pickQ('split'), identifyQ('split', ALL), whichPaletteQ('split', ALL),
      choice('分裂互補取的是主色「互補色」的哪裡？', ['互補色左右兩側的顏色', '互補色本身', '主色左右兩側的顏色', '主色的淺色和深色'], 0, '主色 + 互補色兩旁的兩個顏色＝分裂互補。')]),
  },
  15: {
    learn: [
      { title: '三角配色', body: '在色相環上畫一個<b>正三角形</b>，三個角的顏色（每隔 120°）就是三角配色。', visual: wheel12({ lit: SCHEMES.triad.of(1) }) },
      { title: '原色本身就是三角！', body: '青、洋紅、黃三原色剛好相隔 120°；紅、綠、藍也是。所以三角配色通常<b>鮮豔、活潑、有朝氣</b>。', visual: paletteStrip(['#00ffff', '#ff00ff', '#ffff00']) + paletteStrip(['#ff0000', '#00ff00', '#0000ff']) },
      { title: '使用技巧', body: '三個顏色都很搶眼，建議<b>一個當主色</b>、另外兩個少量使用，或把其中兩個的彩度降低。', visual: ratioBar([[hsvHex(30, 0.85, 0.95), 60, '主色'], [hsvHex(150, 0.5, 0.75), 30, '輔助'], [hsvHex(270, 0.8, 0.8), 10, '點綴']]) },
    ],
    practice: () => [pickQ('triad'), identifyQ('triad', ALL), triadPaintQ()],
    challenge: () => shuffle([pickQ('triad'), pickQ('triad'), identifyQ('triad', ALL), whichPaletteQ('triad', ALL), triadPaintQ()]),
  },
  16: {
    learn: [
      { title: '四角配色（正方形）', body: '在色相環上畫一個<b>正方形</b>，四個角（每隔 90°）的顏色就是四角配色。它其實是<b>兩組互補色</b>。', visual: wheel12({ lit: SCHEMES.square.of(0) }) },
      { title: '矩形配色', body: '四角配色也可以是<b>長方形</b>：選兩個相近的顏色，再加上它們各自的互補色，例如紅、黃 + 青、藍。', visual: wheel12({ lit: [0, 2, 6, 8] }) },
      { title: '顏色多，要有主角', body: '四個顏色很豐富，但也容易亂。選<b>一個主色</b>用大面積，其他三個少量使用，或降低它們的彩度。', visual: ratioBar([[hsvHex(0, 0.75, 0.9), 55, '主色'], [hsvHex(90, 0.45, 0.8), 20, ''], [hsvHex(180, 0.45, 0.8), 15, ''], [hsvHex(270, 0.8, 0.8), 10, '']]) },
    ],
    practice: () => [pickQ('square'), pickQ('rect'), identifyQ('square', ALL)],
    challenge: () => shuffle([pickQ('square'), pickQ('square'), pickQ('rect'), identifyQ('square', ALL), whichPaletteQ('square', ALL),
      choice('四角配色是由幾組互補色組成的？', ['2 組', '1 組', '3 組', '4 組'], 0, '四個顏色兩兩在正對面，所以是 2 組互補色。')]),
  },
};

SCHEMES.rect = { name: '矩形配色', of: (b) => [b, b + 2, b + 6, b + 8].map(mod12) };
