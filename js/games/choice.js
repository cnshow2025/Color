// 玩法 A：選擇題
// q = { prompt, visual?: html, options: [{ label, color?, palette?: [hex], sample?: { fg, bg } }],
//       answer: 選項索引, fixedOrder?: bool, timeLimit?: 秒 }
import { h, htmlToNode } from '../dom.js';
import { shuffle } from '../color-utils.js';

function optionBody(o) {
  return [
    o.color ? h('span', { class: 'opt-chip', style: { background: o.color } }) : null,
    o.palette ? h('span', { class: 'opt-palette' }, o.palette.map((c) => h('span', { style: { background: c } }))) : null,
    o.sample ? h('span', { class: 'opt-sample', style: { background: o.sample.bg, color: o.sample.fg } }, o.sample.text || '色彩學 Aa') : null,
    o.label ? h('span', { class: 'opt-label' }, o.label) : null,
  ];
}

export function render(root, q, done) {
  const order = q.fixedOrder ? q.options.map((_, i) => i) : shuffle(q.options.map((_, i) => i));
  const hasColor = q.options.some((o) => o.color);
  const wide = q.options.some((o) => o.palette || o.sample);
  let answered = false;
  let timer = null;

  function finish(i) {
    if (answered) return;
    answered = true;
    clearInterval(timer);
    const correct = i === q.answer;
    buttons.forEach((b) => (b.disabled = true));
    if (i >= 0) buttons[order.indexOf(i)].classList.add(correct ? 'right' : 'wrong');
    if (!correct) buttons[order.indexOf(q.answer)].classList.add('right');
    done({ score: correct ? 1 : 0, correct, detail: i < 0 ? '⏰ 時間到了！' : null });
  }

  const buttons = order.map((i) => {
    const o = q.options[i];
    const btn = h('button', { class: 'opt' + (o.color ? ' opt-color' : '') + (wide ? ' opt-wide' : ''), type: 'button' },
      optionBody(o));
    btn.addEventListener('click', () => finish(i));
    return btn;
  });

  let timerEl = null;
  if (q.timeLimit) {
    const fill = h('span', { class: 'timer-fill' });
    timerEl = h('div', { class: 'timer' }, fill);
    const start = Date.now();
    timer = setInterval(() => {
      if (!root.isConnected) return clearInterval(timer);
      const left = 1 - (Date.now() - start) / (q.timeLimit * 1000);
      fill.style.width = Math.max(0, left) * 100 + '%';
      if (left <= 0) finish(-1);
    }, 50);
  }

  root.append(...[
    timerEl,
    q.visual ? h('div', { class: 'q-visual' }, htmlToNode(q.visual)) : null,
    h('div', { class: 'opts' + (hasColor && !wide ? ' opts-grid' : '') }, buttons),
  ].filter(Boolean));
}
