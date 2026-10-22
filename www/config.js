/* ===== Настройки «Котика Штриха» — меняйте только этот файл =====
   flavor:
     'web'      — сайт: кнопка «Поддержать разработчика» и реквизиты
     'telegram' — Telegram Mini App: то же, ссылки открываются через Telegram
     'rustore'  — RuStore: то же, что 'web'
     'store'    — App Store и Google Play: только тёплое сообщение, БЕЗ реквизитов и ссылок на оплату
   Сборщик tools/build.py сам подставляет нужный flavor для каждой версии. */
window.SHTRIH_CONFIG={
  flavor:'web',

  /* Подпись в окне «О приложении» */
  author:'Андрей',

  /* Реквизиты для поддержки. Замените примеры на свои. Пустые строки не показываются. */
  donate:{
    cardLink:'https://yoomoney.ru/to/4100119661361771',      /* ссылка на перевод с карты: CloudTips (Т-Банк), ЮMoney, Boosty… */
    cardLabel:'Перевод с российской карты',
    crypto:[
      {name:'Bybit UID',address:'431155003'}
    ]
  },

  /* Нейро-озвучка: папка или адрес, где лежат audio/<язык>/index.json и mp3 (см. tools/make_voice.py).
     Если файлов нет, Штрих говорит голосом устройства. */
  audioBase:'audio/',
  /* Запасной адрес озвучки: языки, которых нет внутри приложения, подгружаются отсюда (нужен интернет) */
  audioRemote:'https://bhousemsk-web.github.io/shtrih/audio/',

  /* Страница политики конфиденциальности (нужна магазинам) */
  privacyUrl:'privacy.html',

  /* Почта для связи: подставляется в privacy.html при сборке (tools/build.py) */
  contactEmail:'wildtrademail@gmail.com'
};
