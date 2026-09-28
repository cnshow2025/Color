// 玩法 E：分類／配對（先點一個色塊，再點要放進的類別）
// q = { categories: [{ label, color? }], items: [{ color, label?, cat: 類別索引 }] }
import { h } from '../dom.js';
import { shuffle } from '../color-utils.js';

export function render(root, q, done) {
  const placed = new Map(); // 項目索引 → 類別索引
  let selected = null;
  let finished = false;
  const order = shuffle(q.items.map((_, i) => i));

  const pool = h('div', { class: 'cls-pool' });
  const bins = q.categories.map((cat, c) => {
    const body = h('div', { class: 'cls-bin-items' });
    const bin = h('div', { class: 'cls-bin', role: 'button', tabindex: 0 },
      h('span', { class: 'cls-bin-title' },
        cat.color ? h('span', { class: 'cls-dot', style: { background: cat.color } }) : null, cat.label),
      body);
    bin.addEventListener('click', (e) => {
      if (finished || selected == null || e.target.closest('.cls-item')) return;
      placed.set(selected, c);
      selected = null;
      draw();
    });
    return { bin, body };
  });
  const confirm = h('button', { class: 'btn btn-primary btn-block', type: 'button', disabled: true }, '確認');
  const hint = h('div', { class: 'sort-caption' });

  function item(i) {
    const it = q.items[i];
    const el = h('span', {
      class: 'cls-item' + (selected === i ? ' selected' : ''), role: 'button', tabindex: 0,
    },
    h('span', { class: 'cls-chip', style: { background: it.color } }),
    it.label ? h('span', { class: 'cls-label' }, it.label) : null);
    el.addEventListener('click', () => {
      if (finished) return;
      if (placed.has(i)) placed.delete(i);
      selected = selected === i ? null : i;
      draw();
    });
    el.dataset.i = i;
    return el;
  }

  function draw() {
    pool.replaceChildren(...order.filter((i) => !placed.has(i)).map(item));
    bins.forEach(({ bin, body }, c) => {
      body.replaceChildren(...order.filter((i) => placed.get(i) === c).map(item));
      bin.classList.toggle('ready', selected != null);
    });
    hint.textContent = selected != null ? '現在點選要放進的類別' : '先點一個色塊，再點下方的類別';
    confirm.disabled = finished || placed.size !== q.items.length;
  }

  confirm.addEventListener('click', () => {
    finished = true;
    confirm.disabled = true;
    let right = 0;
    root.querySelectorAll('.cls-bin-items .cls-item').forEach((el) => {
      const i = Number(el.dataset.i);
      const ok = q.items[i].cat === placed.get(i);
      if (ok) right++;
      el.classList.add(ok ? 'ok' : 'bad');
      if (!ok) el.append(h('span', { class: 'cls-fix' }, '→ ' + q.categories[q.items[i].cat].label));
    });
    const total = q.items.length;
    done({
      score: right / total, correct: right === total,
      detail: `答對 ${right} / ${total}` + (right < total ? '，紅框的色塊放錯了，下方寫著正確的類別' : ''),
    });
  });

  root.append(hint, pool, h('div', { class: 'cls-bins' + (q.categories.length > 3 ? ' many' : '') }, bins.map((b) => b.bin)), confirm);
  draw();
}
