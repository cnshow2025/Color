// 色彩工具：色彩空間轉換、混色模型、CIEDE2000 色差

export function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
}

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

// h: 0–360，s、v: 0–1
export function hsvToRgb(h, s, v) {
  h = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] :
    h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255].map(Math.round);
}

export function rgbToHsv([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  return [(h + 360) % 360, max ? d / max : 0, max];
}

export function hsvHex(h, s = 1, v = 1) {
  return rgbToHex(hsvToRgb(h, s, v));
}

// sRGB → CIELAB（D65）
export function rgbToLab([r, g, b]) {
  const lin = (c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const R = lin(r), G = lin(g), B = lin(b);
  const X = (R * 0.4124564 + G * 0.3575761 + B * 0.1804375) / 0.95047;
  const Y = R * 0.2126729 + G * 0.7151522 + B * 0.072175;
  const Z = (R * 0.0193339 + G * 0.119192 + B * 0.9503041) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const fx = f(X), fy = f(Y), fz = f(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

// CIEDE2000 色差
export function deltaE2000([L1, a1, b1], [L2, a2, b2]) {
  const rad = Math.PI / 180, deg = 180 / Math.PI;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2);
  const Cb7 = ((C1 + C2) / 2) ** 7;
  const G = 0.5 * (1 - Math.sqrt(Cb7 / (Cb7 + 25 ** 7)));
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const hue = (b, a) => {
    if (b === 0 && a === 0) return 0;
    const h = Math.atan2(b, a) * deg;
    return h < 0 ? h + 360 : h;
  };
  const h1p = hue(b1, a1p), h2p = hue(b2, a2p);
  const dLp = L2 - L1, dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * rad) / 2);
  const Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
  let hbp;
  if (C1p * C2p === 0) hbp = h1p + h2p;
  else if (Math.abs(h1p - h2p) <= 180) hbp = (h1p + h2p) / 2;
  else hbp = h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2;
  const T = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad) +
    0.32 * Math.cos((3 * hbp + 6) * rad) - 0.2 * Math.cos((4 * hbp - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hbp - 275) / 25) ** 2));
  const Cbp7 = Cbp ** 7;
  const Rc = 2 * Math.sqrt(Cbp7 / (Cbp7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2);
  const Sc = 1 + 0.045 * Cbp;
  const Sh = 1 + 0.015 * Cbp * T;
  const Rt = -Math.sin(2 * dTheta * rad) * Rc;
  return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
}

export function colorDiff(a, b) {
  const toRgb = (c) => (typeof c === 'string' ? hexToRgb(c) : c);
  return deltaE2000(rgbToLab(toRgb(a)), rgbToLab(toRgb(b)));
}

export function describeDeltaE(dE) {
  if (dE < 2) return '幾乎一模一樣！';
  if (dE < 5) return '非常接近，只有細看才分得出來';
  if (dE < 10) return '很接近了';
  if (dE < 20) return '有點像，但差異明顯';
  return '差很多';
}

// 兩個色相角的最短距離（0–180）
export function hueDistance(a, b) {
  const d = Math.abs((((a - b) % 360) + 360) % 360);
  return d > 180 ? 360 - d : d;
}

// 加法混色（光）：各通道 0–1
export function lightMix(r, g, b) {
  return [r * 255, g * 255, b * 255].map(Math.round);
}

// 減法混色（顏料 CMY）：各顏料濃度 0–1
// 青吸收紅光、洋紅吸收綠光、黃吸收藍光
export function pigmentMix(c, m, y) {
  return [(1 - c) * 255, (1 - m) * 255, (1 - y) * 255].map(Math.round);
}

// 12 色相環：以顏料三原色 CMY 為原色
export const HUES12 = [
  { deg: 0, name: '紅', kind: 'secondary', mix: '洋紅 + 黃' },
  { deg: 30, name: '橙', kind: 'tertiary', mix: '黃 + 紅' },
  { deg: 60, name: '黃', kind: 'primary' },
  { deg: 90, name: '黃綠', kind: 'tertiary', mix: '黃 + 綠' },
  { deg: 120, name: '綠', kind: 'secondary', mix: '青 + 黃' },
  { deg: 150, name: '青綠', kind: 'tertiary', mix: '青 + 綠' },
  { deg: 180, name: '青', kind: 'primary' },
  { deg: 210, name: '天藍', kind: 'tertiary', mix: '青 + 藍' },
  { deg: 240, name: '藍', kind: 'secondary', mix: '青 + 洋紅' },
  { deg: 270, name: '紫', kind: 'tertiary', mix: '洋紅 + 藍' },
  { deg: 300, name: '洋紅', kind: 'primary' },
  { deg: 330, name: '玫瑰紅', kind: 'tertiary', mix: '洋紅 + 紅' },
].map((h, i) => ({ ...h, index: i, hex: hsvHex(h.deg) }));

export const KIND_NAMES = { primary: '原色', secondary: '二次色', tertiary: '三次色' };

// 小工具
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pick(arr, n) {
  return shuffle(arr).slice(0, n);
}

export function randInt(lo, hi) {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}
