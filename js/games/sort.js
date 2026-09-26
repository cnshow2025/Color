// 玩法 C：排序（依序點選色塊放進答案列，點答案列的色塊可放回）
// q = { items: [hex...]（正確順序）, fixedFirst?: bool, ends?: [左端文字, 右端文字] }
import { h } from '../dom.js';
import { shuffle } from '../color-utils.js';

export function render(root, q, done) {
  const n = q.items.length;
  const fixed = q.fixedFirst ? 1 : 0;
  const answer = q.fixedFirst ? [0] : [];
  let pool = shuffle(q.items.map((_, i) => i).slice(fixed));

  const slotsEl = h('div', { class: 'sort-slots' });
  const poolEl = h('div', { class: 'sort-pool' });
  const confirm = h('button', { class: 'btn btn-primary btn-block', type: 'button', disabled: true }, '確認順序');
  const reset = h('button', { class: 'btn btn-ghost', type: 'button' }, '重來');
  let finished = false;

  function chip(i, extra = '') {
    return h('button', { class: 'sort-chip ' + extra, type: 'button', style: { background: q.items[i] }, 'aria-label': `色塊 ${i + 1}` });
  }

  function draw() {
    slotsEl.replaceChildren();
    for (let k = 0; k < n; k++) {
      const i = answer[k];
      if (i === undefined) {
        slotsEl.append(h('span', { class: 'sort-slot' }, String(k + 1)));
        continue;
      }
      const locked = k < fixed;
      const c = chip(i, locked ? 'locked' : '');
      if (!locked && !finished) c.addEventListener('click', () => {
        answer.splice(k, 1);
        pool.push(i);
        draw();
      });
      slotsEl.append(c);
    }
    poolEl.replaceChildren(...pool.map((i) => {
      const c = chip(i);
      c.addEventListener('click', () => {
        if (finished) return;
        pool = pool.filter((x) => x !== i);
        answer.push(i);
        draw();
      });
      return c;
    }));
    confirm.disabled = finished || answer.length !== n;
  }

  reset.addEventListener('click', () => {
    if (finished) return;
    pool = shuffle(q.items.map((_, i) => i).slice(fixed));
    answer.length = fixed;
    draw();
  });

  confirm.addEventListener('click', () => {
    finished = true;
    reset.disabled = true;
    let right = 0;
    [...slotsEl.children].forEach((el, k) => {
      if (k < fixed) return;
      const ok = answer[k] === k;
      if (ok) right++;
      el.classList.add(ok ? 'ok' : 'bad');
    });
    const total = n - fixed;
    const correctRow = h('div', { class: 'sort-answer' },
      h('div', { class: 'sort-caption' }, '正確順序'),
      h('div', { class: 'sort-slots' }, q.items.map((_, i) => chip(i, 'static'))));
    root.insertBefore(correctRow, confirm);
    confirm.disabled = true;
    done({ score: right / total, correct: right === total, detail: `排對了 ${right} / ${total} 個位置` });
  });

  const ends = q.ends ? h('div', { class: 'sort-ends' }, h('span', {}, q.ends[0]), h('span', {}, q.ends[1])) : null;
  root.append(
    h('div', { class: 'sort-box' }, ends, slotsEl),
    h('div', { class: 'sort-caption' }, '點選下面的色塊，依序放進上面的格子'),
    poolEl,
    h('div', { class: 'row-end' }, reset),
    confirm,
  );
  draw();
}
