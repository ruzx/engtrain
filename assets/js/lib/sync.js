// Отправка ответов преподавателю (Google Apps Script → Google-таблица).
// Адрес задаётся в content/manifest.json → "reportUrl". Пусто — ничего не отправляется.
// Ответы копятся в очереди и уходят, когда есть сеть (работает и офлайн).
const OUT = 'chem-oge-outbox';
let url = '';
let getName = () => '';

function load() { try { return JSON.parse(localStorage.getItem(OUT) || '[]'); } catch { return []; } }
function saveQ(q) { try { localStorage.setItem(OUT, JSON.stringify(q.slice(-2000))); } catch {} }

export const sync = {
  init(reportUrl, nameFn) {
    url = reportUrl || ''; getName = nameFn;
    if (!url) return;
    addEventListener('online', () => sync.flush());
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') sync.flush(); });
    setTimeout(() => sync.flush(), 1500);
  },
  get enabled() { return !!url; },
  pending() { return load().length; },
  push(ev) {
    if (!url) return;
    const q = load();
    q.push({ ...ev, student: getName() || 'no name', device: deviceId() });
    saveQ(q);
    clearTimeout(sync._t); sync._t = setTimeout(() => sync.flush(), 800);
  },
  async flush() {
    if (!url || sync._busy || !navigator.onLine) return;
    const q = load();
    if (!q.length) return;
    sync._busy = true;
    const batch = q.slice(0, 200);
    try {
      // text/plain + no-cors: так Apps Script принимает запрос без настройки CORS
      await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(batch) });
      saveQ(load().slice(batch.length));
    } catch { /* нет сети — попробуем позже */ }
    sync._busy = false;
    if (load().length && load().length < q.length) sync.flush();
  },
};

function deviceId() {
  try {
    let id = localStorage.getItem('chem-oge-device');
    if (!id) { id = Math.random().toString(36).slice(2, 8); localStorage.setItem('chem-oge-device', id); }
    return id;
  } catch { return ''; }
}
