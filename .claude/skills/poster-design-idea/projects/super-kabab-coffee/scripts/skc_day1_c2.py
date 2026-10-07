"""SKC Day 1, Design C v2: food-hero, minimal text (Joy: main food bold and
close, background properly arranged, little text).
Usage: python3 -I skc_day1_c2.py <assets_dir> <fonts_dir> <logo_path> <out_path>
"""
import sys, os, importlib.util
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageEnhance

A, FD, LOGO, OUT = sys.argv[1:5]
# reuse helpers from C v1 without running its composition
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'skc_day1_c.py')).read()
helpers = src.split('# ---------- compose ----------')[0]
ns = {'__name__': 'helpers'}; sys.argv = [sys.argv[0], A, FD, LOGO, OUT]
exec(compile(helpers, 'skc_day1_c_helpers', 'exec'), ns)
g = ns; W, H = g['W'], g['H']; BROWN, OCHRE, CREAM, RED, WHITE = g['BROWN'], g['OCHRE'], g['CREAM'], g['RED'], g['WHITE']
text, cover, cutout_white, paste_shadow, logo_badge, repair_slip = g['text'], g['cover'], g['cutout_white'], g['paste_shadow'], g['logo_badge'], g['repair_slip']

# background: real place, pushed back (blur + warm + vignette) so the food owns the frame
bg = cover(os.path.join(A, 'SKC-03-cafe-evening-bg.jpg'), W, H, focus=(0.45, 0.62))
bg = ImageEnhance.Brightness(bg.filter(ImageFilter.GaussianBlur(7))).enhance(0.82).convert('RGBA')
img = bg
vign = Image.new('L', (W, H), 0); vd = ImageDraw.Draw(vign)
for i in range(60):
    a = int(170 * (1 - i / 60) ** 2)
    vd.rectangle((0, i * 7, W, i * 7 + 7), fill=a)          # dark top band for type
vtop = Image.new('RGBA', (W, H), (20, 10, 6, 255)); vtop.putalpha(vign)
img.alpha_composite(vtop)
bot = Image.linear_gradient('L').resize((W, 260)).point(lambda v: int(v * .75))
vb = Image.new('RGBA', (W, 260), (20, 10, 6, 255)); vb.putalpha(bot)
img.alpha_composite(vb, (0, H - 260))

coffee = cutout_white(os.path.join(A, 'SKC-01-coffee-cup-STANDIN.jpg'))
firni = cutout_white(os.path.join(A, 'SKC-04-firni-clay-STANDIN.jpg'))
steam = Image.open(os.path.join(A, 'SKC-07-steam-black.jpg')).convert('RGB')

# HERO: oversized coffee (bleeds off left edge) + firni closer to camera
cf = coffee.resize((800, int(800 * coffee.height / coffee.width)), Image.LANCZOS)
fr = firni.resize((500, int(500 * firni.height / firni.width)), Image.LANCZOS)
st = steam.resize((520, int(520 * steam.height / steam.width)), Image.LANCZOS)
st = ImageEnhance.Brightness(st).enhance(0.8)
sx, sy = 120, 330
reg = img.crop((sx, sy, sx + st.width, sy + st.height)).convert('RGB')
img.paste(ImageChops.screen(reg, st).convert('RGBA'), (sx, sy))
paste_shadow(img, cf, (-90, 1180 - cf.height), blur=22, off=(14, 24), alpha=150)
paste_shadow(img, fr, (W - fr.width + 30, 1250 - fr.height), blur=22, off=(14, 24), alpha=150)

d = ImageDraw.Draw(img)
# brand (who) small, top-left
lg = logo_badge(92); img.alpha_composite(lg, (40, 36))
text(d, (148, 48), 'Super Kabab & Coffee', 'baloo', 40, WHITE, shadow=(0, 0, 0))
# one headline (why)
text(d, (44, 150), 'অপেক্ষা নয়,', 'anekB', 64, CREAM, shadow=(0, 0, 0))
text(d, (40, 212), 'টেবিল রেডি!', 'baloo', 132, OCHRE, shadow=(30, 12, 6))
# price seal (how much) on the firni side
cx, cy, r = W - 190, 560, 118
d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=RED)
d.ellipse((cx - r + 10, cy - r + 10, cx + r - 10, cy + r - 10), outline=CREAM, width=3)
text(d, (cx, cy - 70), 'কফি + ফিরনি', 'anekB', 28, CREAM, center=True)
text(d, (cx, cy - 34), '৳১৯৯', 'baloo', 68, WHITE, center=True)
# one-line action + where (bottom)
text(d, (W / 2, H - 92), 'রিপেয়ার স্লিপ দেখান · মোতালিব প্লাজা গলি · ০১৯৭২-৪৯৮৫৬১', 'anekB', 30, CREAM, center=True, shadow=(0, 0, 0))
img.convert('RGB').save(OUT, quality=90)
print('ok')
