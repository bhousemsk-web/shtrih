#!/usr/bin/env bash
# Скачивает шрифты Neucha и Nunito (лицензия SIL OFL) в www/fonts, чтобы приложение
# не ходило за шрифтами в интернет. Запуск из папки проекта:  bash tools/get_fonts.sh
set -euo pipefail
cd "$(dirname "$0")/../www/fonts"
BASE=https://raw.githubusercontent.com/google/fonts/main/ofl
curl -fL -o Neucha.ttf  "$BASE/neucha/Neucha.ttf"
curl -fL -o Nunito.ttf  "$BASE/nunito/Nunito%5Bwght%5D.ttf"
curl -fL -o OFL-Neucha.txt "$BASE/neucha/OFL.txt"
curl -fL -o OFL-Nunito.txt "$BASE/nunito/OFL.txt"
# по желанию: сжать в woff2 (pip install fonttools brotli)
if python3 -c "import fontTools, brotli" 2>/dev/null; then
  for f in Neucha Nunito; do python3 -m fontTools.ttLib.woff2 compress -o "$f.woff2" "$f.ttf"; done
fi
ls -la
