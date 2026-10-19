/* ===== Настройки «Котика Штриха» — меняйте только этот файл =====
   flavor:
     'web'      — сайт: кнопка «Поддержать разработчика» и реквизиты
     'telegram' — Telegram Mini App: то же, ссылки открываются через Telegram
     'rustore'  — RuStore: то же, что 'web'
     'store'    — App Store и Google Play: только тёплое сообщение, БЕЗ реквизитов и ссылок на оплату
   Сборщик tools/build.py сам подставляет нужный flavor для каждой версии. */
window.SHTRIH_CONFIG={
  flavor:'telegram',

  /* Подпись в окне «О приложении» */
  author:'Андрей',

  /* Реквизиты для поддержки. Замените примеры на свои. Пустые строки не показываются. */
  donate:{
    cardLink:'https://pay.cloudtips.ru/p/00000000',      /* ссылка на перевод с карты: CloudTips (Т-Банк), ЮMoney, Boosty… */
    cardLabel:'Перевод с российской карты',
    crypto:[
      {name:'USDT (TRC-20)',address:'TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'},
      {name:'TON',address:'UQXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'}
    ]
  },

  /* Нейро-озвучка: папка или адрес, где лежат audio/<язык>/index.json и mp3 (см. tools/make_voice.py).
     Если файлов нет, Штрих говорит голосом устройства. */
  audioBase:'audio/',

  /* Страница политики конфиденциальности (нужна магазинам) */
  privacyUrl:'privacy.html',

  /* Почта для связи: подставляется в privacy.html при сборке (tools/build.py) */
  contactEmail:'you@example.com'
};
