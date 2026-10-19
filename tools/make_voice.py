#!/usr/bin/env python3
"""Генерирует нейро-озвучку всех фраз Штриха в mp3: www/audio/<язык>/<хэш>.mp3 + index.json.
Приложение само найдёт эти файлы и будет говорить живым голосом вместо голоса телефона
(если файла для фразы нет — спокойно говорит голосом телефона).

ВНИМАНИЕ: в среде, где писался скрипт, интернет был закрыт, поэтому он не прогонялся
на настоящих сервисах. Сначала попробуйте на одном языке: --langs ru --limit 5.

Шаги:
  1) node tools/export_phrases.js          (обновить список фраз, если меняли уроки)
  2) один из движков:

  Azure (Microsoft), бесплатный уровень F0 = 500 000 символов в месяц, хватает на все 10 языков (~430 тыс.):
     export AZURE_SPEECH_KEY=...  AZURE_SPEECH_REGION=westeurope
     python3 tools/make_voice.py --engine azure --langs ru en
     (на F0 лимит 20 запросов в минуту, поэтому пауза 3,1 с: ~1,2 часа на язык. Можно прерывать —
      уже готовые файлы пропускаются.)

  Яндекс SpeechKit (удобно оплачивать из России, отличный русский голос «Алёна»):
     export YANDEX_API_KEY=...
     python3 tools/make_voice.py --engine yandex --langs ru

  edge-tts (бесплатно и без ключа, голоса те же, что в Azure; только для пробы — это неофициальный
  доступ, перед публикацией лучше перегенерировать через Azure):
     pip install edge-tts
     python3 tools/make_voice.py --engine edge --langs ru

Опции: --voice ru=ru-RU-SvetlanaNeural  --rate -6%  --force  --limit N  --delay сек  --dry-run
"""
import argparse, asyncio, json, os, sys, time, urllib.parse, urllib.request
from xml.sax.saxutils import escape

HERE = os.path.dirname(os.path.abspath(__file__))
PHRASES = os.path.join(HERE, 'phrases')
AUDIO = os.path.join(HERE, '..', 'www', 'audio')
LOCALE = {'ru': 'ru-RU', 'en': 'en-US', 'es': 'es-ES', 'pt': 'pt-BR', 'fr': 'fr-FR', 'de': 'de-DE',
          'zh': 'zh-CN', 'ja': 'ja-JP', 'hi': 'hi-IN', 'ar': 'ar-SA'}
# Тёплые, спокойные голоса для детей. Детские голоса, если хочется: en-US-AnaNeural, en-GB-MaisieNeural,
# de-DE-GiselaNeural, fr-FR-EloiseNeural, pt-BR-LeticiaNeural, zh-CN-XiaoyouNeural (только Azure).
VOICES = {
    'azure': {'ru': 'ru-RU-DariyaNeural', 'en': 'en-US-JennyNeural', 'es': 'es-ES-ElviraNeural',
              'pt': 'pt-BR-FranciscaNeural', 'fr': 'fr-FR-DeniseNeural', 'de': 'de-DE-KatjaNeural',
              'zh': 'zh-CN-XiaoxiaoNeural', 'ja': 'ja-JP-NanamiNeural', 'hi': 'hi-IN-SwaraNeural',
              'ar': 'ar-SA-ZariyahNeural'},
    'edge': {'ru': 'ru-RU-SvetlanaNeural', 'en': 'en-US-JennyNeural', 'es': 'es-ES-ElviraNeural',
             'pt': 'pt-BR-FranciscaNeural', 'fr': 'fr-FR-DeniseNeural', 'de': 'de-DE-KatjaNeural',
             'zh': 'zh-CN-XiaoxiaoNeural', 'ja': 'ja-JP-NanamiNeural', 'hi': 'hi-IN-SwaraNeural',
             'ar': 'ar-SA-ZariyahNeural'},
    'yandex': {'ru': 'alena', 'en': 'john', 'de': 'lea'},
}
DELAY = {'azure': 3.1, 'yandex': 0.1, 'edge': 0.2}


def azure(text, lang, voice, rate, out):
    key, region = os.environ.get('AZURE_SPEECH_KEY'), os.environ.get('AZURE_SPEECH_REGION', 'westeurope')
    if not key:
        sys.exit('Нужна переменная AZURE_SPEECH_KEY (и AZURE_SPEECH_REGION).')
    ssml = (f"<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='{LOCALE[lang]}'>"
            f"<voice name='{voice}'><prosody rate='{rate}' pitch='+3%'>{escape(text)}</prosody></voice></speak>")
    req = urllib.request.Request(f'https://{region}.tts.speech.microsoft.com/cognitiveservices/v1', data=ssml.encode('utf-8'),
                                 headers={'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml',
                                          'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'shtrih-voice'})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    open(out, 'wb').write(data)


def yandex(text, lang, voice, rate, out):
    key = os.environ.get('YANDEX_API_KEY')
    if not key:
        sys.exit('Нужна переменная YANDEX_API_KEY (API-ключ сервисного аккаунта с ролью ai.speechkit-tts.user).')
    speed = max(0.5, min(1.5, 1 + float(rate.strip('%')) / 100))
    body = {'text': text, 'lang': LOCALE[lang], 'voice': voice, 'speed': f'{speed:.2f}', 'format': 'mp3'}
    if voice == 'alena':
        body['emotion'] = 'good'
    req = urllib.request.Request('https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize',
                                 data=urllib.parse.urlencode(body).encode(), headers={'Authorization': 'Api-Key ' + key})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    open(out, 'wb').write(data)


def edge(text, lang, voice, rate, out):
    try:
        import edge_tts
    except ImportError:
        sys.exit('Установите: pip install edge-tts')
    asyncio.run(edge_tts.Communicate(text, voice, rate=rate, pitch='+3Hz').save(out))


ENGINES = {'azure': azure, 'yandex': yandex, 'edge': edge}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--engine', choices=ENGINES, required=True)
    ap.add_argument('--langs', nargs='+', default=list(LOCALE))
    ap.add_argument('--voice', action='append', default=[], help='язык=ИмяГолоса, можно несколько раз')
    ap.add_argument('--rate', default='-6%', help='скорость речи, например -6%% (чуть медленнее обычного)')
    ap.add_argument('--delay', type=float, help='пауза между запросами, сек')
    ap.add_argument('--limit', type=int, help='сделать только N фраз (для пробы)')
    ap.add_argument('--force', action='store_true', help='перезаписать готовые файлы')
    ap.add_argument('--dry-run', action='store_true', help='только посчитать фразы и символы')
    a = ap.parse_args()
    voices = dict(VOICES[a.engine]); voices.update(dict(v.split('=', 1) for v in a.voice))
    delay = DELAY[a.engine] if a.delay is None else a.delay
    total = 0
    for lang in a.langs:
        src = os.path.join(PHRASES, lang + '.json')
        if not os.path.exists(src):
            print(f'[{lang}] нет {src} — сначала node tools/export_phrases.js'); continue
        if lang not in voices:
            print(f'[{lang}] у движка {a.engine} нет голоса для этого языка — пропускаю (укажите --voice {lang}=...)'); continue
        rows = json.load(open(src, encoding='utf-8'))[:a.limit]
        chars = sum(len(r['text']) for r in rows); total += chars
        print(f'[{lang}] {len(rows)} фраз, {chars} символов, голос {voices[lang]}')
        if a.dry_run:
            continue
        d = os.path.join(AUDIO, lang); os.makedirs(d, exist_ok=True)
        done = errors = 0
        for i, r in enumerate(rows, 1):
            out = os.path.join(d, r['file'] + '.mp3')
            if os.path.exists(out) and os.path.getsize(out) > 500 and not a.force:
                continue
            for attempt in range(4):
                try:
                    ENGINES[a.engine](r['text'], lang, voices[lang], a.rate, out + '.part')
                    if os.path.getsize(out + '.part') < 500:
                        raise RuntimeError('слишком короткий ответ')
                    os.replace(out + '.part', out); done += 1; break
                except SystemExit:
                    raise
                except Exception as e:
                    wait = 10 * (attempt + 1)
                    print(f'  ! {r["text"][:40]}… — {e}; жду {wait} с'); time.sleep(wait)
            else:
                errors += 1
            if i % 50 == 0:
                print(f'  {i}/{len(rows)}')
            time.sleep(delay)
        files = sorted(f[:-4] for f in os.listdir(d) if f.endswith('.mp3'))
        json.dump({'engine': a.engine, 'voice': voices[lang], 'files': files}, open(os.path.join(d, 'index.json'), 'w'))
        print(f'[{lang}] готово: новых {done}, ошибок {errors}, всего файлов {len(files)}')
    print(f'Итого символов: {total}')


if __name__ == '__main__':
    main()
