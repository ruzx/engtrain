// English exercise helpers: template variants, answer checking, sentence for audio, hashing.
export const NONE = ['no article', 'no preposition'];
const isNone = a => NONE.includes(a) || a === '' || a === '-';

// Choose a variant for templates with %1 / %2. Returns { text, key }.
export function variant(q, pick) {
  let text = q.text;
  if (!q.args) return { text, idx: [] };
  let idx;
  if (pick) idx = pick;
  else if (q.tied) { const k = Math.floor(Math.random() * q.args[0].length); idx = q.args.map(() => k); }
  else idx = q.args.map(list => Math.floor(Math.random() * list.length));
  q.args.forEach((list, n) => { text = text.replace('%' + (n + 1), list[idx[n]]); });
  return { text: tidy(text), idx };
}
const tidy = s => s.replace(/\s+/g, ' ').replace(/\s([.,!?])(?!\.)/g, '$1').trim();

// All variants (for audio generation)
export function allVariants(q) {
  if (!q.args) return [q.text];
  if (q.tied) return q.args[0].map((_, k) => variant(q, q.args.map(() => k)).text);
  const out = [];
  const rec = (n, idx) => { if (n === q.args.length) return out.push(variant(q, idx).text); q.args[n].forEach((_, k) => rec(n + 1, [...idx, k])); };
  rec(0, []);
  return out;
}

export function normalize(s) {
  return String(s || '').toLowerCase().replace(/[’‘`]/g, "'").replace(/[—–]/g, '-').replace(/[.!?,;:]+$/g, '').replace(/\s+/g, ' ').trim();
}

export function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

// Check typed answer. Returns { ok, typo, matched }
export function checkTyped(input, answers) {
  const v = normalize(input);
  for (const a of answers) {
    if (isNone(a) && ['', '-', '0', 'no article', 'no preposition', 'none', 'nothing'].includes(v)) return { ok: true, matched: a };
    if (normalize(a) === v) return { ok: true, matched: a };
  }
  for (const a of answers) {
    if (isNone(a)) continue;
    const na = normalize(a);
    if (na.length >= 5 && lev(na, v) === 1) return { ok: true, typo: true, matched: a };
  }
  return { ok: false };
}

// Irregular verbs: two inputs. answers like ["began begun"]. Returns { score 0..1, typo, matched }
export function checkForms(f2, f3, answers) {
  const a2 = normalize(f2), a3 = normalize(f3);
  let best = { score: 0 };
  for (const a of answers) {
    const [x2, x3] = a.split(' ');
    const m2 = a2 === x2 || (x2 === 'was' && ['were', 'was/were', 'was / were', 'were/was'].includes(a2));
    const m3 = a3 === x3;
    const t2 = !m2 && x2.length >= 5 && lev(a2, x2) === 1, t3 = !m3 && x3.length >= 5 && lev(a3, x3) === 1;
    const score = ((m2 || t2) ? 0.5 : 0) + ((m3 || t3) ? 0.5 : 0);
    if (score > best.score) best = { score, typo: t2 || t3, matched: a };
  }
  return best;
}

// Display text: "..." → blank
export function blankHTML(text, fill) {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const parts = esc(text).split('...');
  if (parts.length === 1) return parts[0];
  const b = fill == null ? '<span class="blank">&nbsp;</span>' : `<span class="blank filled">${isNone(fill) ? '—' : esc(fill)}</span>`;
  return parts.join(b);
}

// Full sentence (for audio and review): fill the blank, drop hints in brackets
export function sentence(text, answer, type) {
  if (type === 'forms') return `${text.replace(/\s*\(.*?\)/g, '')}, ${answer.replace(' ', ', ')}`;
  let s = text.replace(/\s*\((?!['"])[^)]*\)/g, '');
  s = isNone(answer) ? s.replace(/\s*\.\.\.\s*/, ' ') : s.replace('...', answer);
  return tidy(s).replace(/^"|"$/g, '');
}

// Stable hash for audio file names (same algorithm in tools/make_audio.py)
export function hash(str) {
  let h = 5381;
  for (const ch of str.normalize('NFC')) { h = ((h * 33) ^ ch.codePointAt(0)) >>> 0; }
  return h.toString(16).padStart(8, '0');
}
