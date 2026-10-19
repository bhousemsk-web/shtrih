# Котик Штрих — заметки для Claude

Бесплатное приложение с уроками рисования для детей (автор делает его для дочки 5 лет).
Ребёнок рисует на бумаге, а на телефоне котик Штрих показывает каждый штрих анимацией и озвучивает шаги.
5 уровней (Котёнок → Профи), 40 техник, 155 рисунков, 10 языков. Без рекламы и без сбора данных.

## Текущие решения
- Публикуем только **Telegram Mini App** (через сайт на GitHub Pages) и **RuStore** (Android через Capacitor).
  Google Play и App Store отложены — версию `store` по умолчанию не собирать.
- Кнопка «Поддержать разработчика» — тихая (серый текст внизу), реквизиты только за родительским замком (пример на сложение).
  Реквизиты в `www/config.js`: ссылка на сервис (CloudTips/ЮMoney/Boosty), без номера карты, + криптокошельки.
- В приветствии сказано: бесплатно, без рекламы, не собирает данных.
- Пользователь общается по-русски, не программист: объяснять простыми словами, делать самому.

## Устройство
- `www/` — само приложение, обычный HTML/JS без сборщика. Русский текст — ключ перевода.
  - `js/geometry*.js` — построение рисунков (SVG-пути, viewBox 300×300), `js/lessons-*.js` — уроки, `js/course.js` — уровни,
    `js/app.js` — интерфейс, голос (mp3-пакеты → Capacitor TextToSpeech → Web Speech), языки, донаты.
  - `i18n/<lang>.js` — генерируются из `tools/tr/<lang>.*.txt` командой `python3 tools/build_i18n.py` (строки «NNNN текст», номера из `tools/tr/ru.txt`).
    Новая фраза интерфейса = новая строка в ru.txt и во всех 9 языках.
- `tools/build.py` — сборка в `dist/` (web, telegram, rustore, preview; `app:rustore` → `dist/app` для Capacitor).
- `tools/export_phrases.js` + `tools/make_voice.py` — нейро-озвучка в `www/audio/<lang>/` (Azure / Яндекс / edge-tts).
- `tools/capacitor_setup.sh`, `tools/patch_native.py` — Android-проект; `tools/make_icons.py` — иконки и картинки для магазинов.
- `store/listing.md` — тексты карточек.

## Проверка после изменений
- `python3 tools/build_i18n.py` → везде 1230/1230.
- `python3 tools/build.py` без ошибок; открыть `dist/web/index.html` через `python3 -m http.server -d dist/web 8000`.
- Рисунки проверять глазами (рендер в PNG), особенно перекрытия линий.

## Что дальше
1. Вписать реквизиты и почту в `www/config.js`.
2. Выложить `dist/web` и `dist/telegram` (как папку `tg/`) на GitHub Pages.
3. Создать бота в @BotFather → /newapp с адресом `.../tg/`.
4. Собрать подписанный APK (`bash tools/capacitor_setup.sh`, Android Studio), опубликовать в RuStore.
5. По желанию — нейро-озвучка.
Подробная инструкция: документ «Котик Штрих: как выложить…» в claude.ai.
