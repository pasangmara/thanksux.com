# Dentex visiting card: Dr. Anjuman Ara Muna

Figma (page "Dentex"): https://www.figma.com/design/xrBqOge9hA4CSLhvRSpXDQ

**Option B (chosen, follows the client's reference layout)** is in this folder. The first concept, Option A, is in `option-A/`.

- Front: teal gradient with soft circles, the tooth mark + DENTEX, the doctor's name and credentials, all centred.
- Back: plain white, typography only (no shapes or overlays), set on a modular grid. Contacts: phone +880 1868-980020, email, and the chamber address (56/2 Dynasty Wahed Tower, West Panthapath, Dhaka 1205), each with a small teal icon. No website. Text on columns 1–9; Govt. of Bangladesh logo and QR code on columns 10–12. See `mockups/Dentex_Back_Grid.png`.

| File | Use |
| --- | --- |
| `Dentex_Card_PrintReady_CMYK.pdf` | **Send to the printer / open in Illustrator.** 2 pages (front, back). CMYK, 3.5 × 2 in trim, 0.125 in bleed, crop marks, Trim/Bleed boxes set, live text (Poppins embedded). |
| `Dentex_Card_Front.svg`, `Dentex_Card_Back.svg` | Fully editable vector layers (bleed size 270 × 162 pt), with named layers. |
| `preview-front.png`, `preview-back.png` | 300 dpi previews. |
| `mockups/` | 3 presentation mockups (flat lay, isometric stacks, dark premium), 2400 × 1600, plus the back-side grid diagram. Editable versions are in Figma, section 06. `mockups.py` and `grid_diagram.py` re-render them. |
| `assets/` | Govt. logo (RGBA PNG for screen, CMYK JPEG for print) and the QR matrix. |
| `fonts/` | Poppins (OFL). Install it before editing the text in Illustrator. |
| `build.py` | The layout spec that generates both options (`pip install reportlab && python3 build.py`). |

## Before printing
1. The QR code is a vector rebuild of the one on the old card. It opens `https://share.google/ibaEdEEhdLPOn5D4g` (decoded from the old card and re-checked on the new print render). Scan a printed proof once more before the full run.
2. The Govt. logo is placed as a 34 pt CMYK image (1200 px, about 2500 dpi at that size).
3. Illustrator: open the PDF, then check *File › Document Color Mode › CMYK*.
4. The soft circles on the front use 5–7% white transparency. If the printer needs PDF/X-1a, flatten the transparency in Illustrator first.
5. Ask for a press proof next to the old card. The teal is `C80 M5 Y35 K0` (screen `#0FAAAC`, from the logo file).

## Specs
- Trim 252 × 144 pt · bleed 9 pt · safe zone 9 pt inside trim
- Type: Poppins. Name 14 pt, wordmark 14/10 pt, designation 9 pt, everything else 8 pt (minimum)
- Back grid: margins 14 pt (L/R) and 17 pt (T/B); 12 columns × 6 rows of square 15 pt modules; 4 pt gutters. Name cap-top = row 1 = logo top; last contact baseline = row 6 bottom = QR bottom; three text groups with equal 13 pt gaps; contact icons on column 1, contact text indented 12 pt
- QR: version 3, 29 × 29 modules, 53 pt (≈ 18.7 mm), K100 on white
- Govt. logo: 34 pt
- Colours: Teal C80 M5 Y35 K0 · Teal Deep (gradient end) C92 M35 Y48 K18 · Teal Dark C85 M28 Y45 K8 · Ink K90 · Grey K72 (Option A also uses Teal Tint C74 M4.5 Y32.5 K0)
