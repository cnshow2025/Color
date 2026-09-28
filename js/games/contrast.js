// 玩法：對比度調整（調整文字明度，讓對比度達標）
// q = { bg: 背景色, hue, sat: 0–1, start: 文字初始明度 0–1, min: 需要的對比度（預設 4.5） }
import { h } from '../dom.js';
import { contrastRatio, hslToRgb, rgbToHex } from '../color-utils.js';

export function render(root, q, done) {
  const min = q.min || 4.5;
  let l = q.start;
  const textColor = () => rgbToHex(hslToRgb(q.hue, q.sat, l));

  const sample = h('div', { class: 'ct-sample', style: { background: q.bg } },
    h('b', {}, '色彩冒險'), h('span', {}, '這段文字要讓每個人都看得清楚。'));
  const ratioEl = h('div', { class: 'ct-ratio' });
  const input = h('input', { type: 'range', min: 0, max: 100, step: 1, value: Math.round(l * 100), class: 'slider', 'aria-label': '文字明度' });
  input.style.background = `linear-gradient(90deg,#000,${rgbToHex(hslToRgb(q.hue, q.sat, 0.5))},#fff)`;

  function update() {
    const c = textColor();
    sample.style.color = c;
    const r = contrastRatio(c, q.bg);
    ratioEl.textContent = `對比度 ${r.toFixed(2)} : 1`;
    ratioEl.classList.toggle('ok', r >= min);
  }
  input.addEventListener('input', () => {
    l = Number(input.value) / 100;
    update();
  });

  const confirm = h('button', { class: 'btn btn-primary btn-block', type: 'button' }, '確認');
  confirm.addEventListener('click', () => {
    confirm.disabled = true;
    input.disabled = true;
    const r = contrastRatio(textColor(), q.bg);
    done({
      score: Math.min(1, (r - 1) / (min - 1)),
      correct: r >= min,
      detail: `對比度 ${r.toFixed(2)} : 1（需要 ${min} : 1 以上）`,
    });
  });

  root.append(sample, ratioEl,
    h('div', { class: 'sliders' }, h('label', { class: 'sl-row' }, h('span', { class: 'sl-name' }, '文字'), input, h('span', { class: 'sl-val' }, ''))),
    confirm);
  update();
}
