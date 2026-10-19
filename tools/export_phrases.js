#!/usr/bin/env node
/* Выгружает все фразы, которые произносит Штрих, по языкам — для генерации нейро-озвучки.
   Запуск:  node tools/export_phrases.js            → tools/phrases/<язык>.json
   Каждый файл: [{"file":"<хэш>","text":"фраза"}, ...]. Имя файла = phraseHash(текста),
   ровно так его ищет приложение (www/js/speech-text.js). */
const fs = require('fs'), path = require('path'), vm = require('vm');
const W = path.join(__dirname, '..', 'www');
const ctx = { console, window: {}, document: undefined };
ctx.window = ctx; vm.createContext(ctx);
for (const f of ['js/geometry.js', 'js/lessons-1-4.js', 'js/lessons-more.js', 'js/geometry-pro.js',
  'js/lessons-pro-a.js', 'js/lessons-pro-b.js', 'js/course.js', 'js/speech-text.js'])
  vm.runInContext(fs.readFileSync(path.join(W, f), 'utf8'), ctx, { filename: f });
ctx.I18N = {};
for (const f of fs.readdirSync(path.join(W, 'i18n')))
  vm.runInContext(fs.readFileSync(path.join(W, 'i18n', f), 'utf8'), ctx, { filename: f });
const langs = ['ru', ...Object.keys(ctx.I18N).sort()];
const out = path.join(__dirname, 'phrases'); fs.mkdirSync(out, { recursive: true });
for (const l of langs) {
  const d = l === 'ru' ? null : ctx.I18N[l];
  const tr = s => (d && d[s]) || s;
  const seen = new Map();
  for (const p of vm.runInContext('allSpeech', ctx)(tr))
    for (const s of ctx.splitSentences(ctx.forSpeech(p))) if (!seen.has(s)) seen.set(s, ctx.phraseHash(s));
  const rows = [...seen].map(([text, file]) => ({ file, text }));
  const chars = rows.reduce((n, r) => n + r.text.length, 0);
  fs.writeFileSync(path.join(out, l + '.json'), JSON.stringify(rows, null, 0).replace(/\},\{/g, '},\n{'));
  console.log(`${l}: ${rows.length} фраз, ${chars} символов`);
}
