#!/usr/bin/env python3
"""Рисует иконки и картинки для магазинов из мордочки Штриха (те же формы, что в шапке приложения).

Запуск:  python3 tools/make_icons.py
Нужен только Pillow (pip install pillow).

Результат:
  www/icons/      — иконки сайта/PWA/Telegram (32, 180, 192, 512, maskable-512)
  resources/      — исходники для Capacitor (`npx @capacitor/assets generate`):
                    icon-only.png, icon-foreground.png, icon-background.png, splash.png, splash-dark.png
  store/          — картинки для карточек: icon-1024.png (App Store), icon-512.png и
                    feature-1024x500.png (Google Play / RuStore), telegram-640x360.png (BotFather)
"""
import math, os, re
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SKY = (217, 233, 244); FUR = (242, 134, 42); PINK = (245, 154, 174); BERET = (62, 111, 208)
INK = (47, 58, 74); WHITE = (255, 255, 255); PAPER = (255, 255, 255); GRID = (207, 224, 236)

# мордочка в координатах 0..100 (как <svg viewBox="0 0 100 100"> в index.html)
FILLS = [
    ('M22 44 L18 12 L44 28 Z', FUR), ('M78 44 L82 12 L56 28 Z', FUR),
    ('M25 36 L23 19 L37 28 Z', PINK), ('M75 36 L77 19 L63 28 Z', PINK),
    ('circle 50 56 36', FUR),
    ('M24 30 Q34 8 62 14 Q78 18 72 28 Q50 20 24 30 Z', BERET), ('circle 58 11 3.5', BERET),
    ('ellipse 37 52 5 7', INK), ('ellipse 63 52 5 7', INK),
    ('circle 39 49 2', WHITE), ('circle 65 49 2', WHITE),
    ('M45 64 L55 64 L50 70 Z', PINK),
]
STROKES = [
    ('M50 70 Q45 77 39 74', 2.5), ('M50 70 Q55 77 61 74', 2.5),
    ('M30 66 L8 62', 2), ('M30 71 L9 74', 2), ('M70 66 L92 62', 2), ('M70 71 L91 74', 2),
]


def flatten(d):
    toks = re.findall(r'[MLQZ]|-?[\d.]+', d); i = 0; pts = []; x = y = 0
    while i < len(toks):
        c = toks[i]; i += 1
        if c in 'ML':
            x, y = float(toks[i]), float(toks[i + 1]); i += 2; pts.append((x, y))
        elif c == 'Q':
            qx, qy, nx, ny = map(float, toks[i:i + 4]); i += 4
            for k in range(1, 25):
                t = k / 24; pts.append(((1 - t) ** 2 * x + 2 * (1 - t) * t * qx + t * t * nx, (1 - t) ** 2 * y + 2 * (1 - t) * t * qy + t * t * ny))
            x, y = nx, ny
    return pts


def face(dr, cx, cy, size):
    """Рисует мордочку: центр (cx, cy), size — ширина области 0..100 в пикселях."""
    s = size / 100; ox, oy = cx - 50 * s, cy - 50 * s
    P = lambda p: (ox + p[0] * s, oy + p[1] * s)
    for d, col in FILLS:
        if d.startswith('circle'):
            _, a, b, r = d.split(); a, b, r = float(a), float(b), float(r)
            dr.ellipse([P((a - r, b - r)), P((a + r, b + r))], fill=col)
        elif d.startswith('ellipse'):
            _, a, b, rx, ry = d.split(); a, b, rx, ry = map(float, (a, b, rx, ry))
            dr.ellipse([P((a - rx, b - ry)), P((a + rx, b + ry))], fill=col)
        else:
            dr.polygon([P(p) for p in flatten(d)], fill=col)
    for d, w in STROKES:
        pts = [P(p) for p in flatten(d)]; ww = max(1, round(w * s))
        dr.line(pts, fill=INK, width=ww, joint='curve')
        for e in (pts[0], pts[-1]):
            dr.ellipse([e[0] - ww / 2, e[1] - ww / 2, e[0] + ww / 2, e[1] + ww / 2], fill=INK)


def canvas(w, h, bg, ss=4):
    im = Image.new('RGBA', (w * ss, h * ss), bg); return im, ImageDraw.Draw(im), ss


def finish(im, w, h, path, alpha=True):
    im = im.resize((w, h), Image.LANCZOS)
    if not alpha:
        im = im.convert('RGB')
    os.makedirs(os.path.dirname(path), exist_ok=True); im.save(path, optimize=True); print('  ', os.path.relpath(path, ROOT))


def grid(dr, w, h, step, col):
    for x in range(0, w, step): dr.line([(x, 0), (x, h)], fill=col, width=max(1, step // 22))
    for y in range(0, h, step): dr.line([(0, y), (w, y)], fill=col, width=max(1, step // 22))


def pencil(dr, x, y, L, ang, k):
    """карандаш длиной L под углом ang (градусы), k — толщина"""
    a = math.radians(ang); ux, uy = math.cos(a), math.sin(a); nx, ny = -uy, ux
    body = [(x + nx * k, y + ny * k), (x + ux * L + nx * k, y + uy * L + ny * k), (x + ux * L - nx * k, y + uy * L - ny * k), (x - nx * k, y - ny * k)]
    dr.polygon(body, fill=(255, 200, 70))
    tip = [(x + nx * k, y + ny * k), (x - nx * k, y - ny * k), (x - ux * k * 2.2, y - uy * k * 2.2)]
    dr.polygon(tip, fill=(240, 214, 170))
    dr.polygon([(x - ux * k * 1.5 + nx * k * .32, y - uy * k * 1.5 + ny * k * .32), (x - ux * k * 1.5 - nx * k * .32, y - uy * k * 1.5 - ny * k * .32), (x - ux * k * 2.2, y - uy * k * 2.2)], fill=INK)
    e = [(x + ux * L + nx * k, y + uy * L + ny * k), (x + ux * (L + k * 1.4) + nx * k, y + uy * (L + k * 1.4) + ny * k), (x + ux * (L + k * 1.4) - nx * k, y + uy * (L + k * 1.4) - ny * k), (x + ux * L - nx * k, y + uy * L - ny * k)]
    dr.polygon(e, fill=PINK)


def icon(size, scale, path, alpha=False, bg=SKY, with_grid=True):
    im, dr, ss = canvas(size, size, bg + (255,) if bg else (0, 0, 0, 0))
    S = size * ss
    if with_grid and bg:
        grid(dr, S, S, S // 8, GRID)
    face(dr, S / 2, S / 2 + S * .03, S * scale)
    finish(im, size, size, path, alpha)


def main():
    print('Иконки:')
    W = os.path.join(ROOT, 'www', 'icons'); R = os.path.join(ROOT, 'resources'); ST = os.path.join(ROOT, 'store')
    for n in (32, 180, 192, 512):
        icon(n, .86, os.path.join(W, f'icon-{n}.png'), with_grid=n > 64)
    icon(512, .66, os.path.join(W, 'icon-maskable-512.png'))          # безопасная зона Android
    icon(1024, .86, os.path.join(ST, 'icon-1024.png'))                  # App Store: без прозрачности
    icon(512, .86, os.path.join(ST, 'icon-512.png'))                    # Google Play / RuStore
    icon(1024, .86, os.path.join(R, 'icon-only.png'))
    icon(1024, .60, os.path.join(R, 'icon-foreground.png'), alpha=True, bg=None)
    im, dr, ss = canvas(1024, 1024, SKY + (255,)); grid(dr, 1024 * ss, 1024 * ss, 1024 * ss // 8, GRID); finish(im, 1024, 1024, os.path.join(R, 'icon-background.png'), False)
    # заставки
    for name in ('splash.png', 'splash-dark.png'):
        im, dr, ss = canvas(2732, 2732, SKY + (255,), ss=1)
        grid(dr, 2732, 2732, 2732 // 22, GRID)
        face(dr, 1366, 1366, 700)
        finish(im, 2732, 2732, os.path.join(R, name), False)
    # баннер Google Play 1024x500
    im, dr, ss = canvas(1024, 500, SKY + (255,))
    grid(dr, 1024 * ss, 500 * ss, 40 * ss, GRID)
    dr.rounded_rectangle([560 * ss, 70 * ss, 960 * ss, 430 * ss], radius=26 * ss, fill=PAPER)
    grid_paper = [(560 + 20 * i) * ss for i in range(1, 20)]
    for x in grid_paper: dr.line([(x, 70 * ss), (x, 430 * ss)], fill=GRID, width=ss)
    for y in range(90, 430, 20): dr.line([(560 * ss, y * ss), (960 * ss, y * ss)], fill=GRID, width=ss)
    # на листе — простой рисунок котика линиями
    cx, cy, r = 760 * ss, 260 * ss, 95 * ss
    dr.ellipse([cx - r, cy - r, cx + r, cy + r], outline=INK, width=6 * ss)
    dr.line([(cx - 80 * ss, cy - 52 * ss), (cx - 72 * ss, cy - 150 * ss), (cx - 20 * ss, cy - 92 * ss)], fill=INK, width=6 * ss, joint='curve')
    dr.line([(cx + 80 * ss, cy - 52 * ss), (cx + 72 * ss, cy - 150 * ss), (cx + 20 * ss, cy - 92 * ss)], fill=INK, width=6 * ss, joint='curve')
    for ex in (-34, 34): dr.ellipse([cx + (ex - 8) * ss, cy - 18 * ss, cx + (ex + 8) * ss, cy + 6 * ss], fill=INK)
    for sgn in (-1, 1):
        dr.line([(cx + sgn * 40 * ss, cy + 30 * ss), (cx + sgn * 140 * ss, cy + 18 * ss)], fill=INK, width=4 * ss)
        dr.line([(cx + sgn * 40 * ss, cy + 44 * ss), (cx + sgn * 138 * ss, cy + 56 * ss)], fill=INK, width=4 * ss)
    pencil(dr, 905 * ss, 395 * ss, 150 * ss, -40, 13 * ss)
    face(dr, 270 * ss, 250 * ss, 400 * ss)
    finish(im, 1024, 500, os.path.join(ST, 'feature-1024x500.png'), False)
    # картинка для BotFather /newapp: 640x360
    im, dr, ss = canvas(640, 360, SKY + (255,))
    grid(dr, 640 * ss, 360 * ss, 32 * ss, GRID)
    face(dr, 320 * ss, 186 * ss, 300 * ss)
    finish(im, 640, 360, os.path.join(ST, 'telegram-640x360.png'), False)


if __name__ == '__main__':
    main()
