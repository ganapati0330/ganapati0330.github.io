# 兵種アニメ（攻撃 4コマ）を 切りだして 旗を 青・赤に
from PIL import Image, ImageDraw
import numpy as np
from scipy import ndimage
SRC = '/mnt/user-data/uploads/1b171388-image.png'
im = Image.open(SRC).convert('RGBA')
L = [123, 233, 340, 445, 553, 652, 775]; Rr = [892, 1000, 1102, 1204, 1310, 1413, 1536]; T = [124, 268, 386, 504, 622, 741, 874]
ROWS = {'ashigaru': (L, 120, 278), 'yumi': (Rr, 120, 278), 'kiba': (L, 320, 495), 'teppo': (Rr, 320, 495),
        'kosaku': (L, 543, 718), 'ninja': (Rr, 543, 718), 'taisho': (T, 776, 995)}
def clean(c):
    a = np.array(c); m = a[:, :, 3] > 60
    lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=2))
    if n:
        sz = ndimage.sum(m, lab, range(1, n + 1))
        keep = np.zeros_like(m)
        objs = ndimage.find_objects(lab); W0 = m.shape[1]
        for i in range(n):
            edge = objs[i][1].start <= 1 or objs[i][1].stop >= W0 - 1
            if sz[i] >= max(60, sz.max() * (0.2 if edge else 0.04)): keep |= lab == i + 1
        a[:, :, 3] = np.where(keep, a[:, :, 3], 0)
    a[:, :, 3][a[:, :, 3] < 40] = 0
    ys, xs = np.where(a[:, :, 3] > 40)
    return Image.fromarray(a).crop((xs.min() - 2, ys.min() - 2, xs.max() + 3, ys.max() + 3))
def tint(img, rgb):
    a = np.array(img).astype(np.float32); h = a.shape[0]
    r, g, b, al = a[:, :, 0], a[:, :, 1], a[:, :, 2], a[:, :, 3]
    mn = np.minimum(np.minimum(r, g), b); mx = np.maximum(np.maximum(r, g), b)
    yy = np.arange(h)[:, None] * np.ones_like(r)
    cream = (mn > 175) & (mx - mn < 60) & (al > 60) & (yy < h * 0.5)
    xx = np.arange(a.shape[1])[None, :] * np.ones_like(r)
    flag = None
    for cut in (0.45, 0.66, 0.78, 0.84):   # 旗は 右上：けむりと つながったら もっと 右だけ
        cm = cream & (xx >= a.shape[1] * cut)
        lab, n = ndimage.label(ndimage.binary_closing(cm, iterations=1))
        if not n: continue
        sz = ndimage.sum(cm, lab, range(1, n + 1)); bi = int(np.argmax(sz)); ob = ndimage.find_objects(lab)[bi]
        flag = lab == bi + 1
        if (ob[1].stop - ob[1].start) <= 0.35 * a.shape[1]: break
    if flag is None: return Image.fromarray(a.astype(np.uint8)), 0
    area = ndimage.binary_dilation(ndimage.binary_fill_holes(ndimage.binary_closing(flag, iterations=2)), iterations=1)
    m = area & (al > 60) & (mx - mn < 80) & (mn > 120)
    lum = (0.3 * r + 0.59 * g + 0.11 * b) / 255.0; k = np.clip(lum * 1.15, 0.3, 1.2)
    for i, c in enumerate(rgb): a[:, :, i] = np.where(m, np.clip(c * k, 0, 255), a[:, :, i])
    return Image.fromarray(a.astype(np.uint8)), int(m.sum())
W = Image.new('RGBA', (8 * 130, 7 * 200), (200, 220, 190, 255))
for row, (unit, (xs, y0, y1)) in enumerate(ROWS.items()):
    for f in range(1, 5):
        c = clean(im.crop((xs[f], y0, xs[f + 1], y1)))
        for ti, (team, rgb) in enumerate((('b', (55, 110, 230)), ('r', (225, 60, 45)))):
            t, n = tint(c, rgb)
            if unit == 'teppo' and f == 3: t = t.transpose(Image.FLIP_LEFT_RIGHT)   # 敵の ほうへ うつ
            t.save('gfx/anim_%s_%d_%s.webp' % (unit, f, team), 'WEBP', quality=85, method=6)
            th = t.copy(); th.thumbnail((125, 195)); W.alpha_composite(th, (((f - 1) * 2 + ti) * 130 + 3, row * 200 + 3))
        print(unit, f, c.size, n)
W.save('anim_check.png')
