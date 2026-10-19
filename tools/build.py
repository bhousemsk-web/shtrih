#!/usr/bin/env python3
"""Собирает готовые версии приложения из папки www.

Запуск:  python3 tools/build.py                  (все версии)
         python3 tools/build.py web store         (только указанные)
Опции:   --audio ru,en   положить в store/rustore-версии озвучку только этих языков
                         (по умолчанию в магазинные версии озвучка не кладётся, чтобы приложение было лёгким;
                          в web/telegram кладётся всё, что есть в www/audio)

Результат (папка dist/):
  web/        — сайт (GitHub Pages, Cloudflare Pages, свой хостинг): кнопка «Поддержать» + реквизиты
  telegram/   — то же, но для Telegram Mini App (SDK Telegram подключён всегда)
  rustore/    — для Android-сборки под RuStore: с реквизитами, без внешних шрифтов
  store/      — для App Store и Google Play: БЕЗ реквизитов и ссылок на оплату, без внешних запросов
  preview/shtrih.html — всё в одном файле (для быстрого просмотра)
  app/        — копия store или rustore для Capacitor:  python3 tools/build.py app:store  /  app:rustore
"""
import hashlib, json, os, re, shutil, sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
WWW = os.path.join(ROOT, 'www'); DIST = os.path.join(ROOT, 'dist')
FLAVORS = ['web', 'telegram', 'rustore', 'store']
GFONTS = re.compile(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>\n?')
TGSNIP = re.compile(r'<script>\n/\* Telegram Mini App.*?</script>\n', re.S)
TG_STATIC = '<script src="https://telegram.org/js/telegram-web-app.js"></script>\n'

SW = """/* Котик Штрих — офлайн-кэш (файл создаёт tools/build.py) */
const VERSION='shtrih-%(ver)s';
const CORE=%(files)s;
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('shtrih-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  e.respondWith(caches.open(VERSION).then(async c=>{
    const hit=await c.match(e.request,{ignoreSearch:true});
    const net=fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r.clone());return r;}).catch(()=>hit||Response.error());
    return hit||net;   /* сначала из кэша (работает без интернета), обновление — в фоне */
  }));
});
"""


def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


def write(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(s)


def cfg_value(cfg, key):
    m = re.search(r"(?m)^[ \t]*" + key + r"[ \t]*:[ \t]*'([^']*)'", cfg)
    return m.group(1) if m else ''


def check_config(cfg, flavor):
    warn = []
    if flavor != 'store':
        if re.search(r"00000000|XXXXXXXX", cfg):
            warn.append('в config.js остались примерные реквизиты (00000000 / XXXX…) — замените на свои или сотрите')
    if cfg_value(cfg, 'contactEmail') in ('', 'you@example.com'):
        warn.append('в config.js не указан contactEmail — магазины требуют контакт в политике конфиденциальности')
    return warn


def sw_files(d):
    out = []
    for base, _, files in os.walk(d):
        for f in files:
            rel = os.path.relpath(os.path.join(base, f), d).replace(os.sep, '/')
            # озвучка и переводы кэшируются по мере использования, а не все сразу
            if rel.startswith(('audio/', 'i18n/')) or rel == 'sw.js' or rel.endswith('.txt'):
                continue
            if rel.endswith('.ttf') and os.path.exists(os.path.join(d, rel[:-4] + '.woff2')):
                continue
            out.append(rel)
    return ['./'] + sorted(out)


def make_sw(d):
    files = sw_files(d)
    h = hashlib.sha1()
    for f in files[1:]:
        with open(os.path.join(d, f), 'rb') as fh:
            h.update(fh.read())
    write(os.path.join(d, 'sw.js'), SW % {'ver': h.hexdigest()[:10], 'files': json.dumps(files, ensure_ascii=False)})


def build(flavor, audio_langs):
    d = os.path.join(DIST, flavor)
    shutil.rmtree(d, ignore_errors=True)
    shutil.copytree(WWW, d, ignore=shutil.ignore_patterns('.*', 'sw.js', 'audio'))
    # озвучка
    src_audio = os.path.join(WWW, 'audio')
    if os.path.isdir(src_audio):
        for lang in sorted(os.listdir(src_audio)):
            if flavor in ('web', 'telegram') or lang in audio_langs:
                shutil.copytree(os.path.join(src_audio, lang), os.path.join(d, 'audio', lang))
    # config.js
    cfg = read(os.path.join(WWW, 'config.js'))
    cfg = re.sub(r"(?m)^([ \t]*)flavor[ \t]*:[ \t]*'[^']*'", lambda m: m.group(1) + f"flavor:'{flavor}'", cfg, count=1)
    if flavor == 'store':
        cfg = re.sub(r"donate\s*:\s*\{.*?\n  \},", 'donate:null,', cfg, count=1, flags=re.S)
        assert 'cardLink' not in cfg, 'не удалось убрать реквизиты из store-версии'
    write(os.path.join(d, 'config.js'), cfg)
    # index.html
    html = read(os.path.join(WWW, 'index.html'))
    if flavor in ('store', 'rustore'):
        html = GFONTS.sub('', html)
    if flavor == 'store':
        html = TGSNIP.sub('', html)
    if flavor == 'telegram':
        html = TGSNIP.sub(TG_STATIC, html)
    if not any(f.endswith(('.woff2', '.ttf')) for f in os.listdir(os.path.join(WWW, 'fonts'))):
        html = html.replace('<link rel="stylesheet" href="fonts/fonts.css">\n', '')   # шрифты не скачаны — не дёргаем пустые файлы
    write(os.path.join(d, 'index.html'), html)
    # политика
    email = cfg_value(read(os.path.join(WWW, 'config.js')), 'contactEmail') or 'you@example.com'
    write(os.path.join(d, 'privacy.html'), read(os.path.join(WWW, 'privacy.html')).replace('CONTACT_EMAIL', email))
    make_sw(d)
    n = sum(len(f) for _, _, f in os.walk(d))
    size = sum(os.path.getsize(os.path.join(b, f)) for b, _, fs in os.walk(d) for f in fs)
    print(f'[{flavor}] dist/{flavor}: {n} файлов, {size / 1e6:.1f} МБ')
    for w in check_config(read(os.path.join(WWW, 'config.js')), flavor):
        print(f'   ⚠ {w}')


def preview():
    """Один html-файл без doctype/head/body (так его принимает просмотр артефактов)."""
    html = read(os.path.join(WWW, 'index.html'))
    head = html.split('<head>', 1)[1].split('</head>', 1)[0]
    body = html.split('<body>', 1)[1].split('</body>', 1)[0]
    head = re.sub(r'<meta charset[^>]*>\n|<meta name="viewport"[^>]*>\n|<link rel="(manifest|icon|apple-touch-icon)"[^>]*>\n|<link rel="stylesheet" href="fonts/fonts.css">\n', '', head)
    head = TGSNIP.sub('', head)

    def inline(m):
        src = m.group(1)
        code = read(os.path.join(WWW, src))
        if src == 'js/app.js':
            i18n = ''.join(read(os.path.join(WWW, 'i18n', f)) for f in sorted(os.listdir(os.path.join(WWW, 'i18n'))))
            code = i18n + '\n' + code
        assert '</script' not in code, src
        return '<script>\n' + code + '\n</script>'
    body = re.sub(r'<script src="([^"]+)"></script>', inline, body)
    out = head.strip() + '\n' + body.strip() + '\n'
    write(os.path.join(DIST, 'preview', 'shtrih.html'), out)
    print(f'[preview] dist/preview/shtrih.html: {len(out.encode()) / 1e6:.1f} МБ')


def main():
    args = sys.argv[1:]; audio = []
    if '--audio' in args:
        i = args.index('--audio'); audio = args[i + 1].split(','); del args[i:i + 2]
    targets = args or ['web', 'telegram', 'rustore', 'preview']   # store (App Store / Google Play) — пока отложено
    for t in targets:
        if t == 'preview':
            preview()
        elif t in FLAVORS:
            build(t, audio)
        elif t.startswith('app:') and t[4:] in ('store', 'rustore'):
            # папка dist/app — её берёт Capacitor (capacitor.config.json → webDir)
            build(t[4:], audio)
            shutil.rmtree(os.path.join(DIST, 'app'), ignore_errors=True)
            shutil.copytree(os.path.join(DIST, t[4:]), os.path.join(DIST, 'app'))
            print(f'   → скопировано в dist/app для Capacitor')
        else:
            sys.exit(f'неизвестная версия: {t}')


if __name__ == '__main__':
    main()
