"""Back-side grid diagram: print render + 12 x 6 module outlines + key alignment lines."""
import os, subprocess
import build as B
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
k = 400 / 72
base = os.path.join(HERE, "out", "_grid")
subprocess.run(["pdftoppm", "-r", "400", "-png", "-f", "2", "-l", "2", os.path.join(HERE, "out", "Dentex_Card_PrintReady_CMYK.pdf"), base], check=True)
im = Image.open(base + "-2.png").convert("RGBA"); os.remove(base + "-2.png")
im = im.crop((int(27*k), int(27*k), int(279*k), int(171*k)))
ov = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
for c in range(1, 13):
    for r in range(1, 7):
        x, y = B.col(c) * k, B.row(r) * k
        d.rectangle([x, y, x + 15*k, y + 15*k], fill=(15, 170, 172, 22), outline=(15, 170, 172, 110), width=2)
red = (226, 54, 74, 220)
for y in (B.row(1), B.row(6) + 15):
    d.line([(0, y*k), (im.width, y*k)], fill=red, width=3)
for x in (B.col(1), B.col(3), B.col(10)):
    d.line([(x*k, 0), (x*k, im.height)], fill=red, width=3)
im = Image.alpha_composite(im, ov)
pad = 110; W = im.width + 2*pad; H = im.height + 2*pad + 150
cv = Image.new("RGB", (W, H), (245, 246, 246))
sh = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh).rectangle([pad+6, pad+10, pad+im.width+6, pad+im.height+10], fill=(0, 0, 0, 40))
from PIL import ImageFilter
cv.paste(sh.filter(ImageFilter.GaussianBlur(14)), (0, 0), sh.filter(ImageFilter.GaussianBlur(14)))
cv.paste(im, (pad, pad))
dr = ImageDraw.Draw(cv)
f = ImageFont.truetype(os.path.join(HERE, "fonts/Poppins-SemiBold.ttf"), 34)
fs = ImageFont.truetype(os.path.join(HERE, "fonts/Poppins-Regular.ttf"), 26)
y0 = im.height + pad + 34
dr.text((pad, y0), "Back: modular grid, 12 × 6 square modules (15 pt), 4 pt gutters, margins 14 / 17 pt", font=f, fill=(40, 40, 40))
dr.text((pad, y0 + 52), "Red lines: name cap-top = logo top  ·  last baseline = QR bottom", font=fs, fill=(90, 90, 90))
dr.text((pad, y0 + 88), "Labels on column 1  ·  values on column 3  ·  logo + QR on columns 10–12", font=fs, fill=(90, 90, 90))
out = os.path.join(HERE, "out", "mockups", "Dentex_Back_Grid.png"); cv.save(out); print(out, cv.size)
