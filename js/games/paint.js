// 玩法 F：上色設計（先選調色盤裡的顏色，再點畫面區塊上色）
// q = { scene: 'poster' | 'ui', palette: [hex], check: (fills) => { score, correct, detail } }
//   fills = { 區塊 id: hex }
//   可改用 groups: [{ label, colors: [hex] }] 把同一色相的顏色排在同一組，groupCols 為每排幾組
//   example: { 區塊 id: hex } 作答後顯示的範例答案
import { h, htmlToNode } from '../dom.js';

// 每個場景的區塊依面積由大到小排列
export const SCENES = {
  poster: {
    regions: [
      { id: 'sky', name: '天空' },
      { id: 'mountain', name: '山' },
      { id: 'ground', name: '地面' },
      { id: 'sun', name: '太陽' },
    ],
    svg: `<svg viewBox="0 0 300 300" class="paint-svg">
      <rect data-r="sky" x="0" y="0" width="300" height="300"/>
      <path data-r="mountain" d="M-10 230 L95 70 L165 170 L205 115 L310 230 Z"/>
      <rect data-r="ground" x="0" y="222" width="300" height="78"/>
      <circle data-r="sun" cx="238" cy="62" r="24"/>
    </svg>`,
  },
  ui: {
    regions: [
      { id: 'page', name: '背景' },
      { id: 'card', name: '卡片' },
      { id: 'button', name: '按鈕' },
    ],
    svg: `<svg viewBox="0 0 300 300" class="paint-svg">
      <rect data-r="page" x="0" y="0" width="300" height="300"/>
      <rect data-r="card" x="36" y="62" width="228" height="126" rx="14"/>
      <rect x="56" y="84" width="130" height="12" rx="6" class="paint-fixed"/>
      <rect x="56" y="106" width="180" height="8" rx="4" class="paint-fixed"/>
      <rect x="56" y="122" width="160" height="8" rx="4" class="paint-fixed"/>
      <rect data-r="button" x="96" y="214" width="108" height="40" rx="20"/>
      <rect x="126" y="231" width="48" height="6" rx="3" class="paint-fixed light"/>
    </svg>`,
  },
};

export function render(root, q, done) {
  const scene = SCENES[q.scene];
  const fills = {};
  let brush = null;
  let finished = false;

  const svg = htmlToNode(scene.svg);
  const confirm = h('button', { class: 'btn btn-primary btn-block', type: 'button', disabled: true }, '完成作品');
  const status = h('div', { class: 'sort-caption' });

  const swatches = [];
  const swatchBtn = (hex) => {
    const b = h('button', { class: 'paint-sw', type: 'button', style: { background: hex }, 'aria-label': hex });
    b.addEventListener('click', () => {
      if (finished) return;
      brush = hex;
      swatches.forEach((s) => s.classList.toggle('on', s === b));
      draw();
    });
    swatches.push(b);
    return b;
  };
  const palette = q.groups
    ? h('div', { class: 'paint-groups', style: { gridTemplateColumns: `repeat(${q.groupCols || 1}, 1fr)` } },
      q.groups.map((g) => h('div', { class: 'paint-group' },
        h('span', { class: 'paint-group-label' }, g.label),
        h('div', { class: 'paint-group-sw' }, g.colors.map(swatchBtn)))))
    : h('div', { class: 'paint-palette' }, q.palette.map(swatchBtn));

  svg.querySelectorAll('[data-r]').forEach((el) => {
    el.addEventListener('click', () => {
      if (finished || !brush) return;
      fills[el.dataset.r] = brush;
      draw();
    });
  });

  function draw() {
    svg.querySelectorAll('[data-r]').forEach((el) => {
      const c = fills[el.dataset.r];
      el.style.fill = c || '';
      el.classList.toggle('empty', !c);
    });
    const left = scene.regions.filter((r) => !fills[r.id]).map((r) => r.name);
    status.textContent = !brush ? '先從調色盤選一個顏色' : left.length ? `點畫面上色，還沒上色：${left.join('、')}` : '都上好色了，可以按「完成作品」';
    confirm.disabled = finished || left.length > 0;
  }

  const canvas = h('div', { class: 'paint-canvas' }, svg);

  confirm.addEventListener('click', () => {
    finished = true;
    confirm.disabled = true;
    if (q.example) {
      const ex = htmlToNode(scene.svg);
      ex.querySelectorAll('[data-r]').forEach((el) => (el.style.fill = q.example[el.dataset.r]));
      canvas.classList.add('paint-compare');
      canvas.replaceChildren(
        h('figure', {}, svg, h('figcaption', {}, '你的作品')),
        h('figure', {}, ex, h('figcaption', {}, '範例答案')));
      if (q.exampleNote) canvas.append(h('p', { class: 'paint-note' }, q.exampleNote));
    }
    done(q.check(fills, scene.regions));
  });

  root.append(canvas, status, palette, confirm);
  draw();
}
