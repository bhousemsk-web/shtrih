#!/usr/bin/env bash
# Первая настройка Android-проекта для RuStore. Запуск из папки проекта:
#   bash tools/capacitor_setup.sh
# Нужны: Node.js (LTS), Python 3 + Pillow, Android Studio.
set -euo pipefail
cd "$(dirname "$0")/.."

python3 tools/make_icons.py
bash tools/get_fonts.sh || echo "⚠ шрифты не скачались — приложение возьмёт системные, это не страшно"
python3 tools/build.py app:rustore --audio ru,en

npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor-community/text-to-speech
npm install -D @capacitor/assets

[ -d android ] || npx cap add android

npx @capacitor/assets generate --iconBackgroundColor '#D9E9F4' --splashBackgroundColor '#D9E9F4' \
  --splashBackgroundColorDark '#D9E9F4' --iconBackgroundColorDark '#D9E9F4'
python3 tools/patch_native.py
npx cap sync android

echo
echo "Готово. Дальше:"
echo "  npx cap open android   — откроется Android Studio (Build → Generate Signed App Bundle)"
echo "После любых изменений в www:  npm run app:rustore"
