# Dentex visiting card: Dr. Anjuman Ara Muna

Figma (page "Dentex"): https://www.figma.com/design/xrBqOge9hA4CSLhvRSpXDQ

**Option B (chosen, follows the client's reference layout)** is in this folder. The first concept, Option A, is in `option-A/`.

- Front: teal gradient with soft circles, the tooth mark + DENTEX, the doctor's name and credentials, all centred.
- Back: white, details on the left, a faint tooth watermark on the right, and placeholders for the Govt. logo and the QR code.

| File | Use |
| --- | --- |
| `Dentex_Card_PrintReady_CMYK.pdf` | **Send to the printer / open in Illustrator.** 2 pages (front, back). CMYK, 3.5 × 2 in trim, 0.125 in bleed, crop marks, Trim/Bleed boxes set, live text (Poppins embedded). |
| `Dentex_Card_Front.svg`, `Dentex_Card_Back.svg` | Fully editable vector layers (bleed size 270 × 162 pt). Named layers, including the placeholders. |
| `preview-front.png`, `preview-back.png` | 300 dpi previews. |
| `fonts/` | Poppins (OFL). Install it before editing the text in Illustrator. |
| `build.py` | The layout spec that generates both options (`pip install reportlab && python3 build.py`). |

## Before printing
1. Replace the two **PLACEHOLDER** layers on the back: the Govt. of Bangladesh logo (28 pt circle) and the QR code (44 pt ≈ 15.5 mm square). Use vector art, or images at 300 dpi or higher.
2. Delete the dashed placeholder outlines.
3. Illustrator: open the PDF, then check *File › Document Color Mode › CMYK*.
4. The soft circles on the front use 5–7% white transparency. If the printer needs PDF/X-1a, flatten the transparency in Illustrator first.
5. Ask for a press proof next to the old card. The teal is `C80 M5 Y35 K0` (screen `#0FAAAC`, from the logo file).

## Specs
- Trim 252 × 144 pt · bleed 9 pt · safe zone 9 pt inside trim
- Type: Poppins. Name 14 pt, wordmark 14/10 pt, designation 9 pt, everything else 8 pt (minimum)
- Colours: Teal C80 M5 Y35 K0 · Teal Deep (gradient end) C92 M35 Y48 K18 · Teal Dark C85 M28 Y45 K8 · Mist C4 M0 Y1.5 K0 · Mist Line C9 M0 Y3.5 K0 · Ink K90 · Grey K72 (Option A also uses Teal Tint C74 M4.5 Y32.5 K0)
