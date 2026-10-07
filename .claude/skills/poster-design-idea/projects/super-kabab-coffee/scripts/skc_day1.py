"""SKC Day 1 photo-sketch previews (Design A message-led, Design B visual-led).
Usage: python3 -I skc_day1.py <assets_dir> <fonts_dir> <logo_path> <out_dir>
"""
import sys, os, glob
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops, ImageOps, ImageEnhance

A, FD, LOGO, OUT = sys.argv[1:5]
W, H = 1080, 1350
BROWN = (59, 31, 20); OCHRE = (224, 164, 58); CREAM = (246, 235, 221); RED = (200, 16, 46); WHITE = (255, 255, 255)

def ff(name):
    return glob.glob(os.path.join(FD, 'x-*', 'files', name))[0]

FONTS = {
    'baloo': ('baloo-da-2-bengali-800-normal.woff', 'baloo-da-2-latin-800-normal.woff'),
    'anekB': ('anek-bangla-bengali-700-normal.woff', 'anek-bangla-latin-700-normal.woff'),
    'anekM': ('anek-bangla-bengali-500-normal.woff', 'anek-bangla-latin-500-normal.woff'),
}
_cache = {}
def font(kind, size, bengali=True):
    key = (kind, size, bengali)
    if key not in _cache:
        _cache[key] = ImageFont.truetype(ff(FONTS[kind][0 if bengali else 1]), size, layout_engine=ImageFont.Layout.RAQM)
    return _cache[key]

def is_bn(ch):
    return 'ঀ' <= ch <= '৿' or ch in '‌‍'

def runs(text):
    out = []
    for ch in text:
        b = is_bn(ch) or (ch == ' ' and out and out[-1][1])
        if out and out[-1][1] == b:
            out[-1][0] += ch
        else:
            out.append([ch, b])
    return out

def text_w(text, kind, size):
    return sum(font(kind, size, b).getlength(t) for t, b in runs(text))

def draw_text(d, xy, text, kind, size, fill, anchor_center=False, shadow=None):
    x, y = xy
    if anchor_center:
        x -= text_w(text, kind, size) / 2
    for t, b in runs(text):
        f = font(kind, size, b)
        if shadow:
            d.text((x + 3, y + 3), t, font=f, fill=shadow)
        d.text((x, y), t, font=f, fill=fill)
        x += f.getlength(t)
    return x

def cutout_white(path, thresh=238, feather=2):
    im = Image.open(path).convert('RGB')
    g = im.convert('L')
    mask = g.point(lambda v: 0 if v >= thresh else 255)
    # flood-fill from edges so inner whites (crema, plate shine) stay
    m = mask.copy()
    for sx in range(0, m.width, 40):
        for sy in (0, m.height - 1):
            if m.getpixel((sx, sy)) == 0: ImageDraw.floodfill(m, (sx, sy), 128)
    for sy in range(0, m.height, 40):
        for sx in (0, m.width - 1):
            if m.getpixel((sx, sy)) == 0: ImageDraw.floodfill(m, (sx, sy), 128)
    alpha = m.point(lambda v: 0 if v == 128 else 255).filter(ImageFilter.GaussianBlur(feather))
    out = im.convert('RGBA'); out.putalpha(alpha)
    return out.crop(alpha.getbbox())

def cover(path, w, h, focus=(0.5, 0.5)):
    im = Image.open(path).convert('RGB')
    s = max(w / im.width, h / im.height)
    im = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
    x = int((im.width - w) * focus[0]); y = int((im.height - h) * focus[1])
    return im.crop((x, y, x + w, y + h))

def screen(base, overlay, pos):
    region = base.crop((pos[0], pos[1], pos[0] + overlay.width, pos[1] + overlay.height)).convert('RGB')
    region = ImageChops.screen(region, overlay.convert('RGB'))
    base.paste(region, pos)

def battery(d, x, y, w, h, pct, fill, stroke, label=None, label_color=WHITE):
    r = h // 5
    d.rounded_rectangle((x, y, x + w, y + h), r, outline=stroke, width=max(4, h // 10))
    d.rounded_rectangle((x + w + 2, y + h * 0.3, x + w + h * 0.18, y + h * 0.7), 3, fill=stroke)
    pad = max(8, h // 7)
    inner = (w - 2 * pad) * pct
    if inner > 0:
        d.rounded_rectangle((x + pad, y + pad, x + pad + inner, y + h - pad), r // 2, fill=fill)
    if label:
        draw_text(d, (x + w / 2, y + h * 0.12), label, 'baloo', int(h * 0.62), label_color, anchor_center=True)

def chip(d, x, y, text, bg, fg, size=34, icon=None):
    pad = 22; tw = text_w(text, 'anekB', size); iw = size + 10 if icon else 0
    w = tw + 2 * pad + iw; h = size + 30
    d.rounded_rectangle((x, y, x + w, y + h), h // 2, fill=bg)
    if icon == 'clock':
        cx, cy, r = x + pad + size / 2 - 4, y + h / 2, size / 2 - 4
        d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=fg, width=4)
        d.line((cx, cy, cx, cy - r + 6), fill=fg, width=4); d.line((cx, cy, cx + r - 7, cy), fill=fg, width=4)
    if icon == 'wifi':
        cx, cy = x + pad + size / 2 - 4, y + h / 2 + size / 3
        for i, rr in enumerate((size * .55, size * .38, size * .21)):
            d.arc((cx - rr, cy - rr, cx + rr, cy + rr), 225, 315, fill=fg, width=4)
        d.ellipse((cx - 4, cy - 4, cx + 4, cy + 4), fill=fg)
    draw_text(d, (x + pad + iw, y + 10), text, 'anekB', size, fg)
    return x + w

def pin(d, x, y, s, color):
    d.ellipse((x, y, x + s, y + s), fill=color)
    d.polygon([(x + s * .15, y + s * .65), (x + s * .85, y + s * .65), (x + s / 2, y + s * 1.35)], fill=color)
    d.ellipse((x + s * .32, y + s * .32, x + s * .68, y + s * .68), fill=WHITE)

def logo_badge(size):
    lg = Image.open(LOGO).convert('RGB')
    s = min(lg.size); lg = lg.crop(((lg.width - s) // 2, (lg.height - s) // 2, (lg.width + s) // 2, (lg.height + s) // 2))
    lg = lg.crop((int(s * .16), int(s * .16), int(s * .84), int(s * .84))).resize((size, size), Image.LANCZOS)
    m = Image.new('L', (size, size), 0); ImageDraw.Draw(m).ellipse((0, 0, size, size), fill=255)
    out = lg.convert('RGBA'); out.putalpha(m); return out

coffee = cutout_white(os.path.join(A, 'SKC-01-coffee-cup-STANDIN.jpg'))
firni = cutout_white(os.path.join(A, 'SKC-04-firni-clay-STANDIN.jpg'))
man = cutout_white(os.path.join(A, 'SKC-05-man-coffee-phone.jpg'), thresh=242)
steam = Image.open(os.path.join(A, 'SKC-07-steam-black.jpg')).convert('RGB')
logo = logo_badge(120)

# ---------------- Design A : message-led ----------------
img = Image.new('RGB', (W, H), CREAM)
cafe = cover(os.path.join(A, 'SKC-03-cafe-evening-bg.jpg'), W, 820, focus=(0.35, 0.75))
img.paste(cafe, (0, 530))
grad = Image.linear_gradient('L').resize((W, 220))  # 0 top -> 255 bottom
cream_layer = Image.new('RGB', (W, 220), CREAM)
img.paste(cream_layer, (0, 530), ImageOps.invert(grad))
d = ImageDraw.Draw(img)
draw_text(d, (70, 70), 'মোতালিব প্লাজায় ফোন সারাতে দিয়েছেন?', 'anekM', 36, BROWN)
draw_text(d, (66, 125), 'ফোন রিচার্জ হচ্ছে,', 'anekB', 72, BROWN)
xe = draw_text(d, (62, 205), 'আপনিও হোন', 'baloo', 140, BROWN)
battery(d, int(xe) + 24, 262, 170, 84, 1.0, OCHRE, BROWN)
draw_text(d, (70, 405), 'দাঁড়িয়ে নয়, বসে কাটান অপেক্ষার সময়টা', 'anekM', 36, BROWN)
# products on the table
cf = coffee.resize((430, int(430 * coffee.height / coffee.width)), Image.LANCZOS)
fr = firni.resize((330, int(330 * firni.height / firni.width)), Image.LANCZOS)
sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(sh)
sd.ellipse((255, 1095, 735, 1150), fill=(0, 0, 0, 120)); sd.ellipse((620, 1135, 980, 1185), fill=(0, 0, 0, 110))
img.paste(Image.alpha_composite(img.convert('RGBA'), sh.filter(ImageFilter.GaussianBlur(14))).convert('RGB'))
st = steam.resize((360, int(360 * steam.height / steam.width)), Image.LANCZOS)
screen(img, ImageEnhance.Brightness(st).enhance(0.7), (300, 470))
img.paste(cf, (280, 1120 - cf.height), cf)
img.paste(fr, (640, 1170 - fr.height), fr)
d = ImageDraw.Draw(img)
# chips + footer
d.rectangle((0, 1210, W, H), fill=BROWN)
x = chip(d, 40, 1232, '২ মিনিট দূরে', CREAM, BROWN, 30, 'clock')
x = chip(d, x + 14, 1232, 'ফ্রি ওয়াইফাই', CREAM, BROWN, 30, 'wifi')
chip(d, x + 14, 1232, 'কফি + ফিরনি ৳১৯৯', RED, WHITE, 30)
d.rounded_rectangle((40, 1150, 560, 1196), 23, fill=(59, 31, 20))
pin(d, 56, 1157, 26, OCHRE)
draw_text(d, (96, 1153), 'SKC · মোতালিব প্লাজা গলি, ৮ পরিবাগ', 'anekM', 28, CREAM)
img.paste(logo, (W - 160, 40), logo)
img.save(os.path.join(OUT, 'SKC-D1-A-message-led.jpg'), quality=90)

# ---------------- Design B : visual-led (diagonal split) ----------------
corr = cover(os.path.join(A, 'SKC-06-mobile-market-corridor.jpg'), W, H, focus=(0.22, 0.5))
corr = ImageEnhance.Color(corr).enhance(0.25)
corr = Image.blend(corr, Image.new('RGB', (W, H), (60, 80, 110)), 0.28)
cafe = cover(os.path.join(A, 'SKC-03-cafe-evening-bg.jpg'), W, H, focus=(0.55, 0.5))
cafe = ImageEnhance.Brightness(cafe).enhance(1.05)
mask = Image.new('L', (W, H), 0); md = ImageDraw.Draw(mask)
P = [(W, 330), (W, H), (0, H), (0, 1060)]  # café = lower-right triangle-ish
md.polygon(P, fill=255)
img = Image.composite(cafe, corr, mask.filter(ImageFilter.GaussianBlur(2)))
d = ImageDraw.Draw(img, 'RGBA')
# glowing doorway line along the diagonal
for wdt, a in ((40, 40), (22, 90), (8, 255)):
    d.line([(0, 1060), (W, 330)], fill=OCHRE + (a,), width=wdt)
# arrow head + label on the diagonal
ax, ay = 470, 1060 - (470 / W) * 730
d.polygon([(ax + 40, ay - 27), (ax - 16, ay - 30), (ax + 10, ay + 22)], fill=OCHRE)
d.rounded_rectangle((ax - 70, ay + 34, ax + 170, ay + 96), 31, fill=OCHRE)
draw_text(d, (ax - 48, ay + 40), '২ মিনিট', 'anekB', 40, BROWN)
# 5% battery over the corridor crowd
d.rounded_rectangle((60, 430, 430, 570), 24, fill=(0, 0, 0, 150))
battery(d, 85, 455, 160, 80, 0.06, RED, WHITE)
draw_text(d, (265, 460), '৫%', 'baloo', 64, WHITE)
draw_text(d, (66, 585), 'দাঁড়িয়ে ১ ঘণ্টা অপেক্ষা?', 'anekB', 40, WHITE, shadow=(0, 0, 0))
# man in café
mn = man.resize((720, int(660 * man.height / man.width)), Image.LANCZOS)
img.paste(mn, (W - mn.width + 60, H - mn.height - 110), mn)
d = ImageDraw.Draw(img, 'RGBA')
d.rounded_rectangle((640, 470, 1040, 590), 24, fill=(59, 31, 20, 210))
battery(d, 665, 492, 150, 76, 1.0, OCHRE, CREAM)
draw_text(d, (835, 492), '১০০%', 'baloo', 58, CREAM)
# headline top
draw_text(d, (60, 60), 'অপেক্ষা নয়,', 'anekB', 76, WHITE, shadow=(0, 0, 0))
draw_text(d, (55, 140), 'রিচার্জ!', 'baloo', 170, OCHRE, shadow=(30, 15, 10))
# bottom strip
d.rectangle((0, H - 110, W, H), fill=BROWN)
x = chip(d, 30, H - 92, 'কফি + ফিরনি ৳১৯৯', RED, WHITE, 30)
x = chip(d, x + 12, H - 92, 'ফ্রি ওয়াইফাই', CREAM, BROWN, 30, 'wifi')
pin(d, x + 24, H - 86, 26, OCHRE)
draw_text(d, (x + 62, H - 90), 'মোতালিব প্লাজা গলি', 'anekM', 30, CREAM)
img.paste(logo.resize((100, 100)), (W - 120, 30), logo.resize((100, 100)))
img.save(os.path.join(OUT, 'SKC-D1-B-visual-led.jpg'), quality=90)
print('ok')
