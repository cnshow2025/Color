// 玩法 D：色環點選
// 12 格模式：q = { mode: 'slots', lit: [已上色的格子], target: 正確格子, pieceLabel?: 文字 }
// 連續模式：q = { mode: 'hue', target: 色相角度 }
import { h, htmlToNode } from '../dom.js';
import { HUES12, hsvHex, hueDistance } from '../color-utils.js';
import { wheel12, polar } from '../visuals.js';

export function render(root, q, done) {
  if (q.mode === 'hue') renderHue(root, q, done);
  else renderSlots(root, q, done);
}

function renderSlots(root, q, done) {
  const target = HUES12[q.target];
  const svg = htmlToNode(wheel12({ lit: q.lit, labels: true, interactive: true }));
  let answered = false;

  svg.addEventListener('click', (e) => {
    const seg = e.target.closest('.wseg');
    if (!seg || answered || seg.classList.contains('on')) return;
    answered = true;
    svg.classList.remove('interactive');
    const i = Number(seg.dataset.i);
    const correct = i === q.target;
    const t = svg.querySelector(`.wseg[data-i="${q.target}"]`);
    t.classList.replace('off', 'on');
    t.style.fill = target.hex;
    t.classList.add('reveal');
    if (!correct) seg.classList.add('miss');
    done({ score: correct ? 1 : 0, correct, detail: `正確位置：${target.name}（${target.deg}°）` });
  });

  root.append(
    h('div', { class: 'piece' },
      h('span', { class: 'piece-chip', style: { background: target.hex } }),
      h('span', {}, q.pieceLabel || '這塊顏色要放在哪一格？')),
    h('div', { class: 'wheel-wrap' }, svg),
  );
}

function renderHue(root, q, done) {
  let chosen = null;
  const ring = h('div', { class: 'hue-ring' });
  const marker = h('span', { class: 'ring-marker hidden' });
  const answerMark = h('span', { class: 'ring-marker answer hidden' });
  const wrap = h('div', { class: 'hue-ring-wrap' }, ring, marker, answerMark,
    h('span', { class: 'ring-center', style: { background: hsvHex(q.target) } }));
  const confirm = h('button', { class: 'btn btn-primary btn-block', type: 'button', disabled: true }, '確認位置');
  let finished = false;

  function place(el, deg) {
    const [x, y] = polar(50, 50, 40, deg);
    el.style.left = x + '%';
    el.style.top = y + '%';
    el.classList.remove('hidden');
  }

  wrap.addEventListener('pointerdown', (e) => {
    if (finished) return;
    const r = wrap.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const dist = Math.hypot(dx, dy) / (r.width / 2);
    if (dist < 0.45 || dist > 1.1) return;
    chosen = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
    place(marker, chosen);
    marker.style.background = hsvHex(chosen);
    confirm.disabled = false;
  });

  confirm.addEventListener('click', () => {
    finished = true;
    confirm.disabled = true;
    const err = hueDistance(chosen, q.target);
    place(answerMark, q.target);
    // 誤差 ≤ 10° 滿分，≥ 60° 零分
    const score = Math.max(0, Math.min(1, 1 - (err - 10) / 50));
    done({ score, correct: err <= 20, detail: `正確位置約 ${Math.round(q.target)}°，你差了 ${Math.round(err)}°` });
  });

  root.append(
    h('div', { class: 'sort-caption' }, '點選色相環上的位置（中間是題目顏色）'),
    wrap,
    confirm,
  );
}
