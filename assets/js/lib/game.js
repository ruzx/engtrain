// Игровой слой: опыт (XP), дневная цель, уровень, серия правильных ответов, звуки, конфетти.
import { store } from './store.js';

export const DAILY_GOAL = 50;
const today = () => new Date().toISOString().slice(0, 10);

export const game = {
  combo: 0,
  get xpToday() { return (store.setting('xp') || {})[today()] || 0; },
  get xpTotal() { return Object.values(store.setting('xp') || {}).reduce((a, b) => a + b, 0); },
  get level() { return Math.floor(Math.sqrt(game.xpTotal / 40)) + 1; },
  addXP(n) {
    const x = { ...(store.setting('xp') || {}) };
    const before = x[today()] || 0;
    x[today()] = before + n;
    store.setting('xp', x);
    if (before < DAILY_GOAL && before + n >= DAILY_GOAL) setTimeout(() => sound('goal'), 450);
    refreshTop();
  },
  // Ответ в сессии: обновить комбо, начислить XP, звук. Возвращает начисленный XP.
  answer(ok, part = 0) {
    if (ok) { game.combo++; sound('ok'); const xp = 10 + (game.combo >= 3 ? 5 : 0); game.addXP(xp); return xp; }
    game.combo = 0;
    if (part > 0) { sound('ok'); game.addXP(5); return 5; }
    sound('bad'); return 0;
  },
  resetCombo() { game.combo = 0; },
  get soundOn() { return store.setting('sound') !== false; },
  toggleSound() { store.setting('sound', !game.soundOn); return game.soundOn; },
};

// Счётчики в верхней панели
export function refreshTop() {
  const s = document.getElementById('topStreak'), x = document.getElementById('topXP');
  if (s) s.textContent = store.streak();
  if (x) x.textContent = game.xpToday;
}

// ---------- Звуки (WebAudio, без файлов) ----------
let ac = null;
export function sound(kind) {
  if (!game.soundOn) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const seq = {
      ok: [[660, 0, .09], [880, .08, .14]],
      bad: [[220, 0, .12], [180, .1, .18]],
      tap: [[520, 0, .04]],
      finish: [[523, 0, .12], [659, .12, .12], [784, .24, .12], [1047, .36, .3]],
      goal: [[784, 0, .1], [988, .1, .1], [1175, .2, .25]],
    }[kind] || [];
    for (const [f, t, d] of seq) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = kind === 'bad' ? 'square' : 'triangle'; o.frequency.value = f;
      const t0 = ac.currentTime + t;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(kind === 'bad' ? 0.05 : 0.12, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
      o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + d + 0.02);
    }
  } catch {}
}

// ---------- Конфетти ----------
export function confetti(n = 140) {
  let cv = document.getElementById('confetti');
  if (!cv) { cv = document.createElement('canvas'); cv.id = 'confetti'; document.body.append(cv); }
  const ctx = cv.getContext('2d');
  cv.width = innerWidth; cv.height = innerHeight;
  const cols = ['#58cc02', '#1cb0f6', '#ffc800', '#ff4b4b', '#ce82ff', '#ff9600'];
  const ps = Array.from({ length: n }, (_, i) => ({ x: innerWidth / 2 + (Math.random() - .5) * 240, y: innerHeight * .35, vx: (Math.random() - .5) * 16, vy: -Math.random() * 15 - 5, s: Math.random() * 8 + 5, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: cols[i % cols.length], life: 140 + Math.random() * 60 }));
  (function loop() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    let alive = 0;
    for (const p of ps) {
      if (p.life-- <= 0) continue; alive++;
      p.vy += .38; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.min(1, p.life / 40); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
    }
    if (alive) requestAnimationFrame(loop); else ctx.clearRect(0, 0, cv.width, cv.height);
  })();
}
