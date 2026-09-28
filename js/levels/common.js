// 各章節共用的出題工具
export const choice = (prompt, options, answer, explain, visual) => ({
  type: 'choice', prompt, explain, visual,
  options: options.map((o) => (typeof o === 'string' ? { label: o } : o)),
  answer,
});

export const mixQ = (mode, target, prompt, explain, step = 5) => ({
  type: 'mix', mode, target, prompt, explain, step,
});

export const C = { R: '#ff0000', G: '#00ff00', B: '#0000ff', C: '#00ffff', M: '#ff00ff', Y: '#ffff00', W: '#ffffff', K: '#000000' };
