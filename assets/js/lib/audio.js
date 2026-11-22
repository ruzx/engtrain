// Audio: pre-generated files (assets/audio/<hash>.<ext>) with fallback to the browser's speech synthesis.
import { hash } from './english.js';
import { store } from './store.js';

let cfg = { dir: 'assets/audio', ext: '', lang: 'en-GB' };
export function initAudio(c) { cfg = { ...cfg, ...(c || {}) }; }
export const audioOn = () => store.setting('audio') !== false;
export function setAudio(v) { store.setting('audio', v); }

let current = null;
export function speak(text) {
  if (!text) return;
  try { current?.pause(); speechSynthesis?.cancel(); } catch {}
  if (cfg.ext) {
    const a = new Audio(`${cfg.dir}/${hash(text)}.${cfg.ext}`);
    current = a;
    a.onerror = () => tts(text);
    a.play().catch(() => tts(text));
  } else tts(text);
}

function tts(text) {
  try {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    const v = voices.find(x => x.lang === cfg.lang) || voices.find(x => x.lang?.startsWith('en'));
    if (v) u.voice = v;
    u.lang = v?.lang || cfg.lang; u.rate = 0.95;
    speechSynthesis.speak(u);
  } catch {}
}
if ('speechSynthesis' in window) { try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices(); } catch {} }

export const SPEAKER = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4V5z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>';
