# English Practice

A static web app (PWA) for English grammar practice. No build step: HTML + CSS + JavaScript modules, content in JSON. Works on GitHub Pages, installs on a phone, works offline.

Exercises are based on [Areso/English-exercises](https://github.com/Areso/English-exercises) (AGPL-3.0). This project is therefore also licensed under **AGPL-3.0** (see `LICENSE`) — keep the source public.

## Learning methods built in

| Method | Where |
|---|---|
| Retrieval practice | Every topic is practised by answering, not re-reading |
| Spaced repetition | Review: items return after 1, 3, 7, 14, 30 days; mistakes the same day |
| Interleaving | Practice sessions mix sub-topics; "Mix" and "Mixed practice" mix topics |
| Desirable difficulty | A multiple-choice item you already know comes back as typing ("Level up: no options") |
| Worked examples first | Each topic starts with a short lesson: rule → examples you can listen to → quick checks |
| Immediate feedback | Correct sentence shown and read aloud after every answer |
| Variability | Templates (`%1`, `%2`) give a different sentence each time for the same rule |
| Confidence rating | "Not sure" checkbox; confident mistakes are flagged and reviewed sooner |
| Motivation | XP, daily goal, streak, combo, Blitz with personal records |

## Publish on GitHub Pages

Upload this folder to a repository → Settings → Pages → Deploy from a branch → `main` / root.
Locally: `python -m http.server` and open `http://localhost:8000`.

## Content

`content/manifest.json` lists sections and topics. A topic is one file `content/modules/<id>.json`:

```json
{
  "id": "articles", "title": "Articles: a, an, the", "summary": "…",
  "rules": [ { "rule": "**a / an** — one thing…", "examples": ["I have an apple."] } ],
  "questions": [
    { "id": "articles-1", "type": "choice", "text": "I have ... apple.", "options": ["a", "an", "the", "no article"], "answer": ["an"] },
    { "id": "domake-1", "type": "choice", "text": "I ... a %1 for you.", "options": ["made", "did"], "answer": ["made"], "args": [["cake", "present"]] },
    { "id": "phrasal-1", "type": "text", "text": "I usually get ... at 7.", "answer": ["up"] },
    { "id": "irregular-1", "type": "forms", "text": "begin", "answer": ["began begun"] }
  ]
}
```

- `...` is the blank. `answer` lists all accepted answers; `"no article"` / `"no preposition"` accept an empty answer or a dash when typing.
- `args`: one list per placeholder `%1`, `%2`; add `"tied": true` to use the same index for all lists.
- Optional: `explain` (shown after answering), `skill`.
- Typed answers allow one-letter typos in words of 5+ letters ("Correct, but check the spelling").

To add a topic: create the JSON file and add its id to a section in `content/manifest.json`. No code changes.

## Audio

Without audio files the app uses the browser's built-in voice. For better quality, generate files with your TTS:

1. `python tools/make_audio.py --tts-dir "C:\SwedishTTS_Builder" --voice M1 --speed 1.1`
2. Run `tools\make_audio.bat`. It calls `tts_say.py` for each sentence (about 1 000), skips files that already exist, and converts to mp3 if `ffmpeg` is installed.
3. In `content/manifest.json` set `"audio": { "dir": "assets/audio", "ext": "mp3", "lang": "en-GB" }` (or `"wav"`).
4. Commit `assets/audio/` with the site.

File names are a hash of the sentence, computed the same way in `make_audio.py` and `assets/js/lib/english.js`. After adding exercises, run both steps again — only new sentences are generated. `tools/audio_list.tsv` shows which file is which sentence.

## Teacher reports

Same as the chemistry site: set `"reportUrl"` in `content/manifest.json` to a Google Apps Script web app (`tools/google-apps-script.gs`). Each answer is sent with the student's name; each student gets their own sheet. Personal links: `https://…/?s=Student%20Name`.

## Updates

Content is loaded from the network first, so fixes appear immediately. After changing code, bump `CACHE` in `sw.js` (`eng-v2`, …).
