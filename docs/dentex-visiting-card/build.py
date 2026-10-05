"""Dentex visiting card — single source of truth for layout.

Generates:
  out/Dentex_Card_PrintReady_CMYK.pdf  (2 pages, 3.5x2in trim, 0.125in bleed, crop marks, live text)
  out/Dentex_Card_Front.svg / _Back.svg (bleed size, editable in Illustrator)
  (design B = reference layout, the chosen one; design A = first concept in out/option-A/)
Units: points. Coordinates are TRIM coords, origin top-left, y down.
"""
import json, re, os, base64
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas as rl
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import CMYKColor

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")
os.makedirs(OUT, exist_ok=True)
for w in ["Regular", "Medium", "SemiBold", "Bold"]:
    pdfmetrics.registerFont(TTFont("Poppins-" + w, os.path.join(HERE, "fonts", f"Poppins-{w}.ttf")))

TW, TH, BLEED, SLUG = 252, 144, 9, 18  # 3.5x2in, 0.125in bleed
M = BLEED + SLUG                       # trim offset on the PDF page

# name: (hex for screen/Figma, CMYK % for print)
COLORS = {
    "teal":      ("#0FAAAC", (80, 5, 35, 0)),    # Dentex brand teal (logo file)
    "tealDark":  ("#0B8184", (85, 28, 45, 8)),   # small text / icons on white
    "tealTint":  ("#21B0B2", (74, 4.5, 32.5, 0)),# watermark on teal (teal + 7% white)
    "ink":       ("#333333", (0, 0, 0, 90)),
    "grey":      ("#555555", (0, 0, 0, 72)),
    "line":      ("#B3B3B3", (0, 0, 0, 30)),
    "white":     ("#FFFFFF", (0, 0, 0, 0)),
    "tealDeep":  ("#077A80", (92, 35, 48, 18)),  # gradient end (design B)
    "mist":      ("#F3F9F9", (4, 0, 1.5, 0)),      # soft shape on white (design B)
    "qr":        ("#1D1D1B", (0, 0, 0, 100)),     # QR modules, max contrast
    "mistLine":  ("#E3F1F1", (9, 0, 3.5, 0)),     # watermark on mist (design B)
}

# Dentex tooth mark, traced from the logo (circle removed). Stroke-based, unit box 430 x 468.
TOOTH_W, TOOTH_H, TOOTH_STROKE = 430, 468, 30
TOOTH_PATHS = [
    "M30 463 L3 143 C-3 58 25 0 100 0 L345 0 C405 0 430 38 425 98 L380 463",
    "M380 463 C345 448 315 388 255 318 L135 158 C100 113 55 93 10 108",
    "M225 278 C195 350 115 410 30 463",
]

ICONS = {  # 24x24 boxes, filled unless noted
    "phone": "M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z",
    "mail": "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
}


def text_w(s, font, size, ls=0):
    return pdfmetrics.stringWidth(s, font, size) + ls * (len(s) - 1)


def tooth(x, y, h, color, name):
    s = h / TOOTH_H
    return {"t": "tooth", "x": x, "y": y, "s": s, "w": TOOTH_W * s, "h": h, "color": color,
            "stroke": TOOTH_STROKE * s, "name": name}


def text(s, x, y, font, size, color, name, ls=0, align="left"):
    """y = baseline."""
    w = text_w(s, font, size, ls)
    if align == "center":
        x = x - w / 2
    return {"t": "text", "s": s, "x": x, "y": y, "font": font, "size": size, "color": color,
            "ls": ls, "w": w, "name": name}


QR_URL = "https://share.google/ibaEdEEhdLPOn5D4g"  # decoded from the old card's QR
QR_MATRIX = json.load(open(os.path.join(HERE, "assets", "qr_matrix.json")))
EMBLEM_PNG = os.path.join(HERE, "assets", "govt_emblem.png")        # RGBA, for SVG/Figma
EMBLEM_CMYK = os.path.join(HERE, "assets", "govt_emblem_cmyk.jpg")  # CMYK, for the print PDF


def emblem(cx, cy, r, name="Govt of Bangladesh logo"):
    return {"t": "image", "x": cx - r, "y": cy - r, "w": 2 * r, "h": 2 * r, "circle": True, "name": name}


def qr(x, y, size, name="QR code"):
    return {"t": "qr", "x": x, "y": y, "size": size, "fill": "qr", "name": name}


def qr_runs(e):
    """Dark modules merged into horizontal runs -> list of (x, y, w, h) in trim coords."""
    n = len(QR_MATRIX); m = e["size"] / n; out = []
    for r, row in enumerate(QR_MATRIX):
        c = 0
        while c < n:
            if row[c]:
                s0 = c
                while c < n and row[c]: c += 1
                out.append((e["x"] + s0 * m, e["y"] + r * m, (c - s0) * m, m))
            else:
                c += 1
    return out


# ---------------------------------------------------------------- FRONT
front = [
    {"t": "rect", "x": -BLEED, "y": -BLEED, "w": TW + 2 * BLEED, "h": TH + 2 * BLEED, "fill": "teal", "name": "BG Teal (full bleed)"},
    tooth(188, -22, 186, "tealTint", "Watermark tooth"),
]
lock_h = 42
front.append(tooth(TW / 2 - TOOTH_W * lock_h / TOOTH_H / 2, 34, lock_h, "white", "Logo mark"))
front.append(text("DENTEX", TW / 2, 96, "Poppins-Bold", 14, "white", "Wordmark", ls=3, align="center"))
front.append(text("Dentistry Done Differently", TW / 2, 109, "Poppins-Regular", 8, "white", "Tagline", ls=0.4, align="center"))
front.append({"t": "rect", "x": TW / 2 - 9, "y": 119, "w": 18, "h": 0.75, "fill": "white", "name": "Accent rule"})

# ---------------------------------------------------------------- BACK
X0 = 14
PANEL = "M196 -9 C180 36 194 100 184 153 L261 153 L261 -9 Z"
PCX = 215.5  # panel content centre
back = [
    {"t": "rect", "x": -BLEED, "y": -BLEED, "w": TW + 2 * BLEED, "h": TH + 2 * BLEED, "fill": "white", "name": "BG White (full bleed)"},
    {"t": "path", "d": PANEL, "fill": "teal", "name": "Teal panel (curved)"},
    # mini logo lockup
    tooth(X0, 14, 18, "teal", "Logo mark small"),
    text("DENTEX", X0 + 16.5 + 5.5, 26.6, "Poppins-Bold", 10, "ink", "Wordmark small", ls=1.6),
    # doctor
    text("Dr. Anjuman Ara Muna", X0, 52, "Poppins-SemiBold", 14, "ink", "Name"),
    text("BDS, BCS, DDS, FCPS", X0, 63.5, "Poppins-Medium", 8, "grey", "Degrees"),
    text("Orthodontics & Dentofacial Orthopedics", X0, 73.5, "Poppins-Regular", 8, "grey", "Speciality"),
    text("Assistant Professor", X0, 87, "Poppins-SemiBold", 9, "tealDark", "Designation"),
    text("Dhaka Dental College Hospital", X0, 97.5, "Poppins-Regular", 8, "grey", "Institution"),
    {"t": "rect", "x": X0, "y": 104.5, "w": 22, "h": 1.2, "fill": "teal", "name": "Accent rule"},
    # contacts
    {"t": "icon", "k": "phone", "x": X0 - 0.5, "y": 110.6, "size": 8, "fill": "tealDark", "name": "Icon phone"},
    text("01733-682188", X0 + 11, 117, "Poppins-Regular", 8, "ink", "Phone"),
    {"t": "icon", "k": "globe", "x": 86, "y": 110.6, "size": 8, "fill": "tealDark", "name": "Icon web"},
    text("www.dentex.cc", 97, 117, "Poppins-Regular", 8, "ink", "Website"),
    {"t": "icon", "k": "mail", "x": X0 - 0.5, "y": 122.6, "size": 8, "fill": "tealDark", "name": "Icon email"},
    text("dentex6037@gmail.com", X0 + 11, 129, "Poppins-Regular", 8, "ink", "Email"),
    # placeholders in panel
    {"t": "circle", "cx": PCX, "cy": 37, "r": 16, "fill": "white", "name": "Govt logo backing"},
    emblem(PCX, 37, 14),
    {"t": "rect", "x": PCX - 25, "y": 60, "w": 50, "h": 50, "r": 4, "fill": "white", "name": "QR backing"},
    qr(PCX - 22, 63, 44),
    text("SCAN ME", PCX, 123, "Poppins-Medium", 8, "white", "QR label", ls=1.2, align="center"),
]

SIDES_A = {"Front": front, "Back": back}

# ============================================================ DESIGN B
# Layout after the client's reference: gradient brand side with soft circles
# and the doctor's name; clean white info side with a big faint logo watermark.
CX = TW / 2
mark_h = 26
front_b = [
    {"t": "grad_rect", "x": -BLEED, "y": -BLEED, "w": TW + 2 * BLEED, "h": TH + 2 * BLEED,
     "c0": "teal", "c1": "tealDeep", "p0": (-BLEED, -BLEED), "p1": (TW + BLEED, TH + BLEED), "name": "BG Teal gradient (full bleed)"},
    {"t": "circle", "cx": 262, "cy": 18, "r": 128, "fill": "white", "alpha": 0.07, "name": "Soft circle large"},
    {"t": "circle", "cx": 262, "cy": 18, "r": 84, "fill": "white", "alpha": 0.06, "name": "Soft circle small"},
    {"t": "circle", "cx": -6, "cy": 150, "r": 62, "fill": "white", "alpha": 0.05, "name": "Soft circle corner"},
    tooth(CX - TOOTH_W * mark_h / TOOTH_H / 2, 21, mark_h, "white", "Logo mark"),
    text("DENTEX", CX, 59, "Poppins-Bold", 8, "white", "Wordmark", ls=2.5, align="center"),
    text("DR. ANJUMAN ARA MUNA", CX, 83, "Poppins-Bold", 14, "white", "Name", ls=0.2, align="center"),
    text("BDS, BCS, DDS, FCPS", CX, 96, "Poppins-Medium", 8, "white", "Degrees", align="center"),
    text("Orthodontics & Dentofacial Orthopedics", CX, 106, "Poppins-Regular", 8, "white", "Speciality", align="center"),
    text("Assistant Professor, Dhaka Dental College Hospital", CX, 116, "Poppins-Regular", 8, "white", "Designation", align="center"),
]

QX, QY = 192, 74  # QR backing top-left
back_b = [
    {"t": "rect", "x": -BLEED, "y": -BLEED, "w": TW + 2 * BLEED, "h": TH + 2 * BLEED, "fill": "white", "name": "BG White (full bleed)"},
    {"t": "circle", "cx": 302, "cy": 80, "r": 100, "fill": "mist", "name": "Soft shape"},
    tooth(203, -4, 168, "mistLine", "Watermark tooth"),
    text("DR. ANJUMAN ARA MUNA", X0, 30, "Poppins-Bold", 14, "tealDark", "Name", ls=0.2),
    text("BDS, BCS, DDS, FCPS", X0, 42, "Poppins-Medium", 8, "grey", "Degrees"),
    text("Orthodontics & Dentofacial Orthopedics", X0, 52, "Poppins-Regular", 8, "grey", "Speciality"),
    text("Assistant Professor", X0, 65, "Poppins-SemiBold", 9, "ink", "Designation"),
    text("Dhaka Dental College Hospital", X0, 75, "Poppins-Regular", 8, "grey", "Institution"),
    {"t": "rect", "x": X0, "y": 83, "w": 132, "h": 0.75, "fill": "teal", "name": "Teal rule"},
    {"t": "icon", "k": "phone", "x": X0 - 0.5, "y": 90.6, "size": 8, "fill": "tealDark", "name": "Icon phone"},
    text("01733-682188", X0 + 11, 97, "Poppins-Regular", 8, "ink", "Phone"),
    {"t": "icon", "k": "mail", "x": X0 - 0.5, "y": 102.6, "size": 8, "fill": "tealDark", "name": "Icon email"},
    text("dentex6037@gmail.com", X0 + 11, 109, "Poppins-Regular", 8, "ink", "Email"),
    {"t": "icon", "k": "globe", "x": X0 - 0.5, "y": 114.6, "size": 8, "fill": "tealDark", "name": "Icon web"},
    text("www.dentex.cc", X0 + 11, 121, "Poppins-Regular", 8, "ink", "Website"),
    {"t": "circle", "cx": 225, "cy": 32, "r": 16, "fill": "white", "name": "Govt logo backing"},
    emblem(225, 32, 14),
    {"t": "rect", "x": QX, "y": QY, "w": 50, "h": 50, "r": 4, "fill": "white", "name": "QR backing"},
    qr(QX + 3, QY + 3, 44),
]
SIDES_B = {"Front": front_b, "Back": back_b}
VARIANTS = {"A": SIDES_A, "B": SIDES_B}
SIDES = SIDES_B

# ------------------------------------------------------------ path utils
TOK = re.compile(r"[MmLlHhVvCcSsZz]|-?\d*\.?\d+(?:e-?\d+)?")


def parse_path(d):
    """-> list of absolute ops: ('M',x,y) ('L',x,y) ('C',x1,y1,x2,y2,x,y) ('Z',)"""
    toks = TOK.findall(d)
    i, cmd, ops = 0, None, []
    cx = cy = sx = sy = 0
    lc = None  # last cubic ctrl2
    while i < len(toks):
        if re.match(r"[A-Za-z]", toks[i]):
            cmd = toks[i]; i += 1
            if cmd in "Zz":
                ops.append(("Z",)); cx, cy = sx, sy; lc = None
                continue
        n = lambda k: float(toks[i + k])
        rel = cmd.islower(); C = cmd.upper()
        ox, oy = (cx, cy) if rel else (0, 0)
        if C == "M":
            cx, cy = ox + n(0), oy + n(1); sx, sy = cx, cy; ops.append(("M", cx, cy)); i += 2
            cmd = "l" if rel else "L"; lc = None
        elif C == "L":
            cx, cy = ox + n(0), oy + n(1); ops.append(("L", cx, cy)); i += 2; lc = None
        elif C == "H":
            cx = (cx if rel else 0) + n(0); ops.append(("L", cx, cy)); i += 1; lc = None
        elif C == "V":
            cy = (cy if rel else 0) + n(0); ops.append(("L", cx, cy)); i += 1; lc = None
        elif C == "C":
            x1, y1, x2, y2, x, y = ox + n(0), oy + n(1), ox + n(2), oy + n(3), ox + n(4), oy + n(5)
            ops.append(("C", x1, y1, x2, y2, x, y)); cx, cy, lc = x, y, (x2, y2); i += 6
        elif C == "S":
            x1, y1 = (2 * cx - lc[0], 2 * cy - lc[1]) if lc else (cx, cy)
            x2, y2, x, y = ox + n(0), oy + n(1), ox + n(2), oy + n(3)
            ops.append(("C", x1, y1, x2, y2, x, y)); cx, cy, lc = x, y, (x2, y2); i += 4
    return ops


def ops_to_d(ops, s=1, dx=0, dy=0):
    f = lambda v: f"{v:.3f}".rstrip("0").rstrip(".")
    out = []
    for o in ops:
        if o[0] == "Z":
            out.append("Z")
        else:
            pts = o[1:]
            out.append(o[0] + " " + " ".join(f(pts[k] * s + (dx if k % 2 == 0 else dy)) for k in range(len(pts))))
    return " ".join(out)


# globe drawn as primitives (filled circle + white meridian/equator)
def icon_shapes(k, x, y, size, fill):
    s = size / 24
    if k == "globe":
        return [("circle", x + 12 * s, y + 12 * s, 10 * s, fill),
                ("ellipse_stroke", x + 12 * s, y + 12 * s, 4.2 * s, 10 * s, "white", 1.6 * s),
                ("line_stroke", x + 2 * s, y + 12 * s, x + 22 * s, y + 12 * s, "white", 1.6 * s)]
    return [("path", ops_to_d(parse_path(ICONS[k]), s, x, y), fill)]


# ------------------------------------------------------------ PDF backend
def cmyk(name):
    c, m, y, k = COLORS[name][1]
    return CMYKColor(c / 100, m / 100, y / 100, k / 100, spotName=None)


def pdf_path(c, ops, s=1, dx=0, dy=0):
    p = c.beginPath()
    for o in ops:
        if o[0] == "M": p.moveTo(o[1] * s + dx, o[2] * s + dy)
        elif o[0] == "L": p.lineTo(o[1] * s + dx, o[2] * s + dy)
        elif o[0] == "C": p.curveTo(*[o[k] * s + (dx if k % 2 else dy) for k in range(1, 7)])
        elif o[0] == "Z": p.close()
    return p


def draw_pdf_side(c, items):
    PW, PH = TW + 2 * M, TH + 2 * M
    c.saveState()
    c.translate(M, PH - M); c.scale(1, -1)  # trim coords, y down
    clip = c.beginPath(); clip.rect(-BLEED, -BLEED, TW + 2 * BLEED, TH + 2 * BLEED)
    c.clipPath(clip, stroke=0, fill=0)  # nothing prints past the bleed edge
    for e in items:
        t = e["t"]
        if t == "rect":
            c.setFillColor(cmyk(e["fill"]))
            if e.get("r"): c.roundRect(e["x"], e["y"], e["w"], e["h"], e["r"], stroke=0, fill=1)
            else: c.rect(e["x"], e["y"], e["w"], e["h"], stroke=0, fill=1)
        elif t == "path":
            c.setFillColor(cmyk(e["fill"])); c.drawPath(pdf_path(c, parse_path(e["d"])), stroke=0, fill=1)
        elif t == "circle":
            c.saveState(); c.setFillColor(cmyk(e["fill"]))
            if e.get("alpha") is not None: c.setFillAlpha(e["alpha"])
            c.circle(e["cx"], e["cy"], e["r"], stroke=0, fill=1); c.restoreState()
        elif t == "grad_rect":
            c.saveState()
            p = c.beginPath(); p.rect(e["x"], e["y"], e["w"], e["h"]); c.clipPath(p, stroke=0, fill=0)
            c.linearGradient(*e["p0"], *e["p1"], (cmyk(e["c0"]), cmyk(e["c1"])), extend=True)
            c.restoreState()
        elif t == "tooth":
            c.setStrokeColor(cmyk(e["color"])); c.setLineWidth(e["stroke"]); c.setLineCap(1); c.setLineJoin(1)
            for d in TOOTH_PATHS:
                c.drawPath(pdf_path(c, parse_path(d), e["s"], e["x"], e["y"]), stroke=1, fill=0)
        elif t == "icon":
            for sh in icon_shapes(e["k"], e["x"], e["y"], e["size"], e["fill"]):
                if sh[0] == "path":
                    c.setFillColor(cmyk(sh[2])); c.drawPath(pdf_path(c, parse_path(sh[1])), stroke=0, fill=1, fillMode=0)
                elif sh[0] == "circle":
                    c.setFillColor(cmyk(sh[4])); c.circle(sh[1], sh[2], sh[3], stroke=0, fill=1)
                elif sh[0] == "ellipse_stroke":
                    c.setStrokeColor(cmyk(sh[5])); c.setLineWidth(sh[6])
                    c.ellipse(sh[1] - sh[3], sh[2] - sh[4], sh[1] + sh[3], sh[2] + sh[4], stroke=1, fill=0)
                elif sh[0] == "line_stroke":
                    c.setStrokeColor(cmyk(sh[5])); c.setLineWidth(sh[6]); c.line(*sh[1:5])
        elif t == "qr":
            c.setFillColor(cmyk(e["fill"]))
            for (x, y, w, h) in qr_runs(e):
                c.rect(x, y, w + 0.01, h + 0.01, stroke=0, fill=1)  # hairline overlap, no seams
        elif t == "image":
            c.saveState()
            if e.get("circle"):
                p = c.beginPath(); p.circle(e["x"] + e["w"] / 2, e["y"] + e["h"] / 2, e["w"] / 2)
                c.clipPath(p, stroke=0, fill=0)
            c.translate(e["x"], e["y"] + e["h"]); c.scale(1, -1)
            c.drawImage(ImageReader(EMBLEM_CMYK), 0, 0, e["w"], e["h"])
            c.restoreState()
        elif t in ("ph_rect", "ph_circle"):
            c.setStrokeColor(cmyk("line")); c.setLineWidth(0.5); c.setDash(2, 1.5)
            if t == "ph_rect":
                x, y, w, h = e["x"], e["y"], e["w"], e["h"]
                c.rect(x, y, w, h, stroke=1, fill=0); c.line(x, y, x + w, y + h); c.line(x + w, y, x, y + h)
            else:
                c.circle(e["cx"], e["cy"], e["r"], stroke=1, fill=0)
                d = e["r"] * 0.7071
                c.line(e["cx"] - d, e["cy"] - d, e["cx"] + d, e["cy"] + d); c.line(e["cx"] + d, e["cy"] - d, e["cx"] - d, e["cy"] + d)
            c.setDash()
        elif t == "text":
            c.saveState(); c.translate(e["x"], e["y"]); c.scale(1, -1)
            to = c.beginText(); to.setTextOrigin(0, 0); to.setFont(e["font"], e["size"])
            to.setCharSpace(e["ls"]); to.setFillColor(cmyk(e["color"])); to.textOut(e["s"])
            c.drawText(to); c.restoreState()
    c.restoreState()


def crop_marks(c):
    PW, PH = TW + 2 * M, TH + 2 * M
    reg = CMYKColor(1, 1, 1, 1)
    c.setStrokeColor(reg); c.setLineWidth(0.25)
    for x in (M, M + TW):
        c.line(x, 0, x, SLUG - 3); c.line(x, PH - SLUG + 3, x, PH)
    for y in (M, M + TH):
        c.line(0, y, SLUG - 3, y); c.line(PW - SLUG + 3, y, PW, y)


def build_pdf(sides=None, out=OUT):
    sides = sides or SIDES
    PW, PH = TW + 2 * M, TH + 2 * M
    path = os.path.join(out, "Dentex_Card_PrintReady_CMYK.pdf")
    c = rl.Canvas(path, pagesize=(PW, PH))
    c.setTitle("Dentex Visiting Card - Dr. Anjuman Ara Muna"); c.setAuthor("Dentex")
    for side, items in sides.items():
        c.setTrimBox((M, M, M + TW, M + TH))
        c.setBleedBox((M - BLEED, M - BLEED, M + TW + BLEED, M + TH + BLEED))
        draw_pdf_side(c, items)
        crop_marks(c)
        c.setFillColor(CMYKColor(0, 0, 0, 1)); c.setFont("Poppins-Regular", 5)
        c.drawString(M + 6, 6, f"DENTEX visiting card - {side} - trim 3.5x2in, bleed 0.125in, CMYK")
        c.showPage()
    c.save()
    return path


# ------------------------------------------------------------ SVG backend
def svg_side(name, items, out=OUT):
    W, H = TW + 2 * BLEED, TH + 2 * BLEED
    hexc = lambda n: COLORS[n][0]
    fam = {"Poppins-Regular": ("Poppins", 400), "Poppins-Medium": ("Poppins", 500),
           "Poppins-SemiBold": ("Poppins", 600), "Poppins-Bold": ("Poppins", 700)}
    L = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}pt" height="{H}pt" viewBox="{-BLEED} {-BLEED} {W} {H}">',
         f'<title>Dentex visiting card - {name} (3.5x2in trim + 0.125in bleed)</title>',
         f'<defs><clipPath id="bleed"><rect x="{-BLEED}" y="{-BLEED}" width="{W}" height="{H}"/></clipPath></defs>',
         '<g clip-path="url(#bleed)">']
    for e in items:
        t, nm = e["t"], e.get("name", "")
        if t == "rect":
            L.append(f'<rect id="{nm}" x="{e["x"]}" y="{e["y"]}" width="{e["w"]}" height="{e["h"]}" rx="{e.get("r", 0)}" fill="{hexc(e["fill"])}"/>')
        elif t == "path":
            L.append(f'<path id="{nm}" d="{e["d"]}" fill="{hexc(e["fill"])}"/>')
        elif t == "circle":
            op = f' fill-opacity="{e["alpha"]}"' if e.get("alpha") is not None else ""
            L.append(f'<circle id="{nm}" cx="{e["cx"]}" cy="{e["cy"]}" r="{e["r"]}" fill="{hexc(e["fill"])}"{op}/>')
        elif t == "grad_rect":
            gid = "g" + str(abs(hash(nm)) % 10000)
            (x0, y0), (x1, y1) = e["p0"], e["p1"]
            L.append(f'<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="{x0}" y1="{y0}" x2="{x1}" y2="{y1}"><stop offset="0" stop-color="{hexc(e["c0"])}"/><stop offset="1" stop-color="{hexc(e["c1"])}"/></linearGradient>')
            L.append(f'<rect id="{nm}" x="{e["x"]}" y="{e["y"]}" width="{e["w"]}" height="{e["h"]}" fill="url(#{gid})"/>')
        elif t == "tooth":
            L.append(f'<g id="{nm}" fill="none" stroke="{hexc(e["color"])}" stroke-width="{e["stroke"]:.3f}" stroke-linecap="round" stroke-linejoin="round">')
            for d in TOOTH_PATHS:
                L.append(f'<path d="{ops_to_d(parse_path(d), e["s"], e["x"], e["y"])}"/>')
            L.append("</g>")
        elif t == "icon":
            L.append(f'<g id="{nm}">')
            for sh in icon_shapes(e["k"], e["x"], e["y"], e["size"], e["fill"]):
                if sh[0] == "path": L.append(f'<path d="{sh[1]}" fill="{hexc(sh[2])}"/>')
                elif sh[0] == "circle": L.append(f'<circle cx="{sh[1]:.3f}" cy="{sh[2]:.3f}" r="{sh[3]:.3f}" fill="{hexc(sh[4])}"/>')
                elif sh[0] == "ellipse_stroke": L.append(f'<ellipse cx="{sh[1]:.3f}" cy="{sh[2]:.3f}" rx="{sh[3]:.3f}" ry="{sh[4]:.3f}" fill="none" stroke="{hexc(sh[5])}" stroke-width="{sh[6]:.3f}"/>')
                elif sh[0] == "line_stroke": L.append(f'<line x1="{sh[1]:.3f}" y1="{sh[2]:.3f}" x2="{sh[3]:.3f}" y2="{sh[4]:.3f}" stroke="{hexc(sh[5])}" stroke-width="{sh[6]:.3f}"/>')
            L.append("</g>")
        elif t == "qr":
            d = " ".join(f"M{x:.3f} {y:.3f}h{w:.3f}v{h:.3f}h{-w:.3f}z" for (x, y, w, h) in qr_runs(e))
            L.append(f'<path id="{nm}" d="{d}" fill="{hexc(e["fill"])}"/>')
        elif t == "image":
            b64 = base64.b64encode(open(EMBLEM_PNG, "rb").read()).decode()
            L.append(f'<image id="{nm}" x="{e["x"]}" y="{e["y"]}" width="{e["w"]}" height="{e["h"]}" href="data:image/png;base64,{b64}"/>')
        elif t == "ph_rect":
            x, y, w, h = e["x"], e["y"], e["w"], e["h"]
            L.append(f'<g id="{nm}" fill="none" stroke="{hexc("line")}" stroke-width="0.5" stroke-dasharray="2 1.5"><rect x="{x}" y="{y}" width="{w}" height="{h}"/><line x1="{x}" y1="{y}" x2="{x+w}" y2="{y+h}"/><line x1="{x+w}" y1="{y}" x2="{x}" y2="{y+h}"/></g>')
        elif t == "ph_circle":
            d = e["r"] * 0.7071; cx, cy = e["cx"], e["cy"]
            L.append(f'<g id="{nm}" fill="none" stroke="{hexc("line")}" stroke-width="0.5" stroke-dasharray="2 1.5"><circle cx="{cx}" cy="{cy}" r="{e["r"]}"/><line x1="{cx-d:.3f}" y1="{cy-d:.3f}" x2="{cx+d:.3f}" y2="{cy+d:.3f}"/><line x1="{cx+d:.3f}" y1="{cy-d:.3f}" x2="{cx-d:.3f}" y2="{cy+d:.3f}"/></g>')
        elif t == "text":
            f, wgt = fam[e["font"]]
            s = e["s"].replace("&", "&amp;")
            L.append(f'<text id="{nm}" x="{e["x"]:.3f}" y="{e["y"]}" font-family="{f}" font-weight="{wgt}" font-size="{e["size"]}" letter-spacing="{e["ls"]}" fill="{hexc(e["color"])}">{s}</text>')
    L.append("</g></svg>")
    p = os.path.join(out, f"Dentex_Card_{name}.svg")
    open(p, "w").write("\n".join(L))
    return p


if __name__ == "__main__":
    # Design B (reference layout, chosen) -> out/ ; Design A (first concept) -> out/option-A/
    for tag, sides, out in [("B", SIDES_B, OUT), ("A", SIDES_A, os.path.join(OUT, "option-A"))]:
        os.makedirs(out, exist_ok=True)
        print(build_pdf(sides, out))
        for n, it in sides.items():
            print(svg_side(n, it, out))
        for n, it in sides.items():
            for e in it:
                if e["t"] == "text":
                    print(f'{tag} {n:5} {e["name"]:14} x {e["x"]:6.1f}..{e["x"] + e["w"]:6.1f}  size {e["size"]}')
