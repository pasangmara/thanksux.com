"""SKC Day 1 — Design C v1 (after Joy's critique of A/B).
Fixes: clear brand (who) + restaurant cues (menu card, skewer divider, script type)
+ concrete mechanic (show repair slip -> waiting combo) + explicit CTA/where/how.
Battery metaphor replaced by a local object: the mobile-repair slip.
Usage: python3 -I skc_day1_c.py <assets_dir> <fonts_dir> <logo_path> <out_path>
"""
import sys, os, glob, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops, ImageOps, ImageEnhance

A, FD, LOGO, OUT = sys.argv[1:5]
W, H = 1080, 1350
BROWN = (59, 31, 20); OCHRE = (224, 164, 58); CREAM = (246, 235, 221); RED = (200, 16, 46)
WHITE = (255, 255, 255); PAPER = (252, 250, 243); INK = (40, 40, 48)

def ff(n): return glob.glob(os.path.join(FD, 'x-*', 'files', n))[0]
FONTS = {
    'baloo': ('baloo-da-2-bengali-800-normal.woff', 'baloo-da-2-latin-800-normal.woff'),
    'anekB': ('anek-bangla-bengali-700-normal.woff', 'anek-bangla-latin-700-normal.woff'),
    'anekM': ('anek-bangla-bengali-500-normal.woff', 'anek-bangla-latin-500-normal.woff'),
    'galada': ('galada-bengali-400-normal.woff', 'baloo-da-2-latin-700-normal.woff'),
}
_c = {}
def font(k, s, bn=True):
    key = (k, s, bn)
    if key not in _c:
        _c[key] = ImageFont.truetype(ff(FONTS[k][0 if bn else 1]), s, layout_engine=ImageFont.Layout.RAQM)
    return _c[key]
def is_bn(ch): return 'ঀ' <= ch <= '৿' or ch in '‌‍'
def runs(t):
    o = []
    for ch in t:
        b = is_bn(ch) or (ch == ' ' and o and o[-1][1])
        if o and o[-1][1] == b: o[-1][0] += ch
        else: o.append([ch, b])
    return o
def tw(t, k, s): return sum(font(k, s, b).getlength(x) for x, b in runs(t))
def text(d, xy, t, k, s, fill, center=False, right=False, shadow=None):
    x, y = xy
    if center: x -= tw(t, k, s) / 2
    if right: x -= tw(t, k, s)
    for x_, b in runs(t):
        f = font(k, s, b)
        if shadow: d.text((x + 2, y + 3), x_, font=f, fill=shadow)
        d.text((x, y), x_, font=f, fill=fill); x += f.getlength(x_)
    return x

def cutout_white(path, thresh=238, feather=2):
    im = Image.open(path).convert('RGB'); g = im.convert('L')
    m = g.point(lambda v: 0 if v >= thresh else 255)
    for sx in range(0, m.width, 40):
        for sy in (0, m.height - 1):
            if m.getpixel((sx, sy)) == 0: ImageDraw.floodfill(m, (sx, sy), 128)
    for sy in range(0, m.height, 40):
        for sx in (0, m.width - 1):
            if m.getpixel((sx, sy)) == 0: ImageDraw.floodfill(m, (sx, sy), 128)
    a = m.point(lambda v: 0 if v == 128 else 255).filter(ImageFilter.GaussianBlur(feather))
    o = im.convert('RGBA'); o.putalpha(a); return o.crop(a.getbbox())

def cover(path, w, h, focus=(0.5, 0.5)):
    im = Image.open(path).convert('RGB'); s = max(w / im.width, h / im.height)
    im = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
    x = int((im.width - w) * focus[0]); y = int((im.height - h) * focus[1])
    return im.crop((x, y, x + w, y + h))

def paste_shadow(base, layer, pos, blur=14, off=(10, 14), alpha=120):
    sh = Image.new('RGBA', layer.size, (0, 0, 0, 0))
    sh.putalpha(layer.getchannel('A').point(lambda v: v * alpha // 255))
    pad = blur * 3
    big = Image.new('RGBA', (layer.width + 2 * pad, layer.height + 2 * pad), (0, 0, 0, 0)); big.paste(sh, (pad, pad))
    big = big.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(big, (pos[0] - pad + off[0], pos[1] - pad + off[1]))
    base.alpha_composite(layer, pos)

def skewer(d, x, y, w, color_a=OCHRE, color_b=BROWN):
    d.line((x, y, x + w, y), fill=color_b, width=5)
    n = 6; step = w / (n + 1)
    for i in range(1, n + 1):
        cx = x + i * step
        d.rounded_rectangle((cx - 16, y - 15, cx + 16, y + 15), 7, fill=color_a if i % 2 else (196, 120, 50), outline=color_b, width=2)
    d.ellipse((x + w - 4, y - 7, x + w + 10, y + 7), fill=color_b)

def repair_slip():
    sw, sh_ = 360, 370
    s = Image.new('RGBA', (sw, sh_), (0, 0, 0, 0)); d = ImageDraw.Draw(s)
    d.rectangle((0, 0, sw, sh_), fill=PAPER + (255,))
    # torn bottom edge
    pts = [(0, sh_ - 18)] + [(x, sh_ - (10 if (x // 12) % 2 else 0) - 4) for x in range(0, sw + 12, 12)] + [(sw, sh_), (0, sh_)]
    d.polygon(pts, fill=(0, 0, 0, 0))
    d.rectangle((0, 0, sw, 54), fill=(36, 74, 140, 255))
    text(d, (sw / 2, 10), 'মোবাইল রিপেয়ার স্লিপ', 'anekB', 28, WHITE, center=True)
    text(d, (22, 70), 'টোকেন নং', 'anekM', 24, INK); text(d, (sw - 22, 62), '১৭', 'baloo', 44, (36, 74, 140), right=True)
    for i, (k, v) in enumerate((('সমস্যা', 'ডিসপ্লে'), ('ফেরত', '১ ঘণ্টা পর'))):
        y = 128 + i * 44
        text(d, (22, y), k, 'anekM', 24, INK); text(d, (sw - 22, y), v, 'anekB', 24, INK, right=True)
        for x in range(22, sw - 22, 10): d.point((x, y + 36), fill=(160, 160, 170))
    # SKC stamp (the twist): the slip itself becomes the coupon
    st = Image.new('RGBA', (220, 90), (0, 0, 0, 0)); sd = ImageDraw.Draw(st)
    sd.rounded_rectangle((3, 3, 217, 87), 12, outline=RED + (230,), width=5)
    text(sd, (110, 8), 'SKC ওয়েটিং', 'anekB', 30, RED, center=True)
    text(sd, (110, 44), 'কম্বো ৳১৯৯', 'anekB', 30, RED, center=True)
    st = st.rotate(14, expand=True, resample=Image.BICUBIC)
    s.alpha_composite(st, (sw - st.width - 4, 228))
    return s.rotate(-9, expand=True, resample=Image.BICUBIC)

def menu_card(w, h):
    c = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(c)
    d.rounded_rectangle((0, 0, w, h), 18, fill=CREAM + (255,))
    d.rounded_rectangle((12, 12, w - 12, h - 12), 12, outline=BROWN, width=3)
    d.rounded_rectangle((22, 22, w - 22, h - 22), 8, outline=OCHRE, width=2)
    for (cx, cy) in ((22, 22), (w - 22, 22), (22, h - 22), (w - 22, h - 22)):
        d.polygon([(cx, cy - 10), (cx + 10, cy), (cx, cy + 10), (cx - 10, cy)], fill=BROWN)
    text(d, (w / 2, 34), 'ওয়েটিং কম্বো', 'galada', 52, BROWN, center=True)
    skewer(d, 70, 128, w - 140)
    y = 158
    xe = text(d, (44, y), 'গরম কফি + ফিরনি', 'anekB', 34, BROWN)
    px = w - 44 - tw('৳১৯৯', 'baloo', 54)
    for x in range(int(xe) + 10, int(px) - 10, 12): d.ellipse((x, y + 30, x + 4, y + 34), fill=BROWN)
    text(d, (w - 44, y - 12), '৳১৯৯', 'baloo', 54, RED, right=True)
    text(d, (w / 2, y + 64), 'রিপেয়ার স্লিপ দেখালেই · ফ্রি ওয়াইফাই', 'anekM', 26, BROWN, center=True)
    return c

def logo_badge(size):
    lg = Image.open(LOGO).convert('RGB'); s = min(lg.size)
    lg = lg.crop(((lg.width - s) // 2, (lg.height - s) // 2, (lg.width + s) // 2, (lg.height + s) // 2))
    lg = lg.crop((int(s * .16), int(s * .16), int(s * .84), int(s * .84))).resize((size, size), Image.LANCZOS)
    m = Image.new('L', (size, size), 0); ImageDraw.Draw(m).ellipse((0, 0, size, size), fill=255)
    o = lg.convert('RGBA'); o.putalpha(m); return o

def circle_inset(path, size, focus):
    im = cover(path, size, size, focus); m = Image.new('L', (size, size), 0)
    ImageDraw.Draw(m).ellipse((0, 0, size, size), fill=255)
    o = im.convert('RGBA'); o.putalpha(m)
    ring = Image.new('RGBA', (size + 16, size + 16), (0, 0, 0, 0))
    ImageDraw.Draw(ring).ellipse((0, 0, size + 15, size + 15), fill=WHITE + (255,))
    ring.alpha_composite(o, (8, 8)); return ring

# ---------- compose ----------
img = Image.new('RGBA', (W, H), CREAM + (255,))
PH_Y, PH_H = 440, 760
cafe = cover(os.path.join(A, 'SKC-03-cafe-evening-bg.jpg'), W, PH_H, focus=(0.32, 0.8)).convert('RGBA')
img.alpha_composite(cafe, (0, PH_Y))
fade = Image.new('RGBA', (W, 140), CREAM + (255,)); fade.putalpha(ImageOps.invert(Image.linear_gradient('L').resize((W, 140))))
img.alpha_composite(fade, (0, PH_Y))
d = ImageDraw.Draw(img)

# WHO: brand bar
lg = logo_badge(118); img.alpha_composite(lg, (44, 26))
text(d, (182, 30), 'Super Kabab & Coffee', 'baloo', 50, BROWN)
text(d, (184, 96), 'কাবাব · কফি · রেস্টুরেন্ট  |  মোতালিব প্লাজা', 'anekM', 28, (120, 80, 50))
d.line((44, 164, W - 44, 164), fill=(220, 200, 175), width=2)

# WHY: headline (restaurant voice: script + bold)
text(d, (48, 178), 'মোতালিব প্লাজায় ফোন সারাতে দিয়েছেন?', 'galada', 46, (150, 90, 40))
text(d, (44, 236), 'অপেক্ষা নয়, টেবিল রেডি!', 'baloo', 92, BROWN)
skewer(d, 48, 372, 300)
text(d, (380, 356), 'দাঁড়িয়ে না থেকে বসুন, খান, রিল্যাক্স করুন', 'anekM', 30, BROWN)

# HERO on table: coffee + firni + repair slip (the local object)
coffee = cutout_white(os.path.join(A, 'SKC-01-coffee-cup-STANDIN.jpg'))
firni = cutout_white(os.path.join(A, 'SKC-04-firni-clay-STANDIN.jpg'))
steam = Image.open(os.path.join(A, 'SKC-07-steam-black.jpg')).convert('RGB')
slip = repair_slip()
cf = coffee.resize((370, int(370 * coffee.height / coffee.width)), Image.LANCZOS)
fr = firni.resize((240, int(240 * firni.height / firni.width)), Image.LANCZOS)
st = ImageEnhance.Brightness(steam.resize((280, int(280 * steam.height / steam.width)), Image.LANCZOS)).enhance(0.65)
reg = img.crop((170, 520, 170 + st.width, 520 + st.height)).convert('RGB')
img.paste(ImageChops.screen(reg, st), (170, 520))
paste_shadow(img, cf, (130, 960 - cf.height), blur=16)
paste_shadow(img, fr, (470, 985 - fr.height), blur=16)
paste_shadow(img, slip, (W - slip.width - 18, 1012 - slip.height), blur=10, off=(8, 12), alpha=120)

# WHERE (visual): corridor inset + "walk 2 min" chip
ins = circle_inset(os.path.join(A, 'SKC-06-mobile-market-corridor.jpg'), 150, (0.45, 0.5))
ix, iy = W - ins.width - 30, PH_Y + 26
img.alpha_composite(ins, (ix, iy))
d = ImageDraw.Draw(img)
cx0 = ix - 300
d.rounded_rectangle((cx0, iy + 34, ix + 10, iy + 128), 24, fill=BROWN + (235,))
text(d, (cx0 + 22, iy + 40), 'রিপেয়ার করিডোর থেকে', 'anekM', 26, CREAM)
text(d, (cx0 + 22, iy + 76), 'হেঁটে মাত্র ২ মিনিট', 'anekB', 32, OCHRE)

# HOW: menu-card offer
mc = menu_card(500, 280)
paste_shadow(img, mc, (40, 935), blur=14, off=(6, 10), alpha=140)

# CTA bar
d = ImageDraw.Draw(img)
d.rectangle((0, 1228, W, H), fill=BROWN + (255,))
d.rounded_rectangle((580, 1028, 1040, 1100), 36, fill=OCHRE)
xe = text(d, (628, 1040), 'স্লিপ দেখান, বসে পড়ুন', 'anekB', 36, BROWN)
d.polygon([(xe + 22, 1052), (xe + 50, 1066), (xe + 22, 1080)], fill=BROWN)
text(d, (810, 1112), 'কল/মেসেজ: ০১৯৭২-৪৯৮৫৬১', 'anekB', 28, WHITE, center=True, shadow=(0, 0, 0))
# pin + address
px, py = 44, 1252
d.ellipse((px, py, px + 30, py + 30), fill=OCHRE); d.polygon([(px + 4, py + 20), (px + 26, py + 20), (px + 15, py + 42)], fill=OCHRE)
d.ellipse((px + 9, py + 9, px + 21, py + 21), fill=BROWN)
text(d, (88, 1244), 'মোতালিব প্লাজা গলি, ৮ পরিবাগ, হাতিরপুল', 'anekB', 32, CREAM)
text(d, (88, 1288), 'পেমেন্ট: বিকাশ · নগদ · ক্যাশ   |   ফ্রি ওয়াইফাই', 'anekM', 26, (230, 205, 170))
img.convert('RGB').save(OUT, quality=90)
print('ok')
