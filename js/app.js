// 主程式：畫面切換、進度存檔、關卡流程
import { h, htmlToNode, buzz } from './dom.js';
import { LEVELS, CHAPTERS } from './levels.js';
import { hsvHex } from './color-utils.js';
import { sectorPath } from './visuals.js';
import * as choice from './games/choice.js';
import * as mix from './games/mix.js';
import * as sort from './games/sort.js';
import * as wheel from './games/wheel.js';
import * as classify from './games/classify.js';
import * as paint from './games/paint.js';
import * as contrast from './games/contrast.js';

const GAMES = { choice, mix, sort, wheel, classify, paint, contrast };
const app = document.getElementById('app');

// ---------- 進度存檔 ----------
const STORE_KEY = 'colorquest.v1';
const store = (() => {
  let data = { stars: {} };
  try { data = { ...data, ...JSON.parse(localStorage.getItem(STORE_KEY) || '{}') }; } catch { /* 無法讀取就用預設 */ }
  return {
    stars: (id) => data.stars[id] || 0,
    setStars(id, n) {
      if (n <= (data.stars[id] || 0)) return;
      data.stars[id] = n;
      try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch { /* 忽略 */ }
    },
    total: () => Object.values(data.stars).reduce((a, b) => a + b, 0),
  };
})();

function isUnlocked(level) {
  if (!level.ready) return false;
  return level.id === 1 || store.stars(level.id - 1) >= 1;
}

function starsText(n, max = 3) {
  return '★'.repeat(n) + '☆'.repeat(max - n);
}

// ---------- 路由 ----------
function go(path) {
  location.hash = path;
}

function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  window.scrollTo(0, 0);
  if (parts[0] === 'level') {
    const level = LEVELS[Number(parts[1]) - 1];
    if (!level || !isUnlocked(level)) return go('/');
    const step = parts[2];
    if (step === 'learn') return showLearn(level);
    if (step === 'practice') return showRun(level, 'practice');
    if (step === 'challenge') return showRun(level, 'challenge');
    return showIntro(level);
  }
  if (parts[0] === 'dex') return showDex();
  showMap();
}

function screen(title, backPath, ...content) {
  const top = h('header', { class: 'topbar' },
    backPath != null ? h('button', { class: 'icon-btn', type: 'button', 'aria-label': '返回', onclick: () => go(backPath) }, '‹') : h('span', { class: 'icon-spacer' }),
    h('h1', { class: 'topbar-title' }, title),
    h('span', { class: 'icon-spacer' }));
  app.replaceChildren(top, h('main', { class: 'screen' }, ...content));
}

// ---------- 地圖 ----------
function progressRing() {
  const segs = LEVELS.map((lv, i) => {
    const a0 = i * 18 + 1, a1 = (i + 1) * 18 - 1;
    const lit = store.stars(lv.id) > 0;
    return `<path d="${sectorPath(60, 60, 40, 56, a0, a1)}" style="fill:${lit ? hsvHex(lv.hue, 0.85, 0.95) : 'var(--track)'}"/>`;
  }).join('');
  const done = LEVELS.filter((lv) => store.stars(lv.id) > 0).length;
  return htmlToNode(`<div class="ring-progress"><svg viewBox="0 0 120 120">${segs}</svg><div class="ring-progress-text"><b>${done}</b><span>/ 20 關</span></div></div>`);
}

let installEvent = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installEvent = e;
  document.querySelector('.install-btn')?.classList.remove('hidden');
});

function showMap() {
  const installBtn = h('button', { class: 'btn btn-ghost install-btn' + (installEvent ? '' : ' hidden'), type: 'button' }, '📲 安裝到主畫面');
  installBtn.addEventListener('click', async () => {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    installEvent = null;
    installBtn.classList.add('hidden');
  });

  const hero = h('section', { class: 'hero' },
    progressRing(),
    h('div', { class: 'hero-text' },
      h('p', { class: 'hero-sub' }, '一關一關點亮你的色相環'),
      h('p', { class: 'hero-stars' }, `★ ${store.total()} / 60`),
      h('div', { class: 'hero-actions' },
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => go('/dex') }, '📖 色彩圖鑑'),
        installBtn)));

  const chapters = CHAPTERS.map((ch) => {
    const nodes = ch.levels.map((id, k) => {
      const lv = LEVELS[id - 1];
      const unlocked = isUnlocked(lv);
      const stars = store.stars(id);
      const color = hsvHex(lv.hue, 0.85, 0.95);
      const node = h('button', {
        class: `node pos${k % 4}` + (unlocked ? '' : ' locked') + (stars ? ' done' : ''),
        type: 'button', disabled: !unlocked,
        style: unlocked ? { '--node': color } : null,
        'aria-label': `第 ${id} 關 ${lv.title}`,
      },
      h('span', { class: 'node-dot' }, unlocked ? String(id) : '🔒'),
      h('span', { class: 'node-info' },
        h('span', { class: 'node-title' }, lv.title),
        h('span', { class: 'node-sub' }, lv.ready ? (unlocked ? starsText(stars) : '通過上一關解鎖') : '即將推出')));
      if (unlocked) node.addEventListener('click', () => go(`/level/${id}`));
      return node;
    });
    return h('section', { class: 'chapter' },
      h('h2', { class: 'chapter-title' }, h('span', {}, `第 ${ch.id} 章`), ch.name),
      h('div', { class: 'path' }, nodes));
  });

  screen('色彩冒險', null, hero, ...chapters);
}

// ---------- 關卡首頁 ----------
function showIntro(level) {
  const stars = store.stars(level.id);
  screen(`第 ${level.id} 關`, '/',
    h('section', { class: 'intro', style: { '--node': hsvHex(level.hue, 0.85, 0.95) } },
      h('div', { class: 'intro-badge' }, String(level.id)),
      h('h2', {}, level.title),
      h('p', { class: 'muted' }, level.subtitle),
      h('p', { class: 'intro-stars' }, starsText(stars)),
      h('div', { class: 'steps' },
        stepBtn('📖', '學習', `${level.learn.length} 張圖解卡片`, `/level/${level.id}/learn`),
        stepBtn('✋', '練習', '動手試試，答錯可以重來', `/level/${level.id}/practice`),
        stepBtn('🏆', '挑戰', '拿到 1 顆星就能解鎖下一關', `/level/${level.id}/challenge`))));
}

function stepBtn(icon, name, desc, path) {
  return h('button', { class: 'step', type: 'button', onclick: () => go(path) },
    h('span', { class: 'step-icon' }, icon),
    h('span', { class: 'step-text' }, h('b', {}, name), h('span', {}, desc)),
    h('span', { class: 'step-arrow' }, '›'));
}

// ---------- 學習卡片 ----------
function cardNode(card) {
  return h('article', { class: 'card' },
    card.visual ? h('div', { class: 'card-visual' }, htmlToNode(card.visual)) : null,
    h('h3', {}, card.title),
    h('p', { html: card.body }));
}

function showLearn(level) {
  let i = 0;
  const holder = h('div', { class: 'card-holder' });
  const dots = h('div', { class: 'dots' });
  const prev = h('button', { class: 'btn btn-ghost', type: 'button' }, '上一張');
  const next = h('button', { class: 'btn btn-primary', type: 'button' });

  function draw() {
    holder.replaceChildren(cardNode(level.learn[i]));
    dots.replaceChildren(...level.learn.map((_, k) => h('span', { class: 'dot' + (k === i ? ' on' : '') })));
    prev.disabled = i === 0;
    next.textContent = i === level.learn.length - 1 ? '開始練習 ›' : '下一張';
  }
  prev.addEventListener('click', () => { i--; draw(); });
  next.addEventListener('click', () => {
    if (i === level.learn.length - 1) return go(`/level/${level.id}/practice`);
    i++;
    draw();
  });

  // 左右滑動換卡片
  let x0 = null;
  holder.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
  holder.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0;
    x0 = null;
    if (dx < -50 && i < level.learn.length - 1) { i++; draw(); }
    if (dx > 50 && i > 0) { i--; draw(); }
  });

  screen(`${level.title}．學習`, `/level/${level.id}`, holder, dots, h('div', { class: 'nav-row' }, prev, next));
  draw();
}

// ---------- 練習 / 挑戰 ----------
function showRun(level, mode) {
  const questions = mode === 'practice' ? level.practice() : level.challenge();
  const scores = [];
  let idx = 0;

  const bar = h('div', { class: 'qbar-fill' });
  const counter = h('span', { class: 'qcount' });
  const body = h('div', { class: 'qbody' });
  const sheet = h('div', { class: 'sheet hidden' });

  screen(`${level.title}．${mode === 'practice' ? '練習' : '挑戰'}`, `/level/${level.id}`,
    h('div', { class: 'qbar' }, h('div', { class: 'qbar-track' }, bar), counter),
    body, sheet);

  function ask() {
    const q = questions[idx];
    counter.textContent = `${idx + 1} / ${questions.length}`;
    bar.style.width = (idx / questions.length) * 100 + '%';
    sheet.classList.add('hidden');
    body.replaceChildren(h('p', { class: 'prompt' }, q.prompt));
    const area = h('div', { class: 'qarea' });
    body.append(area);
    GAMES[q.type].render(area, q, (res) => feedback(q, res));
    window.scrollTo(0, 0);
  }

  function feedback(q, res) {
    if (!res.correct) buzz(80);
    const last = idx === questions.length - 1;
    const good = res.correct;
    const title = good ? (res.score >= 0.99 ? '答對了！' : '不錯，很接近！') : '再想想看';
    const buttons = [];
    if (mode === 'practice' && !good) {
      buttons.push(h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => ask() }, '再試一次'));
    }
    const nextBtn = h('button', { class: 'btn btn-primary', type: 'button' }, last ? (mode === 'practice' ? '完成練習' : '看結果') : '下一題');
    nextBtn.addEventListener('click', () => {
      scores.push(res.score);
      if (last) return finish();
      idx++;
      ask();
    });
    buttons.push(nextBtn);
    sheet.className = 'sheet ' + (good ? 'good' : 'bad');
    sheet.replaceChildren(...[
      h('div', { class: 'sheet-title' }, (good ? '✓ ' : '✗ ') + title),
      res.detail ? h('p', { class: 'sheet-detail' }, res.detail) : null,
      q.explain ? h('p', { class: 'sheet-explain' }, q.explain) : null,
      h('div', { class: 'sheet-btns' }, buttons)].filter(Boolean));
    requestAnimationFrame(() => sheet.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  }

  function finish() {
    bar.style.width = '100%';
    if (mode === 'practice') return showPracticeDone(level);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const stars = avg >= 0.9 ? 3 : avg >= 0.75 ? 2 : avg >= 0.5 ? 1 : 0;
    store.setStars(level.id, stars);
    showResult(level, avg, stars);
  }

  ask();
}

function showPracticeDone(level) {
  screen(`${level.title}．練習`, `/level/${level.id}`,
    h('section', { class: 'result' },
      h('div', { class: 'result-emoji' }, '✋'),
      h('h2', {}, '練習完成！'),
      h('p', { class: 'muted' }, '準備好了就去挑戰吧，拿到星星就能解鎖下一關。'),
      h('div', { class: 'result-btns' },
        h('button', { class: 'btn btn-primary btn-block', type: 'button', onclick: () => go(`/level/${level.id}/challenge`) }, '🏆 開始挑戰'),
        h('button', { class: 'btn btn-ghost btn-block', type: 'button', onclick: () => showRun(level, 'practice') }, '再練一次'))));
}

function showResult(level, avg, stars) {
  const next = LEVELS[level.id];
  const messages = ['還差一點，再試一次吧！', '過關了！', '很棒！', '完美！你已經掌握這一關了！'];
  const btns = [];
  if (stars >= 1 && next && next.ready) {
    btns.push(h('button', { class: 'btn btn-primary btn-block', type: 'button', onclick: () => go(`/level/${next.id}`) }, `下一關：${next.title} ›`));
  }
  btns.push(h('button', { class: 'btn ' + (stars ? 'btn-ghost' : 'btn-primary') + ' btn-block', type: 'button', onclick: () => showRun(level, 'challenge') }, '再挑戰一次'));
  if (!stars) btns.push(h('button', { class: 'btn btn-ghost btn-block', type: 'button', onclick: () => go(`/level/${level.id}/learn`) }, '回去複習'));
  btns.push(h('button', { class: 'btn btn-ghost btn-block', type: 'button', onclick: () => go('/') }, '回地圖'));
  if (stars >= 1 && next && !next.ready) btns.unshift(h('p', { class: 'muted center' }, `第 ${next.id} 關「${next.title}」即將推出，敬請期待！`));

  screen(`${level.title}．結果`, `/level/${level.id}`,
    h('section', { class: 'result' },
      h('div', { class: 'result-stars' }, [0, 1, 2].map((k) => h('span', { class: 'rstar' + (k < stars ? ' on' : ''), style: { animationDelay: `${k * 0.2}s` } }, '★'))),
      h('h2', {}, messages[stars]),
      h('p', { class: 'muted' }, `得分 ${Math.round(avg * 100)} 分（90 分 ★★★、75 分 ★★、50 分 ★）`),
      h('div', { class: 'result-btns' }, btns)));
  if (stars) buzz(30);
}

// ---------- 色彩圖鑑 ----------
function showDex() {
  const open = LEVELS.filter((lv) => lv.ready && isUnlocked(lv));
  const sections = open.map((lv) => h('section', { class: 'dex-sec' },
    h('h2', { class: 'chapter-title' }, h('span', {}, `第 ${lv.id} 關`), lv.title),
    lv.learn.map(cardNode)));
  screen('色彩圖鑑', '/',
    h('p', { class: 'muted' }, '已解鎖關卡的觀念都會收在這裡，隨時可以複習。'),
    ...sections);
}

// ---------- 啟動 ----------
window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => { /* 離線功能無法使用時忽略 */ });
}
