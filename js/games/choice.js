// 玩法 A：選擇題
// q = { prompt, visual?: html, options: [{ label, color? }], answer: 選項索引, fixedOrder?: bool }
import { h, htmlToNode } from '../dom.js';
import { shuffle } from '../color-utils.js';

export function render(root, q, done) {
  const order = q.fixedOrder ? q.options.map((_, i) => i) : shuffle(q.options.map((_, i) => i));
  const hasColor = q.options.some((o) => o.color);
  let answered = false;

  const buttons = order.map((i) => {
    const o = q.options[i];
    const btn = h('button', { class: 'opt' + (o.color ? ' opt-color' : ''), type: 'button' },
      o.color ? h('span', { class: 'opt-chip', style: { background: o.color } }) : null,
      o.label ? h('span', { class: 'opt-label' }, o.label) : null);
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      const correct = i === q.answer;
      buttons.forEach((b) => (b.disabled = true));
      btn.classList.add(correct ? 'right' : 'wrong');
      if (!correct) buttons[order.indexOf(q.answer)].classList.add('right');
      done({ score: correct ? 1 : 0, correct });
    });
    return btn;
  });

  root.append(
    q.visual ? h('div', { class: 'q-visual' }, htmlToNode(q.visual)) : null,
    h('div', { class: 'opts' + (hasColor ? ' opts-grid' : '') }, buttons),
  );
}
