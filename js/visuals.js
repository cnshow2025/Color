// 教學卡片與題目共用的圖解（回傳 HTML 字串）
import { HUES12, hsvHex } from './color-utils.js';

export function swatch(hex, label = '', size = 'md') {
  return `<span class="sw sw-${size}"><span class="sw-chip" style="background:${hex}"></span>${
    label ? `<span class="sw-label">${label}</span>` : ''}</span>`;
}

export function swatchRow(items, size = 'md') {
  return `<div class="sw-row">${items.map(([hex, label]) => swatch(hex, label, size)).join('')}</div>`;
}

// 例：equation([['#f00','紅光'],['#0f0','綠光']], ['#ff0','黃光'])
export function equation(parts, result) {
  const lhs = parts.map(([hex, label]) => swatch(hex, label, 'sm')).join('<span class="eq-op">+</span>');
  return `<div class="eq">${lhs}<span class="eq-op">=</span>${swatch(result[0], result[1], 'sm')}</div>`;
}

// 三個重疊圓：light = 黑底 screen；pigment = 白底 multiply
export function venn(mode, colors) {
  const cls = mode === 'light' ? 'venn venn-light' : 'venn venn-pigment';
  const [a, b, c] = colors || (mode === 'light' ? ['#f00', '#0f0', '#00f'] : ['#0ff', '#f0f', '#ff0']);
  return `<div class="${cls}"><span class="venn-c v1" style="background:${a}"></span><span class="venn-c v2" style="background:${b}"></span><span class="venn-c v3" style="background:${c}"></span></div>`;
}

export function rainbowBar() {
  const stops = [0, 30, 60, 120, 200, 240, 275].map((d) => hsvHex(d)).join(',');
  return `<div class="rainbow" style="background:linear-gradient(90deg,${stops})"></div>`;
}

// 角度 0° 在正上方，順時針
export function polar(cx, cy, r, a) {
  const t = ((a - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(t), cy + r * Math.sin(t)];
}

export function sectorPath(cx, cy, r0, r1, a0, a1) {
  const [x0, y0] = polar(cx, cy, r1, a0);
  const [x1, y1] = polar(cx, cy, r1, a1);
  const [x2, y2] = polar(cx, cy, r0, a1);
  const [x3, y3] = polar(cx, cy, r0, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  const f = (n) => n.toFixed(2);
  return `M${f(x0)} ${f(y0)}A${r1} ${r1} 0 ${large} 1 ${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}A${r0} ${r0} 0 ${large} 0 ${f(x3)} ${f(y3)}Z`;
}

// 12 色相環 SVG。lit：要上色的格子（index 陣列或 'all'）；labels：是否顯示名稱
export function wheel12({ lit = 'all', labels = true, interactive = false, marks = {} } = {}) {
  const litSet = lit === 'all' ? new Set(HUES12.map((h) => h.index)) : new Set(lit);
  const cx = 150, cy = 150, r0 = 62, r1 = 118;
  const segs = HUES12.map((hue) => {
    const on = litSet.has(hue.index);
    const d = sectorPath(cx, cy, r0, r1, hue.deg - 15 + 0.8, hue.deg + 15 - 0.8);
    const mark = marks[hue.index] ? ` data-mark="${marks[hue.index]}"` : '';
    return `<path class="wseg${on ? ' on' : ' off'}" data-i="${hue.index}"${mark} d="${d}" style="${on ? `fill:${hue.hex}` : ''}"/>`;
  }).join('');
  const txt = labels ? HUES12.map((hue) => {
    if (!litSet.has(hue.index)) return '';
    const [x, y] = polar(cx, cy, 136, hue.deg);
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="wlabel">${hue.name}</text>`;
  }).join('') : '';
  return `<svg class="wheel12${interactive ? ' interactive' : ''}" viewBox="0 0 300 300" role="img" aria-label="12 色相環">${segs}${txt}</svg>`;
}

// 連續色相環（CSS conic-gradient），可加角度標籤
export function hueRing(labels = []) {
  const tags = labels.map(([deg, text]) => {
    const [x, y] = polar(50, 50, 58, deg);
    return `<span class="ring-tag" style="left:${x}%;top:${y}%">${text}</span>`;
  }).join('');
  return `<div class="hue-ring-wrap static"><div class="hue-ring"></div>${tags}</div>`;
}
