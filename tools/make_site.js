#!/usr/bin/env node
/* Страницы для поисковиков: «Как нарисовать … по шагам» для каждого рисунка из уроков.
   Запуск:  node tools/make_site.js  → dist/site/ (kak-narisovat/*.html, sitemap.xml, robots.txt)
   GitHub Pages кладёт эти файлы в корень сайта рядом с приложением (.github/workflows/pages.yml). */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..'), W = path.join(ROOT, 'www');
const SITE = 'https://bhousemsk-web.github.io/shtrih/';
const BOT = 'https://t.me/Cat_Strih_bot';
const OUT = path.join(ROOT, 'dist', 'site');

const ctx = { console, window: {} }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ['js/geometry.js', 'js/lessons-1-4.js', 'js/lessons-more.js', 'js/geometry-pro.js',
  'js/lessons-pro-a.js', 'js/lessons-pro-b.js', 'js/course.js'])
  vm.runInContext(fs.readFileSync(path.join(W, f), 'utf8'), ctx, { filename: f });
const LEVELS = vm.runInContext('LEVELS', ctx), VARS = vm.runInContext('VARS', ctx);
const dOf = vm.runInContext('dOf', ctx), kOf = vm.runInContext('kOf', ctx);
const mOf = it => typeof it === 'string' ? null : it.m || null;

const AGE = ['5–6 лет', '5–6 лет', '6–9 лет', '6–9 лет', '9 лет и старше'];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = v => v.id.replace(/[^a-z0-9]+/gi, '-').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
const plain = s => s.replace(/\s+/g, ' ').trim();

function pathTag(it, cls) {
  const d = dOf(it); if (!d) return '';
  const k = [cls, kOf(it)].filter(Boolean).join(' '), m = mOf(it);
  return `<path class="${k}" d="${d}"${m ? ` transform="matrix(${m.join(' ')})"` : ''}/>`;
}
/* шаг n: прошлые штрихи серые, текущий оранжевый; n = steps.length — готовый рисунок */
function svg(v, n, label) {
  let body = '';
  v.steps.forEach((s, i) => {
    if (i < n) body += s.paths.map(p => pathTag(p, n === v.steps.length ? 'fin' : 'old')).join('');
    else if (i === n) body += s.paths.map(p => pathTag(p, 'cur')).join('');
  });
  return `<svg viewBox="0 0 300 300" role="img" aria-label="${esc(label)}">${body}</svg>`;
}

const CSS = `
:root{--sky:#D9E9F4;--ink:#2F3A4A;--soft:#A8B5C4;--fur:#F2862A;--green:#22936B;--muted:#5B6678}
*{box-sizing:border-box}
body{margin:0;background:var(--sky);color:var(--ink);font:17px/1.55 "Nunito",system-ui,sans-serif}
main{max-width:860px;margin:0 auto;padding:16px}
h1,h2{font-family:"Neucha","Comic Sans MS",cursive;font-weight:400;line-height:1.2}
h1{font-size:34px;margin:12px 0 6px}h2{font-size:26px;margin:28px 0 10px}
a{color:#2A6FB0}.muted{color:var(--muted)}
.cta{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0}
.btn{display:inline-block;padding:12px 20px;border-radius:24px;background:var(--green);color:#fff;font-weight:800;text-decoration:none}
.btn.alt{background:#fff;color:var(--ink)}
.steps{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
.steps li,.card{background:#fff;border-radius:18px;padding:12px}
.steps b{display:block;margin-bottom:4px}
svg{display:block;width:100%;height:auto;background:#fff;
 background-image:linear-gradient(#CFE0EC 1px,transparent 1px),linear-gradient(90deg,#CFE0EC 1px,transparent 1px);background-size:20px 20px;border-radius:12px}
svg path{fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-width:5}
svg path.s{stroke-width:2.2}svg path.f{stroke-width:3}svg path.g{stroke-width:2.2;stroke-dasharray:5 7}
svg .old{stroke:var(--soft)}svg .cur{stroke:var(--fur);stroke-width:6}svg .fin{stroke:var(--ink)}svg .fin.g{stroke:var(--soft)}
.final{max-width:420px;margin:0 auto}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.grid a{display:block;background:#fff;border-radius:16px;padding:8px;text-decoration:none;color:var(--ink);font-weight:700;font-size:15px}
.grid svg{margin-bottom:6px}
footer{margin:32px 0 16px;font-size:14px}
`;

function page({ title, desc, url, body, ld }) {
  return `<!doctype html>
<html lang="ru"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}og.png"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${SITE}icons/icon-192.png">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Neucha&family=Nunito:wght@600;800&display=swap">
<style>${CSS}</style>
${ld ? `<script type="application/ld+json">${JSON.stringify(ld)}</script>` : ''}
</head><body><main>
${body}
<footer class="muted">Котик Штрих — бесплатные уроки рисования для детей. Без рекламы, без сбора данных.
<a href="${SITE}">Открыть приложение</a> · <a href="${BOT}">Telegram</a> · <a href="${SITE}kak-narisovat/">Все рисунки</a></footer>
</main></body></html>
`;
}

const cta = `<div class="cta"><a class="btn" href="${SITE}">Рисовать с котиком Штрихом</a><a class="btn alt" href="${BOT}">Открыть в Telegram</a></div>`;

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'kak-narisovat'), { recursive: true });
const urls = [SITE, SITE + 'kak-narisovat/'];

VARS.forEach(v => {
  const s = slug(v), url = `${SITE}kak-narisovat/${s}.html`, n = v.steps.length;
  const title = `Как нарисовать «${v.name}» поэтапно — урок рисования для детей`;
  const desc = `Пошаговый урок для детей ${AGE[v.level]}: «${v.name}» за ${n} шагов, техника «${v.tech}». Рисуем карандашом на бумаге с котиком Штрихом.`;
  const steps = v.steps.map((st, i) =>
    `<li><b>Шаг ${i + 1}</b>${svg(v, i, `Шаг ${i + 1}: ${plain(st.say)}`)}<p>${esc(plain(st.say))}</p></li>`).join('\n');
  const body = `<p class="muted"><a href="../kak-narisovat/">Все рисунки</a> → ${esc(LEVELS[v.level].name)}</p>
<h1>Как нарисовать «${esc(v.name)}»</h1>
<p>Урок для детей ${AGE[v.level]}. Техника: «${esc(v.tech)}». Понадобятся лист бумаги, простой карандаш и ластик.
Оранжевым показан штрих, который рисуем сейчас, серым — уже нарисованное.</p>
<div class="final">${svg(v, n, `Готовый рисунок: ${v.name}`)}</div>
${cta}
<h2>Рисуем по шагам</h2>
<ol class="steps">
${steps}
</ol>
<h2>Хотите, чтобы котик показал каждый штрих сам?</h2>
<p>В бесплатном приложении «Котик Штрих» этот рисунок рисуется на экране анимацией, а котик рассказывает голосом, что делать.
Ребёнок повторяет на бумаге. 155 рисунков, 5 уровней, 10 языков, без рекламы.</p>
${cta}`;
  const ld = { '@context': 'https://schema.org', '@type': 'HowTo', name: `Как нарисовать «${v.name}»`, description: desc,
    tool: ['Лист бумаги', 'Простой карандаш', 'Ластик'],
    step: v.steps.map((st, i) => ({ '@type': 'HowToStep', position: i + 1, text: plain(st.say) })) };
  fs.writeFileSync(path.join(OUT, 'kak-narisovat', s + '.html'), page({ title, desc, url, body, ld }));
  urls.push(url);
});

let list = '';
LEVELS.forEach((lv, li) => {
  list += `<h2>${li + 1}. ${esc(lv.name)} <span class="muted" style="font-size:16px">— ${esc(lv.sub)}, ${AGE[li]}</span></h2><div class="grid">\n`;
  VARS.filter(v => v.level === li).forEach(v => {
    list += `<a href="${slug(v)}.html">${svg(v, v.steps.length, v.name)}${esc(v.name)}</a>\n`;
  });
  list += '</div>\n';
});
fs.writeFileSync(path.join(OUT, 'kak-narisovat', 'index.html'), page({
  title: 'Как нарисовать котика и не только: 155 пошаговых уроков рисования для детей',
  desc: 'Бесплатные пошаговые уроки рисования для детей 5–12 лет: котики, животные, пейзажи, перспектива. Рисуем карандашом на бумаге.',
  url: SITE + 'kak-narisovat/',
  body: `<h1>Уроки рисования для детей по шагам</h1>
<p>155 простых рисунков — от палочек и кружочков до перспективы и светотени. Каждый рисунок разобран на шаги:
ребёнок рисует карандашом на настоящей бумаге, повторяя штрих за штрихом.</p>${cta}${list}`
}));

fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `<url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /tg/\nSitemap: ${SITE}sitemap.xml\n`);
fs.copyFileSync(path.join(ROOT, 'store', 'feature-1024x500.png'), path.join(OUT, 'og.png'));
console.log(`dist/site: ${VARS.length} страниц «как нарисовать», sitemap ${urls.length} адресов`);
