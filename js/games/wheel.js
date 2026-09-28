// 玩法 D：色環點選
// 12 格模式：q = { mode: 'slots', lit: [已上色的格子], target: 正確格子, pieceLabel?: 文字 }
// 多選模式：q = { mode: 'pick', given: [題目給的格子], answer: [要選的格子] }
// 連續模式：q = { mode: 'hue', target: 色相角度, show?: 中間顯示的顏色（預設為目標色）, caption?: 說明 }
import { h, htmlToNode } from '../dom.js';
import { HUES12, hsvHex, hueDistance } from '../color-utils.js';
import { wheel12, polar } from '../visuals.js';

export function render(root, q, done) {
  if (q.mode === 'hue') renderHue(root, q, done);
  else if (q.mode === 'pick') renderPick(root, q, done);
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

function renderPick(root, q, done) {
  const n = q.answer.length;
  const marks = Object.fromEntries(q.given.map((i) => [i, 'given']));
  const svg = htmlToNode(wheel12({ lit: 'all', labels: true, interactive: true, marks }));
  const picked = new Set();
  const status = h('div', { class: 'sort-caption' });
  const confirm = h('button', { class: 'btn btn-primary btn-block', type: 'button', disabled: true }, '確認');
  let finished = false;

  function draw() {
    svg.querySelectorAll('.wseg').forEach((seg) => seg.classList.toggle('picked', picked.has(Number(seg.dataset.i))));
    status.textContent = `已選 ${picked.size} / ${n} 格（★ 是題目給的顏色）`;
    confirm.disabled = picked.size !== n;
  }

  svg.addEventListener('click', (e) => {
    const seg = e.target.closest('.wseg');
    if (!seg || finished) return;
    const i = Number(seg.dataset.i);
    if (q.given.includes(i)) return;
    if (picked.has(i)) picked.delete(i);
    else if (picked.size < n) picked.add(i);
    draw();
  });

  confirm.addEventListener('click', () => {
    finished = true;
    confirm.disabled = true;
    svg.classList.remove('interactive');
    let right = 0;
    picked.forEach((i) => {
      const ok = q.answer.includes(i);
      if (ok) right++;
      else svg.querySelector(`.wseg[data-i="${i}"]`).classList.add('miss');
    });
    q.answer.forEach((i) => svg.querySelector(`.wseg[data-i="${i}"]`).classList.add('reveal'));
    const names = q.answer.map((i) => HUES12[i].name).join('、');
    done({ score: right / n, correct: right === n, detail: `正確答案：${names}` });
  });

  // 題目格子加上星號
  q.given.forEach((i) => {
    const [x, y] = polar(150, 150, 90, HUES12[i].deg);
    svg.insertAdjacentHTML('beforeend', `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="wstar">★</text>`);
  });

  root.append(h('div', { class: 'wheel-wrap' }, svg), status, confirm);
  draw();
}

function renderHue(root, q, done) {
  let chosen = null;
  const ring = h('div', { class: 'hue-ring' });
  const marker = h('span', { class: 'ring-marker hidden' });
  const answerMark = h('span', { class: 'ring-marker answer hidden' });
  const wrap = h('div', { class: 'hue-ring-wrap' }, ring, marker, answerMark,
    h('span', { class: 'ring-center', style: { background: q.show || hsvHex(q.target) } }));
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
    h('div', { class: 'sort-caption' }, q.caption || '點選色相環上的位置（中間是題目顏色）'),
    wrap,
    confirm,
  );
}
