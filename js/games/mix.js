// 玩法 B：混色實驗
// q = { mode, target: hex, step?: 刻度, start?: [各滑桿初始值 0–1], scoreBy?: 'L' }
//   mode 'light'   光的加法混色（R、G、B）
//   mode 'pigment' 顏料的減法混色（C、M、Y）
//   mode 'hsv'     q.channels: ['h','s','v'] 的子集；q.base: { h, s, v } 為固定值
//   mode 'tint'    q.baseHex 純色加白、加黑
//   mode 'grey'    調一個灰色；q.surround: { target: 底色, mine: 底色 } 可加背景
import { h } from '../dom.js';
import {
  colorDiff, describeDeltaE, lightMix, pigmentMix, rgbToHex, hsvHex, tintMix, lightness,
} from '../color-utils.js';

const HUE_TRACK = 'linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)';

function modeConfig(q) {
  if (q.mode === 'light') {
    return {
      venn: 'light',
      channels: [
        { name: '紅光', track: () => 'linear-gradient(90deg,#000,#f00)', solo: (v) => rgbToHex([v * 255, 0, 0]) },
        { name: '綠光', track: () => 'linear-gradient(90deg,#000,#0f0)', solo: (v) => rgbToHex([0, v * 255, 0]) },
        { name: '藍光', track: () => 'linear-gradient(90deg,#000,#00f)', solo: (v) => rgbToHex([0, 0, v * 255]) },
      ],
      color: (vals) => rgbToHex(lightMix(...vals)),
    };
  }
  if (q.mode === 'pigment') {
    return {
      venn: 'pigment',
      channels: [
        { name: '青', track: () => 'linear-gradient(90deg,#fff,#0ff)', solo: (v) => rgbToHex([255 * (1 - v), 255, 255]) },
        { name: '洋紅', track: () => 'linear-gradient(90deg,#fff,#f0f)', solo: (v) => rgbToHex([255, 255 * (1 - v), 255]) },
        { name: '黃', track: () => 'linear-gradient(90deg,#fff,#ff0)', solo: (v) => rgbToHex([255, 255, 255 * (1 - v)]) },
      ],
      color: (vals) => rgbToHex(pigmentMix(...vals)),
    };
  }
  if (q.mode === 'hsv') {
    const keys = q.channels;
    const hsv = (vals) => {
      const o = { ...q.base };
      keys.forEach((k, i) => (o[k] = k === 'h' ? vals[i] * 360 : vals[i]));
      return o;
    };
    const defs = {
      h: { name: '色相 H', unit: '°', scale: 360, track: () => HUE_TRACK },
      s: { name: '飽和 S', track: (o) => `linear-gradient(90deg,${hsvHex(o.h, 0, o.v)},${hsvHex(o.h, 1, o.v)})` },
      v: { name: '明度 B', track: (o) => `linear-gradient(90deg,#000,${hsvHex(o.h, o.s, 1)})` },
    };
    return {
      channels: keys.map((k) => ({ ...defs[k], track: (vals) => defs[k].track(hsv(vals)) })),
      color: (vals) => { const o = hsv(vals); return hsvHex(o.h, o.s, o.v); },
    };
  }
  if (q.mode === 'tint') {
    return {
      channels: [
        { name: '白', track: () => `linear-gradient(90deg,${q.baseHex},#fff)` },
        { name: '黑', track: () => `linear-gradient(90deg,${q.baseHex},#000)` },
      ],
      color: (vals) => tintMix(q.baseHex, vals[0], vals[1]),
      base: q.baseHex,
    };
  }
  // grey
  return {
    channels: [{ name: '明度', track: () => 'linear-gradient(90deg,#000,#fff)' }],
    color: (vals) => rgbToHex([vals[0] * 255, vals[0] * 255, vals[0] * 255]),
  };
}

// 色差 → 分數：差 ≤ 3 滿分，≥ 35 零分
export function scoreFromDeltaE(dE) {
  return Math.max(0, Math.min(1, 1 - (dE - 3) / 32));
}

export function render(root, q, done) {
  const cfg = modeConfig(q);
  const step = q.step || 5;
  const values = cfg.channels.map((_, i) => (q.start ? q.start[i] : 0));

  const circles = cfg.venn ? cfg.channels.map((_, i) => h('span', { class: `venn-c v${i + 1}` })) : [];
  const mine = h('span', { class: 'cmp-chip' });
  const inputs = [];
  const valueLabels = [];

  const sliders = cfg.channels.map((ch, i) => {
    const out = h('span', { class: 'sl-val' });
    valueLabels.push(out);
    const input = h('input', {
      type: 'range', min: 0, max: ch.scale || 100, step, value: values[i] * (ch.scale || 100),
      class: 'slider', 'aria-label': ch.name,
    });
    inputs.push(input);
    input.addEventListener('input', () => {
      values[i] = Number(input.value) / (ch.scale || 100);
      update();
    });
    return h('label', { class: 'sl-row' }, h('span', { class: 'sl-name' }, ch.name), input, out);
  });

  const current = () => cfg.color(values);

  function update() {
    circles.forEach((c, i) => (c.style.background = cfg.channels[i].solo(values[i])));
    valueLabels.forEach((o, i) => {
      const ch = cfg.channels[i];
      o.textContent = ch.scale ? Math.round(values[i] * ch.scale) + (ch.unit || '') : Math.round(values[i] * 100) + '%';
    });
    inputs.forEach((inp, i) => (inp.style.background = cfg.channels[i].track(values)));
    mine.style.background = current();
  }

  const confirm = h('button', { class: 'btn btn-primary btn-block', type: 'button' }, '確認顏色');
  confirm.addEventListener('click', () => {
    confirm.disabled = true;
    inputs.forEach((s) => (s.disabled = true));
    if (q.scoreBy === 'L') {
      const dL = Math.abs(lightness(current()) - lightness(q.target));
      done({
        score: scoreFromDeltaE(dL), correct: dL <= 10,
        detail: `明度差 ΔL = ${dL.toFixed(1)}，${dL < 3 ? '一樣亮！' : dL < 10 ? '很接近了' : dL < 20 ? '差異明顯' : '差很多'}`,
      });
      return;
    }
    const dE = colorDiff(current(), q.target);
    done({ score: scoreFromDeltaE(dE), correct: dE <= 10, detail: `色差 ΔE = ${dE.toFixed(1)}，${describeDeltaE(dE)}` });
  });

  const target = h('span', { class: 'cmp-chip', style: { background: q.target } });
  const wrapChip = (chip, bg) => (bg ? h('span', { class: 'cmp-surround', style: { background: bg } }, chip) : chip);
  const cmp = h('div', { class: cfg.venn ? 'cmp' : 'cmp cmp-row' },
    cfg.base ? h('div', { class: 'cmp-item' }, h('span', { class: 'cmp-chip', style: { background: cfg.base } }), h('span', {}, '純色')) : null,
    h('div', { class: 'cmp-item' }, wrapChip(target, q.surround?.target), h('span', {}, '目標')),
    h('div', { class: 'cmp-item' }, wrapChip(mine, q.surround?.mine), h('span', {}, '你的')));

  root.append(
    h('div', { class: 'mix-top' }, cfg.venn ? h('div', { class: `venn venn-${cfg.venn} venn-live` }, circles) : null, cmp),
    h('div', { class: 'sliders' }, sliders),
    confirm,
  );
  update();
}
