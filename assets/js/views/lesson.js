// "Learn" lesson, built from a topic's rules: rule → examples (listen) → quick check, then a short quiz.
import { h, rich, shuffle } from '../lib/ui.js';
import { store } from '../lib/store.js';
import { game } from '../lib/game.js';
import { renderQuestion } from '../lib/quiz.js';
import { speak, SPEAKER } from '../lib/audio.js';
import { openSession, closeSession, fmtTime } from '../lib/session.js';

export function render(root, arg, { content }) {
  const m = content.modules.find(x => x.id === arg);
  if (!m) { root.append(h('p', {}, 'Topic not found.')); return; }
  const qs = shuffle(m.questions.filter(q => q.type !== 'forms' || true));
  // Screens: each rule, and after every second rule one check question; then 4 more questions.
  const screens = [];
  let qi = 0;
  m.rules.forEach((r, i) => { screens.push({ rule: r }); if (i % 2 === 1 && qs[qi]) screens.push({ q: qs[qi++] }); });
  for (let k = 0; k < 4 && qs[qi]; k++) screens.push({ q: qs[qi++] });

  const s = openSession(root, { onClose: () => (location.hash = '#home') });
  let i = 0, xp = 0, right = 0, asked = 0;
  const t0 = Date.now();
  const next = () => {
    s.progress(i / screens.length);
    if (i >= screens.length) return finish();
    const sc = screens[i];
    window.scrollTo({ top: 0 });
    const go = () => { i++; next(); };
    if (sc.q) {
      asked++;
      s.stage.replaceChildren(h('div', { class: 'lesson-screen' }, renderQuestion(sc.q, { session: s, forceChoice: true, onNext: r => { xp += r.xp; if (r.full) right++; go(); } })));
      return;
    }
    const r = sc.rule;
    s.stage.replaceChildren(h('div', { class: 'lesson-screen' },
      i === 0 ? h('div', { class: 'eyebrow' }, m.title) : null,
      h('p', { class: 'lead', html: rich(r.rule) }),
      r.examples?.length ? h('div', { class: 'examples' }, r.examples.map(ex => h('button', { class: 'example', onclick: () => speak(ex) }, h('span', { class: 'say', html: SPEAKER }), h('span', {}, ex)))) : null));
    if (r.examples?.[0]) setTimeout(() => speak(r.examples[0]), 300);
    s.dock(h('div', { class: 'dock' }, h('div', { class: 'dock-in' }, h('div', { class: 'msg meta' }, 'Tap an example to hear it'), h('button', { class: 'btn primary', onclick: go }, 'Continue'))));
  };
  function finish() {
    const done = { ...(store.setting('lessons') || {}) };
    const first = !done[m.id];
    done[m.id] = Date.now(); store.setting('lessons', done);
    if (first) { game.addXP(20); xp += 20; }
    store.record(`${m.id}-learn`, { ok: true, sure: true, module: m.id, skill: m.id, kind: 'l', text: `Lesson: ${m.title}`, answer: `${right}/${asked}`, ms: Date.now() - t0 });
    s.finish({ title: 'Lesson complete!', xp, acc: asked ? Math.round(right / asked * 100) : null, time: fmtTime(Date.now() - t0),
      buttons: [h('a', { class: 'btn', href: '#home' }, 'Home'), h('a', { class: 'btn primary', href: `#practice-${m.id}` }, 'Practice')] });
  }
  next();
  return closeSession;
}
