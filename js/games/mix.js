// 玩法 B：混色實驗（光的加法混色 / 顏料的減法混色）
// q = { mode: 'light' | 'pigment', target: hex, step?: 百分比刻度 }
import { h } from '../dom.js';
import { colorDiff, describeDeltaE, lightMix, pigmentMix, rgbToHex } from '../color-utils.js';

const MODES = {
  light: {
    mix: lightMix,
    channels: [
      { key: 'R', name: '紅光', full: '#ff0000', zero: '#000000', solo: (v) => rgbToHex([v * 255, 0, 0]) },
      { key: 'G', name: '綠光', full: '#00ff00', zero: '#000000', solo: (v) => rgbToHex([0, v * 255, 0]) },
      { key: 'B', name: '藍光', full: '#0000ff', zero: '#000000', solo: (v) => rgbToHex([0, 0, v * 255]) },
    ],
  },
  pigment: {
    mix: pigmentMix,
    channels: [
      { key: 'C', name: '青', full: '#00ffff', zero: '#ffffff', solo: (v) => rgbToHex([255 * (1 - v), 255, 255]) },
      { key: 'M', name: '洋紅', full: '#ff00ff', zero: '#ffffff', solo: (v) => rgbToHex([255, 255 * (1 - v), 255]) },
      { key: 'Y', name: '黃', full: '#ffff00', zero: '#ffffff', solo: (v) => rgbToHex([255, 255, 255 * (1 - v)]) },
    ],
  },
};

// 色差 → 分數：ΔE ≤ 3 滿分，ΔE ≥ 35 零分
export function scoreFromDeltaE(dE) {
  return Math.max(0, Math.min(1, 1 - (dE - 3) / 32));
}

export function render(root, q, done) {
  const cfg = MODES[q.mode];
  const step = q.step || 5;
  const values = [0, 0, 0];

  const circles = cfg.channels.map((_, i) => h('span', { class: `venn-c v${i + 1}` }));
  const stage = h('div', { class: `venn venn-${q.mode} venn-live` }, circles);
  const mine = h('span', { class: 'cmp-chip' });
  const valueLabels = [];

  const sliders = cfg.channels.map((ch, i) => {
    const out = h('span', { class: 'sl-val' }, '0%');
    valueLabels.push(out);
    const input = h('input', {
      type: 'range', min: 0, max: 100, step, value: 0, class: 'slider',
      'aria-label': ch.name,
      style: { background: `linear-gradient(90deg, ${ch.zero}, ${ch.full})` },
    });
    input.addEventListener('input', () => {
      values[i] = Number(input.value) / 100;
      update();
    });
    return h('label', { class: 'sl-row' },
      h('span', { class: 'sl-name' }, ch.name), input, out);
  });

  function current() {
    return rgbToHex(cfg.mix(...values));
  }

  function update() {
    circles.forEach((c, i) => (c.style.background = cfg.channels[i].solo(values[i])));
    valueLabels.forEach((o, i) => (o.textContent = Math.round(values[i] * 100) + '%'));
    mine.style.background = current();
  }

  const confirm = h('button', { class: 'btn btn-primary btn-block', type: 'button' }, '確認顏色');
  confirm.addEventListener('click', () => {
    confirm.disabled = true;
    sliders.forEach((s) => (s.querySelector('input').disabled = true));
    const dE = colorDiff(current(), q.target);
    const score = scoreFromDeltaE(dE);
    done({
      score,
      correct: dE <= 10,
      detail: `色差 ΔE = ${dE.toFixed(1)}，${describeDeltaE(dE)}`,
    });
  });

  root.append(
    h('div', { class: 'mix-top' },
      stage,
      h('div', { class: 'cmp' },
        h('div', { class: 'cmp-item' }, h('span', { class: 'cmp-chip', style: { background: q.target } }), h('span', {}, '目標')),
        h('div', { class: 'cmp-item' }, mine, h('span', {}, '你的'))),
    ),
    h('div', { class: 'sliders' }, sliders),
    confirm,
  );
  update();
}
