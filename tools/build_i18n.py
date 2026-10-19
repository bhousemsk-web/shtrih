#!/usr/bin/env python3
"""Собирает переводы tools/tr/<lang>.*.txt в www/i18n/<lang>.js и проверяет их.

Формат файлов перевода: каждая строка «NNNN текст», где NNNN — номер фразы из tools/tr/ru.txt.
Запуск:  python3 tools/build_i18n.py            (все языки)
         python3 tools/build_i18n.py en de      (только указанные)
"""
import glob, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
TR = os.path.join(HERE, 'tr')
OUT = os.path.join(HERE, '..', 'www', 'i18n')


def read(path_glob):
    rows = {}
    for p in sorted(glob.glob(path_glob)):
        with open(p, encoding='utf-8') as f:
            for n, line in enumerate(f, 1):
                line = line.rstrip('\n')
                if not line.strip():
                    continue
                m = re.match(r'^(\d{4}) (.*)$', line)
                if not m:
                    sys.exit(f'{p}:{n}: строка не в формате «NNNN текст»: {line[:60]}')
                rows[int(m.group(1))] = m.group(2).strip()
    return rows


def main():
    src = read(os.path.join(TR, 'ru.txt'))
    langs = sys.argv[1:] or sorted({os.path.basename(p).split('.')[0] for p in glob.glob(os.path.join(TR, '*.txt'))} - {'ru'})
    os.makedirs(OUT, exist_ok=True)
    ok = True
    for lang in langs:
        tr = read(os.path.join(TR, f'{lang}.*.txt')) or read(os.path.join(TR, f'{lang}.txt'))
        missing = [i for i in src if i not in tr]
        extra = [i for i in tr if i not in src]
        bad = [i for i in src if i in tr and sorted(re.findall(r'\{\d\}', src[i])) != sorted(re.findall(r'\{\d\}', tr[i]))]
        if missing or extra or bad:
            ok = False
            print(f'[{lang}] нет: {missing[:20]}{"…" if len(missing) > 20 else ""}  лишние: {extra[:10]}  плейсхолдеры: {bad[:10]}')
        data = {src[i]: tr[i] for i in src if i in tr}
        with open(os.path.join(OUT, f'{lang}.js'), 'w', encoding='utf-8') as f:
            f.write('(window.I18N=window.I18N||{})[' + json.dumps(lang) + ']=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
        print(f'[{lang}] {len(data)}/{len(src)} фраз → www/i18n/{lang}.js')
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
