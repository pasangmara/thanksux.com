"""SKC Day 1, Design C v3 (two variants) built on FOOD-POSTER-SYSTEM.md.
v3a: giant condensed Bangla type behind the food (R30) + cream floor + reflection (R31)
v3b: orange/red radial appetite glow + white floor + contact shadow (R28)
Usage: python3 -I skc_day1_c3.py <assets_dir> <fonts_dir> <logo_path> <out_dir>
"""
import sys, os, glob, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops, ImageEnhance, ImageOps

A, FD, LOGO, OUT = sys.argv[1:5]
W, H = 1080, 1350
RED = (200, 16, 46); DRED = (140, 10, 30); ORANGE = (245, 124, 0); TOMATO = (226, 64, 28)
CREAM = (246, 235, 221); BROWN = (59, 31, 20); OCHRE = (224, 164, 58); WHITE = (255, 255, 255); BLACK = (22, 16, 14)

def fpath(pat): return glob.glob(os.path.join(FD, 'x-*', 'files', pat))[0]
_c = {}
def F(kind, size):
    key = (kind, size)
    if key in _c: return _c[key]
    if kind in ('cond', 'condL'):
        f = ImageFont.truetype(fpath('noto-sans-bengali-bengali-wdth-normal.woff2' if kind == 'cond' else 'noto-sans-bengali-latin-wdth-normal.woff2'), size, layout_engine=ImageFont.Layout.RAQM)
        f.set_variation_by_axes([900, 62])
    elif kind == 'anton': f = ImageFont.truetype(fpath('anton-latin-400-normal.woff'), size)
    elif kind == 'galada': f = ImageFont.truetype(fpath('galada-bengali-400-normal.woff'), size, layout_engine=ImageFont.Layout.RAQM)
    elif kind == 'anekB': f = ImageFont.truetype(fpath('anek-bangla-bengali-700-normal.woff'), size, layout_engine=ImageFont.Layout.RAQM)
    elif kind == 'anekBL': f = ImageFont.truetype(fpath('anek-bangla-latin-700-normal.woff'), size)
    elif kind == 'baloo': f = ImageFont.truetype(fpath('baloo-da-2-latin-800-normal.woff'), size)
    _c[key] = f; return f

def is_bn(ch): return 'ঀ' <= ch <= '৿' or ch in '‌‍'
LATIN_FOR = {'cond': 'condL', 'anekB': 'anekBL', 'galada': 'anekBL'}
def runs(t):
    o = []
    for ch in t:
        b = is_bn(ch) or (ch == ' ' and o and o[-1][1])
        if o and o[-1][1] == b: o[-1][0] += ch
        else: o.append([ch, b])
    return o
def fonts_for(kind, size, bn): return F(kind, size) if (bn or kind not in LATIN_FOR) else F(LATIN_FOR[kind], size)
def tw(t, kind, size): return sum(fonts_for(kind, size, b).getlength(x) for x, b in runs(t))
def text(d, xy, t, kind, size, fill, center=False, shadow=None):
    x, y = xy
    if center: x -= tw(t, kind, size) / 2
    for x_, b in runs(t):
        f = fonts_for(kind, size, b)
        if shadow: d.text((x + 3, y + 4), x_, font=f, fill=shadow)
        d.text((x, y), x_, font=f, fill=fill); x += f.getlength(x_)
    return x
def text_layer(t, kind, size, fill, pad=20, angle=0):
    w = int(tw(t, kind, size)) + 2 * pad; h = int(size * 1.6) + 2 * pad
    L = Image.new('RGBA', (w, h), (0, 0, 0, 0)); text(ImageDraw.Draw(L), (pad, pad), t, kind, size, fill)
    L = L.crop(L.getbbox())
    return L.rotate(angle, expand=True, resample=Image.BICUBIC) if angle else L

def cutout_white(path, thresh=238, feather=2):
    im = Image.open(path).convert('RGB'); m = im.convert('L').point(lambda v: 0 if v >= thresh else 255)
    for sx in range(0, m.width, 40):
        for sy in (0, m.height - 1):
            if m.getpixel((sx, sy)) == 0: ImageDraw.floodfill(m, (sx, sy), 128)
    for sy in range(0, m.height, 40):
        for sx in (0, m.width - 1):
            if m.getpixel((sx, sy)) == 0: ImageDraw.floodfill(m, (sx, sy), 128)
    a = m.point(lambda v: 0 if v == 128 else 255).filter(ImageFilter.GaussianBlur(feather))
    o = im.convert('RGBA'); o.putalpha(a); return o.crop(a.getbbox())

def fit_w(im, w): return im.resize((w, int(w * im.height / im.width)), Image.LANCZOS)
def contact_shadow(base, cx, cy, w, h, alpha=150, blur=18):
    L = Image.new('RGBA', base.size, (0, 0, 0, 0))
    ImageDraw.Draw(L).ellipse((cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2), fill=(40, 15, 5, alpha))
    base.alpha_composite(L.filter(ImageFilter.GaussianBlur(blur)))
def reflection(base, item, x, y_bottom, strength=70, length=0.35):
    r = ImageOps.flip(item); hgt = int(r.height * length); r = r.crop((0, 0, r.width, hgt))
    g = Image.linear_gradient('L').resize((r.width, hgt)).point(lambda v: int((255 - v) * strength / 255))
    a = ImageChops.multiply(r.getchannel('A'), g); r.putalpha(a)
    base.alpha_composite(r.filter(ImageFilter.GaussianBlur(2)), (x, y_bottom))
def steam_on(base, steam, x, y, w, k=0.85):
    st = fit_w(steam, w).convert('L').point(lambda v: max(0, min(255, int((v - 28) * 1.5 * k))))
    L = Image.new('RGBA', st.size, (255, 255, 255, 255)); L.putalpha(st)
    base.alpha_composite(L, (x, y))
def radial(w, h, inner, outer, cx, cy, r):
    g = Image.radial_gradient('L').resize((int(r * 2), int(r * 2)))
    m = Image.new('L', (w, h), 255); m.paste(g, (int(cx - r), int(cy - r)))
    return Image.composite(Image.new('RGB', (w, h), outer), Image.new('RGB', (w, h), inner), m)
def logo_badge(size):
    lg = Image.open(LOGO).convert('RGB'); s = min(lg.size)
    lg = lg.crop(((lg.width - s) // 2, (lg.height - s) // 2, (lg.width + s) // 2, (lg.height + s) // 2))
    lg = lg.crop((int(s * .16), int(s * .16), int(s * .84), int(s * .84))).resize((size, size), Image.LANCZOS)
    m = Image.new('L', (size, size), 0); ImageDraw.Draw(m).ellipse((0, 0, size, size), fill=255)
    o = lg.convert('RGBA'); o.putalpha(m); return o
def price_disc(r, bg, fg, small='মাত্র', big='৳১৯৯', sub='কফি + ফিরনি', angle=-8):
    s = r * 2 + 20; L = Image.new('RGBA', (s, s), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    d.ellipse((10, 10, s - 10, s - 10), fill=bg)
    d.ellipse((24, 24, s - 24, s - 24), outline=fg, width=3)
    text(d, (s / 2, s * .20), small, 'anekB', int(r * .26), fg, center=True)
    text(d, (s / 2, s * .30), big, 'cond', int(r * .78), fg, center=True)
    text(d, (s / 2, s * .70), sub, 'anekB', int(r * .2), fg, center=True)
    return L.rotate(angle, expand=True, resample=Image.BICUBIC)
def cta_pill(d, img, x, y, label, bg, fg, h=96, glow=None):
    w = int(tw(label, 'anekB', 40)) + 150
    if glow:
        G = Image.new('RGBA', img.size, (0, 0, 0, 0))
        ImageDraw.Draw(G).rounded_rectangle((x - 8, y - 8, x + w + 8, y + h + 8), (h + 16) // 2, fill=glow)
        img.alpha_composite(G.filter(ImageFilter.GaussianBlur(14))); d = ImageDraw.Draw(img)
    d.rounded_rectangle((x, y, x + w, y + h), h // 2, fill=bg)
    text(d, (x + 40, y + 18), label, 'anekB', 40, fg)
    ax = x + w - 62; ay = y + h / 2
    d.ellipse((ax - 26, ay - 26, ax + 26, ay + 26), fill=fg)
    d.polygon([(ax - 8, ay - 13), (ax + 14, ay), (ax - 8, ay + 13)], fill=bg)
    return x + w
def pin(d, x, y, s, c, hole):
    d.ellipse((x, y, x + s, y + s), fill=c); d.polygon([(x + s * .15, y + s * .65), (x + s * .85, y + s * .65), (x + s / 2, y + s * 1.35)], fill=c)
    d.ellipse((x + s * .32, y + s * .32, x + s * .68, y + s * .68), fill=hole)
def phone_icon(d, x, y, s, c):
    d.rounded_rectangle((x, y, x + s * .62, y + s), int(s * .12), outline=c, width=4); d.line((x + s * .22, y + s * .86, x + s * .4, y + s * .86), fill=c, width=3)
def leader(d, p0, p1, p2, c):
    d.line([p0, p1, p2], fill=c, width=3); d.ellipse((p0[0] - 7, p0[1] - 7, p0[0] + 7, p0[1] + 7), fill=c)

coffee = cutout_white(os.path.join(A, 'SKC-01-coffee-cup-STANDIN.jpg'))
firni = cutout_white(os.path.join(A, 'SKC-04-firni-clay-STANDIN.jpg'))
steam = Image.open(os.path.join(A, 'SKC-07-steam-black.jpg')).convert('RGB')

# ======================= v3a : giant type behind food =======================
img = Image.new('RGBA', (W, H), CREAM + (255,))
d = ImageDraw.Draw(img)
floor_y = 1010
d.rectangle((0, floor_y, W, H), fill=(236, 222, 204))
# giant two-line condensed headline, red, behind products (overlap = depth)
l1 = text_layer('অপেক্ষা নয়', 'cond', 300, RED); l1 = l1.resize((W - 60, int(l1.height * (W - 60) / l1.width)), Image.LANCZOS)
img.alpha_composite(l1, (30, 170))
l2 = text_layer('টেবিল রেডি', 'cond', 300, RED); l2 = l2.resize((W - 60, int(l2.height * (W - 60) / l2.width)), Image.LANCZOS)
img.alpha_composite(l2, (30, 170 + l1.height + 10))
# heroes on the floor
cf = fit_w(coffee, 660); fr = fit_w(firni, 470)
cfx, cfy = 10, floor_y + 70 - cf.height
frx, fry = W - fr.width - 10, floor_y + 150 - fr.height
contact_shadow(img, cfx + cf.width * .48, floor_y + 60, cf.width * .9, 70)
contact_shadow(img, frx + fr.width * .5, floor_y + 142, fr.width * .95, 60)
steam_on(img, steam, cfx + 120, cfy - 330, 420, 0.55)
img.alpha_composite(cf, (cfx, cfy)); reflection(img, cf, cfx, cfy + cf.height - 6, 55, .22)
img.alpha_composite(fr, (frx, fry)); reflection(img, fr, frx, fry + fr.height - 6, 55, .2)
d = ImageDraw.Draw(img)
# script accent + brand
acc = text_layer('মোতালিব প্লাজায় ফোন সারাতে দিয়েছেন?', 'galada', 54, BROWN, angle=2); img.alpha_composite(acc, (50, 52))
lg = logo_badge(90); img.alpha_composite(lg, (W - 120, H - 260))
# leader labels (R30)
leader(d, (frx + 300, fry + 90), (frx + 330, fry - 10), (frx + 330, fry - 10), BROWN)
text(d, (frx + 160, fry - 56), 'মাটির বাটিতে ফিরনি', 'anekB', 30, BROWN)
# price disc between items (eye path)
pd = price_disc(130, BLACK, CREAM); img.alpha_composite(pd, (450, 640))
# CTA + info row
d = ImageDraw.Draw(img)
d.rectangle((0, H - 170, W, H), fill=BROWN)
cta_pill(d, img, 40, H - 145, 'রিপেয়ার স্লিপ দেখান', RED, CREAM)
d = ImageDraw.Draw(img)
pin(d, 640, H - 140, 28, OCHRE, BROWN); text(d, (682, H - 146), 'মোতালিব প্লাজা গলি', 'anekB', 30, CREAM)
phone_icon(d, 644, H - 86, 34, OCHRE); text(d, (682, H - 92), '০১৯৭২-৪৯৮৫৬১', 'anekB', 30, CREAM)
img.convert('RGB').save(os.path.join(OUT, 'SKC-D1-C-v3a-giant-type.jpg'), quality=90)

# ======================= v3b : appetite glow + floor =======================
bg = radial(W, H, ORANGE, DRED, W / 2, 560, 900)
img = bg.convert('RGBA'); d = ImageDraw.Draw(img)
floor_y = 980
fl = Image.linear_gradient('L').resize((W, H - floor_y)).point(lambda v: 255 - int(v * .25))
floor = Image.new('RGBA', (W, H - floor_y), (250, 244, 236, 255)); floor.putalpha(Image.new('L', floor.size, 255))
fade = Image.linear_gradient('L').resize((W, 120)).point(lambda v: v)
img.alpha_composite(Image.new('RGBA', (W, H - floor_y), (250, 244, 236, 255)), (0, floor_y))
blend = Image.new('RGBA', (W, 120), (250, 244, 236, 255)); blend.putalpha(fade); img.alpha_composite(blend, (0, floor_y - 120))
d = ImageDraw.Draw(img)
for i in range(0, W + 1, 90): d.line((W / 2 + (i - W / 2) * .35, floor_y, i, H), fill=(232, 222, 210), width=2)  # perspective grid
for k in range(1, 6): yy = floor_y + int((H - floor_y) * (k / 6) ** 1.6); d.line((0, yy, W, yy), fill=(232, 222, 210), width=2)
# headline: two-tone like R28 (dark brown on orange)
lg = logo_badge(84); img.alpha_composite(lg, (W / 2 - 42, 28) if False else (int(W / 2 - 42), 28))
d = ImageDraw.Draw(img)
text(d, (W / 2, 120), 'রিপেয়ারের ফাঁকে', 'galada', 64, CREAM, center=True)
h1 = text_layer('ওয়েটিং কম্বো', 'cond', 210, BROWN); h1 = h1.resize((W - 120, int(h1.height * (W - 120) / h1.width)), Image.LANCZOS)
img.alpha_composite(h1, (60, 210))
# heroes
cf = fit_w(coffee, 600); fr = fit_w(firni, 440)
cfx, cfy = 70, floor_y + 90 - cf.height
frx, fry = W - fr.width - 40, floor_y + 150 - fr.height
contact_shadow(img, cfx + cf.width * .48, floor_y + 80, cf.width * .95, 80, 170)
contact_shadow(img, frx + fr.width * .5, floor_y + 142, fr.width, 70, 170)
steam_on(img, steam, cfx + 90, cfy - 360, 420, 0.75)
img.alpha_composite(cf, (cfx, cfy)); reflection(img, cf, cfx, cfy + cf.height - 6, 45, .2)
img.alpha_composite(fr, (frx, fry)); reflection(img, fr, frx, fry + fr.height - 6, 45, .2)
pd = price_disc(118, RED, WHITE, angle=-10); img.alpha_composite(pd, (W - pd.width - 30, 470))
d = ImageDraw.Draw(img)
# bottom row R28: info | CTA | info
cw = int(tw('স্লিপ দেখান, বসে পড়ুন', 'anekB', 40)) + 150
cta_pill(d, img, int(W / 2 - cw / 2), H - 200, 'স্লিপ দেখান, বসে পড়ুন', ORANGE, WHITE, glow=(245, 124, 0, 170))
d = ImageDraw.Draw(img)
line = 'মোতালিব প্লাজা গলি, ৮ পরিবাগ   |   ০১৯৭২-৪৯৮৫৬১'
lw = tw(line, 'anekB', 28) + 40; lx = W / 2 - lw / 2
pin(d, lx, H - 80, 24, BROWN, (250, 244, 236)); text(d, (lx + 40, H - 86), line, 'anekB', 28, BROWN)
img.convert('RGB').save(os.path.join(OUT, 'SKC-D1-C-v3b-appetite-glow.jpg'), quality=90)
print('ok')
