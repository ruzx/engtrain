// Blitz (Kahoot style): 10 multiple-choice questions, 20 seconds each, points for speed, personal records.
import { h, shuffle } from '../lib/ui.js';
import { store } from '../lib/store.js';
import { allQuestions } from '../lib/content.js';
import { game } from '../lib/game.js';
import { variant, blankHTML, sentence } from '../lib/english.js';
import { speak, audioOn } from '../lib/audio.js';
import { openSession, closeSession } from '../lib/session.js';

const TIME = 20;
const TILES = [['#e21b3c', '▲'], ['#1368ce', '◆'], ['#d89e00', '●'], ['#26890c', '■']];

export function render(root, _arg, { content }) {
  const pool = allQuestions(content).filter(q => q.type === 'choice' && q.options.length <= 4);
  let timer = null;
  start();
  function start() {
    root.replaceChildren();
    const s = openSession(root);
    const qs = shuffle(pool).slice(0, 10);
    let i = 0, score = 0, right = 0, xp = 0;
    const next = () => {
      s.progress(i / qs.length);
      if (i >= qs.length) return finish();
      const q = qs[i], v = variant(q);
      let left = TIME, answered = false;
      const t0 = Date.now();
      const timeBar = h('i', { style: { width: '100%', background: '#ce82ff', transition: 'width .1s linear' } });
      const pts = h('div', { class: 'big-num', style: { fontSize: '22px', textAlign: 'right' } }, String(score));
      const qtext = h('p', { class: 'q-text', style: { marginTop: '18px', textAlign: 'center' }, html: blankHTML(v.text) });
      const tiles = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '12px', marginTop: '18px' } });
      const order = shuffle(q.options);
      const btns = order.map((o, pos) => {
        const [col, shape] = TILES[pos];
        const b = h('button', { class: 'opt kahoot', style: { background: col, minHeight: '84px', fontSize: '20px' }, onclick: () => pick(o) }, h('span', { style: { fontSize: '22px', width: '26px' } }, shape), h('span', {}, o));
        tiles.append(b); return b;
      });
      s.stage.replaceChildren(h('div', { class: 'lesson-screen' }, h('div', { class: 'row' }, h('div', { class: 'bar thin', style: { flex: 1 } }, timeBar), pts), qtext, tiles));
      s.dock(null);
      clearInterval(timer);
      timer = setInterval(() => { left -= 0.1; timeBar.style.width = Math.max(0, left / TIME * 100) + '%'; if (left <= 0) { clearInterval(timer); pick(null); } }, 100);
      function pick(o) {
        if (answered) return; answered = true; clearInterval(timer);
        const ok = o != null && q.answer.includes(o);
        let gain = 0;
        if (ok) { gain = Math.round(500 + 500 * Math.max(0, left) / TIME) + (game.combo >= 2 ? 100 : 0); score += gain; right++; }
        xp += game.answer(ok); s.combo();
        store.record(q.id, { ok, sure: true, skill: q.skill, module: q.module, answer: o ?? 'no answer', ms: Date.now() - t0, text: v.text, score: ok ? 1 : 0, max: 1 });
        btns.forEach((b, pos) => { b.disabled = true; const isAns = q.answer.includes(order[pos]); b.style.opacity = isAns ? '1' : '.35'; if (isAns) b.style.outline = '4px solid #fff'; });
        qtext.innerHTML = blankHTML(v.text, q.answer[0]);
        if (ok && audioOn()) speak(sentence(v.text, q.answer[0], q.type));
        pts.textContent = String(score);
        s.dock(h('div', { class: `dock ${ok ? 'ok' : 'bad'}` }, h('div', { class: 'dock-in' },
          h('div', { class: 'msg' }, h('b', {}, ok ? `+${gain}` : o == null ? "Time's up" : 'Missed'), !ok ? h('div', { class: 'exp' }, 'Answer: ', h('b', {}, q.answer.join(' / '))) : null),
          h('button', { class: 'btn', onclick: () => { i++; next(); } }, 'Next'))));
      }
    };
    next();
    function finish() {
      const best = [...(store.setting('blitzBest') || []), { score, d: new Date().toLocaleDateString() }].sort((a, b) => b.score - a.score).slice(0, 5);
      store.setting('blitzBest', best);
      s.finish({
        title: best[0].score === score && score > 0 ? 'New record!' : 'Blitz complete', xp, acc: Math.round(right / qs.length * 100),
        extra: [h('div', { class: 'big-num', style: { margin: '6px 0 16px' } }, score + ' points'),
          h('div', { class: 'card', style: { maxWidth: '320px', margin: '0 auto 10px', textAlign: 'left' } }, h('h3', {}, 'Your records'),
            ...best.map((b, n) => h('div', { class: 'row', style: { justifyContent: 'space-between', padding: '4px 0' } }, h('span', {}, `${n + 1}. ${b.d}`), h('b', {}, String(b.score)))))],
        buttons: [h('a', { class: 'btn', href: '#home' }, 'Done'), h('button', { class: 'btn primary', onclick: start }, 'Play again')],
      });
    }
  }
  return () => { clearInterval(timer); closeSession(); };
}
