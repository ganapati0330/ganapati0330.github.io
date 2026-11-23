from PIL import Image, ImageDraw, ImageFont, ImageFilter
im = Image.open('./menu_chugoku.webp').convert('RGB')
W, H = im.size
# 上の タイトル部分を 空の 色で ぼかして けす
top = im.crop((0, 0, W, 430)).filter(ImageFilter.GaussianBlur(28))
mask = Image.new('L', (W, 430), 255)
md = ImageDraw.Draw(mask)
for y in range(380, 430): md.line([(0, y), (W, y)], fill=int(255 * (430 - y) / 50))
im.paste(top, (0, 0), mask)
dr = ImageDraw.Draw(im)
def font(sz, w='Black'):
    for f in ['/usr/share/fonts/opentype/noto/NotoSerifCJK-Black.ttc', '/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc']:
        try: return ImageFont.truetype(f, sz, index=0)
        except Exception: pass
    return ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc', sz, index=0)
def ctext(y, t, sz, fill, stroke, sw):
    f = font(sz); w = dr.textlength(t, font=f)
    dr.text(((W - w) / 2, y), t, font=f, fill=fill, stroke_width=sw, stroke_fill=stroke)
# 赤い 帯
dr.polygon([(40, 150), (W - 30, 120), (W - 50, 300), (60, 318)], fill=(150, 24, 24))
ctext(18, 'フテ猫', 70, (255, 255, 255), (40, 20, 10), 7)
ctext(108, '北奥羽の', 120, (255, 214, 90), (60, 25, 5), 10)
ctext(236, '戦国シミュレーション', 66, (255, 255, 255), (40, 15, 5), 6)
# 巻物
dr.rounded_rectangle((110, 322, W - 110, 382), 18, fill=(246, 232, 200), outline=(120, 80, 40), width=4)
f = font(26); t = '津軽・南部・安東　北奥羽統一をめざせ！'; w = dr.textlength(t, font=f)
dr.text(((W - w) / 2, 336), t, font=f, fill=(110, 30, 20))
# 城の 札を けす
dr.rounded_rectangle((632, 440, 744, 500), 8, fill=(120, 80, 45), outline=(70, 40, 20), width=3)
f = font(26); t = '北奥羽'; w = dr.textlength(t, font=f); dr.text((688 - w / 2, 452), t, font=f, fill=(255, 240, 210))
im.save('./menu.webp', 'WEBP', quality=82)
im.save('/tmp/menu_new.png')
