# 兵種シート（待機・攻撃・やられ）を 切りだして 旗を 青・赤に ぬる
import sys
from PIL import Image, ImageDraw
import numpy as np
from scipy import ndimage
import os
SHEETS = {'kosaku': '010d8529', 'teppo': '0f05f64d', 'kiba': '636e0880', 'yumi': '31def4b4', 'taisho': 'ff4d1140', 'ninja': '07373cb7'}
if len(sys.argv) > 1: SHEETS = {k: v for k, v in SHEETS.items() if k in sys.argv[1:]}
POSES = ['stand', 'atk', 'down']
def parts(im):
    a = np.array(im); m = a[:, :, 3] > 40
    lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=2))
    objs = ndimage.find_objects(lab); sz = ndimage.sum(m, lab, range(1, n + 1))
    comps = [(sz[i], objs[i], i + 1) for i in range(n) if sz[i] > 30]
    comps.sort(key=lambda c: -c[0]); big = sorted(comps[:3], key=lambda c: c[1][1].start)
    groups = [[c] for c in big]
    for c in comps[3:]:
        ys, xs = c[1]
        def gap(b):
            bys, bxs = b[1]
            dx = max(0, bxs.start - xs.stop, xs.start - bxs.stop); dy = max(0, bys.start - ys.stop, ys.start - bys.stop)
            return dx + dy
        gi = min(range(3), key=lambda g: gap(groups[g][0])); groups[gi].append(c)
    out = []
    for g in groups:
        keep = np.isin(lab, [c[2] for c in g]) & m
        b = np.array(a); b[:, :, 3] = np.where(keep, a[:, :, 3], 0); b[:, :, 3][b[:, :, 3] < 30] = 0
        ys, xs = np.where(b[:, :, 3] > 40)
        out.append(Image.fromarray(b).crop((xs.min() - 3, ys.min() - 3, xs.max() + 4, ys.max() + 4)))
    return out
def tint(im, rgb):
    a = np.array(im).astype(np.float32); h = a.shape[0]
    r, g, b, al = a[:, :, 0], a[:, :, 1], a[:, :, 2], a[:, :, 3]
    mn = np.minimum(np.minimum(r, g), b); mx = np.maximum(np.maximum(r, g), b)
    yy = np.arange(h)[:, None] * np.ones_like(r)
    cream = (mn > 150) & (mx - mn < 70) & (al > 60) & (yy < h * 0.55)
    lab, n = ndimage.label(ndimage.binary_closing(cream, iterations=2))
    if not n: return Image.fromarray(a.astype(np.uint8)), 0
    sz = ndimage.sum(cream, lab, range(1, n + 1)); flag = lab == (np.argmax(sz) + 1)
    area = ndimage.binary_dilation(ndimage.binary_fill_holes(ndimage.binary_closing(flag, iterations=3)), iterations=2)
    m = area & (al > 60) & (mx - mn < 80) & (mn > 95)
    lum = (0.3 * r + 0.59 * g + 0.11 * b) / 255.0; k = np.clip(lum * 1.15, 0.3, 1.2)
    for i, c in enumerate(rgb): a[:, :, i] = np.where(m, np.clip(c * k, 0, 255), a[:, :, i])
    return Image.fromarray(a.astype(np.uint8)), int(m.sum())
W = Image.new('RGBA', (6 * 190, len(SHEETS) * 230), (200, 220, 190, 255))
for row, (unit, f) in enumerate(SHEETS.items()):
    ps = parts(Image.open('/mnt/user-data/uploads/%s-image.png' % f).convert('RGBA'))
    for pi, (pose, base) in enumerate(zip(POSES, ps)):
        for ti, (team, rgb) in enumerate((('b', (55, 110, 230)), ('r', (225, 60, 45)))):
            im, n = tint(base, rgb); s = 220 / max(im.size)
            im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
            im.save('gfx/%s_%s_%s.webp' % (unit, pose, team), 'WEBP', quality=82, method=6)
            t = im.copy(); t.thumbnail((180, 220)); W.alpha_composite(t, ((pi * 2 + ti) * 190 + 5, row * 230 + 5))
            print(unit, pose, team, im.size, n)
W.save('units_check.png')
