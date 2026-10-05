"""Presentation mockups for the Dentex card (Option B), rendered from the print PDF."""
import os, subprocess, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out", "mockups")
os.makedirs(OUT, exist_ok=True)
DPI = 600
TRIM = (27, 27, 279, 171)  # pt, on the PDF page (see build.py)


def card_images():
    pdf = os.path.join(HERE, "out", "Dentex_Card_PrintReady_CMYK.pdf")
    base = os.path.join(OUT, "_card")
    subprocess.run(["pdftoppm", "-r", str(DPI), "-png", pdf, base], check=True)
    k = DPI / 72
    box = tuple(int(round(v * k)) for v in TRIM)
    imgs = []
    for i in (1, 2):
        p = f"{base}-{i}.png"
        imgs.append(Image.open(p).convert("RGBA").crop(box)); os.remove(p)
    return imgs  # front, back  (2100 x 1200)


FRONT, BACK = card_images()
CW, CH = FRONT.size


# ---------------------------------------------------------------- helpers
def persp_coeffs(dst, src):
    """Coefficients mapping output (dst) points -> input (src) points for Image.PERSPECTIVE."""
    A, b = [], []
    for (x, y), (u, v) in zip(dst, src):
        A += [[x, y, 1, 0, 0, 0, -u * x, -u * y], [0, 0, 0, x, y, 1, -v * x, -v * y]]
        b += [u, v]
    return np.linalg.solve(np.array(A, float), np.array(b, float)).tolist()


def warp(img, quad, size):
    """Place img onto the canvas so its corners land on quad (TL, TR, BR, BL)."""
    w, h = img.size
    src = [(0, 0), (w, 0), (w, h), (0, h)]
    return img.transform(size, Image.PERSPECTIVE, persp_coeffs(quad, src), Image.BICUBIC)


def poly_mask(size, quad, blur=0):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).polygon([tuple(p) for p in quad], fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur)) if blur else m


def shadow(canvas, quad, offset=(0, 0), blur=30, opacity=0.35, color=(0, 0, 0)):
    q = [(x + offset[0], y + offset[1]) for x, y in quad]
    m = poly_mask(canvas.size, q, blur).point(lambda v: int(v * opacity))
    layer = Image.new("RGBA", canvas.size, color + (0,)); layer.putalpha(m)
    canvas.alpha_composite(layer)


def sheen(canvas, quad, strength=0.10, angle=-35):
    """Soft diagonal light across a card face."""
    W, H = canvas.size
    xs = np.linspace(-1, 1, W)[None, :]; ys = np.linspace(-1, 1, H)[:, None]
    a = math.radians(angle)
    g = (xs * math.cos(a) + ys * math.sin(a))
    g = ((g - g.min()) / (g.max() - g.min()))
    alpha = (np.clip(1 - g * 1.6, 0, 1) * 255 * strength).astype("uint8")
    m = Image.fromarray(alpha, "L")
    m = Image.composite(m, Image.new("L", canvas.size, 0), poly_mask(canvas.size, quad))
    layer = Image.new("RGBA", canvas.size, (255, 255, 255, 0)); layer.putalpha(m)
    canvas.alpha_composite(layer)


def place(canvas, img, quad, light=0.10, angle=-35):
    canvas.alpha_composite(warp(img, quad, canvas.size))
    if light: sheen(canvas, quad, light, angle)


def gradient_bg(size, top, bottom, radial=None):
    W, H = size
    t = np.linspace(0, 1, H)[:, None, None]
    arr = (np.array(top)[None, None, :] * (1 - t) + np.array(bottom)[None, None, :] * t)
    arr = np.repeat(arr, W, axis=1)
    if radial:  # (cx, cy, radius, rgb, amount)
        cx, cy, r, col, amt = radial
        yy, xx = np.mgrid[0:H, 0:W]
        d = np.clip(1 - np.hypot(xx - cx, yy - cy) / r, 0, 1)[..., None] ** 1.6 * amt
        arr = arr * (1 - d) + np.array(col)[None, None, :] * d
    return Image.fromarray(arr.clip(0, 255).astype("uint8"), "RGB").convert("RGBA")


def noise(canvas, amount=4, seed=1):
    rng = np.random.default_rng(seed)
    a = np.asarray(canvas).astype(int)
    n = rng.integers(-amount, amount + 1, a.shape[:2])[..., None]
    a[..., :3] = np.clip(a[..., :3] + n, 0, 255)
    return Image.fromarray(a.astype("uint8"), "RGBA")


def rect_quad(cx, cy, w, h, deg):
    a = math.radians(deg); ca, sa = math.cos(a), math.sin(a)
    pts = [(-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)]
    return [(cx + x * ca - y * sa, cy + x * sa + y * ca) for x, y in pts]


# ---------------------------------------------------------------- 1. flat lay
def flat_lay():
    S = (2400, 1600)
    cv = gradient_bg(S, (244, 242, 238), (226, 223, 217), radial=(700, 380, 1500, (252, 251, 248), 0.8))
    cv = noise(cv, 3)
    w, h = 1000, 1000 * CH / CW
    qb = rect_quad(1650, 1100, w, h, 6)     # back card underneath
    qf = rect_quad(720, 480, w, h, -8)     # front card on top
    for q in (qb, qf):
        shadow(cv, q, (24, 40), 46, 0.30)
        shadow(cv, q, (4, 6), 6, 0.25)
        place(cv, BACK if q is qb else FRONT, q, 0.08)
    return cv


# ---------------------------------------------------------------- 2. isometric stacks
def iso_quad(ox, oy, w, h, ang=30):
    a = math.radians(ang)
    u = (math.cos(a) * w, -math.sin(a) * w)       # along card width (up-right)
    v = (math.cos(a) * h, math.sin(a) * h)        # along card height (down-right)
    tl = (ox, oy); tr = (ox + u[0], oy + u[1])
    br = (tr[0] + v[0], tr[1] + v[1]); bl = (ox + v[0], oy + v[1])
    return [tl, tr, br, bl]


def stack(cv, img, ox, oy, w, h, n, edge, edge_dark, t=3.2):
    base = iso_quad(ox, oy, w, h)
    lift = n * t
    top = [(x, y - lift) for x, y in base]
    shadow(cv, base, (30, 34), 40, 0.28)
    shadow(cv, base, (3, 4), 5, 0.30)
    # side faces (front-left: BL->BR, right: TR->BR), with sheet lines
    d = ImageDraw.Draw(cv)
    tl, tr, br, bl = base
    for face, col in (((bl, br), edge), ((br, tr), edge_dark)):
        a, b = face
        poly = [(a[0], a[1]), (b[0], b[1]), (b[0], b[1] - lift), (a[0], a[1] - lift)]
        d.polygon(poly, fill=col)
        for i in range(1, n):
            yy = i * t
            d.line([(a[0], a[1] - yy), (b[0], b[1] - yy)], fill=tuple(max(0, c - 18) for c in col[:3]) + (255,), width=1)
    place(cv, img, top, 0.10, angle=-60)
    return top


def iso_stacks():
    S = (2400, 1600)
    cv = gradient_bg(S, (236, 238, 239), (214, 218, 220), radial=(1200, 600, 1500, (246, 247, 248), 0.7))
    cv = noise(cv, 2)
    w, h = 700, 700 * CH / CW
    teal_edge, teal_dark = (10, 140, 143, 255), (6, 104, 108, 255)
    paper, paper_dark = (238, 238, 236, 255), (214, 214, 211, 255)
    a = math.radians(30)
    u = (math.cos(a) * w * 1.08, -math.sin(a) * w * 1.08)
    v = (math.cos(a) * h * 1.18, math.sin(a) * h * 1.18)
    o = (190, 840)
    at = lambda i, j: (o[0] + u[0] * i + v[0] * j, o[1] + u[1] * i + v[1] * j)
    stacks = [((1, 0), FRONT, 22, teal_edge, teal_dark), ((1, 1), BACK, 16, paper, paper_dark),
              ((0, 0), BACK, 10, paper, paper_dark), ((0, 1), FRONT, 5, teal_edge, teal_dark)]
    for (i, j), img, n, e1, e2 in sorted(stacks, key=lambda s_: at(*s_[0])[1]):  # far (higher) first
        stack(cv, img, *at(i, j), w, h, n, e1, e2)
    return cv


# ---------------------------------------------------------------- 3. dark premium
def dark_premium():
    S = (2400, 1600)
    cv = gradient_bg(S, (16, 46, 48), (6, 22, 24), radial=(1500, 500, 1300, (24, 86, 88), 0.55))
    cv = noise(cv, 3, seed=7)
    # back card lying flat, slightly perspective
    def tilt(cx, cy, w, h, deg, k=0.08):
        q = rect_quad(cx, cy, w, h, deg)
        # simple perspective: shrink the far (top) edge a little
        (x0, y0), (x1, y1), (x2, y2), (x3, y3) = q
        mx, my = (x0 + x1) / 2, (y0 + y1) / 2
        q[0] = (x0 + (mx - x0) * k, y0 + (my - y0) * k)
        q[1] = (x1 + (mx - x1) * k, y1 + (my - y1) * k)
        return q
    w, h = 1000, 1000 * CH / CW
    qb = tilt(1650, 1100, w, h, 8)
    qf = tilt(720, 480, w, h, -10)
    for q, img in ((qb, BACK), (qf, FRONT)):
        shadow(cv, q, (40, 60), 70, 0.55)
        shadow(cv, q, (6, 10), 10, 0.45)
        place(cv, img, q, 0.12)
    return cv


if __name__ == "__main__":
    for name, fn in (("Mockup_1_FlatLay", flat_lay), ("Mockup_2_IsometricStacks", iso_stacks), ("Mockup_3_DarkPremium", dark_premium)):
        img = fn().convert("RGB")
        p = os.path.join(OUT, f"Dentex_{name}.jpg")
        img.save(p, quality=92)
        print(p)
