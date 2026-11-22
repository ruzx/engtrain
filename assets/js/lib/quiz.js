// Question renderer for English exercises.
// Types: choice (options), text (type the missing word), forms (irregular verbs: two inputs).
// Desirable difficulty: a choice item that is already known (box ≥ 2) is asked as typing.
import { h, rich, shuffle } from './ui.js';
import { store } from './store.js';
import { game, sound } from './game.js';
import { variant, blankHTML, checkTyped, checkForms, sentence, normalize } from './english.js';
import { speak, audioOn, SPEAKER } from './audio.js';

const OK_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="#58a700" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const BAD_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="#ea2b2b" stroke-width="3.5" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const PRAISE = ['Great!', 'Correct!', 'Nice!', 'Excellent!', 'Well done!', 'Perfect!'];
const LABEL = { choice: 'Choose the answer', text: 'Type the missing word', forms: 'Past Simple and Past Participle' };

export function renderQuestion(q, { onNext, session, nextLabel = 'Continue', forceChoice = false } = {}) {
  const it = store.item(q.id);
  const mode = q.type === 'choice' && !forceChoice && it && it.box >= 2 ? 'text' : q.type;
  const v = variant(q);
  const root = h('div', { class: 'q' });
  const state = { sel: null, done: false, t0: Date.now() };
  root.append(h('div', { class: 'q-head' }, h('span', {}, LABEL[mode]), mode !== q.type ? h('span', { class: 'level-up' }, 'Level up: no options') : null));
  const qtext = h('p', { class: 'q-text', html: mode === 'forms' ? `<span class="verb">${esc(v.text)}</span>` : blankHTML(v.text) });
  root.append(qtext);
  const body = h('div');
  root.append(body);

  let check;
  if (mode === 'choice') check = choice();
  else if (mode === 'text') check = typed();
  else check = forms();

  const unsure = h('input', { type: 'checkbox' });
  const dock = h('div', { class: 'dock' }, h('div', { class: 'dock-in' },
    h('label', { class: 'unsure', style: { margin: 0, flex: 1 } }, unsure, 'Not sure'),
    h('button', { class: 'btn green', onclick: () => submit() }, 'Check')));
  const setDock = el => session ? session.dock(el) : root.append(el);
  setDock(dock);
  const onKey = e => {
    if (e.key === 'Enter') { e.preventDefault(); state.done ? cont() : submit(); }
    else if (!state.done && mode === 'choice' && /^[1-6]$/.test(e.key)) body.querySelectorAll('.opt')[+e.key - 1]?.click();
  };
  addEventListener('keydown', onKey);
  let cont = () => {};

  function choice() {
    const list = h('div', { class: 'opts' });
    const btns = q.options.map((o, i) => {
      const b = h('button', { class: 'opt', onclick: () => { if (state.done) return; sound('tap'); state.sel = o; btns.forEach(x => x.classList.remove('sel')); b.classList.add('sel'); } },
        h('span', { class: 'n' }, String(i + 1)), h('span', {}, o));
      list.append(b); return b;
    });
    body.append(list);
    return () => {
      if (state.sel == null) return null;
      const ok = q.answer.some(a => normalize(a) === normalize(state.sel));
      btns.forEach((b, i) => { b.disabled = true; b.classList.remove('sel'); const o = q.options[i]; if (q.answer.includes(o)) b.classList.add('ok'); else if (o === state.sel) b.classList.add('bad'); });
      return { score: ok ? 1 : 0, given: state.sel };
    };
  }

  function typed() {
    const hasNone = q.answer.some(a => ['no article', 'no preposition'].includes(a));
    const inp = h('input', { class: 'text-input', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Type here', style: { width: '100%', maxWidth: '420px' } });
    body.append(inp);
    if (hasNone || (q.options || []).some(o => o === 'no article' || o === 'no preposition')) body.append(h('p', { class: 'meta', style: { marginTop: '8px' } }, 'Type – (dash) if nothing is needed.'));
    setTimeout(() => inp.focus(), 60);
    return () => {
      if (!inp.value.trim() && !hasNone) return null;
      const r = checkTyped(inp.value, q.answer);
      inp.disabled = true;
      inp.style.borderColor = r.ok ? 'var(--green)' : 'var(--red)';
      return { score: r.ok ? 1 : 0, typo: r.typo, matched: r.matched, given: inp.value.trim() || '–' };
    };
  }

  function forms() {
    const i2 = h('input', { class: 'text-input', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Past Simple' });
    const i3 = h('input', { class: 'text-input', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Past Participle' });
    i2.addEventListener('keydown', e => { if (e.key === 'Enter' && !i3.value) { e.preventDefault(); e.stopPropagation(); i3.focus(); } });
    body.append(h('div', { class: 'row', style: { gap: '12px' } }, i2, i3));
    setTimeout(() => i2.focus(), 60);
    return () => {
      if (!i2.value.trim() || !i3.value.trim()) return null;
      const r = checkForms(i2.value, i3.value, q.answer);
      [i2, i3].forEach(x => x.disabled = true);
      return { score: r.score, typo: r.typo, matched: r.matched, given: `${i2.value.trim()} ${i3.value.trim()}` };
    };
  }

  function submit() {
    if (state.done) return;
    const res = check();
    if (!res) { body.classList.add('shake'); setTimeout(() => body.classList.remove('shake'), 300); return; }
    state.done = true;
    const sure = !unsure.checked;
    const full = res.score === 1;
    store.record(q.id, { ok: full ? true : res.score, sure, skill: q.skill, module: q.module, answer: res.given, ms: Date.now() - state.t0, text: v.text, score: res.score, max: 1 });
    const xp = game.answer(full, res.score);
    session?.combo();
    const correct = res.matched || q.answer[0];
    const full_sentence = sentence(v.text, correct, q.type);
    if (q.type !== 'forms') qtext.innerHTML = blankHTML(v.text, correct);
    if (audioOn() && full) setTimeout(() => speak(full_sentence), 250);
    const cls = full ? 'ok' : res.score > 0 ? 'part' : 'bad';
    const title = full ? (res.typo ? 'Correct, but check the spelling' : sure ? PRAISE[Math.floor(Math.random() * PRAISE.length)] : 'Correct! It will come back sooner') :
      res.score > 0 ? 'Half right' : (sure ? 'Confident mistake — note this one' : 'Not quite');
    const answerText = q.type === 'forms' ? q.answer.map(a => a.replace(' ', ' — ')).join(' / ') : q.answer.map(a => a === 'no article' || a === 'no preposition' ? `– (${a})` : a).join(' / ');
    cont = () => { removeEventListener('keydown', onKey); try { speechSynthesis.cancel(); } catch {} onNext && onNext({ score: res.score, max: 1, full, sure, xp }); };
    setDock(h('div', { class: `dock ${cls}` }, h('div', { class: 'dock-in' },
      h('div', { class: 'msg' },
        h('b', {}, h('span', { class: 'badge', html: full ? OK_ICO : BAD_ICO }), title),
        !full || res.typo ? h('div', { class: 'exp', html: 'Answer: <b>' + esc(answerText) + '</b>' }) : null,
        h('div', { class: 'exp sentence' }, h('button', { class: 'say', title: 'Listen', html: SPEAKER, onclick: () => speak(full_sentence) }), full_sentence),
        q.explain ? h('div', { class: 'exp', html: rich(q.explain) }) : null),
      h('button', { class: 'btn', onclick: () => cont() }, nextLabel))));
  }
  return root;
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Session builder: due first, then new, then weakest; interleave skills.
export function buildSession(questions, n = 10) {
  const now = Date.now();
  const due = [], fresh = [], rest = [];
  for (const q of questions) {
    const it = store.item(q.id);
    if (!it) fresh.push(q); else if (it.due <= now) due.push(q); else rest.push(q);
  }
  rest.sort((a, b) => (store.item(a.id).box - store.item(b.id).box) || (store.item(a.id).due - store.item(b.id).due));
  const pool = [...shuffle(due), ...shuffle(fresh), ...rest].slice(0, n * 2);
  const by = {};
  for (const q of pool) (by[q.module + q.skill] ||= []).push(q);
  const groups = Object.values(by), out = [];
  while (out.length < n && groups.some(g => g.length)) for (const g of groups) if (g.length && out.length < n) out.push(g.shift());
  return out;
}
