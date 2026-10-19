#!/usr/bin/env python3
"""Донастраивает нативные проекты Capacitor (запускать после `npx cap add android/ios`, можно много раз):
  Android: только портретная ориентация; разрешение находить движок синтеза речи (нужно с Android 11);
  iOS:     только портрет, полноэкранный режим на iPad, ответ «без шифрования» для App Store Connect.
"""
import os, plistlib, re

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))


def android():
    p = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'AndroidManifest.xml')
    if not os.path.exists(p):
        print('Android-проекта нет (npx cap add android) — пропускаю'); return
    s = open(p, encoding='utf-8').read()
    if 'TTS_SERVICE' not in s:
        s = s.replace('<application', '<queries>\n        <intent>\n            <action android:name="android.intent.action.TTS_SERVICE" />\n        </intent>\n    </queries>\n\n    <application', 1)
    if 'screenOrientation' not in s:
        s = re.sub(r'(<activity\b[^>]*?android:name="[^"]*MainActivity")', r'\1\n            android:screenOrientation="portrait"', s, count=1)
    open(p, 'w', encoding='utf-8').write(s)
    print('Android: AndroidManifest.xml обновлён')


def ios():
    p = os.path.join(ROOT, 'ios', 'App', 'App', 'Info.plist')
    if not os.path.exists(p):
        print('iOS-проекта нет (npx cap add ios, только на Mac) — пропускаю'); return
    with open(p, 'rb') as f:
        d = plistlib.load(f)
    d['UISupportedInterfaceOrientations'] = ['UIInterfaceOrientationPortrait']
    d['UISupportedInterfaceOrientations~ipad'] = ['UIInterfaceOrientationPortrait', 'UIInterfaceOrientationPortraitUpsideDown']
    d['UIRequiresFullScreen'] = True
    d['ITSAppUsesNonExemptEncryption'] = False
    d['CFBundleDisplayName'] = 'Котик Штрих'
    with open(p, 'wb') as f:
        plistlib.dump(d, f)
    print('iOS: Info.plist обновлён')


if __name__ == '__main__':
    android(); ios()
