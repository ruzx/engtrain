// Прогресс ученика в localStorage + интервальное повторение (коробки Лейтнера).
const KEY = 'chem-oge-v1';
const DAY = 864e5;
// Интервалы по коробкам, дни. Коробка 0 — «снова сегодня».
export const BOXES = [0, 1, 3, 7, 14, 30, 60];

let mem = { items: {}, log: [], days: [], settings: {} };
const listeners = [];
try { const raw = localStorage.getItem(KEY); if (raw) mem = { ...mem, ...JSON.parse(raw) }; } catch {}

function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch {} }

export const store = {
  get data() { return mem; },
  item(id) { return mem.items[id]; },
  setting(k, v) { if (v === undefined) return mem.settings[k]; mem.settings[k] = v; save(); },

  // Записать ответ. ok: true/false/0..1 (частичный), sure: уверен ли ученик.
  onRecord(fn) { listeners.push(fn); },

  // extra: answer (что ответил), ms (время), text (формулировка) — уходят в отчёт преподавателю
  record(id, { ok, sure, skill, module, kind = 'q', answer, ms, text, score, max }) {
    const now = Date.now();
    const it = mem.items[id] || { box: 0, due: now, n: 0, right: 0, kind, skill, module };
    it.n++; it.skill = skill || it.skill; it.module = module || it.module; it.kind = kind;
    const full = ok === true || ok === 1;
    if (full) it.right++;
    if (full && sure) it.box = Math.min(it.box + 1, BOXES.length - 1);
    else if (full && !sure) it.box = Math.max(1, it.box);
    else it.box = 0;
    it.due = it.box === 0 ? now + 10 * 60e3 : now + BOXES[it.box] * DAY;
    it.last = now; it.lastOk = full; it.lastSure = !!sure;
    mem.items[id] = it;
    mem.log.push({ t: now, id, ok: full ? 1 : (typeof ok === 'number' ? ok : 0), sure: sure ? 1 : 0, skill, module, kind });
    if (mem.log.length > 5000) mem.log = mem.log.slice(-5000);
    const d = new Date().toISOString().slice(0, 10);
    if (!mem.days.includes(d)) mem.days.push(d);
    save();
    const ev = { t: now, id, kind, module, skill, ok: full ? 1 : (typeof ok === 'number' ? Math.round(ok * 100) / 100 : 0), sure: sure ? 1 : 0, answer, ms, text, score, max };
    listeners.forEach(fn => { try { fn(ev); } catch {} });
  },

  dueIds(filter = () => true) {
    const now = Date.now();
    return Object.entries(mem.items).filter(([id, it]) => it.due <= now && filter(id, it)).map(([id]) => id);
  },
  seen(id) { return !!mem.items[id]; },

  // Доля освоенных: коробка ≥ 2.
  mastery(ids) {
    if (!ids.length) return 0;
    return ids.filter(id => (mem.items[id]?.box || 0) >= 2).length / ids.length;
  },

  streak() {
    const set = new Set(mem.days);
    let n = 0, d = new Date();
    if (!set.has(d.toISOString().slice(0, 10))) d = new Date(Date.now() - DAY);
    while (set.has(d.toISOString().slice(0, 10))) { n++; d = new Date(d.getTime() - DAY); }
    return n;
  },

  export() { return JSON.stringify(mem); },
  import(json) { const o = JSON.parse(json); if (!o.items) throw new Error('bad'); mem = { ...mem, ...o }; save(); },
  reset() { mem = { items: {}, log: [], days: [], settings: mem.settings }; save(); },
};
